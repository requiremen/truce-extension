/**
 * Gemini API Service
 * Handles AI-powered email classification using structured JSON output.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildResponseSchema, buildSystemPrompt } from '../utils/schemaBuilder.js';

// Lazy initialization — read env vars at call time, not import time
let _genAI = null;
function getGenAI() {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

const BATCH_SIZE = parseInt(process.env.GEMINI_BATCH_SIZE || '25', 10);

/**
 * Classify a batch of emails using Gemini structured output
 * @param {Array} emailSummaries - Normalized email objects
 * @param {object} template - Template definition
 * @param {string} userQuery - User's natural language query
 * @returns {Array} Classified email objects matching template schema
 */
async function classifyBatch(emailSummaries, template, userQuery) {
  const model = getGenAI().getGenerativeModel({ model: getModelName() });

  const systemPrompt = buildSystemPrompt(template, userQuery);
  const responseSchema = buildResponseSchema(template);

  // Format emails as a concise data block for the prompt
  const emailDataBlock = emailSummaries
    .map((e, i) => (
      `[Email ${i + 1}]\n` +
      `ID: ${e.messageId}\n` +
      `Thread: ${e.threadId}\n` +
      `From: ${e.from} <${e.fromEmail}>\n` +
      `Subject: ${e.subject}\n` +
      `Date: ${e.date}\n` +
      `Snippet: ${e.snippet}\n`
    ))
    .join('\n---\n');

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n## Email Data:\n\n${emailDataBlock}` }],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1, // Low temp for deterministic extraction
    },
  });

  const responseText = result.response.text();

  try {
    const parsed = JSON.parse(responseText);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (parseError) {
    console.error('[Gemini] Failed to parse response:', responseText.slice(0, 200));
    throw new Error('Gemini returned invalid JSON');
  }
}

/**
 * Classify emails in chunks, yielding results progressively
 * @param {Array} emailSummaries - All normalized email objects
 * @param {object} template - Template definition
 * @param {string} userQuery - User's natural language query
 * @param {function} onBatchComplete - Callback for each completed batch
 * @returns {Array} All classified results
 */
export async function classifyEmails(emailSummaries, template, userQuery, onBatchComplete = null) {
  const allResults = [];

  for (let i = 0; i < emailSummaries.length; i += BATCH_SIZE) {
    const batch = emailSummaries.slice(i, i + BATCH_SIZE);

    try {
      const batchResults = await classifyBatch(batch, template, userQuery);
      allResults.push(...batchResults);

      if (onBatchComplete) {
        onBatchComplete({
          results: batchResults,
          progress: {
            classified: Math.min(i + BATCH_SIZE, emailSummaries.length),
            total: emailSummaries.length,
          },
        });
      }
    } catch (err) {
      console.error(`[Gemini] Batch ${i / BATCH_SIZE + 1} failed:`, err.message);
      // Continue with remaining batches instead of failing entirely
      if (onBatchComplete) {
        onBatchComplete({
          results: [],
          error: err.message,
          progress: {
            classified: Math.min(i + BATCH_SIZE, emailSummaries.length),
            total: emailSummaries.length,
          },
        });
      }
    }
  }

  return allResults;
}
