import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI } from '../services/api';
import { ServiceType } from '../types';
import './TransactionEntry.css';

interface RegisteredDetailsProps {
  onLogout: () => void;
}

interface LineEntry {
  serviceName: string;
  lineCard: string;
}

const createEmptyEntry = (): LineEntry => ({
  serviceName: '',
  lineCard: '',
});

const normalizeServiceType = (serviceName: string): ServiceType | null => {
  const normalized = serviceName.trim().toLowerCase().replace(/\s+/g, ' ');
  const compact = normalized.replace(/[_\-]/g, ' ');

  if (compact.includes('lipa') && compact.includes('vodacom')) return 'lipa_namba_vodacom';
  if (compact.includes('lipa') && compact.includes('airtel')) return 'lipa_namba_airtel';
  if (compact.includes('lipa') && compact.includes('airtell')) return 'lipa_namba_airtel';
  if (compact.includes('lipa') && compact.includes('tigo')) return 'lipa_namba_tigo';
  if (compact.includes('lipa') && compact.includes('halotel')) return 'lipa_namba_halotel';

  if (compact.includes('vodacom')) return 'vodacom';
  if (compact.includes('airtel') || compact.includes('airtell')) return 'airtel';
  if (compact.includes('tigo')) return 'tigo';
  if (compact.includes('halotel')) return 'halotel';

  // Default bucket keeps save flow manual and non-blocking.
  return 'vodacom';
};

const RegisteredDetails: React.FC<RegisteredDetailsProps> = ({ onLogout }) => {
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

    const hasInvalidRows = entries.some((entry) => !entry.serviceName.trim() || !entry.lineCard.trim());

    if (
      hasInvalidRows
    ) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: 'Please fill service name and line/card for each row.',
      });
      return;
    }

    const mappedEntries = entries.map((entry) => ({
      serviceType: normalizeServiceType(entry.serviceName),
      lineCard: entry.lineCard.trim(),
      serviceName: entry.serviceName.trim(),
    }));

    try {
      await transactionAPI.create({
        entries: mappedEntries.map((entry) => ({
          serviceType: entry.serviceType,
          lineCard: entry.lineCard.trim(),
        })),
      });

      setMessage({ type: 'success', text: 'Registered details saved successfully!' });
      setEntries([createEmptyEntry()]);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save registered details',
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
                <span>Service Name</span>
                <span>Telephone Line / Card</span>
                <span>Action</span>
              </div>
              {entries.map((entry, index) => {
                return (
                  <div className="line-row" key={`line-row-${index}`}>
                    <input
                      type="text"
                      value={entry.serviceName}
                      onChange={(e) => handleEntryChange(index, 'serviceName', e.target.value)}
                      placeholder="Example: Vodacom"
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
