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
          <p className="subtitle">register lines, your cash and uses of the day</p>

          <button type="button" className="btn-submit" onClick={() => navigate('/registered-details')}>
            register lines, your cash and uses of the day
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;
