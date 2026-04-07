import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { reportAPI } from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getServiceInfo } from '../utils/constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';

interface ReportsProps {
  onLogout: () => void;
}

interface ReportData {
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
  };
  generatedAt: string;
}

type PeriodKey = 'day' | 'week' | 'month' | 'year';

interface PeriodConfig {
  key: PeriodKey;
  title: string;
  description: string;
}

const PERIODS: PeriodConfig[] = [
  { key: 'day', title: 'Daily Report', description: 'Summary and transactions for today' },
  { key: 'week', title: 'Weekly Report', description: 'Summary and transactions for the last 7 days' },
  { key: 'month', title: 'Monthly Report', description: 'Summary and transactions for this month' },
  { key: 'year', title: 'Yearly Report', description: 'Summary and transactions for this year' },
];

const normalizeTransaction = (transaction: any): Transaction => ({
  id: Number(transaction.id),
  userId: Number(transaction.userId ?? transaction.user_id ?? 0),
  serviceType: (transaction.serviceType ?? transaction.service_type ?? 'vodacom') as any,
  amount: Number(transaction.amount ?? 0),
  transactionType: (transaction.transactionType ?? transaction.transaction_type ?? 'withdraw') as any,
  cashInHand: Number(transaction.cashInHand ?? transaction.cash_in_hand ?? 0),
  description: transaction.description || '',
  createdAt: String(transaction.createdAt ?? transaction.created_at ?? new Date().toISOString()),
  employeeName: transaction.employeeName ?? transaction.employee_name ?? 'N/A',
});

const normalizeReportData = (raw: any): ReportData => ({
  transactions: Array.isArray(raw?.transactions) ? raw.transactions.map(normalizeTransaction) : [],
  summary: {
    totalTransactions: Number(raw?.summary?.totalTransactions ?? 0),
    totalDeposits: Number(raw?.summary?.totalDeposits ?? 0),
    totalWithdrawals: Number(raw?.summary?.totalWithdrawals ?? 0),
    netProfit: Number(raw?.summary?.netProfit ?? 0),
  },
  generatedAt: raw?.generatedAt || new Date().toISOString(),
});

