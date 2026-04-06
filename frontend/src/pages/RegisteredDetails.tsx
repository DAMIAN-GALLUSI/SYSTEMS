import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI } from '../services/api';
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

const createInitialEntries = (): LineEntry[] =>
  SERVICES.map((service) => ({
    serviceType: service.id,
    lineCard: '',
  }));

const RegisteredDetails: React.FC<RegisteredDetailsProps> = ({ onLogout }) => {
  const [formData, setFormData] = useState({
    placeOfConsumption: '',
    totalCashOut: '',
    dailyConsumption: '',
  });
  const [entries, setEntries] = useState<LineEntry[]>(createInitialEntries());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEntryChange = (index: number, value: string) => {
    const nextEntries = [...entries];
    nextEntries[index] = {
      ...nextEntries[index],
      lineCard: value,
    };
    setEntries(nextEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    const hasInvalidRows = entries.some((entry) => !entry.lineCard.trim());
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
        text: 'Please fill all 8 registered lines, cash out, place of consumption, and daily uses.',
      });
      return;
    }

    try {
      await transactionAPI.create({
        placeOfConsumption: formData.placeOfConsumption,
        totalCashOut,
        dailyConsumption,
        entries: entries.map((entry) => ({
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
      setEntries(createInitialEntries());
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
          <p className="subtitle">Fill the 8 registered lines, your cash out, place of consumption, and daily uses.</p>

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

            <div className="section-header">Registered Lines</div>
            <div className="line-table">
              <div className="line-table-header">
                <span>Service</span>
                <span>Telephone Line / Card</span>
              </div>
              {entries.map((entry, index) => {
                const service = SERVICES.find((item) => item.id === entry.serviceType);
                return (
                  <div className="line-row" key={entry.serviceType}>
                    <span className="service-name">{service?.name || entry.serviceType}</span>
                    <input
                      type="text"
                      value={entry.lineCard}
                      onChange={(e) => handleEntryChange(index, e.target.value)}
                      placeholder="Line/Card number"
                      required
                    />
                  </div>
                );
              })}
            </div>

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
