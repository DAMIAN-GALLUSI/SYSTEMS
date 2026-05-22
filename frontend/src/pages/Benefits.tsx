import React from 'react';
import PublicTopNav from '../components/PublicTopNav';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';
import './PublicInfo.css';

const Benefits: React.FC = () => {
  const { t } = useLanguage();

  const benefitItems = [
    {
      title: t('public.benefits.items.fasterDailyBalancing.title'),
      description: t('public.benefits.items.fasterDailyBalancing.description'),
    },
    {
      title: t('public.benefits.items.betterVisibility.title'),
      description: t('public.benefits.items.betterVisibility.description'),
    },
    {
      title: t('public.benefits.items.reliableReporting.title'),
      description: t('public.benefits.items.reliableReporting.description'),
    },
    {
      title: t('public.benefits.items.singleWorkspace.title'),
      description: t('public.benefits.items.singleWorkspace.description'),
    },
  ];

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
