import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const PublicBottomNav: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="public-bottom-nav">
      <div className="public-bottom-inner">
        <div className="public-bottom-features">
          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-report" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 5h2v14H5zM11 11h2v8h-2zM17 8h2v11h-2z" fill="currentColor" />
                <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <p>{t('public.bottom.report')}</p>
          </article>

          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-profit" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 4c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
                <path d="M8.5 12.5c1.2-1.5 2.5-2.2 3.8-2.2 1.8 0 2.8.9 4.2 2.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.2 9.4h5.6M10.1 14.2h3.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </span>
            <p>{t('public.bottom.profit')}</p>
          </article>

          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-fast" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M13 2L5 14h6l-1 8 9-13h-6z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
              </svg>
            </span>
            <p>{t('public.bottom.fast')}</p>
          </article>

          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-secure" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3l7 3v6c0 4.4-2.5 7.4-7 9-4.5-1.6-7-4.6-7-9V6z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p>{t('public.bottom.secure')}</p>
          </article>
        </div>
      </div>
    </footer>
  );
};

export default PublicBottomNav;
