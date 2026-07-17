/**
 * Background Service Worker
 * Handles OAuth token lifecycle, API calls, and message passing
 * between content script and backend.
 */

import { MSG } from '../shared/message-types.js';
import { BACKEND_URL, STORAGE_KEYS, DEFAULT_SETTINGS } from '../shared/constants.js';

// ============================================================================
// OAuth Token Management
// ============================================================================

/**
 * Get OAuth token (cached or fresh)
 */
function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(token);
    });
  });
}

/**
 * Remove cached token (for logout or token refresh)
 */
function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

/**
 * Verify a token is still valid by checking Gmail profile
 */
async function verifyToken(token) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ============================================================================
// Classification (SSE stream from backend → relay to content script)
// ============================================================================

const activeRequests = new Map();

/**
 * Start a classification request, streaming results from backend to content script
 */
async function startClassification(requestId, query, template, options, senderTabId) {
  try {
    const token = await getAuthToken(false);
    if (!token) {
      sendToTab(senderTabId, { requestId, event: 'error', data: { message: 'Not authenticated. Please sign in.' } });
      return;
    }

    const controller = new AbortController();
    activeRequests.set(requestId, controller);

    const response = await fetch(`${BACKEND_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: token,
        query,
        template,
        options,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg;
      try { errorMsg = JSON.parse(errorBody).error; } catch { errorMsg = errorBody; }

      // If 401, clear the token and notify
      if (response.status === 401) {
        await removeCachedToken(token);
        errorMsg = 'Your session has expired. Please re-authenticate.';
      }

      sendToTab(senderTabId, { requestId, event: 'error', data: { message: errorMsg } });
      return;
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let currentEvent = null;
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            sendToTab(senderTabId, { requestId, event: currentEvent, data });
          } catch (e) {
            console.warn('[SSE] Failed to parse data:', line);
          }
          currentEvent = null;
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`[Classification] Request ${requestId} cancelled`);
    } else {
      console.error('[Classification Error]', err);
      sendToTab(senderTabId, { requestId, event: 'error', data: { message: err.message } });
    }
  } finally {
    activeRequests.delete(requestId);
  }
}

/**
 * Send a message to a specific tab's content script
 */
function sendToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    // Tab might have been closed
  });
}

// ============================================================================
// Settings Management
// ============================================================================

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEYS.SETTINGS, (result) => {
      resolve(result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS);
    });
  });
}

function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings }, resolve);
  });
}

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message;

  switch (type) {
    case MSG.GET_AUTH_TOKEN: {
      getAuthToken(true)
        .then(async (token) => {
          const profile = await verifyToken(token);
          sendResponse({ token, profile });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
      return true; // Async response
    }

    case MSG.GET_AUTH_STATUS: {
      getAuthToken(false)
        .then(async (token) => {
          if (!token) {
            sendResponse({ authenticated: false });
            return;
          }
          const profile = await verifyToken(token);
          if (!profile) {
            await removeCachedToken(token);
            sendResponse({ authenticated: false });
            return;
          }
          sendResponse({ authenticated: true, profile });
        })
        .catch(() => {
          sendResponse({ authenticated: false });
        });
      return true;
    }

    case MSG.LOGOUT: {
      getAuthToken(false)
        .then(async (token) => {
          if (token) await removeCachedToken(token);
          sendResponse({ success: true });
        })
        .catch(() => {
          sendResponse({ success: true });
        });
      return true;
    }

    case MSG.CLASSIFY_EMAILS: {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ error: 'No tab context' });
        return;
      }
      const { requestId, query, template, options } = message;
      startClassification(requestId, query, template, options, tabId);
      sendResponse({ started: true, requestId });
      return false;
    }

    case MSG.CANCEL_CLASSIFICATION: {
      const controller = activeRequests.get(message.requestId);
      if (controller) {
        controller.abort();
        activeRequests.delete(message.requestId);
      }
      sendResponse({ cancelled: true });
      return false;
    }

    case MSG.GET_SETTINGS: {
      getSettings().then(sendResponse);
      return true;
    }

    case MSG.SAVE_SETTINGS: {
      saveSettings(message.settings).then(() => sendResponse({ success: true }));
      return true;
    }

    case MSG.GMAIL_ACTION: {
      const { threadId, action, options } = message;
      performGmailAction(threadId, action, options)
        .then((result) => sendResponse({ success: true, result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // async
    }

    default:
      sendResponse({ error: `Unknown message type: ${type}` });
      return false;
  }
});

/**
 * Perform a native Gmail API action (Archive, Trash, Read/Unread, Snooze)
 */
async function performGmailAction(threadId, action, options = {}) {
  const token = await getAuthToken(false);
  if (!token) throw new Error('Not authenticated');

  let url = '';
  let body = null;

  if (action === 'archive') {
    url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`;
    body = JSON.stringify({ removeLabelIds: ['INBOX'] });
  } else if (action === 'delete') {
    url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/trash`;
  } else if (action === 'read') {
    url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`;
    body = JSON.stringify({ removeLabelIds: ['UNREAD'] });
  } else if (action === 'unread') {
    url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`;
    body = JSON.stringify({ addLabelIds: ['UNREAD'] });
  } else if (action === 'snooze') {
    url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`;
    body = JSON.stringify({ removeLabelIds: ['INBOX'] });
  } else {
    throw new Error(`Unsupported action: ${action}`);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? body : undefined,
  });

  if (!res.ok) {
    throw new Error(`Gmail API error: ${res.statusText}`);
  }

  return res.json();
}

// Log when service worker starts
console.log('✨ MailSort AI service worker initialized');