const getPeriodRange = (period: PeriodKey) => {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0);
  }

  if (period === 'week') {
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  }

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
  }

  if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    startDate.setHours(0, 0, 0, 0);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const Reports: React.FC<ReportsProps> = ({ onLogout }) => {
  const [reportsByPeriod, setReportsByPeriod] = useState<Record<PeriodKey, ReportData | null>>({
    day: null,
    week: null,
    month: null,
    year: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    serviceType: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const generateReports = async () => {
    setLoading(true);
    setError('');

    try {
      const periodEntries = await Promise.all(
        PERIODS.map(async (period) => {
          const range = getPeriodRange(period.key);
          const params: any = {
            startDate: range.startDate,
            endDate: range.endDate,
          };

          if (filters.serviceType) {
            params.serviceType = filters.serviceType;
          }

          const response = await reportAPI.generate(params);
          return [period.key, normalizeReportData(response.data)] as const;
        })
      );

      setReportsByPeriod(Object.fromEntries(periodEntries) as Record<PeriodKey, ReportData>);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalTransactionsAcrossPeriods = useMemo(() => {
    return PERIODS.reduce((sum, period) => {
      return sum + (reportsByPeriod[period.key]?.summary.totalTransactions || 0);
    }, 0);
  }, [reportsByPeriod]);

  const downloadPdfReport = (period: PeriodConfig) => {
    const reportData = reportsByPeriod[period.key];
    if (!reportData) {
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Business Report - ${period.title}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated at: ${formatDate(reportData.generatedAt)}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['Metric', 'Value']],
      body: [
        ['Total Transactions', String(reportData.summary.totalTransactions)],
        ['Total Deposits', formatCurrency(reportData.summary.totalDeposits)],
        ['Total Withdrawals', formatCurrency(reportData.summary.totalWithdrawals)],
        ['Net Profit', formatCurrency(reportData.summary.netProfit)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 102, 204] },
    });

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Service', 'Type', 'Amount', 'Cash in Hand', 'Employee', 'Description']],
      body: reportData.transactions.map((transaction) => [
        formatDate(transaction.createdAt),
        getServiceInfo(transaction.serviceType).name,
        transaction.transactionType,
        formatCurrency(transaction.amount),
        formatCurrency(transaction.cashInHand),
        transaction.employeeName || 'N/A',
        transaction.description || '-',
      ]),
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [0, 102, 204],
      },
    });

    doc.save(`${period.key}_report_${Date.now()}.pdf`);
  };

  useEffect(() => {
    generateReports();
  }, []);

  return (
    <div className="reports-container">
      <Navbar onLogout={onLogout} />
      <div className="reports-content">
        <div className="reports-header">
          <h1>Business Reports</h1>
          <p>Daily, weekly, monthly, and yearly report sections with PDF downloads</p>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="form-group">
              <label htmlFor="serviceType">Service Filter (Optional)</label>
              <select
                id="serviceType"
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
              >
                <option value="">All Services</option>
                <option value="vodacom">Vodacom</option>
                <option value="airtel">Airtel</option>
                <option value="tigo">Tigo</option>
                <option value="halotel">Halotel</option>
                <option value="lipa_namba_vodacom">Lipa Namba Vodacom</option>
                <option value="lipa_namba_airtel">Lipa Namba Airtel</option>
                <option value="lipa_namba_tigo">Lipa Namba Tigo</option>
                <option value="lipa_namba_halotel">Lipa Namba Halotel</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button onClick={generateReports} disabled={loading} className="btn-generate">
              {loading ? 'Refreshing...' : 'Refresh Reports'}
            </button>
          </div>
        </div>

        {error && <div className="report-error">{error}</div>}

        <div className="period-overview">
          <h2>Report Overview</h2>
          <p>Total records across all sections: {totalTransactionsAcrossPeriods}</p>
        </div>

        {PERIODS.map((period) => {
          const reportData = reportsByPeriod[period.key];

          return (
            <section className="period-section" key={period.key}>
              <div className="period-header">
                <div>
                  <h2>{period.title}</h2>
                  <p>{period.description}</p>
                </div>
                <button
                  onClick={() => downloadPdfReport(period)}
                  disabled={!reportData}
                  className="btn-download"
                >
                  Download {period.title} PDF
                </button>
              </div>

              {reportData ? (
                <>
                  <div className="summary-section">
                    <div className="summary-grid">
                      <div className="summary-item">
                        <h3>Total Transactions</h3>
                        <p>{reportData.summary.totalTransactions}</p>
                      </div>
                      <div className="summary-item">
                        <h3>Total Deposits</h3>
                        <p className="positive">{formatCurrency(reportData.summary.totalDeposits)}</p>
                      </div>
                      <div className="summary-item">
                        <h3>Total Withdrawals</h3>
                        <p className="negative">{formatCurrency(reportData.summary.totalWithdrawals)}</p>
                      </div>
                      <div className="summary-item">
                        <h3>Net Profit</h3>
                        <p className={reportData.summary.netProfit >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(reportData.summary.netProfit)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="transactions-table-section">
                    <h3>{period.title} Transactions</h3>
                    <div className="table-container">
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Service</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Cash in Hand</th>
                            <th>Employee</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.transactions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="empty-row">No transactions in this period.</td>
                            </tr>
                          ) : (
                            reportData.transactions.map((transaction) => (
                              <tr key={`${period.key}-${transaction.id}-${transaction.createdAt}`}>
                                <td>{formatDate(transaction.createdAt)}</td>
                                <td>
                                  <span
                                    className="service-badge"
                                    style={{
                                      backgroundColor: getServiceInfo(transaction.serviceType).color,
                                      color: getServiceInfo(transaction.serviceType).textColor,
                                    }}
                                  >
                                    {getServiceInfo(transaction.serviceType).name}
                                  </span>
                                </td>
                                <td>
                                  <span className={`type-badge ${transaction.transactionType}`}>
                                    {transaction.transactionType}
                                  </span>
                                </td>
                                <td className={transaction.transactionType === 'deposit' ? 'positive' : 'negative'}>
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td>{formatCurrency(transaction.cashInHand)}</td>
                                <td>{transaction.employeeName || 'N/A'}</td>
                                <td>{transaction.description || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-report">No data loaded for this period yet.</div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
