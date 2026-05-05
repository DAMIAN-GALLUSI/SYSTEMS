import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI } from '../services/api';
import { ServiceType } from '../types';
import { SERVICES } from '../utils/constants';
import { useLanguage } from '../contexts/LanguageContext';
import './TransactionEntry.css';

interface DailyBalancingProps {
  onLogout: () => void;
}

interface RegisteredLineEntry {
  serviceType: ServiceType;
  serviceName: string;
  lineCard: string;
}

interface SavedRegisteredDetails {
  savedAt: string;
  entries: RegisteredLineEntry[];
}

interface SavedDailyBalancing {
  savedAt: string;
  savedDayKey?: string;
  entries: LineAmountEntry[];
  cashInHand: string;
  dailyConsumption: string;
  notes: string;
  saveBatchId?: string;
}

interface LineAmountEntry extends RegisteredLineEntry {
  amount: string;
}

const REGISTERED_DETAILS_STORAGE_KEY = 'registered-line-details';
const SAVED_DAILY_BALANCING_STORAGE_KEY = 'saved-daily-balancing';

const createDefaultLineEntry = (): LineAmountEntry => ({
  serviceType: 'vodacom' as ServiceType,
  serviceName: 'Vodacom',
  lineCard: '',
  amount: '',
});

const mapRegisteredToLineEntries = (entries: RegisteredLineEntry[]): LineAmountEntry[] => {
  return entries
    .filter((entry) => Boolean(entry?.lineCard?.trim()))
    .map((entry) => ({
      serviceType: entry.serviceType || resolveServiceTypeFromName(entry.serviceName || ''),
      serviceName: entry.serviceName || SERVICES.find((service) => service.id === entry.serviceType)?.name || entry.serviceType,
      lineCard: entry.lineCard,
      amount: '',
    }));
};

const getDayKeyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayKey = (dateValue: string) => getDayKeyFromDate(new Date(dateValue));
const getTodayDayKey = () => getDayKeyFromDate(new Date());

const normalizeText = (value: string) => value.trim().toLowerCase();

const resolveServiceTypeFromName = (value: string): ServiceType => {
  const normalized = normalizeText(value);
  const byId = SERVICES.find((service) => normalizeText(service.id) === normalized);
  if (byId) {
    return byId.id;
  }

  const byName = SERVICES.find((service) => normalizeText(service.name) === normalized);
  if (byName) {
    return byName.id;
  }

  return 'vodacom';
};

const isTodayEntry = (saved: SavedDailyBalancing) => (saved.savedDayKey || getDayKey(saved.savedAt)) === getTodayDayKey();

