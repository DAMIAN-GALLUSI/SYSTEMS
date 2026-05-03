import React from 'react';
import PublicTopNav from '../components/PublicTopNav';
import { SERVICES } from '../utils/constants';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';
import './PublicInfo.css';

const Services: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="auth-page">
      <PublicTopNav active="services" />
      <main className="public-info-wrap">
        <section className="public-info-hero">
          <h1>{t('public.services.title')}</h1>
          <p>{t('public.services.description')}</p>
        </section>

        <section className="public-card-grid">
          {SERVICES.map((service) => (
            <article key={service.id} className="public-info-card">
              <div className="service-dot" style={{ background: service.color }} aria-hidden="true" />
              <h3>{service.name}</h3>
              <p>{t('public.services.cardDescription')}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Services;
