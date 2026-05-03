import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import PublicAuthLayout from '../components/PublicAuthLayout';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

interface RegisterProps {
  onRegister: (token: string, role: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('public.auth.passwordsMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('public.auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      );
      const { token, user } = response.data;
      onRegister(token, user.role);
      navigate('/daily-balancing');
    } catch (err: any) {
      setError(err.response?.data?.message || t('public.auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      mode="register"
      hideShowcase
      title={t('public.auth.registerTitle')}
      subtitle={t('public.auth.registerSubtitle')}
      footer={
        <p className="auth-footer">
          {t('public.auth.haveAccount')} <Link to="/login">{t('public.auth.loginHere')}</Link>
        </p>
      }
    >
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">{t('public.auth.fullName')}</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder={t('public.auth.enterFullName')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">{t('public.auth.email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
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
        <div className="form-group">
          <label htmlFor="confirmPassword">{t('public.auth.confirmPassword')}</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder={t('public.auth.confirmYourPassword')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? t('public.auth.hideConfirmPassword') : t('public.auth.showConfirmPassword')}
            >
              {showConfirmPassword ? (
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
        <div className="form-group">
          <label htmlFor="role">{t('public.auth.role')}</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="employee">{t('public.auth.employee')}</option>
            <option value="owner">{t('public.auth.owner')}</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? t('public.auth.registering') : t('public.auth.register')}
        </button>
      </form>
    </PublicAuthLayout>
  );
};

export default Register;
