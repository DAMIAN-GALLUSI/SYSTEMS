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
          <p className="subtitle">Start by registering only the lines/cards you want to use today.</p>

          <button type="button" className="btn-submit" onClick={() => navigate('/registered-details')}>
            Register Your Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;
