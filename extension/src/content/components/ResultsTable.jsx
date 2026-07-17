/**
 * ResultsTable — Dense table view driven by template columns.
 * Sortable columns, typed cell rendering (text, date, enum badge, boolean, tags),
 * and standard Gmail-style action buttons on row hover.
 */

import React, { useState, useMemo } from 'react';
import { CellRenderer } from './CellRenderer.jsx';

export function ResultsTable({ results, template, onRowClick, onRowAction }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (columnId) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const sortedResults = useMemo(() => {
    if (!sortColumn) return results;

    return [...results].sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';

      let comparison = 0;
      if (typeof aVal === 'boolean') {
        comparison = (aVal === bVal) ? 0 : aVal ? -1 : 1;
      } else if (typeof aVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [results, sortColumn, sortDirection]);

  const handleActionClick = (e, item, action) => {
    e.stopPropagation(); // Stop parent row click trigger
    if (onRowAction) {
      onRowAction(item, action);
    }
  };

  return (
    <div className="rt-table-container">
      <table className="rt-table">
        <thead>
          <tr>
            {template.columns.map(col => (
              <th
                key={col.id}
                className={sortColumn === col.id ? 'sorted' : ''}
                onClick={() => handleSort(col.id)}
              >
                {col.label}
                {sortColumn === col.id && (
                  <span className="ms-sort-icon" style={{ marginLeft: 6 }}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="ms-stagger">
          {sortedResults.map((item, i) => (
            <tr
              key={item.messageId || i}
              onClick={() => onRowClick(item)}
              className={item.isUnread ? 'unread' : ''}
            >
              {template.columns.map((col, colIdx) => {
                const isLast = colIdx === template.columns.length - 1;
                return (
                  <td key={col.id} style={{ position: 'relative' }}>
                    <CellRenderer value={item[col.id]} column={col} />
                    {isLast && (
                      <div className="rt-row-actions" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="rt-action-icon"
                          title="Archive"
                          onClick={(e) => handleActionClick(e, item, 'archive')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8v13H3V8M23 3H1v5h22z" />
                            <path d="M10 12h4" />
                          </svg>
                        </div>
                        <div
                          className="rt-action-icon"
                          title="Delete"
                          onClick={(e) => handleActionClick(e, item, 'delete')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </div>
                        <div
                          className="rt-action-icon"
                          title="Mark as Read/Unread"
                          onClick={(e) => handleActionClick(e, item, 'read')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>
                        <div
                          className="rt-action-icon"
                          title="Snooze"
                          onClick={(e) => handleActionClick(e, item, 'snooze')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
