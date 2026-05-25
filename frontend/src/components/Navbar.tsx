import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

interface NavbarProps {
  onLogout: () => void;
}

const PROFILE_PHOTO_STORAGE_KEY = 'user-profile-photo';
const PROFILE_PHOTO_UPDATED_EVENT = 'user-profile-photo-updated';

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const loadProfilePhoto = () => {
    const savedProfilePhoto = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
    setProfilePhoto(savedProfilePhoto);
  };

  useEffect(() => {
    loadProfilePhoto();

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleProfilePhotoUpdate() {
      loadProfilePhoto();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('storage', handleProfilePhotoUpdate);
    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdate);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleProfilePhotoUpdate);
      window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdate);
    };
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
            {/** navbar:home */}
            { /* will be replaced by translation */ }
            <span id="t-navbar-home">{t('navbar.home')}</span>
          </Link>
          <Link 
            to="/registered-details" 
            className={location.pathname === '/registered-details' ? 'active' : ''}
          >
            <span id="t-navbar-register">{t('navbar.register')}</span>
          </Link>
          <Link
            to="/daily-balancing"
            className={location.pathname === '/daily-balancing' ? 'active' : ''}
          >
            <span id="t-navbar-balancing">{t('navbar.balancing')}</span>
          </Link>
          <Link 
            to="/reports" 
            className={location.pathname === '/reports' ? 'active' : ''}
          >
            <span id="t-navbar-report">{t('navbar.report')}</span>
          </Link>

          <div className="account-wrapper" ref={wrapperRef}>
            <button
              className={`account-btn ${open ? 'open' : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-haspopup="true"
            >
              {profilePhoto ? (
                <img className="account-avatar" src={profilePhoto} alt="Profile" />
              ) : (
                <span className="account-icon">👤</span>
              )}
            </button>
            {open && (
              <div className="account-dropdown" role="menu">
                <Link to="/profile" onClick={() => setOpen(false)} id="t-navbar-profile" className="account-dropdown-link">
                  <svg className="dropdown-item-icon profile-item-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M6.8 17.2c1.4-2.2 3.2-3.2 5.2-3.2s3.8 1 5.2 3.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{t('navbar.profile')}</span>
                </Link>
                <Link to="/settings" onClick={() => setOpen(false)} id="t-navbar-settings" className="account-dropdown-link">
                  <svg className="dropdown-item-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58a.75.75 0 0 0 .18-.94l-1.92-3.32a.75.75 0 0 0-.9-.33l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.75.75 0 0 0 12.4 1h-3.8a.75.75 0 0 0-.74.63l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.75.75 0 0 0-.9.33L.66 7.8a.75.75 0 0 0 .18.94l2.03 1.58a7.43 7.43 0 0 0-.05.94c0 .32.02.63.05.94L.84 13.78a.75.75 0 0 0-.18.94l1.92 3.32c.2.35.62.5.99.33l2.39-.96c.51.4 1.05.71 1.63.94l.36 2.54c.06.36.37.63.74.63h3.8c.37 0 .68-.27.74-.63l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.37.15.79 0 .99-.33l1.92-3.32a.75.75 0 0 0-.18-.94l-2.03-1.58Zm-7.14 2.06A3 3 0 1 1 12 8a3 3 0 0 1 0 5.99Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>{t('navbar.settings')}</span>
                </Link>
                <Link to="/preferences" onClick={() => setOpen(false)} id="t-navbar-preferences" className="account-dropdown-link">
                  <svg className="dropdown-item-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M10.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm8 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm8 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10.5 6h3m-8 0H3m18 0h-2.5m-8 12h3m-8 0H3m18 0h-2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{t('navbar.preferences')}</span>
                </Link>
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
                  <span id="t-navbar-signout">{t('navbar.signOut')}</span>
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
