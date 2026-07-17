/**
 * TemplateEditor — Edit columns of the active template.
 * Expandable section at the bottom of the overlay.
 * MVP scope: edit/add/remove columns of existing templates only.
 */

import React, { useState, useCallback } from 'react';

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const COLUMN_TYPES = ['text', 'date', 'enum', 'boolean', 'tag'];

export function TemplateEditor({ template, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateColumn = useCallback((index, field, value) => {
    const updated = { ...template };
    updated.columns = [...template.columns];
    updated.columns[index] = { ...updated.columns[index], [field]: value };
    onUpdate(updated);
  }, [template, onUpdate]);

  const removeColumn = useCallback((index) => {
    const updated = { ...template };
    updated.columns = template.columns.filter((_, i) => i !== index);
    onUpdate(updated);
  }, [template, onUpdate]);

  const addColumn = useCallback(() => {
    const updated = { ...template };
    const newId = `custom_${Date.now()}`;
    updated.columns = [
      ...template.columns,
      { id: newId, label: 'New Column', type: 'text' },
    ];
    onUpdate(updated);
  }, [template, onUpdate]);

  return (
    <div className="ms-editor-section">
      <button
        className={`ms-editor-toggle ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        Template: {template.name}
        <ChevronIcon />
      </button>

      <div className={`ms-editor-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="ms-editor-list">
          {template.columns.map((col, i) => (
            <div key={col.id} className="ms-editor-column">
              <input
                className="ms-editor-column-label"
                value={col.label}
                onChange={(e) => updateColumn(i, 'label', e.target.value)}
                placeholder="Column name"
              />
              <select
                className="ms-editor-column-type"
                value={col.type}
                onChange={(e) => updateColumn(i, 'type', e.target.value)}
              >
                {COLUMN_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                className="ms-editor-delete"
                onClick={() => removeColumn(i)}
                title="Remove column"
              >
                <TrashIcon />
              </button>
            </div>
          ))}

          <button className="ms-editor-add" onClick={addColumn}>
            <PlusIcon /> Add Column
          </button>
        </div>
      </div>
    </div>
  );
}
