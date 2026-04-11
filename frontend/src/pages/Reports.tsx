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

interface DailyBalancingMetadata {
  lineCard?: string;
  dailyConsumption?: number;
  notes?: string;
  saveBatchId?: string;
  mode?: string;
}

interface DailyBalancingReportRow {
  id: number;
  date: string;
  dayKey: string;
  serviceName: string;
  lineCard: string;
  amount: number;
  cashInHand: number;
  dailyConsumption: number;
  notes: string;
  employeeName: string;
  saveBatchId: string;
}

type PeriodKey = 'day' | 'week' | 'month' | 'year';

interface PeriodConfig {
  key: PeriodKey;
  title: string;
  description: string;
}

const PERIODS: PeriodConfig[] = [
  { key: 'day', title: 'Daily Report Area', description: 'Summary and transactions for today' },
  { key: 'week', title: 'Weekly Report Area', description: 'Summary and transactions for the last 7 days' },
  { key: 'month', title: 'Monthly Report Area', description: 'Summary and transactions for this month' },
  { key: 'year', title: 'Yearly Report Area', description: 'Summary and transactions for this year' },
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

const parseDailyBalancingMetadata = (description: string): DailyBalancingMetadata | null => {
  if (!description) {
    return null;
  }

  try {
    const parsed = JSON.parse(description);
    return typeof parsed === 'object' && parsed ? parsed : null;
  } catch {
    return null;
  }
};

const getDailyBalancingRows = (transactions: Transaction[]): DailyBalancingReportRow[] => {
  return transactions
    .map((transaction) => {
      const metadata = parseDailyBalancingMetadata(transaction.description || '');
      if (!metadata || metadata.mode !== 'daily-balancing-entry') {
        return null;
      }

      return {
        id: transaction.id,
        date: transaction.createdAt,
        dayKey: new Date(transaction.createdAt).toISOString().slice(0, 10),
        serviceName: getServiceInfo(transaction.serviceType).name,
        lineCard: metadata.lineCard || '-',
        amount: transaction.amount,
        cashInHand: transaction.cashInHand,
        dailyConsumption: Number(metadata.dailyConsumption || 0),
        notes: metadata.notes || '-',
        employeeName: transaction.employeeName || 'N/A',
        saveBatchId: metadata.saveBatchId || '',
      };
    })
    .filter((row): row is DailyBalancingReportRow => row !== null);
};

const getLatestDailyBalancingRows = (rows: DailyBalancingReportRow[]) => {
  if (rows.length < 1) {
    return [];
  }

  const grouped = new Map<string, DailyBalancingReportRow[]>();
  rows.forEach((row) => {
    const key = `${row.employeeName}::${row.dayKey}`;
    const current = grouped.get(key) || [];
    current.push(row);
    grouped.set(key, current);
  });

  const latestRows: DailyBalancingReportRow[] = [];

  grouped.forEach((groupRows) => {
    const withBatch = groupRows.filter((row) => row.saveBatchId);

    if (withBatch.length > 0) {
      withBatch.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestBatchId = withBatch[0].saveBatchId;
      latestRows.push(...groupRows.filter((row) => row.saveBatchId === latestBatchId));
      return;
    }

    const latestPerLine = new Map<string, DailyBalancingReportRow>();
    groupRows.forEach((row) => {
      const lineKey = `${row.serviceName}::${row.lineCard}`;
      const existing = latestPerLine.get(lineKey);
      if (!existing || new Date(row.date).getTime() > new Date(existing.date).getTime()) {
        latestPerLine.set(lineKey, row);
      }
    });

    latestRows.push(...latestPerLine.values());
  });

  latestRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return latestRows;
};

const getDailyCirculationAmount = (rows: DailyBalancingReportRow[]) => {
  if (rows.length < 1) {
    return 0;
  }

  const lineAmountsTotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const cashInHand = rows[0].cashInHand;
  return cashInHand + lineAmountsTotal;
};

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

const getTodayInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayRangeFromInput = (dateValue: string) => {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59.999`);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
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
  const [dailyLoading, setDailyLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDailyDate, setSelectedDailyDate] = useState(getTodayInputValue());
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
        PERIODS.filter((period) => period.key !== 'day').map(async (period) => {
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

      const nextState: Record<PeriodKey, ReportData | null> = {
        day: reportsByPeriod.day,
        week: null,
        month: null,
        year: null,
      };

      periodEntries.forEach(([key, value]) => {
        nextState[key] = value;
      });

      setReportsByPeriod(nextState);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDailyReport = async () => {
    setDailyLoading(true);
    setError('');

    try {
      const range = getDayRangeFromInput(selectedDailyDate);
      const params: any = {
        startDate: range.startDate,
        endDate: range.endDate,
      };

      if (filters.serviceType) {
        params.serviceType = filters.serviceType;
      }

      const response = await reportAPI.generate(params);
      const dailyData = normalizeReportData(response.data);

      setReportsByPeriod((current) => ({
        ...current,
        day: dailyData,
      }));
    } catch (err) {
      console.error('Failed to load daily report:', err);
      setError('Failed to load selected daily report. Please try again.');
    } finally {
      setDailyLoading(false);
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
          <p>Daily, weekly, monthly, and yearly report areas with PDF download buttons for sharing and storage</p>
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
          const dailyBalancingRows = reportData ? getLatestDailyBalancingRows(getDailyBalancingRows(reportData.transactions)) : [];

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

              {period.key === 'day' && (
                <div className="daily-controls">
                  <div className="form-group daily-date-group">
                    <label htmlFor="selectedDailyDate">Choose Day</label>
                    <input
                      id="selectedDailyDate"
                      type="date"
                      value={selectedDailyDate}
                      onChange={(e) => setSelectedDailyDate(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-generate"
                    onClick={loadSelectedDailyReport}
                    disabled={dailyLoading}
                  >
                    {dailyLoading ? 'Loading Day Details...' : 'View Selected Day Details'}
                  </button>
                </div>
              )}

              {reportData ? (
                <>
                  {period.key === 'day' && (
                    <div className="daily-selected-note">
                      Showing saved details for: <strong>{selectedDailyDate}</strong>
                    </div>
                  )}

                  {period.key === 'day' && dailyBalancingRows.length > 0 && (
                    <div className="daily-balancing-report-section">
                      <h3>Saved From Daily Balancing</h3>
                      <p className="daily-circulation-line">
                        <strong>The current amount of money in circulation within the business:</strong>{' '}
                        {formatCurrency(getDailyCirculationAmount(dailyBalancingRows))}
                      </p>
                      {dailyBalancingRows[0]?.notes && dailyBalancingRows[0].notes !== '-' && (
                        <p className="daily-notes-line">
                          <strong>Notes:</strong> {dailyBalancingRows[0].notes}
                        </p>
                      )}
                      <div className="table-container">
                        <table className="transactions-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Service</th>
                              <th>Line/Card</th>
                              <th>Amount</th>
                              <th>Cash in Hand</th>
                              <th>Use of the Day</th>
                              <th>Employee</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyBalancingRows.map((row) => (
                              <tr key={`daily-balance-${row.id}-${row.date}`}>
                                <td>{formatDate(row.date)}</td>
                                <td>{row.serviceName}</td>
                                <td>{row.lineCard}</td>
                                <td className={row.amount >= 0 ? 'positive' : 'negative'}>{formatCurrency(row.amount)}</td>
                                <td>{formatCurrency(row.cashInHand)}</td>
                                <td>{formatCurrency(row.dailyConsumption)}</td>
                                <td>{row.employeeName}</td>
                                <td>{row.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

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
