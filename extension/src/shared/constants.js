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

export const DEFAULT_SETTINGS = {
  viewMode: VIEW_MODES.COLUMNS,
  autoOpenPanel: true,
  maxEmails: 200,
};
