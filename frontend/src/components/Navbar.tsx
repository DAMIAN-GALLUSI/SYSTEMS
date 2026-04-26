import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();

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
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
          <Link
            to="/preferences"
            className={`settings-btn ${location.pathname === '/preferences' ? 'active' : ''}`}
            aria-label="Settings"
            title="Settings"
          >
            ⚙
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
