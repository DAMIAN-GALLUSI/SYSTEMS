import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { reportAPI } from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getServiceInfo } from '../utils/constants';
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

const Reports: React.FC<ReportsProps> = ({ onLogout }) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    serviceType: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.serviceType) params.serviceType = filters.serviceType;

      const response = await reportAPI.generate(params);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.serviceType) params.serviceType = filters.serviceType;

      const response = await reportAPI.download(params);
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="reports-container">
      <Navbar onLogout={onLogout} />
      <div className="reports-content">
        <div className="reports-header">
          <h1>Business Reports</h1>
          <p>Generate and download comprehensive transaction reports</p>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="serviceType">Service (Optional)</label>
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
            <button onClick={generateReport} disabled={loading} className="btn-generate">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            <button 
              onClick={downloadReport} 
              disabled={!reportData} 
              className="btn-download"
            >
              Download CSV
            </button>
          </div>
        </div>

        {reportData && (
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
              <h2>Transaction Details</h2>
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
                    {reportData.transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{formatDate(transaction.createdAt)}</td>
                        <td>
                          <span 
                            className="service-badge"
                            style={{ 
                              backgroundColor: getServiceInfo(transaction.serviceType).color,
                              color: getServiceInfo(transaction.serviceType).textColor
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
