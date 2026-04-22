import React from 'react';
import { Link } from 'react-router-dom';
import PublicTopNav from './PublicTopNav';

interface PublicAuthLayoutProps {
  mode: 'login' | 'register';
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const PublicAuthLayout: React.FC<PublicAuthLayoutProps> = ({
  mode,
  title,
  subtitle,
  children,
  footer
}) => {
  return (
    <div className="auth-page">
      <PublicTopNav active={mode} />

      <main className="auth-main-grid">
        <section className="auth-showcase">
          <div className="hero-banner">
            <div className="hero-copy">
              <p className="hero-eyebrow">Built for fast and trusted neighborhood transactions</p>
              <h1>Manage mobile money services with confidence and clarity.</h1>
              <p className="hero-intro">
                Centralize your daily balancing, registered lines, and reports in one professional workspace
                designed for modern agent businesses.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="hero-btn hero-btn-primary">Open Agent Account</Link>
                <Link to="/services" className="hero-btn hero-btn-secondary">Explore Services</Link>
              </div>
              <div className="hero-trust-row">
                <span>Clear daily workflow</span>
                <span>Secure access</span>
                <span>Reliable records</span>
              </div>
            </div>

            <div className="hero-media-card">
              <div className="hero-media" role="img" aria-label="A mobile money customer withdrawing cash from an agent point" />
              <div className="hero-media-caption hero-media-caption-floating">
                <span className="caption-pill">Simamia biashara yako rahisi</span>
                <p>Focused access for login and registration. Full details are in Services and Benefits pages.</p>
                <div className="caption-points">
                  <Link to="/services">Services</Link>
                  <Link to="/benefits">Benefits</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-badge">Secure access</div>
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
