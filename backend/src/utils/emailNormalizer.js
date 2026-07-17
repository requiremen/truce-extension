/**
 * Email Normalizer
 * Extracts structured fields from raw Gmail API message responses.
 */

/**
 * Extract a header value by name from Gmail message payload headers
 */
function getHeader(headers, name) {
  const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

/**
 * Parse a "From" header into name and email
 * Handles formats like: "John Doe <john@example.com>" or "john@example.com"
 */
function parseFrom(fromHeader) {
  const match = fromHeader.match(/^"?(.+?)"?\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim() };
}

/**
 * Normalize a raw Gmail API message into a clean summary object
 * @param {object} message - Raw Gmail API message (from users.messages.get)
 * @returns {object} Normalized email summary
 */
export function normalizeEmail(message) {
  const headers = message.payload?.headers || [];

  const from = parseFrom(getHeader(headers, 'From'));
  const subject = getHeader(headers, 'Subject') || '(No Subject)';
  const to = getHeader(headers, 'To');
  const date = getHeader(headers, 'Date');
  const internalDate = message.internalDate
    ? new Date(parseInt(message.internalDate)).toISOString()
    : null;

  return {
    messageId: message.id,
    threadId: message.threadId,
    subject,
    from: from.name,
    fromEmail: from.email,
    to,
    date: internalDate || date,
    snippet: message.snippet || '',
    labels: message.labelIds || [],
  };
}

/**
 * Normalize a batch of Gmail messages
 * @param {Array} messages - Array of raw Gmail API messages
 * @returns {Array} Array of normalized email summaries
 */
export function normalizeEmails(messages) {
  return messages.map(normalizeEmail);
}
