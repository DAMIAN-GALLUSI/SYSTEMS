import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { transactionAPI } from '../services/api';
import { ServiceType } from '../types';
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

const getDayKeyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayKey = (dateValue: string) => getDayKeyFromDate(new Date(dateValue));
const getTodayDayKey = () => getDayKeyFromDate(new Date());

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
  const navigate = useNavigate();
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
    const raw = localStorage.getItem(REGISTERED_DETAILS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed: SavedRegisteredDetails = JSON.parse(raw);
      if (!Array.isArray(parsed.entries)) {
        return;
      }

      setLineEntries(
        parsed.entries.map((entry) => ({
          serviceType: entry.serviceType,
          serviceName: entry.serviceName || entry.serviceType,
          lineCard: entry.lineCard,
          amount: '',
        }))
      );
    } catch {
      setLineEntries([]);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SAVED_DAILY_BALANCING_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SavedDailyBalancing | SavedDailyBalancing[];
      const history = Array.isArray(parsed) ? parsed : [parsed];
      const safeHistory = history.filter((entry) => Array.isArray(entry?.entries));

      if (safeHistory.length < 1) {
        return;
      }

      safeHistory.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());

      setSavedDailyBalancingHistory(safeHistory);
      setSavedDailyBalancing(safeHistory[safeHistory.length - 1]);
    } catch {
      setSavedDailyBalancingHistory([]);
      setSavedDailyBalancing(null);
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
    setMessage({ type: 'success', text: 'Editing today\'s saved details. Save again to update today only.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (lineEntries.length < 1) {
      setMessage({ type: 'error', text: 'No saved registered details found. Save details first.' });
      return;
    }

    const hasInvalidAmount = lineEntries.some((entry) => {
      const parsedAmount = Number(entry.amount);
      return Number.isNaN(parsedAmount) || parsedAmount < 0;
    });

    if (hasInvalidAmount) {
      setMessage({ type: 'error', text: 'Enter a valid non-negative amount for every line.' });
      return;
    }

    const parsedCash = Number(cashInHand);
    if (Number.isNaN(parsedCash) || parsedCash < 0) {
      setMessage({ type: 'error', text: 'Enter a valid non-negative cash amount.' });
      return;
    }

    const parsedConsumption = Number(dailyConsumption);
    if (Number.isNaN(parsedConsumption) || parsedConsumption < 0) {
      setMessage({ type: 'error', text: 'Enter a valid non-negative daily uses amount.' });
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

      setMessage({ type: 'success', text: 'Daily balancing saved successfully.' });
      setLineEntries((current) => current.map((entry) => ({ ...entry, amount: '' })));
      setCashInHand('');
      setDailyConsumption('');
      setNotes('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save daily balancing details',
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
          <h1>Daily Balancing</h1>
          <p className="subtitle">Enter each line amount, your cash in hand, and use of the day.</p>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          {lineEntries.length < 1 ? (
            <>
              <div className="message error">No registered details found yet.</div>
              <button type="button" className="btn-submit" onClick={() => navigate('/registered-details')}>
                Go to Register Your Details
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="section-header">Saved lines/cards</div>
              <button type="button" className="line-add-btn" onClick={() => navigate('/registered-details')}>
                Edit Registered Lines/Cards
              </button>
              <div className="line-table saved-lines-table">
                <div className="line-table-header saved-lines-header">
                  <span>Service</span>
                  <span>Line/Card</span>
                  <span>Amount (TZS)</span>
                </div>
                {lineEntries.map((entry, index) => {
                  return (
                    <div className="line-row saved-lines-row" key={`${entry.serviceType}-${entry.lineCard}-${index}`}>
                      <span className="service-name saved-service-cell">{entry.serviceName}</span>
                      <span className="service-name saved-line-card-cell">{entry.lineCard}</span>
                      <input
                        className="saved-amount-input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={entry.amount}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        required
                      />
                    </div>
                  );
                })}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cashInHand">Cash in hand (TZS)</label>
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
                  <label htmlFor="dailyConsumption">Use of the day (TZS)</label>
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
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra details for this daily balancing entry"
                />
              </div>

              <div className="section-header">The current amount of money in circulation within the business: {new Intl.NumberFormat('en-TZ').format(totalAvailableMoney)} TZS</div>

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Saving...' : 'Save Daily Balancing'}
              </button>

              {todaySavedEntry && (
                <button type="button" className="line-add-btn" onClick={handleEditTodaySaved}>
                  Edit Today's Saved Details (Same Day Only)
                </button>
              )}

              {savedDailyBalancing && (
                <>
                  <button
                    type="button"
                    className="line-add-btn"
                    onClick={() => setShowSavedDailyBalancing((current) => !current)}
                  >
                    {showSavedDailyBalancing ? 'Hide Saved Daily Balancing' : 'Open Saved Daily Balancing'}
                  </button>

                  {showSavedDailyBalancing && (
                    <div className="saved-report-panel" style={{ marginTop: '1rem' }}>
                      <div className="section-header">Saved Daily Balancing</div>
                      <p><strong>Saved at:</strong> {new Date(savedDailyBalancing.savedAt).toLocaleString('en-TZ')}</p>
                      {!isTodayEntry(savedDailyBalancing) && (
                        <p><strong>Note:</strong> This is a past-day record and is locked from editing.</p>
                      )}
                      {isTodayEntry(savedDailyBalancing) && (
                        <button type="button" className="line-add-btn" onClick={handleEditTodaySaved}>
                          Edit This Saved Entry
                        </button>
                      )}
                      <p><strong>Cash in hand:</strong> {new Intl.NumberFormat('en-TZ').format(Number(savedDailyBalancing.cashInHand))} TZS</p>
                      <p><strong>Use of the day:</strong> {new Intl.NumberFormat('en-TZ').format(Number(savedDailyBalancing.dailyConsumption))} TZS</p>
                      <p>
                        <strong>The current amount of money in circulation within the business:</strong>{' '}
                        {new Intl.NumberFormat('en-TZ').format(getSavedCirculationAmount(savedDailyBalancing))} TZS
                      </p>
                      {savedDailyBalancing.notes && <p><strong>Notes:</strong> {savedDailyBalancing.notes}</p>}
                      <div className="line-table saved-lines-table" style={{ marginTop: '1rem' }}>
                        <div className="line-table-header saved-lines-header">
                          <span>Service</span>
                          <span>Line/Card</span>
                          <span>Amount (TZS)</span>
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
                          <strong>Saved days:</strong> {savedDailyBalancingHistory.length} (older days remain locked)
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyBalancing;
