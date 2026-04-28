import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>Mobile Money Agent</h2>
        </div>
        <div className="navbar-menu">
          <Link 
            to="/dashboard" 
            className={location.pathname === '/dashboard' ? 'active' : ''}
          >
            Home
          </Link>
          <Link 
            to="/registered-details" 
            className={location.pathname === '/registered-details' ? 'active' : ''}
          >
            Register Your Details
          </Link>
          <Link
            to="/daily-balancing"
            className={location.pathname === '/daily-balancing' ? 'active' : ''}
          >
            Daily Balancing
          </Link>
          <Link 
            to="/reports" 
            className={location.pathname === '/reports' ? 'active' : ''}
          >
            Report
          </Link>

          <div className="account-wrapper" ref={wrapperRef}>
            <button
              className={`account-btn ${open ? 'open' : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-haspopup="true"
            >
              <span className="account-icon">👤</span>
              <span className="account-label">Account</span>
            </button>
            {open && (
              <div className="account-dropdown" role="menu">
                <Link to="/profile" onClick={() => setOpen(false)}>Profile</Link>
                <Link to="/settings" onClick={() => setOpen(false)}>Setting</Link>
                <Link to="/preferences" onClick={() => setOpen(false)}>Preferences</Link>
                <button
                  className="dropdown-logout"
                  onClick={() => { setOpen(false); onLogout(); }}
                >
                  <svg className="dropdown-logout-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M9.75 1.5a.75.75 0 0 0 0 1.5h2.5A1.25 1.25 0 0 1 13.5 4.25v7.5A1.25 1.25 0 0 1 12.25 13h-2.5a.75.75 0 0 0 0 1.5h2.5A2.75 2.75 0 0 0 15 11.75v-7.5A2.75 2.75 0 0 0 12.25 1.5h-2.5zM7.72 4.22a.75.75 0 0 0-1.06 1.06L8.44 7H2.75a.75.75 0 0 0 0 1.5h5.69L6.66 10.72a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
