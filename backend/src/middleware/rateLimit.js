/**
 * Rate Limiting Middleware
 * Per-user rate limiting to control costs.
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for the classify endpoint
 * 20 requests per 15-minute window per IP
 */
export const classifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    error: 'Too many classification requests. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user email if authenticated, otherwise IP
    return req.user?.email || req.ip;
  },
});
