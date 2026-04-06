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
  const normalized = serviceName.trim().toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, ServiceType> = {
    vodacom: 'vodacom',
    airtel: 'airtel',
    tigo: 'tigo',
    halotel: 'halotel',
    lipa_namba_vodacom: 'lipa_namba_vodacom',
    lipa_namba_airtel: 'lipa_namba_airtel',
    lipa_namba_tigo: 'lipa_namba_tigo',
    lipa_namba_halotel: 'lipa_namba_halotel',
  };

  return map[normalized] || null;
};

const RegisteredDetails: React.FC<RegisteredDetailsProps> = ({ onLogout }) => {
  const [formData, setFormData] = useState({
    placeOfConsumption: '',
    totalCashOut: '',
    dailyConsumption: '',
  });
  const [entries, setEntries] = useState<LineEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
    const totalCashOut = Number(formData.totalCashOut);
    const dailyConsumption = Number(formData.dailyConsumption);

    if (
      hasInvalidRows ||
      !formData.placeOfConsumption.trim() ||
      Number.isNaN(totalCashOut) ||
      totalCashOut < 0 ||
      Number.isNaN(dailyConsumption) ||
      dailyConsumption < 0
    ) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: 'Please fill service name and line/card for each row, plus cash out, place of consumption, and daily uses.',
      });
      return;
    }

    const mappedEntries = entries.map((entry) => ({
      serviceType: normalizeServiceType(entry.serviceName),
      lineCard: entry.lineCard.trim(),
      serviceName: entry.serviceName.trim(),
    }));

    if (mappedEntries.some((entry) => !entry.serviceType)) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: 'Use valid service names: Vodacom, Airtel, Tigo, Halotel, Lipa Namba Vodacom, Lipa Namba Airtel, Lipa Namba Tigo, Lipa Namba Halotel.',
      });
      return;
    }

    try {
      await transactionAPI.create({
        placeOfConsumption: formData.placeOfConsumption,
        totalCashOut,
        dailyConsumption,
        entries: mappedEntries.map((entry) => ({
          serviceType: entry.serviceType,
          lineCard: entry.lineCard.trim(),
        })),
      });

      setMessage({ type: 'success', text: 'Registered details saved successfully!' });
      setFormData({
        placeOfConsumption: '',
        totalCashOut: '',
        dailyConsumption: '',
      });
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
          <p className="subtitle">Manually enter service name and line/card first, then fill cash out, place of consumption, and daily uses.</p>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="section-header">Transaction Details</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="placeOfConsumption">Place of Consumption</label>
                <input
                  type="text"
                  id="placeOfConsumption"
                  name="placeOfConsumption"
                  value={formData.placeOfConsumption}
                  onChange={handleChange}
                  required
                  placeholder="Enter place/location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalCashOut">Your Cash Out (TZS)</label>
                <input
                  type="number"
                  id="totalCashOut"
                  name="totalCashOut"
                  value={formData.totalCashOut}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter cash out"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dailyConsumption">Daily Uses / Consumption (TZS)</label>
                <input
                  type="number"
                  id="dailyConsumption"
                  name="dailyConsumption"
                  value={formData.dailyConsumption}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Example: 10000"
                  required
                />
              </div>
            </div>

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
              + Add Another Line
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
