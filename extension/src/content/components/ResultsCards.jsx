/**
 * ResultsCards — Card grid view driven by template columns.
 * Each card represents one classified email/group.
 */

import React from 'react';
import { CellRenderer } from './CellRenderer.jsx';

export function ResultsCards({ results, template, onCardClick }) {
  // Find the "primary" column (first text column) for the card title
  const primaryCol = template.columns.find(c => c.type === 'text') || template.columns[0];
  // Find status/enum column for the card badge
  const statusCol = template.columns.find(c => c.type === 'enum');
  // Remaining columns for the field grid
  const detailCols = template.columns.filter(
    c => c.id !== primaryCol?.id && c.id !== statusCol?.id
  );

  return (
    <div className="ms-cards-grid ms-stagger">
      {results.map((item, i) => (
        <div
          key={item.messageId || i}
          className="ms-card"
          onClick={() => onCardClick(item)}
        >
          <div className="ms-card-header">
            <span className="ms-card-title">
              {item[primaryCol?.id] || 'Unknown'}
            </span>
            {statusCol && item[statusCol.id] && (
              <span className="ms-badge" data-status={item[statusCol.id]}>
                {item[statusCol.id]}
              </span>
            )}
          </div>

          <div className="ms-card-fields">
            {detailCols.map(col => (
              <div key={col.id} className="ms-card-field">
                <div className="ms-card-field-label">{col.label}</div>
                <div className="ms-card-field-value">
                  <CellRenderer value={item[col.id]} column={col} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
