/**
 * PromptInput — "Ask MailSort..." input bar.
 * Persistent at the top of the overlay, with suggested prompt chips.
 */

import React, { useState, useRef, useEffect } from 'react';

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export function PromptInput({ onSubmit, isLoading, suggestedPrompts = [], hasResults }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      // Don't auto-focus to avoid stealing focus from Gmail
      // inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (prompt) => {
    setQuery(prompt);
    onSubmit(prompt);
  };

  return (
    <div className="ms-prompt-section">
      <div className="ms-prompt-container">
        <div className="ms-prompt-icon">
          <SparkleIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="ms-prompt-input"
          placeholder="Ask MailSort..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          className="ms-prompt-submit"
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading}
          title="Run classification"
        >
          <SendIcon />
        </button>
      </div>

      {/* Show suggestions when no results yet and not loading */}
      {!hasResults && !isLoading && suggestedPrompts.length > 0 && (
        <div className="ms-suggestions">
          {suggestedPrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              className="ms-suggestion-chip"
              onClick={() => handleSuggestionClick(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
