import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import './Preferences.css';

interface PreferencesProps {
  onLogout: () => void;
}

const PROFILE_STORAGE_KEY = 'user-profile-preferences';
const PROFILE_PHOTO_STORAGE_KEY = 'user-profile-photo';

interface ProfilePreferences {
  fullName: string;
  about: string;
  phone: string;
}

const Preferences: React.FC<PreferencesProps> = ({ onLogout }) => {
  const [fullName, setFullName] = useState('Your Name');
  const [about, setAbout] = useState('Hey there. I am using Mobile Money Agent System.');
  const [phone, setPhone] = useState('+255 700 000 000');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [message, setMessage] = useState('');
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const aboutInputRef = useRef<HTMLTextAreaElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const initials = fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase() || '')
    .join('') || 'U';

  useEffect(() => {
    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(rawProfile) as Partial<ProfilePreferences>;
      if (typeof parsedProfile.fullName === 'string' && parsedProfile.fullName.trim()) {
        setFullName(parsedProfile.fullName);
      }
      if (typeof parsedProfile.about === 'string' && parsedProfile.about.trim()) {
        setAbout(parsedProfile.about);
      }
      if (typeof parsedProfile.phone === 'string' && parsedProfile.phone.trim()) {
        setPhone(parsedProfile.phone);
      }
    } catch {
      // Keep defaults when local profile data is invalid.
    }

    const savedProfilePhoto = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
    if (savedProfilePhoto) {
      setProfilePhoto(savedProfilePhoto);
    }
  }, []);

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (!showPhotoEditor) {
      stopCameraStream();
      setCameraError('');
    }
  }, [showPhotoEditor]);

  const handleOpenCamera = async () => {
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraActive(true);

      requestAnimationFrame(() => {
        if (!cameraVideoRef.current) {
          return;
        }

        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(() => {
          setCameraError('Could not start camera preview.');
        });
      });
    } catch {
      setCameraError('Camera access is blocked. Allow camera permission in your browser settings, then tap Retry Camera.');
    }
  };

  const handleOpenCameraPicker = () => {
    setCameraError('');
    cameraInputRef.current?.click();
  };

  const handleCaptureFromCamera = () => {
    if (!cameraVideoRef.current) {
      return;
    }

    const video = cameraVideoRef.current;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Unable to capture photo from camera.');
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setProfilePhoto(dataUrl);
    localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, dataUrl);
    setMessage('Profile picture updated successfully.');
    stopCameraStream();
  };

  const handleClosePhotoEditor = () => {
    setShowPhotoEditor(false);
  };

  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        return;
      }

      setProfilePhoto(result);
      localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, result);
      setMessage('Profile picture updated successfully.');
    };
    reader.readAsDataURL(file);

    // Reset input value so selecting the same image again still triggers onChange.
    event.target.value = '';
  };

  const handleDeleteProfilePhoto = () => {
    setProfilePhoto(null);
    localStorage.removeItem(PROFILE_PHOTO_STORAGE_KEY);
    setMessage('Profile picture deleted successfully.');
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    const profilePayload: ProfilePreferences = {
      fullName: fullName.trim() || 'Your Name',
      about: about.trim() || 'Hey there. I am using Mobile Money Agent System.',
      phone: phone.trim() || '+255 700 000 000'
    };

    setFullName(profilePayload.fullName);
    setAbout(profilePayload.about);
    setPhone(profilePayload.phone);

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profilePayload));
    setMessage('Profile preferences saved successfully.');
  };

  return (
    <div className="preferences-container">
      <Navbar onLogout={onLogout} />
      <div className="preferences-content">
        <div className="profile-screen">
          <div className="profile-header">
            <h1>Profile</h1>
            <p>Manage your profile details</p>
          </div>

          <div className="profile-avatar-wrap">
            {profilePhoto ? (
              <img className="profile-avatar profile-avatar-image" src={profilePhoto} alt="Profile" />
            ) : (
              <div className="profile-avatar" aria-label="User avatar">
                {initials}
              </div>
            )}
            <button
              type="button"
              className="profile-edit-trigger"
              onClick={() => setShowPhotoEditor(true)}
            >
              Edit
            </button>
            <p className="profile-avatar-caption">Tap fields below to edit profile details</p>
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-card-list">
              <div
                className="profile-field-row"
                onClick={() => fullNameInputRef.current?.focus()}
              >
                <label htmlFor="fullName" className="profile-label-with-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 19c1.6-3 4.2-4.5 7-4.5s5.4 1.5 7 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>Name</span>
                </label>
                <input
                  ref={fullNameInputRef}
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setMessage('');
                  }}
                  placeholder="Enter your full name"
                />
                <small>This name is visible in your profile.</small>
              </div>

              <div
                className="profile-field-row"
                onClick={() => aboutInputRef.current?.focus()}
              >
                <label htmlFor="about" className="profile-label-with-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 10v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="7" r="1" fill="currentColor" />
                  </svg>
                  <span>About</span>
                </label>
                <textarea
                  ref={aboutInputRef}
                  id="about"
                  rows={2}
                  value={about}
                  onChange={(event) => {
                    setAbout(event.target.value);
                    setMessage('');
                  }}
                  placeholder="Write a short status"
                />
                <small>Tell people something about you.</small>
              </div>

              <div
                className="profile-field-row"
                onClick={() => phoneInputRef.current?.focus()}
              >
                <label htmlFor="phone" className="profile-label-with-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 3.5h4l1 3-2 1.8a13.3 13.3 0 0 0 6.2 6.2l1.8-2 3 1v4a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 5 5a1.5 1.5 0 0 1 1.5-1.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Phone</span>
                </label>
                <input
                  ref={phoneInputRef}
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setMessage('');
                  }}
                  placeholder="+255 700 000 000"
                />
                <small>Phone number linked to your account.</small>
              </div>

            </div>

            <button type="submit" className="preferences-save-btn">
              Save Profile
            </button>
          </form>

          {message && <p className="preferences-message">{message}</p>}
        </div>

        {showPhotoEditor && (
          <div className="photo-editor-modal" role="dialog" aria-modal="true" aria-label="Edit profile photo">
            <div className="photo-editor-card">
              <button
                type="button"
                className="photo-editor-close"
                aria-label="Close photo editor"
                onClick={handleClosePhotoEditor}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <div className="photo-editor-preview-wrap">
                {profilePhoto ? (
                  <img className="photo-editor-preview" src={profilePhoto} alt="Profile preview" />
                ) : (
                  <div className="photo-editor-preview">{initials}</div>
                )}

                <button
                  type="button"
                  className="photo-editor-delete"
                  aria-label="Delete profile photo"
                  onClick={handleDeleteProfilePhoto}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 4h6l1 2h4v2H4V6h4l1-2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 8l1 12h8l1-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 11v6M14 11v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="photo-editor-actions">
                <button
                  type="button"
                  className="photo-action-btn"
                  onClick={handleOpenCamera}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="13.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  className="photo-action-btn"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="9" cy="10" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6 17l4-4 3 3 2-2 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Gallery</span>
                </button>
              </div>

              {cameraActive && (
                <div className="camera-live-panel">
                  <video ref={cameraVideoRef} className="camera-live-video" autoPlay muted playsInline />
                  <div className="camera-live-actions">
                    <button type="button" className="camera-live-btn" onClick={handleCaptureFromCamera}>
                      Capture
                    </button>
                    <button type="button" className="camera-live-btn secondary" onClick={stopCameraStream}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {cameraError && <p className="camera-error-message">{cameraError}</p>}

              {cameraError && (
                <div className="camera-help-actions">
                  <button type="button" className="camera-help-btn" onClick={handleOpenCamera}>
                    Retry Camera
                  </button>
                  <button type="button" className="camera-help-btn secondary" onClick={handleOpenCameraPicker}>
                    Open Camera Picker
                  </button>
                  <button type="button" className="camera-help-btn secondary" onClick={() => galleryInputRef.current?.click()}>
                    Use Gallery
                  </button>
                </div>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden-file-input"
                onChange={handleProfilePhotoChange}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden-file-input"
                onChange={handleProfilePhotoChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preferences;
