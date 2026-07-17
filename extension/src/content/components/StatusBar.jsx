/**
 * StatusBar — Shows incremental progress during classification.
 * Displays phase, message, and a progress bar.
 */

import React from 'react';

export function StatusBar({ progress }) {
  if (!progress) return null;

  const { phase, message, scanned, total, classified } = progress;

  // Calculate percentage
  let percent = 0;
  if (phase === 'fetching' && total > 0) {
    percent = Math.round((scanned / total) * 50); // fetching = 0-50%
  } else if (phase === 'classifying' && total > 0) {
    percent = 50 + Math.round(((classified || 0) / total) * 50); // classifying = 50-100%
  } else if (phase === 'normalizing') {
    percent = 50;
  }

  return (
    <div className="ms-status-bar">
      <span className="ms-status-text">{message || 'Processing...'}</span>
      <div className="ms-progress-bar">
        <div
          className="ms-progress-fill"
          style={{ width: `${Math.max(percent, 5)}%` }}
        />
      </div>
      <span className="ms-status-count">{percent}%</span>
    </div>
  );
}
