import React from 'react';
import { Link } from 'react-router-dom';
import PublicTopNav from '../components/PublicTopNav';
import { SERVICES } from '../utils/constants';
import './Auth.css';
import './PublicInfo.css';

const Services: React.FC = () => {
  return (
    <div className="auth-page">
      <PublicTopNav active="services" />
      <main className="public-info-wrap">
        <section className="public-info-hero">
          <h1>Services We Support</h1>
          <p>
            The system supports all primary mobile money lines and Lipa Namba channels,
            helping your team manage transactions and balancing from one workspace.
          </p>
          <div className="public-info-actions">
            <Link to="/login" className="hero-btn hero-btn-primary">Login</Link>
            <Link to="/register" className="hero-btn hero-btn-secondary">Create Account</Link>
          </div>
        </section>

        <section className="public-card-grid">
          {SERVICES.map((service) => (
            <article key={service.id} className="public-info-card">
              <div className="service-dot" style={{ background: service.color }} aria-hidden="true" />
              <h3>{service.name}</h3>
              <p>Available for daily balancing, transaction tracking, and reporting.</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Services;
