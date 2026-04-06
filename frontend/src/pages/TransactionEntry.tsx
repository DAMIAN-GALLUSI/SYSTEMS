import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import './TransactionEntry.css';

interface TransactionEntryProps {
  onLogout: () => void;
}

const TransactionEntry: React.FC<TransactionEntryProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="transaction-container">
      <Navbar onLogout={onLogout} />
      <div className="transaction-content">
        <div className="transaction-card">
          <h1>Record Transactions</h1>
          <p className="subtitle">Open the registration page to manually enter the 8 lines, your cash, and daily uses.</p>

          <button type="button" className="btn-submit" onClick={() => navigate('/registered-details')}>
            Register All Lines
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;
