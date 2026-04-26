import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import './Preferences.css';

interface PreferencesProps {
  onLogout: () => void;
}

const LANGUAGE_STORAGE_KEY = 'preferred-language';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'fr', label: 'French' }
];

const Preferences: React.FC<PreferencesProps> = ({ onLogout }) => {
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && languageOptions.some((option) => option.value === savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setMessage('Language preference saved successfully.');
  };

  return (
    <div className="preferences-container">
      <Navbar onLogout={onLogout} />
      <div className="preferences-content">
        <div className="preferences-card">
          <h1>Preferences</h1>
          <p className="preferences-subtitle">Manage your account display preferences.</p>

          <form onSubmit={handleSave}>
            <div className="preferences-form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setMessage('');
                }}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="preferences-save-btn">
              Save Preferences
            </button>
          </form>

          {message && <p className="preferences-message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Preferences;
