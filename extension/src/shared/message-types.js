/**
 * Message Types
 * Constants for chrome.runtime message passing between content script and service worker.
 */

export const MSG = {
  // Auth
  GET_AUTH_TOKEN: 'GET_AUTH_TOKEN',
  LOGOUT: 'LOGOUT',
  GET_AUTH_STATUS: 'GET_AUTH_STATUS',

  // Classification
  CLASSIFY_EMAILS: 'CLASSIFY_EMAILS',
  CANCEL_CLASSIFICATION: 'CANCEL_CLASSIFICATION',

  // Templates
  GET_TEMPLATES: 'GET_TEMPLATES',
  SAVE_TEMPLATE: 'SAVE_TEMPLATE',

  // Settings
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',

  // Gmail native thread actions
  GMAIL_ACTION: 'GMAIL_ACTION',
};
