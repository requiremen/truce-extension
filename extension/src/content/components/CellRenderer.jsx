/**
 * CellRenderer — Renders a single cell value based on column type.
 * Handles: text, date, enum (badge), boolean (check/cross), tag (chips).
 */

import React from 'react';

/**
 * Format a date string for display
 */
function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return value;
  }
}

export function CellRenderer({ value, column }) {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--ms-text-tertiary)' }}>—</span>;
  }

  switch (column.type) {
    case 'date':
      return <span>{formatDate(value)}</span>;

    case 'enum':
      return (
        <span className="ms-badge" data-status={value}>
          {value}
        </span>
      );

    case 'boolean':
      return (
        <span className={`ms-bool ${value ? 'true' : 'false'}`}>
          {value ? '✓' : '✗'}
        </span>
      );

    case 'tag':
      if (Array.isArray(value)) {
        return (
          <span className="ms-tags">
            {value.map((tag, i) => (
              <span key={i} className="ms-tag">{tag}</span>
            ))}
          </span>
        );
      }
      return <span>{String(value)}</span>;

    case 'text':
    default:
      if (column.id === 'details') {
        const hasIssue = String(value).toLowerCase().includes('issue');
        return (
          <span className="rt-details-cell">
            <span className="rt-view-details-btn">View details</span>
            {hasIssue && <span className="rt-alert-issue">⚠️ {String(value)}</span>}
          </span>
        );
      }
      return <span title={String(value)}>{String(value)}</span>;
  }
}
