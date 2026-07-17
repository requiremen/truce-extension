/**
 * ViewToggle — Toggle between table and card view modes.
 * Also shows result count.
 */

import React from 'react';
import { VIEW_MODES } from '../../shared/constants.js';

const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

export function ViewToggle({ viewMode, onViewModeChange, resultCount }) {
  return (
    <div className="ms-toolbar">
      <div className="ms-view-toggle">
        <button
          className={`ms-view-btn ${viewMode === VIEW_MODES.TABLE ? 'active' : ''}`}
          onClick={() => onViewModeChange(VIEW_MODES.TABLE)}
        >
          <TableIcon />
          Table
        </button>
        <button
          className={`ms-view-btn ${viewMode === VIEW_MODES.CARDS ? 'active' : ''}`}
          onClick={() => onViewModeChange(VIEW_MODES.CARDS)}
        >
          <CardIcon />
          Cards
        </button>
      </div>
      <span className="ms-result-count">{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
    </div>
  );
}
