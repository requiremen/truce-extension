/**
 * Popup UI — Extension action popup.
 * Shows auth status, template switcher, settings, and sign out.
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MSG } from '../shared/message-types.js';
import { DEFAULT_TEMPLATES } from '../shared/templates.js';
import { STORAGE_KEYS, VIEW_MODES } from '../shared/constants.js';
import './popup.css';

function Popup() {
  const [authState, setAuthState] = useState({ status: 'loading', profile: null });
  const [activeTemplateId, setActiveTemplateId] = useState(DEFAULT_TEMPLATES[0].templateId);
  const [viewMode, setViewMode] = useState(VIEW_MODES.TABLE);

  // Check auth status on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: MSG.GET_AUTH_STATUS }, (response) => {
      if (response?.authenticated) {
        setAuthState({ status: 'authenticated', profile: response.profile });
      } else {
        setAuthState({ status: 'unauthenticated', profile: null });
      }
    });

    // Load saved settings
    chrome.storage.sync.get([STORAGE_KEYS.ACTIVE_TEMPLATE, STORAGE_KEYS.VIEW_MODE], (result) => {
      if (result[STORAGE_KEYS.ACTIVE_TEMPLATE]) {
        setActiveTemplateId(result[STORAGE_KEYS.ACTIVE_TEMPLATE]);
      }
      if (result[STORAGE_KEYS.VIEW_MODE]) {
        setViewMode(result[STORAGE_KEYS.VIEW_MODE]);
      }
    });
  }, []);

  const handleSignIn = () => {
    chrome.runtime.sendMessage({ type: MSG.GET_AUTH_TOKEN }, (response) => {
      if (response?.token) {
        setAuthState({ status: 'authenticated', profile: response.profile });
      }
    });
  };

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ type: MSG.LOGOUT }, () => {
      setAuthState({ status: 'unauthenticated', profile: null });
    });
  };

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setActiveTemplateId(id);
    chrome.storage.sync.set({ [STORAGE_KEYS.ACTIVE_TEMPLATE]: id });
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    chrome.storage.sync.set({ [STORAGE_KEYS.VIEW_MODE]: mode });
  };

  const isAuthenticated = authState.status === 'authenticated';
  const activeTemplate = DEFAULT_TEMPLATES.find(t => t.templateId === activeTemplateId) || DEFAULT_TEMPLATES[0];

  return (
    <div className="popup">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-logo" style={{ background: 'none', width: 'auto', height: 'auto', display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
            <circle cx="12" cy="13" r="8" fill="url(#tomatoGradPopup)" />
            <path d="M12 5C12 5 11 2 9 3C9 3 11 4 12 5Z" fill="#10b981" />
            <path d="M12 5C12 5 13 2 15 3C15 3 13 4 12 5Z" fill="#10b981" />
            <path d="M12 5V2" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="tomatoGradPopup" x1="8" y1="9" x2="16" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="50%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <div className="popup-title">redtomato</div>
          <div className="popup-version">v1.0.0</div>
        </div>
      </div>

      {/* Auth Section */}
      <div className="popup-section">
        <div className="popup-section-label">Account</div>
        {isAuthenticated ? (
          <div className="popup-auth-info">
            <div className="popup-email">{authState.profile?.emailAddress || 'Connected'}</div>
            <button className="popup-btn popup-btn-ghost" onClick={handleSignOut}>Sign Out</button>
          </div>
        ) : (
          <button className="popup-btn popup-btn-primary" onClick={handleSignIn}>
            Sign in with Google
          </button>
        )}
      </div>

      {/* Template Switcher */}
      <div className="popup-section">
        <div className="popup-section-label">Active Template</div>
        <select className="popup-select" value={activeTemplateId} onChange={handleTemplateChange}>
          {DEFAULT_TEMPLATES.map(t => (
            <option key={t.templateId} value={t.templateId}>{t.name}</option>
          ))}
        </select>
        <div className="popup-template-desc">{activeTemplate.description}</div>
      </div>

      {/* View Mode */}
      <div className="popup-section">
        <div className="popup-section-label">Default View</div>
        <div className="popup-toggle-group">
          <button
            className={`popup-toggle-btn ${viewMode === VIEW_MODES.TABLE ? 'active' : ''}`}
            onClick={() => handleViewModeChange(VIEW_MODES.TABLE)}
          >
            Table
          </button>
          <button
            className={`popup-toggle-btn ${viewMode === VIEW_MODES.CARDS ? 'active' : ''}`}
            onClick={() => handleViewModeChange(VIEW_MODES.CARDS)}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="popup-footer">
        <span>Open Gmail to launch redtomato</span>
      </div>
    </div>
  );
}

// Mount
const container = document.getElementById('popup-root');
const root = createRoot(container);
root.render(<Popup />);
