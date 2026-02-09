import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI } from '../services/api';
import { SERVICES } from '../utils/constants';
import { ServiceType } from '../types';
import './TransactionEntry.css';

interface TransactionEntryProps {
  onLogout: () => void;
}

const TransactionEntry: React.FC<TransactionEntryProps> = ({ onLogout }) => {
  const [formData, setFormData] = useState({
    serviceType: 'vodacom' as ServiceType,
    amount: '',
    transactionType: 'deposit',
    cashInHand: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      await transactionAPI.create({
        serviceType: formData.serviceType,
        amount: parseFloat(formData.amount),
        transactionType: formData.transactionType,
        cashInHand: parseFloat(formData.cashInHand),
        description: formData.description
      });

      setMessage({ type: 'success', text: 'Transaction recorded successfully!' });
      setFormData({
        ...formData,
        amount: '',
        description: ''
      });
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
          <h1>Record Transaction</h1>
          <p className="subtitle">Enter transaction details for mobile money services</p>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="serviceType">Service</label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                >
                  {SERVICES.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount (TZS)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cashInHand">Cash in Hand After Transaction (TZS)</label>
                <input
                  type="number"
                  id="cashInHand"
                  name="cashInHand"
                  value={formData.cashInHand}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter current cash balance"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add any notes about this transaction"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Recording...' : 'Record Transaction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;