const getSavedCirculationAmount = (saved: SavedDailyBalancing) => {
  const cash = Number(saved.cashInHand);
  const safeCash = Number.isNaN(cash) ? 0 : cash;
  const linesTotal = saved.entries.reduce((sum, entry) => {
    const amount = Number(entry.amount);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  return safeCash + linesTotal;
};

const DailyBalancing: React.FC<DailyBalancingProps> = ({ onLogout }) => {
  const { t } = useLanguage();
  const [lineEntries, setLineEntries] = useState<LineAmountEntry[]>([]);
  const [cashInHand, setCashInHand] = useState('');
  const [dailyConsumption, setDailyConsumption] = useState('');
  const [notes, setNotes] = useState('');
  const [savedDailyBalancing, setSavedDailyBalancing] = useState<SavedDailyBalancing | null>(null);
  const [savedDailyBalancingHistory, setSavedDailyBalancingHistory] = useState<SavedDailyBalancing[]>([]);
  const [showSavedDailyBalancing, setShowSavedDailyBalancing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let nextEntries: LineAmountEntry[] = [];

    const registeredRaw = localStorage.getItem(REGISTERED_DETAILS_STORAGE_KEY);
    if (!registeredRaw) {
      nextEntries = [];
    } else {
      try {
        const parsed: SavedRegisteredDetails = JSON.parse(registeredRaw);
        if (Array.isArray(parsed.entries) && parsed.entries.length > 0) {
          const mappedEntries = mapRegisteredToLineEntries(parsed.entries);
          if (mappedEntries.length > 0) {
            nextEntries = mappedEntries;
          }
        }
      } catch {
        nextEntries = [];
      }
    }

    const savedRaw = localStorage.getItem(SAVED_DAILY_BALANCING_STORAGE_KEY);
    if (!savedRaw) {
      setSavedDailyBalancingHistory([]);
      setSavedDailyBalancing(null);
      setShowSavedDailyBalancing(false);
      setLineEntries(nextEntries.length > 0 ? nextEntries : [createDefaultLineEntry()]);
      return;
    }

    try {
      const parsed = JSON.parse(savedRaw) as SavedDailyBalancing | SavedDailyBalancing[];
      const history = Array.isArray(parsed) ? parsed : [parsed];
      const safeHistory = history.filter((entry) => Array.isArray(entry?.entries));

      if (safeHistory.length < 1) {
        return;
      }

      safeHistory.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());

      setSavedDailyBalancingHistory(safeHistory);
      setSavedDailyBalancing(safeHistory[safeHistory.length - 1]);
      setShowSavedDailyBalancing(true);

      const fallbackEntries = mapRegisteredToLineEntries(safeHistory[safeHistory.length - 1].entries || []);
      setLineEntries(nextEntries.length > 0 ? nextEntries : fallbackEntries.length > 0 ? fallbackEntries : [createDefaultLineEntry()]);
    } catch {
      setSavedDailyBalancingHistory([]);
      setSavedDailyBalancing(null);
      setShowSavedDailyBalancing(false);
      setLineEntries(nextEntries.length > 0 ? nextEntries : [createDefaultLineEntry()]);
    }
  }, []);

  const totalLineAmount = useMemo(() => {
    return lineEntries.reduce((sum, entry) => {
      const parsedAmount = Number(entry.amount);
      return sum + (Number.isNaN(parsedAmount) ? 0 : parsedAmount);
    }, 0);
  }, [lineEntries]);

  const totalAvailableMoney = useMemo(() => {
    const parsedCash = Number(cashInHand);
    const safeCash = Number.isNaN(parsedCash) ? 0 : parsedCash;
    return safeCash + totalLineAmount;
  }, [cashInHand, totalLineAmount]);

  const handleAmountChange = (index: number, value: string) => {
    const nextEntries = [...lineEntries];
    nextEntries[index] = { ...nextEntries[index], amount: value };
    setLineEntries(nextEntries);
  };

  const todaySavedEntry = useMemo(() => {
    const todayKey = getTodayDayKey();
    const matches = savedDailyBalancingHistory.filter((entry) => (entry.savedDayKey || getDayKey(entry.savedAt)) === todayKey);
    if (matches.length < 1) {
      return null;
    }

    matches.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
    return matches[matches.length - 1];
  }, [savedDailyBalancingHistory]);

  const handleEditTodaySaved = () => {
    if (!todaySavedEntry) {
      return;
    }

    setLineEntries(todaySavedEntry.entries.map((entry) => ({ ...entry })));
    setCashInHand(todaySavedEntry.cashInHand);
    setDailyConsumption(todaySavedEntry.dailyConsumption);
    setNotes(todaySavedEntry.notes);
    setShowSavedDailyBalancing(false);
    setMessage({ type: 'success', text: t('dailyBalancing.editTodaySuccess') });
  };

  const handleEditLine = (index: number, field: keyof LineAmountEntry, value: string) => {
    const nextEntries = [...lineEntries];
    if (field === 'serviceType') {
      const selectedService = SERVICES.find((service) => service.id === value);
      nextEntries[index] = {
        ...nextEntries[index],
        serviceType: value as ServiceType,
        serviceName: selectedService?.name || value,
      };
    } else {
      nextEntries[index] = { ...nextEntries[index], [field]: value };
    }

    setLineEntries(nextEntries);
  };

  const handleRemoveLine = (index: number) => {
    if (lineEntries.length === 1) return;
    setLineEntries(lineEntries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate that we have at least one line with service name and line card
    const hasInvalidLine = lineEntries.some((entry) => !entry.serviceName.trim() || !entry.lineCard.trim());
    if (hasInvalidLine) {
      setMessage({ type: 'error', text: t('dailyBalancing.fillError') });
      return;
    }

    const hasInvalidAmount = lineEntries.some((entry) => {
      const parsedAmount = Number(entry.amount);
      return Number.isNaN(parsedAmount) || parsedAmount < 0;
    });

    if (hasInvalidAmount) {
      setMessage({ type: 'error', text: t('dailyBalancing.amountError') });
      return;
    }

    const parsedCash = Number(cashInHand);
    if (Number.isNaN(parsedCash) || parsedCash < 0) {
      setMessage({ type: 'error', text: t('dailyBalancing.cashError') });
      return;
    }

    const parsedConsumption = Number(dailyConsumption);
    if (Number.isNaN(parsedConsumption) || parsedConsumption < 0) {
      setMessage({ type: 'error', text: t('dailyBalancing.consumptionError') });
      return;
    }

    setLoading(true);

    try {
      const saveBatchId = `${Date.now()}`;
      const savedPayload: SavedDailyBalancing = {
        savedAt: new Date().toISOString(),
        savedDayKey: getTodayDayKey(),
        entries: lineEntries.map((entry) => ({
          ...entry,
          amount: String(entry.amount),
        })),
        cashInHand: String(parsedCash),
        dailyConsumption: String(parsedConsumption),
        notes: notes.trim(),
        saveBatchId,
      };

      // Update registered details with the edited lines
      const registeredDetails: SavedRegisteredDetails = {
        savedAt: new Date().toISOString(),
        entries: lineEntries.map((entry) => ({
          serviceType: entry.serviceType,
          serviceName: entry.serviceName,
          lineCard: entry.lineCard,
        })),
      };

      // Save to local storage first (synchronous, guaranteed)
      localStorage.setItem(REGISTERED_DETAILS_STORAGE_KEY, JSON.stringify(registeredDetails));

      const updatedHistory = [...savedDailyBalancingHistory];
      const todayKey = savedPayload.savedDayKey;
      const todayIndex = updatedHistory.findIndex((entry) => (entry.savedDayKey || getDayKey(entry.savedAt)) === todayKey);

      if (todayIndex >= 0) {
        updatedHistory[todayIndex] = savedPayload;
      } else {
        updatedHistory.push(savedPayload);
      }

      updatedHistory.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());

      localStorage.setItem(SAVED_DAILY_BALANCING_STORAGE_KEY, JSON.stringify(updatedHistory));
      setSavedDailyBalancingHistory(updatedHistory);
      setSavedDailyBalancing(savedPayload);
      setShowSavedDailyBalancing(true);

      // Update UI immediately after local save
      setMessage({ type: 'success', text: t('dailyBalancing.saveSuccess') });
      setLineEntries((current) => current.map((entry) => ({ ...entry, amount: '' })));
      setCashInHand('');
      setDailyConsumption('');
      setNotes('');

      // Sync with API (optional - data is already saved locally)
      try {
        await transactionAPI.create({
          transactionType: 'withdraw',
          entries: lineEntries.map((entry) => ({
            serviceType: entry.serviceType,
            lineCard: entry.lineCard,
            amount: Number(entry.amount),
          })),
          cashInHand: parsedCash,
          dailyConsumption: parsedConsumption,
          notes: notes.trim(),
          saveBatchId,
        });
      } catch (apiError: any) {
        console.warn('API sync failed, but data is saved locally:', apiError);
        // Data is already saved locally, API sync failure is non-critical
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || t('dailyBalancing.saveFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-container">
      <Navbar onLogout={onLogout} />
      <div className="transaction-content">
        <div className="transaction-card">
          <h1>{t('dailyBalancing.title')}</h1>
          <p className="subtitle">{t('dailyBalancing.subtitle')}</p>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="section-header">{t('dailyBalancing.sectionHeader')}</div>
            <p className="subtitle">{t('dailyBalancing.sectionSubtitle')}</p>

            {lineEntries.length > 0 && (
              <div className="line-table">
                <div className="line-table-header">
                  <span>{t('dailyBalancing.service')}</span>
                  <span>{t('dailyBalancing.lineCard')}</span>
                  <span>{t('dailyBalancing.amount')}</span>
                  <span>{t('dailyBalancing.action')}</span>
                </div>
                {lineEntries.map((entry, index) => {
                  return (
                    <div className="line-row" key={`entry-${index}`}>
                      <select
                        value={entry.serviceType}
                        onChange={(e) => handleEditLine(index, 'serviceType', e.target.value)}
                        required
                      >
                        {SERVICES.map((service) => (
                          <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={entry.lineCard}
                        onChange={(e) => handleEditLine(index, 'lineCard', e.target.value)}
                        placeholder={t('dailyBalancing.linePlaceholder')}
                        required
                      />
                      <input
                        className="saved-amount-input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={t('dailyBalancing.amountPlaceholder')}
                        value={entry.amount}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="line-remove-btn"
                        onClick={() => handleRemoveLine(index)}
                        disabled={lineEntries.length === 1}
                      >
                        {t('dailyBalancing.remove')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cashInHand">{t('dailyBalancing.cashInHand')}</label>
                  <input
                    id="cashInHand"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashInHand}
                    onChange={(e) => setCashInHand(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dailyConsumption">{t('dailyBalancing.useOfDay')}</label>
                  <input
                    id="dailyConsumption"
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyConsumption}
                    onChange={(e) => setDailyConsumption(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">{t('dailyBalancing.notes')}</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('dailyBalancing.notesPlaceholder')}
                />
              </div>

              <div className="section-header">{t('dailyBalancing.circulation')} {new Intl.NumberFormat('en-TZ').format(totalAvailableMoney)} TZS</div>

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? t('dailyBalancing.saving') : t('dailyBalancing.saveBalancing')}
              </button>

              {todaySavedEntry && (
                <button type="button" className="line-add-btn" onClick={handleEditTodaySaved}>
                  {t('dailyBalancing.editToday')}
                </button>
              )}

              {savedDailyBalancing && (
                <>
                  <button
                    type="button"
                    className="line-add-btn"
                    onClick={() => setShowSavedDailyBalancing((current) => !current)}
                  >
                    {showSavedDailyBalancing ? t('dailyBalancing.hideSaved') : t('dailyBalancing.openSaved')}
                  </button>

                  {showSavedDailyBalancing && (
                    <div className="saved-report-panel" style={{ marginTop: '1rem' }}>
                      <div className="section-header">{t('dailyBalancing.savedTitle')}</div>
                      <p><strong>{t('dailyBalancing.savedAt')}</strong> {new Date(savedDailyBalancing.savedAt).toLocaleString('en-TZ')}</p>
                      {!isTodayEntry(savedDailyBalancing) && (
                        <p><strong>{t('dailyBalancing.note')}</strong> {t('dailyBalancing.locked')}</p>
                      )}
                      {isTodayEntry(savedDailyBalancing) && (
                        <button type="button" className="line-add-btn" onClick={handleEditTodaySaved}>
                          {t('dailyBalancing.editSaved')}
                        </button>
                      )}
                      <p><strong>{t('dailyBalancing.savedCash')}</strong> {new Intl.NumberFormat('en-TZ').format(Number(savedDailyBalancing.cashInHand))} TZS</p>
                      <p><strong>{t('dailyBalancing.savedUseOfDay')}</strong> {new Intl.NumberFormat('en-TZ').format(Number(savedDailyBalancing.dailyConsumption))} TZS</p>
                      <p>
                        <strong>{t('dailyBalancing.circulation')}</strong>{' '}
                        {new Intl.NumberFormat('en-TZ').format(getSavedCirculationAmount(savedDailyBalancing))} TZS
                      </p>
                      {savedDailyBalancing.notes && <p><strong>{t('dailyBalancing.notes')}</strong> {savedDailyBalancing.notes}</p>}
                      <div className="line-table saved-lines-table" style={{ marginTop: '1rem' }}>
                        <div className="line-table-header saved-lines-header">
                          <span>{t('dailyBalancing.service')}</span>
                          <span>{t('dailyBalancing.lineCard')}</span>
                          <span>{t('dailyBalancing.amount')}</span>
                        </div>
                        {savedDailyBalancing.entries.map((entry, index) => (
                          <div className="line-row saved-lines-row" key={`${entry.serviceType}-${entry.lineCard}-${index}`}>
                            <span className="service-name saved-service-cell">{entry.serviceName}</span>
                            <span className="service-name saved-line-card-cell">{entry.lineCard}</span>
                            <span className="saved-amount-input">{new Intl.NumberFormat('en-TZ').format(Number(entry.amount))}</span>
                          </div>
                        ))}
                      </div>
                      {savedDailyBalancingHistory.length > 1 && (
                        <p style={{ marginTop: '1rem' }}>
                          <strong>{t('dailyBalancing.savedDays')}</strong> {savedDailyBalancingHistory.length} ({t('dailyBalancing.olderLocked')})
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default DailyBalancing;
