/**
 * EmptyState — Shown when no results yet.
 * Displays suggested prompts tied to the active template.
 */

import React from 'react';

const InboxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

export function EmptyState({ template, onSuggestionClick }) {
  return (
    <div className="ms-empty">
      <div className="ms-empty-icon">
        <InboxIcon />
      </div>
      <div className="ms-empty-title">
        Ready to sort your inbox
      </div>
      <div className="ms-empty-desc">
        Ask anything about your emails using the {template.name} template, or try one of these suggestions:
      </div>

      {template.suggestedPrompts?.length > 0 && (
        <div className="ms-empty-suggestions ms-stagger">
          {template.suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              className="ms-empty-suggestion"
              onClick={() => onSuggestionClick(prompt)}
            >
              → {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
