/**
 * Content Script Entry Point
 * Injects the MailSort AI overlay into Gmail using Shadow DOM for style isolation.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import overlayStyles from './styles/overlay.css?inline';
import { watchGmailTheme } from '../utils/gmail-theme.js';

// Prevent double injection
if (!document.getElementById('mailsort-ai-host')) {
  init();
}

function init() {
  // Create host element
  const host = document.createElement('div');
  host.id = 'mailsort-ai-host';
  host.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transition: all 0.2s ease-out;
  `;
  document.body.appendChild(host);

  // Position watcher to align host with Gmail main inbox container
  const updatePosition = () => {
    // Gmail's main inbox area selector (.AO is main content area, .aeF is parent wrapper)
    const inbox = document.querySelector('.AO') || document.querySelector('.aeF');
    if (inbox) {
      const rect = inbox.getBoundingClientRect();
      host.style.top = `${rect.top}px`;
      host.style.left = `${rect.left}px`;
      host.style.width = `${rect.width}px`;
      host.style.height = `${rect.height}px`;
      host.style.display = 'block';
    } else {
      // Fallback to full right-aligned pane if we can't find Gmail container
      host.style.top = '0';
      host.style.right = '0';
      host.style.bottom = '0';
      host.style.width = '460px';
      host.style.left = 'auto';
    }
  };

  // Run immediately and setup listeners
  updatePosition();
  window.addEventListener('resize', updatePosition);
  
  // Set up periodic check since Gmail is a dynamic SPA
  const posInterval = setInterval(updatePosition, 1000);

  // Create Shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles into shadow root
  const styleEl = document.createElement('style');
  styleEl.textContent = overlayStyles;
  shadow.appendChild(styleEl);

  // Create React mount point
  const mountPoint = document.createElement('div');
  mountPoint.id = 'mailsort-root';
  mountPoint.style.cssText = `
    width: 100%;
    height: 100%;
    pointer-events: none;
  `;
  shadow.appendChild(mountPoint);

  // Watch for Gmail theme changes
  const cleanupThemeWatcher = watchGmailTheme((theme) => {
    mountPoint.setAttribute('data-theme', theme);
  });

  // Mount React
  const root = createRoot(mountPoint);
  root.render(React.createElement(App));

  // Cleanup on extension unload
  window.addEventListener('unload', () => {
    root.unmount();
    cleanupThemeWatcher();
    window.removeEventListener('resize', updatePosition);
    clearInterval(posInterval);
    host.remove();
  });
}
