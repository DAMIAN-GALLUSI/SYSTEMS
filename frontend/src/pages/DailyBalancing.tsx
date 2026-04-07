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

interface LineAmountEntry extends RegisteredLineEntry {
  amount: string;
}

const REGISTERED_DETAILS_STORAGE_KEY = 'registered-line-details';

const DailyBalancing: React.FC<DailyBalancingProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [lineEntries, setLineEntries] = useState<LineAmountEntry[]>([]);
  const [cashInHand, setCashInHand] = useState('');
  const [dailyConsumption, setDailyConsumption] = useState('');
  const [useOfTheDay, setUseOfTheDay] = useState('');
  const [notes, setNotes] = useState('');
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
      await transactionAPI.create({
        transactionType: 'withdraw',
        entries: lineEntries.map((entry) => ({
          serviceType: entry.serviceType,
          lineCard: entry.lineCard,
          amount: Number(entry.amount),
        })),
        cashInHand: parsedCash,
        dailyConsumption: parsedConsumption,
        placeOfConsumption: useOfTheDay.trim(),
        notes: notes.trim(),
      });

      setMessage({ type: 'success', text: 'Daily balancing saved successfully.' });
      setLineEntries((current) => current.map((entry) => ({ ...entry, amount: '' })));
      setCashInHand('');
      setDailyConsumption('');
      setUseOfTheDay('');
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
          <p className="subtitle">Enter each line amount, your cash in hand, and daily uses.</p>

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
                  <label htmlFor="dailyConsumption">Uses of the day (TZS)</label>
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
                <label htmlFor="useOfTheDay">Use of the day</label>
                <input
                  id="useOfTheDay"
                  type="text"
                  placeholder="Example: Shop restock, transport, bundles"
                  value={useOfTheDay}
                  onChange={(e) => setUseOfTheDay(e.target.value)}
                />
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

              <div className="section-header">Total available money: {new Intl.NumberFormat('en-TZ').format(totalAvailableMoney)} TZS</div>

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Saving...' : 'Save Daily Balancing'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyBalancing;
