/**
 * App — Root component for the MailSort AI overlay.
 * Manages global state: auth, template, results, view mode, loading.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { OverlayPanel } from './components/OverlayPanel.jsx';
import { getAuthStatus, classifyEmails } from '../shared/api.js';
import { DEFAULT_TEMPLATES } from '../shared/templates.js';
import { STORAGE_KEYS, VIEW_MODES, DEFAULT_SETTINGS } from '../shared/constants.js';

export function App() {
  // Auth state
  const [authState, setAuthState] = useState({ status: 'loading', profile: null });

  // Template
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATES[0]);

  // Results
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  // UI state
  const [viewMode, setViewMode] = useState(VIEW_MODES.TABLE);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [currentQuery, setCurrentQuery] = useState('');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load saved settings
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get([STORAGE_KEYS.ACTIVE_TEMPLATE, STORAGE_KEYS.VIEW_MODE, STORAGE_KEYS.PANEL_OPEN], (result) => {
        if (result[STORAGE_KEYS.ACTIVE_TEMPLATE]) {
          const saved = DEFAULT_TEMPLATES.find(t => t.templateId === result[STORAGE_KEYS.ACTIVE_TEMPLATE]);
          if (saved) setActiveTemplate(saved);
        }
        if (result[STORAGE_KEYS.VIEW_MODE]) {
          setViewMode(result[STORAGE_KEYS.VIEW_MODE]);
        }
        if (result[STORAGE_KEYS.PANEL_OPEN] === false) {
          setIsPanelOpen(false);
        }
      });
    }
  }, []);

  async function checkAuth() {
    try {
      const status = await getAuthStatus();
      setAuthState({
        status: status.authenticated ? 'authenticated' : 'unauthenticated',
        profile: status.profile || null,
      });
    } catch {
      setAuthState({ status: 'unauthenticated', profile: null });
    }
  }

  const handleSubmitQuery = useCallback((query) => {
    if (!query.trim() || isLoading) return;

    setCurrentQuery(query);
    setIsLoading(true);
    setResults([]);
    setProgress({ phase: 'starting', message: 'Starting classification...' });
    setError(null);

    const cleanup = classifyEmails(query, activeTemplate, {}, {
      onProgress: (data) => {
        setProgress(data);
      },
      onResults: (data) => {
        setResults(prev => [...prev, ...data.items]);
        setProgress(data.progress ? {
          phase: 'classifying',
          message: `Classified ${data.progress.classified} of ${data.progress.total}`,
          classified: data.progress.classified,
          total: data.progress.total,
        } : null);
      },
      onComplete: (data) => {
        setIsLoading(false);
        setProgress(null);
      },
      onError: (data) => {
        setIsLoading(false);
        setProgress(null);
        setError(data.message);
      },
    });

    // Store cleanup for potential cancellation
    return cleanup;
  }, [activeTemplate, isLoading]);

  const handleTemplateChange = useCallback((template) => {
    setActiveTemplate(template);
    setResults([]);
    setError(null);
    // Save preference
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ [STORAGE_KEYS.ACTIVE_TEMPLATE]: template.templateId });
    }
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ [STORAGE_KEYS.VIEW_MODE]: mode });
    }
  }, []);

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => {
      const next = !prev;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ [STORAGE_KEYS.PANEL_OPEN]: next });
      }
      return next;
    });
  }, []);

  const handleTemplateUpdate = useCallback((updatedTemplate) => {
    setActiveTemplate(updatedTemplate);
    // If results exist, they'll be stale — clear them
    setResults([]);
  }, []);

  return (
    <OverlayPanel
      isOpen={isPanelOpen}
      onToggle={handleTogglePanel}
      authState={authState}
      onAuthRequest={checkAuth}
      activeTemplate={activeTemplate}
      templates={DEFAULT_TEMPLATES}
      onTemplateChange={handleTemplateChange}
      onTemplateUpdate={handleTemplateUpdate}
      results={results}
      isLoading={isLoading}
      progress={progress}
      error={error}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onSubmitQuery={handleSubmitQuery}
      currentQuery={currentQuery}
    />
  );
}
