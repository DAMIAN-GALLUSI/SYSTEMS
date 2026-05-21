import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { reportAPI } from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getServiceInfo } from '../utils/constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../contexts/LanguageContext';
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
  serviceType: string;
  serviceName: string;
  lineCard: string;
  amount: number;
  cashInHand: number;
  dailyConsumption: number;
  notes: string;
  employeeName: string;
  saveBatchId: string;
}

interface WeeklyBalancingGroup {
  dayKey: string;
  dateLabel: string;
  rows: DailyBalancingReportRow[];
  totalLineAmounts: number;
  totalConsumption: number;
  circulationAmount: number;
  employees: string[];
}

interface MonthlyBalancingGroup {
  weekKey: string;
  weekLabel: string;
  days: WeeklyBalancingGroup[];
  totalCirculation: number;
  totalLineAmounts: number;
  totalConsumption: number;
  employees: string[];
}

interface YearMonthSummary {
  monthKey: string;
  monthLabel: string;
  activeDays: number;
  lineEntries: number;
  totalLineAmounts: number;
  totalConsumption: number;
  averageCirculation: number;
  closingCirculation: number;
}

type PeriodKey = 'day' | 'week' | 'month' | 'year';

interface PeriodConfig {
  key: PeriodKey;
  title: string;
  description: string;
}

const buildPeriods = (t: (path: string) => string): PeriodConfig[] => [
  { key: 'day', title: t('reports.dailyArea'), description: t('reports.dailySummary') },
  { key: 'week', title: t('reports.weeklyArea'), description: t('reports.weeklySummary') },
  { key: 'month', title: t('reports.monthlyArea'), description: t('reports.monthlySummary') },
  { key: 'year', title: t('reports.yearlyArea'), description: t('reports.yearlySummary') },
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
        serviceType: transaction.serviceType as string,
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

  const sortedRows = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const lineAmountsTotal = sortedRows.reduce((sum, row) => sum + row.amount, 0);
  const cashInHand = sortedRows[0].cashInHand;
  return cashInHand + lineAmountsTotal;
};

const getDailyProfitAmount = (rows: DailyBalancingReportRow[], currentDayKey?: string) => {
  if (rows.length < 1) {
    return 0;
  }

  const grouped = new Map<string, DailyBalancingReportRow[]>();

  rows.forEach((row) => {
    const current = grouped.get(row.dayKey) || [];
    current.push(row);
    grouped.set(row.dayKey, current);
  });

  const orderedDays = Array.from(grouped.entries())
    .map(([dayKey, dayRows]) => ({
      dayKey,
      circulation: getDailyCirculationAmount(dayRows),
    }))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  if (orderedDays.length < 2) {
    return 0;
  }

  const selectedIndex = currentDayKey
    ? orderedDays.findIndex((day) => day.dayKey === currentDayKey)
    : orderedDays.length - 1;

  if (selectedIndex < 1) {
    return 0;
  }

  const current = orderedDays[selectedIndex];
  const previous = orderedDays[selectedIndex - 1];

  if (!current || !previous) {
    return 0;
  }

  return current.circulation - previous.circulation;
};

const getDisplayNotes = (rows: DailyBalancingReportRow[]) => {
  const uniqueNotes = Array.from(
    new Set(
      rows
        .map((row) => row.notes?.trim())
        .filter((note): note is string => Boolean(note && note !== '-'))
    )
  );

  return uniqueNotes.length > 0 ? uniqueNotes.join(' | ') : '-';
};

