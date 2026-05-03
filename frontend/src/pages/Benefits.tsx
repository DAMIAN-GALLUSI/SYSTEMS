import React from 'react';
import PublicTopNav from '../components/PublicTopNav';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';
import './PublicInfo.css';

const benefitItems = [
  {
    title: 'Faster Daily Balancing',
    description: 'Capture all service balances quickly with a clear end-of-day process.'
  },
  {
    title: 'Better Visibility',
    description: 'Owners and employees can view operational data based on role permissions.'
  },
  {
    title: 'Reliable Reporting',
    description: 'Generate records that help track performance and support business decisions.'
  },
  {
    title: 'Single Workspace',
    description: 'Keep services, transactions, and profit/loss trends in one connected system.'
  }
];

const Benefits: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="auth-page">
      <PublicTopNav active="benefits" />
      <main className="public-info-wrap">
        <section className="public-info-hero">
          <h1>{t('public.benefits.title')}</h1>
          <p>{t('public.benefits.description')}</p>
        </section>

        <section className="public-card-grid benefits-grid-two">
          {benefitItems.map((item) => (
            <article key={item.title} className="public-info-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Benefits;
