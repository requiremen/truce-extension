/**
 * Auth Middleware
 * Validates the OAuth access token passed from the extension.
 */

import { validateToken } from '../services/gmail.js';

/**
 * Middleware that validates the access token and attaches user info to req.
 * Token can be in Authorization header or request body.
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = req.body?.accessToken
      || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const profile = await validateToken(token);
    req.user = {
      email: profile.emailAddress,
      accessToken: token,
    };

    next();
  } catch (err) {
    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    next(err);
  }
}
