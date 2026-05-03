import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';
import { dashboardAPI } from '../services/api';
import { SERVICES } from '../utils/constants';
import { DashboardData, ProfitLossData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { t } = useLanguage();
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

  const getServiceStyle = (serviceType: string) => {
    return SERVICES.find((service) => service.id === serviceType) || {
      name: serviceType,
      color: '#334155',
      textColor: '#FFFFFF',
    };
  };

  const totalCash = dashboardData?.summary?.total_circulating || 0;

  const netProfit = dashboardData?.summary?.current_profit_loss || 0;

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>{t('dashboard.title')}</h1>
          <div className="dashboard-summary">
            <div className="summary-card">
              <h3>{t('dashboard.totalCash')}</h3>
              <p className="summary-amount">
                {new Intl.NumberFormat('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                }).format(totalCash)}
              </p>
            </div>
            <div className="summary-card">
              <h3>{t('dashboard.todayVsPrevious')}</h3>
              <p className={`summary-amount ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                {new Intl.NumberFormat('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                }).format(netProfit)}
              </p>
              <p className="summary-note">
                {netProfit >= 0 ? t('dashboard.profitNote') : t('dashboard.lossNote')}
              </p>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h2>{t('dashboard.trendTitle')}</h2>
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="time-filter"
            >
              <option value={7}>{t('dashboard.last7')}</option>
              <option value={30}>{t('dashboard.last30')}</option>
              <option value={90}>{t('dashboard.last90')}</option>
            </select>
          </div>
          {loading ? (
            <div className="loading">{t('dashboard.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-TZ', {
                      style: 'currency',
                      currency: 'TZS',
                      minimumFractionDigits: 0
                    }).format(value),
                    t('dashboard.dailyChange')
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-TZ')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#0066CC" 
                  strokeWidth={2}
                  name={t('dashboard.profitLossSeries')}
                  dot={{ fill: '#0066CC', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="services-section">
          <h2>{t('dashboard.registeredLines')}</h2>
          <div className="services-grid">
            {dashboardData?.services.length ? (
              dashboardData.services.map((entry, index) => {
                const style = getServiceStyle(entry.service_type);
                return (
                  <ServiceCard
                    key={`${entry.service_type}-${entry.line_card}-${index}`}
                    name={style.name}
                    lineCard={entry.line_card}
                    color={style.color}
                    textColor={style.textColor}
                    amount={Number(entry.amount) || 0}
                  />
                );
              })
            ) : (
              <div className="empty-services">{t('dashboard.emptyServices')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