const getWeeklyBalancingGroups = (rows: DailyBalancingReportRow[]): WeeklyBalancingGroup[] => {
  if (rows.length < 1) {
    return [];
  }

  const latestRows = getLatestDailyBalancingRows(rows);
  const grouped = new Map<string, DailyBalancingReportRow[]>();

  latestRows.forEach((row) => {
    const current = grouped.get(row.dayKey) || [];
    current.push(row);
    grouped.set(row.dayKey, current);
  });

  const groups = Array.from(grouped.entries()).map(([dayKey, dayRows]) => {
    const sortedRows = dayRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const employees = Array.from(new Set(sortedRows.map((row) => row.employeeName)));
    const totalLineAmounts = sortedRows.reduce((sum, row) => sum + row.amount, 0);
    const totalConsumption = sortedRows.reduce((sum, row) => sum + row.dailyConsumption, 0);

    return {
      dayKey,
      dateLabel: formatDate(`${dayKey}T12:00:00`),
      rows: sortedRows,
      totalLineAmounts,
      totalConsumption,
      circulationAmount: getDailyCirculationAmount(sortedRows),
      employees,
    };
  });

  groups.sort((a, b) => new Date(b.dayKey).getTime() - new Date(a.dayKey).getTime());
  return groups;
};

const getMonthWeekKey = (dayKey: string) => {
  const date = new Date(`${dayKey}T12:00:00`);
  const dayOfMonth = date.getDate();
  const weekStart = Math.floor((dayOfMonth - 1) / 7) * 7 + 1;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const weekEnd = Math.min(weekStart + 6, daysInMonth);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${weekStart}`.padStart(2, '0')}-${`${weekEnd}`.padStart(2, '0')}`;
};

const getMonthWeekLabel = (weekKey: string) => {
  const [, year, month, startDay, endDay] = weekKey.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})$/) || [];
  if (!year || !month || !startDay || !endDay) {
    return weekKey;
  }

  return `Week ${startDay}-${endDay} ${new Date(`${year}-${month}-01T12:00:00`).toLocaleString('en-TZ', {
    month: 'long',
    year: 'numeric',
  })}`;
};

const getMonthlyBalancingGroups = (rows: DailyBalancingReportRow[]): MonthlyBalancingGroup[] => {
  if (rows.length < 1) {
    return [];
  }

  const weeklyGroups = getWeeklyBalancingGroups(rows);
  const grouped = new Map<string, WeeklyBalancingGroup[]>();

  weeklyGroups.forEach((dayGroup) => {
    const weekKey = getMonthWeekKey(dayGroup.dayKey);
    const current = grouped.get(weekKey) || [];
    current.push(dayGroup);
    grouped.set(weekKey, current);
  });

  const monthlyGroups = Array.from(grouped.entries()).map(([weekKey, days]) => {
    const employees = Array.from(new Set(days.flatMap((day) => day.employees)));
    const totalCirculation = days.reduce((sum, day) => sum + day.circulationAmount, 0);
    const totalLineAmounts = days.reduce((sum, day) => sum + day.totalLineAmounts, 0);
    const totalConsumption = days.reduce((sum, day) => sum + day.totalConsumption, 0);

    return {
      weekKey,
      weekLabel: getMonthWeekLabel(weekKey),
      days,
      totalCirculation,
      totalLineAmounts,
      totalConsumption,
      employees,
    };
  });

  monthlyGroups.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  return monthlyGroups;
};

const getYearMonthSummaries = (rows: DailyBalancingReportRow[]): YearMonthSummary[] => {
  if (rows.length < 1) {
    return [];
  }

  const grouped = new Map<string, DailyBalancingReportRow[]>();

  rows.forEach((row) => {
    const date = new Date(row.date);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const monthKey = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
    const current = grouped.get(monthKey) || [];
    current.push(row);
    grouped.set(monthKey, current);
  });

  const monthlySummaries = Array.from(grouped.entries()).map(([monthKey, monthRows]) => {
    const dailyGroups = getWeeklyBalancingGroups(monthRows);
    const totalLineAmounts = monthRows.reduce((sum, row) => sum + row.amount, 0);
    const totalConsumption = monthRows.reduce((sum, row) => sum + row.dailyConsumption, 0);
    const totalCirculation = dailyGroups.reduce((sum, day) => sum + day.circulationAmount, 0);
    const averageCirculation = dailyGroups.length > 0 ? totalCirculation / dailyGroups.length : 0;
    const sortedDays = [...dailyGroups].sort((a, b) => new Date(a.dayKey).getTime() - new Date(b.dayKey).getTime());
    const closingCirculation = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1].circulationAmount : 0;

    return {
      monthKey,
      monthLabel: new Date(`${monthKey}-01T12:00:00`).toLocaleString('en-TZ', {
        month: 'long',
        year: 'numeric',
      }),
      activeDays: dailyGroups.length,
      lineEntries: monthRows.length,
      totalLineAmounts,
      totalConsumption,
      averageCirculation,
      closingCirculation,
    };
  });

  monthlySummaries.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  return monthlySummaries;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const getComparisonRangeFromInput = (dateValue: string) => {
  const dayRange = getDayRangeFromInput(dateValue);
  if (!dayRange) {
    return null;
  }

  const start = new Date(`${dateValue}T00:00:00`);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);

  return {
    startDate: start.toISOString(),
    endDate: dayRange.endDate,
  };
};

