import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import PublicAuthLayout from '../components/PublicAuthLayout';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      const resetLink = response.data.resetLink;
      setSuccessMessage(resetLink ? `${t('public.auth.resetLinkSent')} ${resetLink}` : t('public.auth.resetLinkSent'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('public.auth.resetLinkFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      mode="login"
      hideShowcase
      title={t('public.auth.forgotPasswordTitle')}
      subtitle={t('public.auth.forgotPasswordSubtitle')}
      footer={
        <p className="auth-footer">
          <Link to="/login">{t('public.auth.backToLogin')}</Link>
        </p>
      }
    >
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">{t('public.auth.email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('public.auth.enterEmail')}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? t('public.auth.sendingResetLink') : t('public.auth.sendResetLink')}
        </button>
      </form>
    </PublicAuthLayout>
  );
};

export default ForgotPassword;