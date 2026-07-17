/**
 * Schema Builder
 * Converts template column definitions into a Gemini responseSchema
 * and builds the extraction prompt.
 */

/**
 * Map template column types to JSON Schema types for Gemini
 */
const TYPE_MAP = {
  text: { type: 'STRING' },
  date: { type: 'STRING' },
  boolean: { type: 'BOOLEAN' },
  tag: { type: 'ARRAY', items: { type: 'STRING' } },
  enum: (options) => ({
    type: 'STRING',
    enum: options || [],
  }),
};

/**
 * Build a Gemini-compatible responseSchema from a template definition
 * @param {object} template - Template with columns array
 * @returns {object} Gemini responseSchema (JSON Schema)
 */
export function buildResponseSchema(template) {
  const properties = {
    messageId: { type: 'STRING', description: 'The original email message ID' },
    threadId: { type: 'STRING', description: 'The email thread ID' },
  };

  const required = ['messageId', 'threadId'];

  for (const col of template.columns) {
    if (col.type === 'enum' && col.options?.length) {
      properties[col.id] = {
        ...TYPE_MAP.enum(col.options),
        description: col.label,
        nullable: true,
      };
    } else if (col.type === 'tag') {
      properties[col.id] = {
        ...TYPE_MAP.tag,
        description: col.label,
      };
    } else {
      const mapping = TYPE_MAP[col.type] || TYPE_MAP.text;
      properties[col.id] = {
        ...mapping,
        description: col.label,
        nullable: true,
      };
    }
    required.push(col.id);
  }

  return {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties,
      required,
    },
  };
}

/**
 * Build the system prompt for Gemini based on template and user query
 * @param {object} template - Template definition
 * @param {string} userQuery - User's natural language query
 * @returns {string} System instruction prompt
 */
export function buildSystemPrompt(template, userQuery) {
  const columnDescriptions = template.columns
    .map(col => {
      let desc = `- "${col.id}" (${col.label}): type=${col.type}`;
      if (col.type === 'enum' && col.options) {
        desc += `, allowed values: [${col.options.map(o => `"${o}"`).join(', ')}]`;
      }
      return desc;
    })
    .join('\n');

  return `You are an intelligent email classification assistant called MailSort AI.

Your task is to analyze email data and extract structured information based on the user's request and the template schema.

## Template: "${template.name}"
${template.aiInstructions || ''}

## Fields to extract per email:
${columnDescriptions}

## Rules:
1. Always include "messageId" and "threadId" from the source email data.
2. Extract or infer each field from the email's subject, sender, snippet, and date.
3. If a field cannot be determined, set it to null (for nullable fields) or a reasonable default.
4. For enum fields, ONLY use the allowed values listed. Pick the closest match.
5. For date fields, return ISO 8601 format (YYYY-MM-DD).
6. Be concise — field values should be short labels, not full sentences.
7. Only return emails that are relevant to the user's query. If an email is clearly irrelevant, skip it.

## User's Request:
"${userQuery}"

Analyze the provided emails and return the structured data.`;
}
