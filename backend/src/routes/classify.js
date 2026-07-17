/**
 * Classify Route
 * POST /api/classify — The core endpoint that orchestrates:
 * 1. Gmail email fetching (batched, field-masked)
 * 2. Email normalization
 * 3. Cache lookup (skip already-classified emails)
 * 4. Gemini structured classification
 * 5. SSE streaming of progressive results
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { classifyRateLimit } from '../middleware/rateLimit.js';
import { fetchEmails } from '../services/gmail.js';
import { classifyEmails } from '../services/gemini.js';
import { getClassified, setClassified } from '../services/cache.js';
import { normalizeEmails } from '../utils/emailNormalizer.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultTemplates = JSON.parse(
  readFileSync(join(__dirname, '..', 'templates', 'defaults.json'), 'utf-8')
);

export const classifyRouter = Router();

/**
 * GET /api/templates — Return available default templates
 */
classifyRouter.get('/templates', (req, res) => {
  res.json(defaultTemplates);
});

/**
 * POST /api/classify — Main classification endpoint
 *
 * Body: {
 *   accessToken: string,
 *   query: string,
 *   template: object (template definition),
 *   options?: { maxEmails?: number, searchQuery?: string }
 * }
 *
 * Response: SSE stream of events:
 *   - progress: { phase, scanned, total }
 *   - results: { items: [...], progress: { classified, total } }
 *   - complete: { totalResults }
 *   - error: { message }
 */
classifyRouter.post('/classify', authMiddleware, classifyRateLimit, async (req, res) => {
  const { query, template, options = {} } = req.body;
  const { accessToken, email: userId } = req.user;

  // Validate required fields
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  if (!template?.templateId || !template?.columns?.length) {
    return res.status(400).json({ error: 'Valid template with columns is required' });
  }

  const maxEmails = Math.min(
    options.maxEmails || parseInt(process.env.MAX_EMAILS_PER_REQUEST || '200', 10),
    500
  );

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Phase 1: Fetch emails from Gmail
    sendEvent('progress', { phase: 'fetching', scanned: 0, total: 0, message: 'Connecting to Gmail...' });

    const rawMessages = await fetchEmails(accessToken, {
      query: options.searchQuery || '',
      maxEmails,
    }, (progress) => {
      sendEvent('progress', {
        phase: 'fetching',
        scanned: progress.scanned,
        total: progress.total,
        message: `Fetching emails... ${progress.scanned} of ${progress.total}`,
      });
    });

    if (rawMessages.length === 0) {
      sendEvent('complete', { totalResults: 0, message: 'No emails found matching your criteria.' });
      return res.end();
    }

    // Phase 2: Normalize emails
    const normalizedEmails = normalizeEmails(rawMessages);
    sendEvent('progress', {
      phase: 'normalizing',
      scanned: normalizedEmails.length,
      total: normalizedEmails.length,
      message: `Processing ${normalizedEmails.length} emails...`,
    });

    // Phase 3: Check cache
    const messageIds = normalizedEmails.map(e => e.messageId);
    const { cached, uncachedIds } = getClassified(userId, messageIds, template.templateId);

    if (cached.length > 0) {
      sendEvent('results', {
        items: cached,
        fromCache: true,
        progress: { classified: cached.length, total: normalizedEmails.length },
      });
    }

    // Phase 4: Classify uncached emails with Gemini
    if (uncachedIds.length > 0) {
      const uncachedEmails = normalizedEmails.filter(e => uncachedIds.includes(e.messageId));

      sendEvent('progress', {
        phase: 'classifying',
        scanned: cached.length,
        total: normalizedEmails.length,
        message: `AI analyzing ${uncachedEmails.length} emails...`,
      });

      const freshResults = await classifyEmails(uncachedEmails, template, query, (batch) => {
        if (batch.results.length > 0) {
          // Cache the fresh results
          setClassified(userId, template.templateId, batch.results);

          sendEvent('results', {
            items: batch.results,
            fromCache: false,
            progress: {
              classified: cached.length + batch.progress.classified,
              total: normalizedEmails.length,
            },
          });
        }

        if (batch.error) {
          sendEvent('warning', { message: `Batch error: ${batch.error}` });
        }
      });

      sendEvent('complete', {
        totalResults: cached.length + freshResults.length,
        cached: cached.length,
        fresh: freshResults.length,
        message: 'Classification complete!',
      });
    } else {
      sendEvent('complete', {
        totalResults: cached.length,
        cached: cached.length,
        fresh: 0,
        message: 'All results loaded from cache!',
      });
    }
  } catch (err) {
    console.error('[Classify Error]', err);
    sendEvent('error', {
      message: err.status === 401
        ? 'Your Gmail session has expired. Please re-authenticate.'
        : `Classification failed: ${err.message}`,
    });
  } finally {
    res.end();
  }
});
