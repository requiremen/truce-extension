/**
 * Storage Helpers
 * Wraps chrome.storage.sync for cleaner async access.
 */

/**
 * Get a value from chrome.storage.sync
 * @param {string} key
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
export function getStorage(key, defaultValue = null) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key] ?? defaultValue);
    });
  });
}

/**
 * Set a value in chrome.storage.sync
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, resolve);
  });
}

/**
 * Remove a value from chrome.storage.sync
 * @param {string} key
 * @returns {Promise<void>}
 */
export function removeStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(key, resolve);
  });
}

/**
 * Get multiple values from chrome.storage.sync
 * @param {string[]} keys
 * @returns {Promise<object>}
 */
export function getStorageMultiple(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, resolve);
  });
}