const Reports: React.FC<ReportsProps> = ({ onLogout }) => {
  const { t } = useLanguage();
  const periods = buildPeriods(t);
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
  const [loadedDailyDate, setLoadedDailyDate] = useState(getTodayInputValue());
  const [filters, setFilters] = useState({
    serviceType: ''
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'daily-balance': true,
    'weekly-balance': false,
    'monthly-balance': false,
    'yearly-summary': false,
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const generateReports = async () => {
    setLoading(true);
    setError('');

    try {
      const periodEntries = await Promise.all(
        periods.filter((period) => period.key !== 'day').map(async (period) => {
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
      setError(t('reports.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDailyReport = async (dateValue?: string) => {
    const targetDate = dateValue || selectedDailyDate;
    const range = getComparisonRangeFromInput(targetDate);
    if (!range) {
      setError(t('reports.invalidDate'));
      return;
    }

    setDailyLoading(true);
    setError('');

    try {
      // Try to fetch from API first
      try {
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
        setLoadedDailyDate(targetDate);
      } catch (apiError) {
        // Fall back to localStorage if API fails
        console.warn('API failed, falling back to localStorage:', apiError);
        
        const raw = localStorage.getItem('saved-daily-balancing');
        if (!raw) {
          setReportsByPeriod((current) => ({
            ...current,
            day: null,
          }));
          setLoadedDailyDate(targetDate);
          return;
        }

        try {
          const parsed = JSON.parse(raw) as any;
          const history = Array.isArray(parsed) ? parsed : [parsed];
          
          // Find entries for the selected date and the day before it so profit can be compared correctly.
          const targetDayKey = targetDate;
          const previousDate = new Date(`${targetDate}T00:00:00`);
          previousDate.setDate(previousDate.getDate() - 1);
          const previousDayKey = previousDate.toISOString().slice(0, 10);
          const dailyEntries = history.filter((entry) => {
            const dayKey = entry.savedDayKey || new Date(entry.savedAt).toISOString().slice(0, 10);
            return dayKey === targetDayKey || dayKey === previousDayKey;
          });

          if (dailyEntries.length === 0) {
            setReportsByPeriod((current) => ({
              ...current,
              day: null,
            }));
            setLoadedDailyDate(targetDate);
            return;
          }

          // Convert to report format
          const transactions: Transaction[] = [];
          dailyEntries.forEach((entry, idx) => {
            if (Array.isArray(entry.entries)) {
              entry.entries.forEach((lineEntry: any, lineIdx: number) => {
                const serviceTypeOfLine = lineEntry.serviceType || 'vodacom';
                // Apply serviceType filter when present (local fallback)
                if (filters.serviceType && filters.serviceType !== '' && serviceTypeOfLine !== filters.serviceType) {
                  return;
                }

                transactions.push({
                  id: idx * 1000 + lineIdx,
                  userId: 0,
                  serviceType: serviceTypeOfLine,
                  amount: Number(lineEntry.amount) || 0,
                  transactionType: 'withdraw',
                  cashInHand: Number(entry.cashInHand) || 0,
                  description: JSON.stringify({
                    lineCard: lineEntry.lineCard,
                    dailyConsumption: entry.dailyConsumption,
                    notes: entry.notes,
                    saveBatchId: entry.saveBatchId,
                    mode: 'daily-balancing-entry',
                  }),
                  createdAt: entry.savedAt,
                  employeeName: 'Current User',
                });
              });
            }
          });

          const dailyData: ReportData = {
            transactions,
            summary: {
              totalTransactions: transactions.length,
              totalDeposits: 0,
              totalWithdrawals: transactions.reduce((sum, t) => sum + t.amount, 0),
              netProfit: (() => {
                const allDailyRows = getDailyBalancingRows(transactions);

                return getDailyProfitAmount(allDailyRows, targetDayKey);
              })(),
            },
            generatedAt: new Date().toISOString(),
          };

          setReportsByPeriod((current) => ({
            ...current,
            day: dailyData,
          }));
          setLoadedDailyDate(targetDate);
        } catch (parseError) {
          console.error('Failed to parse localStorage data:', parseError);
          throw parseError;
        }
      }
    } catch (err) {
      console.error('Failed to load daily report:', err);
      setError('Failed to load selected daily report. Please try again.');
    } finally {
      setDailyLoading(false);
    }
  };

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
      head: [['Date', 'Service', 'Amount', 'Cash in Hand', 'Employee', 'Description']],
      body: reportData.transactions.map((transaction) => [
        formatDate(transaction.createdAt),
        getServiceInfo(transaction.serviceType).name,
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

  useEffect(() => {
    loadSelectedDailyReport(getTodayInputValue());
  }, []);

  const monthlyBalancingGroups =
    reportsByPeriod.month ? getMonthlyBalancingGroups(getDailyBalancingRows(reportsByPeriod.month.transactions)) : [];

  return (
    <div className="reports-container">
      <Navbar onLogout={onLogout} />
      <div className="reports-content">
        <div className="reports-header">
          <h1>{t('reports.businessTitle')}</h1>
          <p>{t('reports.reportAreasCopy')}</p>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="form-group">
              <label htmlFor="serviceType">{t('reports.serviceFilter')}</label>
              <select
                id="serviceType"
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
              >
                <option value="">{t('reports.allServices')}</option>
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
              {loading ? t('reports.loading') : t('reports.refreshReports')}
            </button>
          </div>
        </div>

        {error && <div className="report-error">{error}</div>}

        <div className="report-sections-nav">
          <p className="nav-label">{t('reports.jumpToReport')}</p>
          <div className="nav-buttons">
            <button
              onClick={() => toggleSection('daily-balance')}
              className={`nav-btn ${expandedSections['daily-balance'] ? 'active' : ''}`}
            >
              {expandedSections['daily-balance'] ? '▼' : '▶'} {t('reports.dailyReport')}
            </button>
            <button
              onClick={() => toggleSection('weekly-balance')}
              className={`nav-btn ${expandedSections['weekly-balance'] ? 'active' : ''}`}
            >
              {expandedSections['weekly-balance'] ? '▼' : '▶'} {t('reports.weeklyReport')}
            </button>
            <button
              onClick={() => toggleSection('monthly-balance')}
              className={`nav-btn ${expandedSections['monthly-balance'] ? 'active' : ''}`}
            >
              {expandedSections['monthly-balance'] ? '▼' : '▶'} {t('reports.monthlyReport')}
            </button>
            <button
              onClick={() => toggleSection('yearly-summary')}
              className={`nav-btn ${expandedSections['yearly-summary'] ? 'active' : ''}`}
            >
              {expandedSections['yearly-summary'] ? '▼' : '▶'} {t('reports.yearlyReport')}
            </button>
          </div>
        </div>

        {periods.map((period) => {
          const reportData = reportsByPeriod[period.key];
            const allDailyBalancingRows = reportData ? getDailyBalancingRows(reportData.transactions) : [];
            const filteredDailyBalancingRows = filters.serviceType
              ? allDailyBalancingRows.filter((r) => r.serviceType === filters.serviceType)
              : allDailyBalancingRows;

            const dailyBalancingRows =
              period.key === 'day'
                ? getLatestDailyBalancingRows(filteredDailyBalancingRows).filter((row) => row.dayKey === loadedDailyDate)
                : reportData
                  ? getLatestDailyBalancingRows(filteredDailyBalancingRows)
                  : [];
          const weeklyBalancingGroups =
            period.key === 'week' && reportData
              ? getWeeklyBalancingGroups(filteredDailyBalancingRows)
              : [];
          const yearMonthSummaries =
            period.key === 'year' && reportData
              ? getYearMonthSummaries(getLatestDailyBalancingRows(filteredDailyBalancingRows))
              : [];

          const sectionKey = period.key === 'day' ? 'daily-balance' : period.key === 'week' ? 'weekly-balance' : period.key === 'month' ? 'monthly-balance' : 'yearly-summary';
          const isExpanded = expandedSections[sectionKey];

          return (
            <section className="period-section" key={period.key} style={{ display: isExpanded ? 'block' : 'none' }}>
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
                  {t('reports.downloadPrefix')} {period.title} {t('reports.downloadSuffix')}
                </button>
              </div>

              {period.key === 'day' && (
                <div className="daily-controls">
                  <div className="form-group daily-date-group">
                    <label htmlFor="selectedDailyDate">{t('reports.chooseDay')}</label>
                    <input
                      id="selectedDailyDate"
                      type="date"
                      value={selectedDailyDate}
                      onChange={(e) => {
                        const nextDate = e.target.value;
                        setSelectedDailyDate(nextDate);
                        if (nextDate) {
                          loadSelectedDailyReport(nextDate);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-generate"
                    onClick={() => loadSelectedDailyReport()}
                    disabled={dailyLoading}
                  >
                    {dailyLoading ? t('reports.loadingDayDetails') : t('reports.viewSelectedDayDetails')}
                  </button>
                </div>
              )}

              {reportData ? (
                <>
                  {period.key === 'day' && (
                    <div className="daily-selected-note">
                      {t('reports.showingSavedDetails')} <strong>{loadedDailyDate}</strong>
                    </div>
                  )}

                  {period.key === 'day' && dailyBalancingRows.length > 0 && (
                    <div className="daily-balancing-report-section"> 
                      <button
                        type="button"
                        className="collapse-toggle-btn"
                        onClick={() => toggleSection('daily-balance')}
                      >
                        {expandedSections['daily-balance'] ? '▼' : '▶'} {t('reports.savedFromDailyBalancing')}
                      </button>
                      {expandedSections['daily-balance'] && (
                      <div className="collapsible-content">
                      <p className="daily-circulation-line">
                        <strong>{t('reports.currentCirculation')}</strong>{' '}
                        {formatCurrency(getDailyCirculationAmount(dailyBalancingRows))}
                      </p>
                      <p className="daily-profitloss-line">
                        <strong>
                          {(() => {
                            const allDailyRows = reportData ? getDailyBalancingRows(reportData.transactions) : [];
                            const profitLoss = getDailyProfitAmount(allDailyRows, loadedDailyDate);
                            
                            return profitLoss >= 0 
                              ? `Today there is a profit: ${formatCurrency(profitLoss)}`
                              : `Today there is a loss: ${formatCurrency(Math.abs(profitLoss))}`;
                          })()}
                        </strong>
                      </p>
                      <p className="daily-notes-line">
                        <strong>{t('reports.notesLabel')}</strong> {getDisplayNotes(dailyBalancingRows)}
                      </p>
                      <div className="table-container">
                        <table className="transactions-table">
                          <thead>
                            <tr>
                              <th>{t('reports.date')}</th>
                              <th>{t('reports.service')}</th>
                              <th>{t('reports.lineCard')}</th>
                              <th>{t('reports.amount')}</th>
                              <th>{t('reports.cashInHand')}</th>
                              <th>{t('reports.useOfDay')}</th>
                              <th>{t('reports.employee')}</th>
                              <th>{t('reports.notes')}</th>
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
                    </div>
                  )}

                  {period.key === 'week' && weeklyBalancingGroups.length > 0 && (
                    <div className="weekly-balancing-report-section">
                      <button
                        type="button"
                        className="collapse-toggle-btn"
                        onClick={() => toggleSection('weekly-balance')}
                      >
                        {expandedSections['weekly-balance'] ? '▼' : '▶'} Saved From Daily Balancing (Weekly Full Details)
                      </button>
                      {expandedSections['weekly-balance'] && (
                        <div className="collapsible-content">
                          <p className="weekly-balancing-description">
                            A complete day-by-day breakdown of the week, including circulation, line amounts, usage, and employee entries.
                          </p>

                          {weeklyBalancingGroups.map((group) => (
                            <div className="weekly-day-group" key={`weekly-group-${group.dayKey}`}>
                              <div className="weekly-day-header">
                                <h4>{group.dateLabel}</h4>
                                <p>{group.rows.length} records</p>
                              </div>

                              <p className="daily-circulation-line">
                                <strong>The current amount of money in circulation within the business:</strong>{' '}
                                {formatCurrency(group.circulationAmount)}
                              </p>
                              <p className="daily-notes-line">
                                <strong>Notes:</strong> {getDisplayNotes(group.rows)}
                              </p>

                              <div className="weekly-day-summary-grid">
                                <div className="weekly-day-summary-item">
                                  <span>Money In Circulation</span>
                                  <strong>{formatCurrency(group.circulationAmount)}</strong>
                                </div>
                                <div className="weekly-day-summary-item">
                                  <span>Total Line/Card Amount</span>
                                  <strong>{formatCurrency(group.totalLineAmounts)}</strong>
                                </div>
                                <div className="weekly-day-summary-item">
                                  <span>Total Use of the Day</span>
                                  <strong>{formatCurrency(group.totalConsumption)}</strong>
                                </div>
                                <div className="weekly-day-summary-item">
                                  <span>Employees</span>
                                  <strong>{group.employees.join(', ') || 'N/A'}</strong>
                                </div>
                              </div>

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
                                    {group.rows.map((row) => (
                                      <tr key={`weekly-daily-balance-${group.dayKey}-${row.id}-${row.date}`}>
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
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {period.key === 'month' && monthlyBalancingGroups.length > 0 && (
                    <div className="monthly-balancing-report-section">
                      <button
                        type="button"
                        className="collapse-toggle-btn"
                        onClick={() => toggleSection('monthly-balance')}
                      >
                        {expandedSections['monthly-balance'] ? '▼' : '▶'} Saved From Daily Balancing (Monthly Structured View)
                      </button>
                      {expandedSections['monthly-balance'] && (
                      <div className="collapsible-content">
                      <p className="monthly-balancing-description">
                        A month-by-month breakdown grouped into weeks, so the report stays clear, ordered, and easy to review.
                      </p>

                      <div className="monthly-summary-grid">
                        <div className="monthly-summary-item">
                          <span>Total Circulation</span>
                          <strong>{formatCurrency(monthlyBalancingGroups.reduce((sum, group) => sum + group.totalCirculation, 0))}</strong>
                        </div>
                        <div className="monthly-summary-item">
                          <span>Total Line/Card Amount</span>
                          <strong>{formatCurrency(monthlyBalancingGroups.reduce((sum, group) => sum + group.totalLineAmounts, 0))}</strong>
                        </div>
                        <div className="monthly-summary-item">
                          <span>Total Use of the Day</span>
                          <strong>{formatCurrency(monthlyBalancingGroups.reduce((sum, group) => sum + group.totalConsumption, 0))}</strong>
                        </div>
                        <div className="monthly-summary-item">
                          <span>Weeks in Report</span>
                          <strong>{monthlyBalancingGroups.length}</strong>
                        </div>
                      </div>

                      {monthlyBalancingGroups.map((group) => (
                        <div className="monthly-week-group" key={`monthly-group-${group.weekKey}`}>
                          <div className="monthly-week-header">
                            <h4>{group.weekLabel}</h4>
                            <p>{group.days.length} days</p>
                          </div>

                          <div className="monthly-week-summary-grid">
                            <div className="monthly-week-summary-item">
                              <span>Money In Circulation</span>
                              <strong>{formatCurrency(group.totalCirculation)}</strong>
                            </div>
                            <div className="monthly-week-summary-item">
                              <span>Total Line/Card Amount</span>
                              <strong>{formatCurrency(group.totalLineAmounts)}</strong>
                            </div>
                            <div className="monthly-week-summary-item">
                              <span>Total Use of the Day</span>
                              <strong>{formatCurrency(group.totalConsumption)}</strong>
                            </div>
                            <div className="monthly-week-summary-item">
                              <span>Employees</span>
                              <strong>{group.employees.join(', ') || 'N/A'}</strong>
                            </div>
                          </div>

                          {group.days.map((day) => (
                            <div className="monthly-day-group" key={`monthly-day-${day.dayKey}`}>
                              <div className="monthly-day-header">
                                <h5>{day.dateLabel}</h5>
                                <p>{day.rows.length} records</p>
                              </div>

                              <p className="daily-circulation-line">
                                <strong>The current amount of money in circulation within the business:</strong>{' '}
                                {formatCurrency(day.circulationAmount)}
                              </p>
                              <p className="daily-notes-line">
                                <strong>Notes:</strong> {getDisplayNotes(day.rows)}
                              </p>

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
                                    {day.rows.map((row) => (
                                      <tr key={`monthly-day-row-${day.dayKey}-${row.id}-${row.date}`}>
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
                          ))}
                        </div>
                      ))}
                      </div>
                      )}
                    </div>
                  )}

                  {period.key === 'year' && yearMonthSummaries.length > 0 && (
                    <div className="yearly-summary-report-section">
                      <button
                        type="button"
                        className="collapse-toggle-btn"
                        onClick={() => toggleSection('yearly-summary')}
                      >
                        {expandedSections['yearly-summary'] ? '▼' : '▶'} Yearly Report Structured by Month
                      </button>
                      {expandedSections['yearly-summary'] && (
                      <div className="collapsible-content">
                      <p className="yearly-summary-description">
                        A clear month-by-month summary based on saved daily balancing data only.
                      </p>

                      <div className="yearly-summary-grid">
                        <div className="yearly-summary-item">
                          <span>Months Covered</span>
                          <strong>{yearMonthSummaries.length}</strong>
                        </div>
                        <div className="yearly-summary-item">
                          <span>Total Active Days</span>
                          <strong>{yearMonthSummaries.reduce((sum, month) => sum + month.activeDays, 0)}</strong>
                        </div>
                        <div className="yearly-summary-item">
                          <span>Total Line/Card Amount</span>
                          <strong>{formatCurrency(yearMonthSummaries.reduce((sum, month) => sum + month.totalLineAmounts, 0))}</strong>
                        </div>
                        <div className="yearly-summary-item">
                          <span>Total Use of the Day</span>
                          <strong>{formatCurrency(yearMonthSummaries.reduce((sum, month) => sum + month.totalConsumption, 0))}</strong>
                        </div>
                        <div className="yearly-summary-item">
                          <span>Latest Closing Circulation</span>
                          <strong>{formatCurrency(yearMonthSummaries[0]?.closingCirculation || 0)}</strong>
                        </div>
                      </div>

                      <div className="table-container">
                        <table className="transactions-table yearly-month-table">
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Active Days</th>
                              <th>Saved Line Entries</th>
                              <th>Total Line/Card Amount</th>
                              <th>Total Use of the Day</th>
                              <th>Average Circulation</th>
                              <th>Closing Circulation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {yearMonthSummaries.map((month) => (
                              <tr key={`year-month-${month.monthKey}`}>
                                <td>{month.monthLabel}</td>
                                <td>{month.activeDays}</td>
                                <td>{month.lineEntries}</td>
                                <td>{formatCurrency(month.totalLineAmounts)}</td>
                                <td>{formatCurrency(month.totalConsumption)}</td>
                                <td>{formatCurrency(month.averageCirculation)}</td>
                                <td>{formatCurrency(month.closingCirculation)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </div>
                      )}
                    </div>
                  )}

                  {/* Day transactions table removed — keep only the saved daily-balancing table above */}
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
