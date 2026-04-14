import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SERVICES } from '../utils/constants';
import { ServiceType } from '../types';
import './TransactionEntry.css';

interface RegisteredDetailsProps {
  onLogout: () => void;
}

interface LineEntry {
  serviceInput: string;
  lineCard: string;
}

interface SavedLineEntry {
  serviceType: ServiceType;
  serviceName: string;
  lineCard: string;
}

interface SavedRegisteredDetails {
  savedAt: string;
  entries: SavedLineEntry[];
}

const REGISTERED_DETAILS_STORAGE_KEY = 'registered-line-details';

const createEmptyEntry = (): LineEntry => ({
  serviceInput: '',
  lineCard: '',
});

const normalizeValue = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const resolveServiceType = (serviceInput: string): ServiceType | null => {
  const normalized = normalizeValue(serviceInput);
  if (!normalized) {
    return null;
  }

  const directMatch = SERVICES.find((service) => normalizeValue(service.id) === normalized);
  if (directMatch) {
    return directMatch.id;
  }

  const nameMatch = SERVICES.find((service) => normalizeValue(service.name) === normalized);
  if (nameMatch) {
    return nameMatch.id;
  }

  return null;
};

const RegisteredDetails: React.FC<RegisteredDetailsProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LineEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const raw = localStorage.getItem(REGISTERED_DETAILS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed: SavedRegisteredDetails = JSON.parse(raw);
      if (!Array.isArray(parsed.entries) || parsed.entries.length < 1) {
        return;
      }

      setEntries(
        parsed.entries.map((entry) => ({
          serviceInput: entry.serviceName || entry.serviceType,
          lineCard: entry.lineCard,
        }))
      );
    } catch {
      setEntries([createEmptyEntry()]);
    }
  }, []);

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

    const invalidRow = entries.find((entry) => !resolveServiceType(entry.serviceInput) || !entry.lineCard.trim());

    if (invalidRow) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: 'Please enter a valid service name and fill line/card for each row.',
      });
      return;
    }

    try {
      const payload: SavedRegisteredDetails = {
        savedAt: new Date().toISOString(),
        entries: entries.map((entry) => ({
          serviceType: resolveServiceType(entry.serviceInput) as ServiceType,
          serviceName: entry.serviceInput.trim(),
          lineCard: entry.lineCard.trim(),
        })),
      };

      localStorage.setItem(REGISTERED_DETAILS_STORAGE_KEY, JSON.stringify(payload));
      setMessage({ type: 'success', text: 'Line saved successfully.' });
      window.setTimeout(() => {
        navigate('/daily-balancing');
      }, 1000);
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
          <h1>Register Your Details</h1>
          <p className="subtitle">Type the service name, then add each line/card you want to register.</p>

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
                    <input
                      type="text"
                      value={entry.serviceInput}
                      onChange={(e) => handleEntryChange(index, 'serviceInput', e.target.value)}
                      placeholder="Service name (e.g. Vodacom, Airtel, Tigo)"
                      required
                    />
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
