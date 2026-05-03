import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './TransactionEntry.css';

interface TransactionEntryProps {
  onLogout: () => void;
}

const TransactionEntry: React.FC<TransactionEntryProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="transaction-container">
      <Navbar onLogout={onLogout} />
      <div className="transaction-content">
        <div className="transaction-card">
          <h1>{t('transactionEntry.title')}</h1>
          <p className="subtitle">{t('transactionEntry.subtitle')}</p>

          <button type="button" className="btn-submit" onClick={() => navigate('/registered-details')}>
            {t('transactionEntry.registerButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;
