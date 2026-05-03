import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import PublicAuthLayout from '../components/PublicAuthLayout';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

interface LoginProps {
  onLogin: (token: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      onLogin(token, user.role);
      navigate('/daily-balancing');
    } catch (err: any) {
      setError(err.response?.data?.message || t('public.auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      mode="login"
      hideShowcase
      title={t('public.auth.loginTitle')}
      subtitle={t('public.auth.loginSubtitle')}
      footer={
        <p className="auth-footer">
          {t('public.auth.noAccount')} <Link to="/register">{t('public.auth.registerHere')}</Link>
        </p>
      }
    >
      {error && <div className="error-message">{error}</div>}
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
        <div className="form-group">
          <label htmlFor="password">{t('public.auth.password')}</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('public.auth.enterPassword')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t('public.auth.hidePassword') : t('public.auth.showPassword')}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.98 8.223A10.94 10.94 0 0 1 12 5c5.5 0 9.27 3.61 10.98 7a12.37 12.37 0 0 1-4.15 4.83" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.88 9.88A3 3 0 1 0 14.12 14.12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 1l22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.1 12c1.7-3.39 5.5-7 9.9-7s8.2 3.61 9.9 7c-1.7 3.39-5.5 7-9.9 7S3.8 15.39 2.1 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? t('public.auth.loggingIn') : t('public.auth.login')}
        </button>
      </form>
    </PublicAuthLayout>
  );
};

export default Login;
