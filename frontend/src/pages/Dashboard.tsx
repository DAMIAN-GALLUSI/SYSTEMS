import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';
import { dashboardAPI } from '../services/api';
import { SERVICES } from '../utils/constants';
import { DashboardData, ProfitLossData } from '../types';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchDashboardData();
    fetchProfitLossData();
  }, [days]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchProfitLossData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getProfitLoss(days);
      setProfitLossData(response.data.profitLossData);
    } catch (error) {
      console.error('Failed to fetch profit/loss data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCashInHand = (serviceType: string) => {
    const service = dashboardData?.services.find(s => s.service_type === serviceType);
    return service ? parseFloat(service.cash_in_hand as any) : 0;
  };

  const totalCash = dashboardData?.services.reduce(
    (sum, service) => sum + parseFloat(service.cash_in_hand as any), 
    0
  ) || 0;

  const netProfit = profitLossData.length > 0 
    ? profitLossData[profitLossData.length - 1].profit 
    : 0;

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="dashboard-summary">
            <div className="summary-card">
              <h3>Total Cash in Hand</h3>
              <p className="summary-amount">
                {new Intl.NumberFormat('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                }).format(totalCash)}
              </p>
            </div>
            <div className="summary-card">
              <h3>Current Profit/Loss</h3>
              <p className={`summary-amount ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                {new Intl.NumberFormat('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                }).format(netProfit)}
              </p>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h2>Profit/Loss Trend</h2>
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="time-filter"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          {loading ? (
            <div className="loading">Loading chart data...</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-TZ', {
                      style: 'currency',
                      currency: 'TZS',
                      minimumFractionDigits: 0
                    }).format(value),
                    'Profit/Loss'
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-TZ')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#0066CC" 
                  strokeWidth={2}
                  name="Profit/Loss"
                  dot={{ fill: '#0066CC', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="services-section">
          <h2>Service Cards</h2>
          <div className="services-grid">
            {SERVICES.map(service => (
              <ServiceCard
                key={service.id}
                name={service.name}
                color={service.color}
                textColor={service.textColor}
                cashInHand={getCashInHand(service.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
