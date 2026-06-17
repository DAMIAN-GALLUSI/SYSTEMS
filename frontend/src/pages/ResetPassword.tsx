import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import PublicAuthLayout from '../components/PublicAuthLayout';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

const ResetPassword: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token) {
      setError(t('public.auth.missingResetToken'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('public.auth.passwordsMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('public.auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      setSuccessMessage(t('public.auth.resetSuccess'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('public.auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      mode="login"
      hideShowcase
      title={t('public.auth.resetPasswordTitle')}
      subtitle={t('public.auth.resetPasswordSubtitle')}
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
          <label htmlFor="password">{t('public.auth.newPassword')}</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('public.auth.enterNewPassword')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t('public.auth.hidePassword') : t('public.auth.showPassword')}
            >
              {showPassword ? '×' : '◉'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">{t('public.auth.confirmNewPassword')}</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('public.auth.confirmYourNewPassword')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? t('public.auth.hideConfirmPassword') : t('public.auth.showConfirmPassword')}
            >
              {showConfirmPassword ? '×' : '◉'}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? t('public.auth.resettingPassword') : t('public.auth.resetPassword')}
        </button>
      </form>
    </PublicAuthLayout>
  );
};

export default ResetPassword;