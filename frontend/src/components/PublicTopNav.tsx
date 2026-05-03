import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

type PublicNavMode = 'home' | 'login' | 'register' | 'services' | 'benefits';

interface PublicTopNavProps {
  active: PublicNavMode;
}

const PublicTopNav: React.FC<PublicTopNavProps> = ({ active }) => {
  const { t } = useLanguage();

  return (
    <header className="public-navbar">
      <div className="public-navbar-inner">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">GSA</span>
          <div>
            <p className="brand-title">Gallusi Smart Argent</p>
            <p className="brand-subtitle">{t('public.brandSubtitle')}</p>
          </div>
        </div>
        <nav className="public-nav-links">
          <Link to="/" className={active === 'home' ? 'active' : ''}>{t('public.topLinks.home')}</Link>
          <Link to="/services" className={active === 'services' ? 'active' : ''}>{t('public.topLinks.services')}</Link>
          <Link to="/benefits" className={active === 'benefits' ? 'active' : ''}>{t('public.topLinks.benefits')}</Link>
          <Link to="/login" className={active === 'login' ? 'active' : ''}>{t('public.topLinks.login')}</Link>
          <Link to="/register" className={active === 'register' ? 'active' : ''}>{t('public.topLinks.register')}</Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicTopNav;
