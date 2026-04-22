import React from 'react';

const PublicBottomNav: React.FC = () => {
  return (
    <footer className="public-bottom-nav">
      <div className="public-bottom-inner">
        <div className="public-bottom-features">
          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-report" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 3h11l3 3v15H5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M16 3v4h4M8 11h8M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <p>Report sahihi</p>
          </article>

          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-profit" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 15l5-5 4 4 7-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p>Faida moja kwa moja</p>
          </article>

          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-fast" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M13 2L5 14h6l-1 8 9-13h-6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <p>Haraka na rahisi</p>
          </article>

          <article className="bottom-feature-item">
            <span className="bottom-feature-icon bottom-feature-secure" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3l7 3v6c0 4.4-2.5 7.4-7 9-4.5-1.6-7-4.6-7-9V6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p>Data salama</p>
          </article>
        </div>
      </div>
    </footer>
  );
};

export default PublicBottomNav;
