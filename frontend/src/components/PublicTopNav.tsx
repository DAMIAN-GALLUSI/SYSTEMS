import React from 'react';
import { Link } from 'react-router-dom';

type PublicNavMode = 'home' | 'login' | 'register' | 'services' | 'benefits';

interface PublicTopNavProps {
  active: PublicNavMode;
}

const PublicTopNav: React.FC<PublicTopNavProps> = ({ active }) => {
  return (
    <header className="public-navbar">
      <div className="public-navbar-inner">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">GSA</span>
          <div>
            <p className="brand-title">Gallusi Smart Argent</p>
            <p className="brand-subtitle">Mobile Money Operations Platform</p>
          </div>
        </div>
        <nav className="public-nav-links">
          <Link to="/" className={active === 'home' ? 'active' : ''}>Home</Link>
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
