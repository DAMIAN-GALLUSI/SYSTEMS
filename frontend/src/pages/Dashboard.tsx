import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';
import { dashboardAPI, registeredLinesAPI } from '../services/api';
import { SERVICES } from '../utils/constants';
import { DashboardData, ProfitLossData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}

interface SavedDailyBalancing {
  savedAt: string;
  savedDayKey?: string;
  entries: Array<{
    serviceType: string;
    serviceName: string;
    lineCard: string;
    amount: string;
  }>;
  cashInHand: string;
  dailyConsumption: string;
  notes: string;
  saveBatchId?: string;
}

const SAVED_DAILY_BALANCING_STORAGE_KEY = 'saved-daily-balancing';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [registeredLines, setRegisteredLines] = useState<Array<{ serviceType: string; lineCard: string }>>([]);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const latestProfitLossPoint = profitLossData.length > 0 ? profitLossData[profitLossData.length - 1] : null;
  
  // Calculate today's profit/loss by comparing with previous day
  const getTodayProfitLoss = () => {
    if (latestProfitLossPoint) {
      return latestProfitLossPoint.profit;
    }
    
    // Fallback: calculate from saved data if available
    if (dashboardData?.summary?.current_profit_loss !== undefined) {
      return dashboardData.summary.current_profit_loss;
    }
    
    return 0;
  };
  
  const visibleProfitLoss = getTodayProfitLoss();

  useEffect(() => {
    loadLocalData();
    fetchRegisteredLines();
    fetchDashboardData();
    fetchProfitLossData();
  }, [days]);

  const loadLocalData = () => {
    try {
      const raw = localStorage.getItem(SAVED_DAILY_BALANCING_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as SavedDailyBalancing | SavedDailyBalancing[];
      const history = Array.isArray(parsed) ? parsed : [parsed];
      const safeHistory = history.filter((entry) => Array.isArray(entry?.entries));

      if (safeHistory.length < 1) {
        return;
      }

      // Get all unique services from history
      const serviceMap = new Map<string, { service_type: string; line_card: string; amount: number; cash_in_hand: number; created_at: string }>();
      
      for (const dailyEntry of safeHistory) {
        const cashInHand = Number(dailyEntry.cashInHand) || 0;
        for (const entry of dailyEntry.entries) {
          const key = `${entry.serviceType}::${entry.lineCard}`;
          const amount = Number(entry.amount) || 0;
          serviceMap.set(key, {
            service_type: entry.serviceType,
            line_card: entry.lineCard,
            amount,
            cash_in_hand: cashInHand,
            created_at: dailyEntry.savedAt,
          });
        }
      }

      // Build profit/loss data from daily history
      const dailyMap = new Map<string, { circulating: number; consumption: number }>();
      for (const dailyEntry of safeHistory) {
        const dayKey = dailyEntry.savedDayKey || new Date(dailyEntry.savedAt).toISOString().slice(0, 10);
        const cashInHand = Number(dailyEntry.cashInHand) || 0;
        const linesTotal = dailyEntry.entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const circulating = cashInHand + linesTotal;
        const consumption = Number(dailyEntry.dailyConsumption) || 0;
        
        dailyMap.set(dayKey, { circulating, consumption });
      }

      // Create profit/loss trend
      const sortedDays = Array.from(dailyMap.keys()).sort();
      const trendData: ProfitLossData[] = [];
      let previousCirculating: number | null = null;

      for (const dayKey of sortedDays) {
        const day = dailyMap.get(dayKey);
        if (!day) continue;

        const profitOrLoss = previousCirculating === null ? 0 : day.circulating - previousCirculating;
        trendData.push({
          date: dayKey,
          profit: profitOrLoss,
          circulatingTotal: day.circulating,
        });
        previousCirculating = day.circulating;
      }

      // Ensure trend data is set even if empty
      setProfitLossData(trendData);

      // Set dashboard data with services
      setDashboardData({
        services: Array.from(serviceMap.values()).map(s => ({
          ...s,
          service_type: s.service_type as any,
        })),
        summary: {
          total_circulating: serviceMap.size > 0 
            ? Array.from(serviceMap.values()).reduce((sum, s) => sum + s.cash_in_hand, 0)
            : 0,
          current_profit_loss: trendData.length > 0 ? trendData[trendData.length - 1].profit : 0,
          previous_total: 0,
          total_transactions: safeHistory.length,
        },
      });
    } catch (error) {
      console.error('Failed to load local data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData();
      if (response.data && Object.keys(response.data).length > 0) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data from API:', error);
      // API failed, but we already have local data from loadLocalData()
    }
  };

  const fetchRegisteredLines = async () => {
    try {
      const response = await registeredLinesAPI.getAll();
      if (response.data?.lines && Array.isArray(response.data.lines)) {
        setRegisteredLines(response.data.lines.map((line: any) => ({
          serviceType: line.serviceType,
          lineCard: line.lineCard,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch registered lines from API:', error);
      // API failed, use fallback
    }
  };

  const fetchProfitLossData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getProfitLoss(days);
      if (response.data?.profitLossData && response.data.profitLossData.length > 0) {
        setProfitLossData(response.data.profitLossData);
      }
    } catch (error) {
      console.error('Failed to fetch profit/loss data from API:', error);
      setLoading(false);
      // API failed, but we already have local data from loadLocalData()
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
  const netProfit = visibleProfitLoss;

  const netProfitLabel = netProfit >= 0 ? t('dashboard.todayThereIsProfit') : t('dashboard.todayThereIsLoss');

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
            <div className="summary-card summary-card-spotlight">
              <div className="summary-card-header">
                <h3>{t('dashboard.todayVsPrevious')}</h3>
                <span className={`summary-pill ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                  {netProfit >= 0 ? t('dashboard.profitShort') : t('dashboard.lossShort')}
                </span>
              </div>
              <p className={`summary-amount summary-inline-result ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                {netProfitLabel}: {new Intl.NumberFormat('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                }).format(netProfit)}
              </p>
              <p className={`summary-amount summary-inline-result ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                {t('dashboard.updatedToday')}: {new Intl.NumberFormat('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                }).format(totalCash)}
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
            {registeredLines.length > 0 ? (
              registeredLines.map((line, index) => {
                const style = getServiceStyle(line.serviceType);
                // Find the amount from dashboard data if available
                const dashboardEntry = dashboardData?.services?.find(
                  (s) => s.service_type === line.serviceType && s.line_card === line.lineCard
                );
                return (
                  <ServiceCard
                    key={`${line.serviceType}-${line.lineCard}-${index}`}
                    name={style.name}
                    lineCard={line.lineCard}
                    color={style.color}
                    textColor={style.textColor}
                    amount={dashboardEntry ? Number(dashboardEntry.amount) || 0 : 0}
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
