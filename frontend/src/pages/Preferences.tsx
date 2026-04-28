import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import './Preferences.css';

interface PreferencesProps {
  onLogout: () => void;
}

const LANGUAGE_STORAGE_KEY = 'preferred-language';
const THEME_STORAGE_KEY = 'preferred-theme';
const NOTIFICATION_STORAGE_KEY = 'notification-preferences';

type LanguageCode = 'en' | 'sw' | 'fr';
type ThemeMode = 'light' | 'dark';

const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Swahili' },
  { code: 'fr', label: 'French' },
];

interface NotificationPreferences {
  smsAlerts: boolean;
  emailNotifications: boolean;
}

const Preferences: React.FC<PreferencesProps> = ({ onLogout }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageMessage, setLanguageMessage] = useState('');
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === 'en' || savedLanguage === 'sw' || savedLanguage === 'fr') {
      setLanguage(savedLanguage);
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }

    const rawNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (rawNotifications) {
      try {
        const parsedNotifications = JSON.parse(rawNotifications) as Partial<NotificationPreferences>;
        if (typeof parsedNotifications.smsAlerts === 'boolean') {
          setSmsAlerts(parsedNotifications.smsAlerts);
        }
        if (typeof parsedNotifications.emailNotifications === 'boolean') {
          setEmailNotifications(parsedNotifications.emailNotifications);
        }
      } catch {
        // Keep defaults when stored notification data is invalid.
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify({ smsAlerts, emailNotifications }));
  }, [smsAlerts, emailNotifications]);

  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageMenuOpen]);

  const renderFlagIcon = (code: LanguageCode) => {
    if (code === 'en') {
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true">
          <rect width="24" height="16" fill="#0A3D91" />
          <path d="M0 0L24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="4" />
          <path d="M0 0L24 16M24 0L0 16" stroke="#D91F26" strokeWidth="2" />
          <path d="M12 0V16M0 8H24" stroke="#FFFFFF" strokeWidth="5" />
          <path d="M12 0V16M0 8H24" stroke="#D91F26" strokeWidth="3" />
        </svg>
      );
    }

    if (code === 'sw') {
      return (
        <svg viewBox="0 0 24 16" aria-hidden="true">
          <polygon points="0,0 24,0 0,16" fill="#28A745" />
          <polygon points="24,16 24,0 0,16" fill="#2D79D5" />
          <polygon points="0,11 24,1 24,5 0,15" fill="#000000" />
          <polygon points="0,9.6 24,0 24,1 0,10.6" fill="#F7D046" />
          <polygon points="0,15 24,5.4 24,6.4 0,16" fill="#F7D046" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 16" aria-hidden="true">
        <rect width="8" height="16" fill="#1E4AA8" />
        <rect x="8" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" width="8" height="16" fill="#D32029" />
      </svg>
    );
  };

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    setIsLanguageMenuOpen(false);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    setLanguageMessage('Language updated successfully.');
  };

  return (
    <div className="preferences-container">
      <Navbar onLogout={onLogout} />
      <div className="preferences-content">
        <div className="preferences-panel">
          <div className="preferences-panel-header">
            <h2>Preferences</h2>
            <p>Language, theme, and alert controls for faster updates</p>
          </div>

          <div className="preferences-section-group">
            <div className="preferences-subsection">
              <div className="preferences-subsection-header">
                <h3>Language</h3>
                <p>Choose English, Swahili, or French.</p>
              </div>

              <div className="language-dropdown" ref={languageMenuRef}>
                <button
                  type="button"
                  className="language-dropdown-button"
                  aria-haspopup="listbox"
                  aria-expanded={isLanguageMenuOpen}
                  onClick={() => setIsLanguageMenuOpen((current) => !current)}
                >
                  <span className="language-flag">{renderFlagIcon(language)}</span>
                  <span className="language-dropdown-text">
                    <strong>{LANGUAGE_OPTIONS.find((option) => option.code === language)?.label}</strong>
                    <small>Selected language</small>
                  </span>
                  <span className="language-dropdown-caret">▾</span>
                </button>

                {isLanguageMenuOpen && (
                  <div className="language-dropdown-menu" role="listbox" aria-label="Language options">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={`language-dropdown-option ${language === option.code ? 'selected' : ''}`}
                        onClick={() => handleLanguageChange(option.code)}
                      >
                        <span className="language-flag">{renderFlagIcon(option.code)}</span>
                        <span className="language-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="preferences-subsection">
              <div className="preferences-subsection-header">
                <h3>Theme Mode</h3>
                <p>Switch between light and dark mode.</p>
              </div>

              <div className="theme-mode-grid" role="radiogroup" aria-label="Theme mode">
                {(['light', 'dark'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`theme-mode-card ${themeMode === mode ? 'selected' : ''}`}
                    aria-pressed={themeMode === mode}
                    onClick={() => setThemeMode(mode)}
                  >
                    <span className="theme-mode-label">{mode === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                    <span className="theme-mode-note">
                      {mode === 'light' ? 'Bright and clean interface.' : 'Low-light friendly view.'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="preferences-subsection">
              <div className="preferences-subsection-header">
                <h3>Notifications</h3>
                <p>Fast alerts for loss updates and account activity.</p>
              </div>

              <div className="notification-settings-list">
                <label className="notification-setting-row">
                  <span>
                    <strong>SMS Alerts</strong>
                    <small>Get quick text alerts when there is a loss.</small>
                  </span>
                  <button
                    type="button"
                    className={`toggle-pill ${smsAlerts ? 'on' : 'off'}`}
                    aria-pressed={smsAlerts}
                    onClick={() => setSmsAlerts((current) => !current)}
                  >
                    {smsAlerts ? 'On' : 'Off'}
                  </button>
                </label>

                <label className="notification-setting-row">
                  <span>
                    <strong>Email Notifications</strong>
                    <small>Receive email updates for activity and losses.</small>
                  </span>
                  <button
                    type="button"
                    className={`toggle-pill ${emailNotifications ? 'on' : 'off'}`}
                    aria-pressed={emailNotifications}
                    onClick={() => setEmailNotifications((current) => !current)}
                  >
                    {emailNotifications ? 'On' : 'Off'}
                  </button>
                </label>
              </div>

              <p className="notification-helper-text">
                These notifications help you get loss results faster when something changes.
              </p>
            </div>
          </div>

          {languageMessage && <p className="preferences-message">{languageMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default Preferences;
