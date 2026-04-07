import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SERVICES } from '../utils/constants';
import { ServiceType } from '../types';
import './TransactionEntry.css';

interface RegisteredDetailsProps {
  onLogout: () => void;
}

interface LineEntry {
  serviceType: ServiceType;
  lineCard: string;
}

interface SavedRegisteredDetails {
  savedAt: string;
  entries: LineEntry[];
}

const REGISTERED_DETAILS_STORAGE_KEY = 'registered-line-details';

const createEmptyEntry = (): LineEntry => ({
  serviceType: 'vodacom',
  lineCard: '',
});

const RegisteredDetails: React.FC<RegisteredDetailsProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LineEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleEntryChange = (index: number, field: keyof LineEntry, value: string) => {
    const nextEntries = [...entries];
    nextEntries[index] = {
      ...nextEntries[index],
      [field]: value,
    };
    setEntries(nextEntries);
  };

  const addLineRow = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeLineRow = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    const hasInvalidRows = entries.some((entry) => !entry.lineCard.trim());

    if (
      hasInvalidRows
    ) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: 'Please fill line/card for each row.',
      });
      return;
    }

    try {
      const payload: SavedRegisteredDetails = {
        savedAt: new Date().toISOString(),
        entries: entries.map((entry) => ({
          serviceType: entry.serviceType,
          lineCard: entry.lineCard.trim(),
        })),
      };

      localStorage.setItem(REGISTERED_DETAILS_STORAGE_KEY, JSON.stringify(payload));

      setMessage({ type: 'success', text: 'Registered details saved. Continue to Daily Balancing.' });
      setEntries([createEmptyEntry()]);
      navigate('/daily-balancing');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Failed to save registered details',
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
          <h1>Registered Details</h1>
          <p className="subtitle">Manually enter service name and line/card, then save registered details.</p>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="section-header">register lines, your cash and uses of the day</div>
            <div className="line-table">
              <div className="line-table-header">
                <span>Service</span>
                <span>Telephone Line / Card</span>
                <span>Action</span>
              </div>
              {entries.map((entry, index) => {
                return (
                  <div className="line-row" key={`line-row-${index}`}>
                    <select
                      value={entry.serviceType}
                      onChange={(e) => handleEntryChange(index, 'serviceType', e.target.value as ServiceType)}
                    >
                      {SERVICES.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={entry.lineCard}
                      onChange={(e) => handleEntryChange(index, 'lineCard', e.target.value)}
                      placeholder="Line/Card number"
                      required
                    />
                    <button
                      type="button"
                      className="line-remove-btn"
                      onClick={() => removeLineRow(index)}
                      disabled={entries.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" className="line-add-btn" onClick={addLineRow}>
              + add another line, your cash, or uses of this day
            </button>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Saving...' : 'Save Registered Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisteredDetails;
