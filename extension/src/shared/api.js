/**
 * API Helper
 * Wraps chrome.runtime.sendMessage for communication with the service worker.
 * Also handles SSE stream parsing for the classify endpoint.
 */

import { MSG } from './message-types.js';

/**
 * Send a message to the service worker and get a response
 */
function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Get the user's OAuth token
 */
export function getAuthToken() {
  return sendMessage(MSG.GET_AUTH_TOKEN);
}

/**
 * Get current auth status
 */
export function getAuthStatus() {
  return sendMessage(MSG.GET_AUTH_STATUS);
}

/**
 * Sign out
 */
export function logout() {
  return sendMessage(MSG.LOGOUT);
}

/**
 * Classify emails — sends request to service worker which streams from backend
 * @param {string} query - Natural language query
 * @param {object} template - Template definition
 * @param {object} options - { maxEmails, searchQuery }
 * @param {object} callbacks - { onProgress, onResults, onComplete, onError }
 */
export function classifyEmails(query, template, options = {}, callbacks = {}) {
  const { onProgress, onResults, onComplete, onError } = callbacks;

  // Use a unique request ID for this classification
  const requestId = `classify_${Date.now()}`;

  // Set up a listener for streamed events
  const listener = (message) => {
    if (message.requestId !== requestId) return;

    switch (message.event) {
      case 'progress':
        onProgress?.(message.data);
        break;
      case 'results':
        onResults?.(message.data);
        break;
      case 'complete':
        onComplete?.(message.data);
        chrome.runtime.onMessage.removeListener(listener);
        break;
      case 'error':
        onError?.(message.data);
        chrome.runtime.onMessage.removeListener(listener);
        break;
      case 'warning':
        console.warn('[MailSort]', message.data.message);
        break;
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  // Kick off the classification
  chrome.runtime.sendMessage({
    type: MSG.CLASSIFY_EMAILS,
    requestId,
    query,
    template,
    options,
  });

  // Return a cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
    chrome.runtime.sendMessage({ type: MSG.CANCEL_CLASSIFICATION, requestId });
  };
}

/**
 * Get user settings from storage
 */
export function getSettings() {
  return sendMessage(MSG.GET_SETTINGS);
}

/**
 * Save user settings
 */
export function saveSettings(settings) {
  return sendMessage(MSG.SAVE_SETTINGS, { settings });
}
