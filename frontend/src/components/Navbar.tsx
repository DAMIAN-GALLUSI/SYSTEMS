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
                <Link to="/profile" onClick={() => setOpen(false)} id="t-navbar-profile">{t('navbar.profile')}</Link>
                <Link to="/settings" onClick={() => setOpen(false)} id="t-navbar-settings">{t('navbar.settings')}</Link>
                <Link to="/preferences" onClick={() => setOpen(false)} id="t-navbar-preferences">{t('navbar.preferences')}</Link>
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
