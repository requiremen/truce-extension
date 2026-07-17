/**
 * Cache Service
 * In-memory caching for classified email results.
 * Designed for easy swap to Redis/Postgres later.
 */

import NodeCache from 'node-cache';

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10);

const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_TTL * 0.2,
  useClones: false, // Performance — we won't mutate cached objects
});

/**
 * Generate cache key for a classified email
 */
function cacheKey(userId, messageId, templateId) {
  return `${userId}:${messageId}:${templateId}`;
}

/**
 * Look up cached classifications for a set of message IDs
 * @param {string} userId - User's email address
 * @param {string[]} messageIds - Array of message IDs to check
 * @param {string} templateId - Template identifier
 * @returns {{ cached: object[], uncachedIds: string[] }}
 */
export function getClassified(userId, messageIds, templateId) {
  const cached = [];
  const uncachedIds = [];

  for (const id of messageIds) {
    const key = cacheKey(userId, id, templateId);
    const hit = cache.get(key);
    if (hit) {
      cached.push(hit);
    } else {
      uncachedIds.push(id);
    }
  }

  return { cached, uncachedIds };
}

/**
 * Store classified results in cache
 * @param {string} userId
 * @param {string} templateId
 * @param {object[]} results - Classified email objects (must have messageId)
 */
export function setClassified(userId, templateId, results) {
  for (const result of results) {
    if (result.messageId) {
      const key = cacheKey(userId, result.messageId, templateId);
      cache.set(key, result);
    }
  }
}

/**
 * Clear all cached data for a user
 * @param {string} userId
 */
export function clearUserCache(userId) {
  const keys = cache.keys().filter(k => k.startsWith(`${userId}:`));
  cache.del(keys);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}
