/**
 * Gmail API Service
 * Fetches emails using the user's OAuth token with batched requests and field masks.
 */

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Fields to fetch per message — minimal set for classification
const MESSAGE_FIELDS = 'id,threadId,snippet,payload/headers,internalDate,labelIds';

/**
 * Validate an OAuth token by calling Gmail profile endpoint
 * @param {string} accessToken
 * @returns {object} User profile { emailAddress }
 */
export async function validateToken(accessToken) {
  const res = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = new Error('Invalid or expired OAuth token');
    err.status = 401;
    throw err;
  }

  return res.json();
}

/**
 * List message IDs matching a query
 * @param {string} accessToken
 * @param {object} options - { query, maxResults, pageToken }
 * @returns {object} { messageIds: string[], nextPageToken?: string, resultSizeEstimate: number }
 */
async function listMessages(accessToken, { query = '', maxResults = 50, pageToken = null }) {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    fields: 'messages(id,threadId),nextPageToken,resultSizeEstimate',
  });

  if (query) params.set('q', query);
  if (pageToken) params.set('pageToken', pageToken);

  const res = await fetch(`${GMAIL_API_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API error (list): ${res.status} — ${body}`);
  }

  const data = await res.json();
  return {
    messageIds: (data.messages || []).map(m => m.id),
    nextPageToken: data.nextPageToken || null,
    resultSizeEstimate: data.resultSizeEstimate || 0,
  };
}

/**
 * Fetch a single message by ID with field mask
 * @param {string} accessToken
 * @param {string} messageId
 * @returns {object} Gmail message object
 */
async function getMessage(accessToken, messageId) {
  const params = new URLSearchParams({ fields: MESSAGE_FIELDS });

  const res = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    // Gracefully handle individual message fetch failures
    console.warn(`Failed to fetch message ${messageId}: ${res.status}`);
    return null;
  }

  return res.json();
}

/**
 * Fetch multiple messages in parallel batches
 * Gmail doesn't support true HTTP batch for REST v1 easily, so we use
 * parallel individual requests with concurrency control.
 *
 * @param {string} accessToken
 * @param {string[]} messageIds
 * @param {number} concurrency - Max parallel requests (default 10)
 * @returns {object[]} Array of message objects
 */
async function getMessagesBatched(accessToken, messageIds, concurrency = 10) {
  const results = [];

  for (let i = 0; i < messageIds.length; i += concurrency) {
    const batch = messageIds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(id => getMessage(accessToken, id))
    );
    results.push(...batchResults.filter(Boolean));
  }

  return results;
}

/**
 * Fetch all emails matching criteria, with progress reporting
 * @param {string} accessToken
 * @param {object} options - { query, maxEmails, dateRange }
 * @param {function} onProgress - Callback: ({ scanned, total }) => void
 * @returns {object[]} Array of raw Gmail message objects
 */
export async function fetchEmails(accessToken, options = {}, onProgress = null) {
  const { query = '', maxEmails = 200 } = options;

  let allMessageIds = [];
  let pageToken = null;
  let totalEstimate = 0;

  // Phase 1: Collect message IDs (paginate)
  do {
    const result = await listMessages(accessToken, {
      query,
      maxResults: Math.min(100, maxEmails - allMessageIds.length),
      pageToken,
    });

    allMessageIds.push(...result.messageIds);
    pageToken = result.nextPageToken;
    totalEstimate = Math.max(totalEstimate, result.resultSizeEstimate);

    if (allMessageIds.length >= maxEmails) {
      allMessageIds = allMessageIds.slice(0, maxEmails);
      break;
    }
  } while (pageToken);

  const total = allMessageIds.length;

  if (onProgress) {
    onProgress({ phase: 'fetching', scanned: 0, total });
  }

  // Phase 2: Fetch message details in batches
  const allMessages = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < allMessageIds.length; i += BATCH_SIZE) {
    const batch = allMessageIds.slice(i, i + BATCH_SIZE);
    const messages = await getMessagesBatched(accessToken, batch, BATCH_SIZE);
    allMessages.push(...messages);

    if (onProgress) {
      onProgress({ phase: 'fetching', scanned: allMessages.length, total });
    }
  }

  return allMessages;
}
