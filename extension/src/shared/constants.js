/**
 * Shared Constants
 */

export const BACKEND_URL = 'http://localhost:3001';

export const STORAGE_KEYS = {
  ACTIVE_TEMPLATE: 'mailsort_active_template',
  CUSTOM_TEMPLATES: 'mailsort_custom_templates',
  VIEW_MODE: 'mailsort_view_mode',
  PANEL_OPEN: 'mailsort_panel_open',
  SETTINGS: 'mailsort_settings',
};

export const VIEW_MODES = {
  COLUMNS: 'columns',
  TABLE: 'table',
  CARDS: 'cards',
};

export const WORK_MODES = {
  'important-today': {
    label: 'Important today',
    allowedStates: ['Needs action now', 'Follow-up due', 'Deadline risk', 'Waiting for reply', 'Review or decision needed', 'Attachment review'],
  },
  'follow-ups-only': {
    label: 'Follow-ups only',
    allowedStates: ['Follow-up due'],
  },
  'deadline-watch': {
    label: 'Deadline watch',
    allowedStates: ['Deadline risk', 'Needs action now'],
  },
  'unread-first': {
    label: 'Unread first',
    allowedStates: null, // show all, sort unread to top
  },
};

export const DEFAULT_SETTINGS = {
  viewMode: VIEW_MODES.COLUMNS,
  autoOpenPanel: true,
  maxEmails: 200,
};
