import React from 'react';
import { Link } from 'react-router-dom';
import PublicTopNav from './PublicTopNav';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicAuthLayoutProps {
  mode: 'login' | 'register';
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  hideShowcase?: boolean;
}

const PublicAuthLayout: React.FC<PublicAuthLayoutProps> = ({
  mode,
  title,
  subtitle,
  children,
  footer,
  hideShowcase = false
}) => {
  const { t } = useLanguage();

  return (
    <div className="auth-page">
      <PublicTopNav active={mode} />

      <main className={`auth-main-grid${hideShowcase ? ' auth-main-grid-compact' : ''}`}>
        {!hideShowcase && <section className="auth-showcase">
          <div className="hero-banner">
            <div className="hero-copy">
              <p className="hero-eyebrow">{t('public.home.heroEyebrow')}</p>
              <h1>{t('public.home.heroTitle')}</h1>
              <p className="hero-intro">{t('public.home.heroIntro')}</p>
              <div className="hero-actions">
                <Link to="/register" className="hero-btn hero-btn-primary">{t('public.home.openAccount')}</Link>
                <Link to="/services" className="hero-btn hero-btn-secondary">{t('public.home.exploreServices')}</Link>
              </div>
              <div className="hero-trust-row">
                <span>{t('public.home.trustOne')}</span>
                <span>{t('public.home.trustTwo')}</span>
                <span>{t('public.home.trustThree')}</span>
              </div>
            </div>

            <div className="hero-media-card">
              <div className="hero-media" role="img" aria-label="A mobile money customer withdrawing cash from an agent point" />
              <div className="hero-media-caption hero-media-caption-floating">
                <span className="caption-pill">{t('public.home.caption')}</span>
                <p>{t('public.home.caption')}</p>
                <div className="caption-points">
                  <Link to="/services">{t('public.home.servicesLink')}</Link>
                  <Link to="/benefits">{t('public.home.benefitsLink')}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>}

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-badge">{t('public.auth.secureAccess')}</div>
            <h2>{title}</h2>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
            <div className="auth-footer-slot">{footer}</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicAuthLayout;
