import React from 'react';
import { Link } from 'react-router-dom';

type PublicNavMode = 'login' | 'register' | 'services' | 'benefits';

interface PublicTopNavProps {
  active: PublicNavMode;
}

const PublicTopNav: React.FC<PublicTopNavProps> = ({ active }) => {
  return (
    <header className="public-navbar">
      <div className="public-navbar-inner">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">TZS</span>
          <div>
            <p className="brand-title">Mobile Money Agent</p>
            <p className="brand-subtitle">Operations Platform</p>
          </div>
        </div>
        <nav className="public-nav-links">
          <Link to="/services" className={active === 'services' ? 'active' : ''}>Services</Link>
          <Link to="/benefits" className={active === 'benefits' ? 'active' : ''}>Benefits</Link>
          <Link to="/login" className={active === 'login' ? 'active' : ''}>Login</Link>
          <Link to="/register" className={active === 'register' ? 'active' : ''}>Register</Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicTopNav;
