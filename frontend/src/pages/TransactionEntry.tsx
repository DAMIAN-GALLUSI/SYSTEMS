import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI } from '../services/api';
import { SERVICES } from '../utils/constants';
import { ServiceType } from '../types';
import './TransactionEntry.css';

interface TransactionEntryProps {
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

const TransactionEntry: React.FC<TransactionEntryProps> = ({ onLogout }) => {
  const [formData, setFormData] = useState({
    transactionType: 'deposit',
    placeOfConsumption: '',
    totalCashOut: '',
    dailyConsumption: '',
    notes: ''
  });
  const [entries, setEntries] = useState<LineEntry[]>(createInitialEntries());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEntryChange = (index: number, field: 'lineCard', value: string) => {
    const nextEntries = [...entries];
    nextEntries[index] = {
      ...nextEntries[index],
      [field]: value,
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

    if (hasInvalidRows || Number.isNaN(totalCashOut) || totalCashOut < 0 || Number.isNaN(dailyConsumption) || dailyConsumption < 0) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: 'Please fill all 8 line/card values, total cash out, and daily consumption.',
      });
      return;
    }

    try {
      await transactionAPI.create({
        transactionType: formData.transactionType,
        placeOfConsumption: formData.placeOfConsumption,
        totalCashOut,
        dailyConsumption,
        notes: formData.notes,
        entries: entries.map((entry) => ({
          serviceType: entry.serviceType,
          lineCard: entry.lineCard.trim(),
        })),
      });

      setMessage({ type: 'success', text: 'All 8 line/card records were saved successfully!' });
      setFormData({
        ...formData,
        placeOfConsumption: '',
        totalCashOut: '',
        dailyConsumption: '',
        notes: '',
      });
      setEntries(createInitialEntries());
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to record transaction' 
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
          <h1>Transactions Fill</h1>
          <p className="subtitle">Fill the registered lines, shared money out value, daily consumption, and place of consumption</p>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

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
                <label htmlFor="transactionType">Transaction Type</label>
                <select
                  id="transactionType"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  required
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                  <option value="transfer">Transfer</option>
                </select>
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
                      onChange={(e) => handleEntryChange(index, 'lineCard', e.target.value)}
                      placeholder="Line/Card number"
                      required
                    />
                  </div>
                );
              })}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalCashOut">Shared Money Out / Cash Out (TZS)</label>
                <input
                  type="number"
                  id="totalCashOut"
                  name="totalCashOut"
                  value={formData.totalCashOut}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter total cash out"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dailyConsumption">Daily Consumption (TZS)</label>
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

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Add any notes about these entries"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Saving...' : 'Save Transactions Fill'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;
