/**
 * OverlayPanel — Professional Workspace Overlay matching the Red Tomato wireframe.
 * Integrates into the main Gmail inbox panel.
 */

import React, { useState, useMemo } from 'react';
import { ResultsTable } from './ResultsTable.jsx';
import { ResultsCards } from './ResultsCards.jsx';
import { TemplateEditor } from './TemplateEditor.jsx';
import { VIEW_MODES, WORK_MODES } from '../../shared/constants.js';

// SVG Icons
const TomatoLogo = () => (
  <svg className="rt-logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24, marginRight: 8 }}>
    <circle cx="12" cy="13" r="8" fill="url(#tomatoGrad)" />
    <path d="M12 5C12 5 11 2 9 3C9 3 11 4 12 5Z" fill="#10b981" />
    <path d="M12 5C12 5 13 2 15 3C15 3 13 4 12 5Z" fill="#10b981" />
    <path d="M12 5V2" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
    <defs>
      <linearGradient id="tomatoGrad" x1="8" y1="9" x2="16" y2="17" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#fb7185" />
        <stop offset="50%" stop-color="#e11d48" />
        <stop offset="100%" stop-color="#be123c" />
      </linearGradient>
    </defs>
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

const ColumnsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <line x1="15" y1="3" x2="15" y2="21"/>
  </svg>
);

const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

export function OverlayPanel({
  isOpen,
  onToggle,
  authState,
  onAuthRequest,
  activeTemplate,
  templates,
  onTemplateChange,
  onTemplateUpdate,
  results,
  isLoading,
  progress,
  error,
  viewMode,
  onViewModeChange,
  workMode,
  onWorkModeChange,
  onSubmitQuery,
  currentQuery,
  hasSearched
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [askText, setAskText] = useState('');
  const [hideLowPriority, setHideLowPriority] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [removedThreadIds, setRemovedThreadIds] = useState(() => new Set());
  const [unreadOverrides, setUnreadOverrides] = useState(() => new Map());

  // Group items by state for the map counters and columns view
  const stateCounts = useMemo(() => {
    const activeItems = results.filter(item => !removedThreadIds.has(item.threadId || item.messageId));
    const counts = {
      all: activeItems.length,
      'Needs action now': 0,
      'Follow-up due': 0,
      'Waiting for reply': 0,
      'Review or decision needed': 0,
      'Attachment review': 0,
      'Missing contact': 0,
      'Deadline risk': 0,
      'Low priority': 0,
    };

    activeItems.forEach(item => {
      const state = item.current_state || item.status;
      if (state && counts[state] !== undefined) {
        counts[state]++;
      }
    });

    return counts;
  }, [results, removedThreadIds]);

  // Filtered items list
  const filteredResults = useMemo(() => {
    let items = results.filter(item => !removedThreadIds.has(item.threadId || item.messageId));

    items = items.map(item => {
      const id = item.threadId || item.messageId;
      if (unreadOverrides.has(id)) {
        return { ...item, isUnread: unreadOverrides.get(id) };
      }
      return item;
    });

    const currentMode = WORK_MODES[workMode];
    if (currentMode && currentMode.allowedStates !== null && activeFilter === 'all') {
      items = items.filter(item => {
        const state = item.current_state || item.status;
        return currentMode.allowedStates.includes(state);
      });
    }

    if (hideLowPriority) {
      items = items.filter(item => {
        const state = item.current_state || item.status;
        return state !== 'Low priority';
      });
    }

    if (activeFilter !== 'all') {
      items = items.filter(item => {
        const state = item.current_state || item.status;
        return state === activeFilter;
      });
    }

    // Unread-first sort mode
    if (workMode === 'unread-first') {
      items.sort((a, b) => {
        const aUnread = a.isUnread ? 0 : 1;
        const bUnread = b.isUnread ? 0 : 1;
        return aUnread - bUnread;
      });
    }

    return items;
  }, [results, activeFilter, hideLowPriority, removedThreadIds, unreadOverrides, workMode]);

  const handleRowAction = async (item, action) => {
    const threadId = item.threadId || item.messageId;
    if (!threadId) return;

    if (action === 'archive' || action === 'delete' || action === 'snooze') {
      setRemovedThreadIds(prev => {
        const next = new Set(prev);
        next.add(threadId);
        return next;
      });
    } else if (action === 'read') {
      const currentVal = unreadOverrides.has(threadId) ? unreadOverrides.get(threadId) : item.isUnread;
      setUnreadOverrides(prev => {
        const next = new Map(prev);
        next.set(threadId, !currentVal);
        return next;
      });
    }

    try {
      chrome.runtime.sendMessage({
        type: 'GMAIL_ACTION',
        threadId,
        action
      }, (response) => {
        if (!response || !response.success) {
          console.warn('[Gmail Action Failed]', response?.error);
        }
      });
    } catch (e) {
      console.warn('[Chrome Extension Runtime Not Ready]', e);
    }
  };

  const handleAskSubmit = (e) => {
    e?.preventDefault();
    if (askText.trim()) {
      onSubmitQuery(askText.trim());
      setAskText('');
    }
  };

  const handleSignIn = async () => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
        if (response?.token) {
          onAuthRequest();
        }
      });
    } catch (err) {
      console.error('Auth failed:', err);
    }
  };

  const isAuthenticated = authState.status === 'authenticated';
  const hasResults = results.length > 0;

  return (
    <>
      {/* Floating Trigger FAB Button (Collapsible) */}
      {!isOpen && (
        <div className="rt-trigger-fab" onClick={onToggle} style={{ pointerEvents: 'auto' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}>
            <circle cx="12" cy="13" r="8" fill="url(#tomatoGradFabPopup)" />
            <path d="M12 5C12 5 11 2 9 3C9 3 11 4 12 5Z" fill="#a7f3d0" />
            <path d="M12 5C12 5 13 2 15 3C15 3 13 4 12 5Z" fill="#a7f3d0" />
            <path d="M12 5V2" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="tomatoGradFabPopup" x1="8" y1="9" x2="16" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="50%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Workspace Panel Container with GPU spring bounce slide up transition */}
      <div className={`workspace-area ${isOpen ? 'active' : ''}`} style={{ display: 'block' }}>
        <div className="rt-workspace">
      
      {/* 1. Workspace Header */}
      <div className="rt-header">
        <div className="rt-brand-group">
          <div className="rt-logo-container" style={{ display: 'flex', alignItems: 'center' }}>
            <TomatoLogo />
            <span className="rt-logo">redtomato</span>
          </div>
          {isAuthenticated ? (
            <div className="rt-mode-dropdown-group">
              <select 
                className="rt-mode-select" 
                value={workMode} 
                onChange={(e) => onWorkModeChange(e.target.value)}
              >
                {Object.entries(WORK_MODES).map(([key, mode]) => (
                  <option key={key} value={key}>{mode.label}</option>
                ))}
              </select>
              <span className="rt-info-icon">ⓘ<span className="rt-tooltip">Choose a pre-built lens to filter and organise your inbox.</span></span>
            </div>
          ) : (
            <div className="rt-mode-badge important" onClick={handleSignIn}>
              <span className="indicator"></span>
              Sign in to Gmail
            </div>
          )}
        </div>

        <div className="rt-workmode-prompt">
          <div className="rt-prompt-label-row">
            <span className="rt-prompt-label">Need a different work mode?</span>
            <span className="rt-info-icon">ⓘ<span className="rt-tooltip">Describe a custom starting mode in your own words.</span></span>
          </div>
          <form className="rt-prompt-card" onSubmit={handleAskSubmit}>
            <textarea
              placeholder="Organise this inbox around customer success conversations and flag any pending replies older than 48 hours."
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskSubmit(e);
                }
              }}
            />
            <button type="submit" className="rt-prompt-submit-btn" disabled={isLoading} title="Apply custom work mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </form>
        </div>

        <button className="rt-exit-btn" onClick={onToggle}>
          Exit view ✕
        </button>
      </div>

      {/* Auth Gate view */}
      {!isAuthenticated && authState.status !== 'loading' ? (
        <div className="rt-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%' }}>
          <div className="rt-logo-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TomatoLogo />
            <span className="rt-logo" style={{ fontSize: 32 }}>redtomato</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, maxWidth: 300, textAlign: 'center' }}>
            Connect with Google to organize your Gmail inbox into a custom structured workspace.
          </p>
          <button className="rt-control-btn active" style={{ padding: '10px 24px' }} onClick={handleSignIn}>
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          {/* 2. Main Workspace Body */}
          <div className="rt-body">
            
            {/* Left Sidebar Panel: Workspace Map */}
            <div className="rt-map-panel">
              <div className="rt-panel-title-row">
                <div className="rt-panel-title">Work Map (by state)</div>
                <span className="rt-info-icon">ⓘ<span className="rt-tooltip">Click a state to filter the table to only those items.</span></span>
              </div>
              
              <div className="rt-map-list">
                <div className={`rt-map-item ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
                  <span>All items</span>
                  <span className="rt-map-count">{stateCounts.all}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Needs action now' ? 'active' : ''}`} onClick={() => setActiveFilter('Needs action now')}>
                  <span>Needs action now</span>
                  <span className="rt-map-count">{stateCounts['Needs action now']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Follow-up due' ? 'active' : ''}`} onClick={() => setActiveFilter('Follow-up due')}>
                  <span>Follow-up due</span>
                  <span className="rt-map-count">{stateCounts['Follow-up due']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Waiting for reply' ? 'active' : ''}`} onClick={() => setActiveFilter('Waiting for reply')}>
                  <span>Waiting for reply</span>
                  <span className="rt-map-count">{stateCounts['Waiting for reply']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Review or decision needed' ? 'active' : ''}`} onClick={() => setActiveFilter('Review or decision needed')}>
                  <span>Review/decision</span>
                  <span className="rt-map-count">{stateCounts['Review or decision needed']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Attachment review' ? 'active' : ''}`} onClick={() => setActiveFilter('Attachment review')}>
                  <span>Attachments</span>
                  <span className="rt-map-count">{stateCounts['Attachment review']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Missing contact' ? 'active' : ''}`} onClick={() => setActiveFilter('Missing contact')}>
                  <span>Missing contact</span>
                  <span className="rt-map-count">{stateCounts['Missing contact']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Deadline risk' ? 'active' : ''}`} onClick={() => setActiveFilter('Deadline risk')}>
                  <span>Deadline risk</span>
                  <span className="rt-map-count">{stateCounts['Deadline risk']}</span>
                </div>
                <div className={`rt-map-item ${activeFilter === 'Low priority' ? 'active' : ''}`} onClick={() => setActiveFilter('Low priority')}>
                  <span>Low priority</span>
                  <span className="rt-map-count">{stateCounts['Low priority']}</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Work Items */}
            <div className="rt-canvas-panel">
              
              {/* Header stats & layout toggles */}
              <div className="rt-canvas-header">
                <span className="rt-canvas-title">Work Items ({filteredResults.length})</span>
                
                {/* View Toggles */}
                <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 2, borderRadius: 8 }}>
                  <button
                    className={`rt-view-toggle-btn ${viewMode === VIEW_MODES.COLUMNS ? 'active' : ''}`}
                    onClick={() => onViewModeChange(VIEW_MODES.COLUMNS)}
                    title="Columns / Kanban Board"
                  >
                    <ColumnsIcon />
                  </button>
                  <button
                    className={`rt-view-toggle-btn ${viewMode === VIEW_MODES.TABLE ? 'active' : ''}`}
                    onClick={() => onViewModeChange(VIEW_MODES.TABLE)}
                    title="Table List View"
                  >
                    <TableIcon />
                  </button>
                  <button
                    className={`rt-view-toggle-btn ${viewMode === VIEW_MODES.CARDS ? 'active' : ''}`}
                    onClick={() => onViewModeChange(VIEW_MODES.CARDS)}
                    title="Cards Grid View"
                  >
                    <GridIcon />
                  </button>
                </div>
              </div>

              {/* Progress Loading Bar */}
              {(isLoading || progress) && (
                <div className="rt-progress-strip">
                  <div className="rt-progress-bar-fill animate-progress" style={{
                    width: progress?.phase === 'fetching' ? '30%' : progress?.phase === 'classifying' ? '70%' : '100%'
                  }}></div>
                  <span className="rt-progress-label">
                    {progress?.message || 'Analyzing inbox...'}
                  </span>
                </div>
              )}

              {/* Error strip */}
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Results canvas rendering */}
              <div className="rt-results-view-wrap">
                {hasResults ? (
                  viewMode === VIEW_MODES.COLUMNS ? (
                    /* Beautiful Kanban Columns Layout */
                    <div className="rt-kanban-board">
                      {['Needs action now', 'Follow-up due', 'Waiting for reply', 'Low priority'].map(state => {
                        const colItems = filteredResults.filter(item => {
                          const itemState = item.current_state || item.status;
                          return itemState === state;
                        });
                        return (
                          <div key={state} className="rt-kanban-column">
                            <div className="rt-kanban-col-header">
                              <span className="rt-kanban-col-title">{state.toUpperCase()}</span>
                              <span className="rt-kanban-col-badge">{colItems.length}</span>
                            </div>
                            <div className="rt-kanban-cards-list">
                              {colItems.map((item, idx) => (
                                <div key={item.messageId || idx} className="rt-kanban-card" onClick={() => setSelectedItem(item)}>
                                  <div className="rt-kanban-card-sender">{item.lead_client || item.sender || item.candidate_name || item.company || 'Unknown'}</div>
                                  <div className="rt-kanban-card-subject">{item.why_it_matters || item.subject}</div>
                                  {item.next_step && <div className="rt-kanban-card-next">{item.next_step}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : viewMode === VIEW_MODES.TABLE ? (
                    <ResultsTable
                      results={filteredResults}
                      template={activeTemplate}
                      onRowClick={(item) => setSelectedItem(item)}
                      onRowAction={handleRowAction}
                    />
                  ) : (
                    <ResultsCards
                      results={filteredResults}
                      template={activeTemplate}
                      onCardClick={(item) => setSelectedItem(item)}
                    />
                  )
                ) : hasSearched ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 40, color: '#64748b', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🕵️‍♂️</div>
                    <span style={{ fontWeight: 500 }}>Zero matches found!</span>
                    <span style={{ fontSize: 13 }}>The AI scanned your inbox but couldn't find any emails that fit this mode. Try a different mode or a broader prompt!</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 40, color: '#94a3b8' }}>
                    <SparkleIcon />
                    <span>No workspace loaded yet. Submit a prompt below to organize your workspace.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar Details Panel */}
            {selectedItem && (
              <div className="rt-detail-panel" style={{ display: 'flex' }}>
                <div className="rt-detail-header">
                  <div className="rt-detail-title-group">
                    <span className="rt-detail-title">
                      {selectedItem.lead_client || selectedItem.candidate_name || selectedItem.company || selectedItem.sender || 'Item Details'}
                    </span>
                    <span className="rt-detail-subtitle">
                      {selectedItem.work_type || selectedItem.role || 'Work Item'}
                    </span>
                  </div>
                  <button className="rt-detail-close-btn" onClick={() => setSelectedItem(null)}>✕</button>
                </div>

                <div className="rt-detail-content">
                  {/* Alert banner for issues */}
                  {selectedItem.details && selectedItem.details.toLowerCase().includes('issue') && (
                    <div className="rt-detail-alert-card">
                      <span className="rt-detail-alert-title">⚠️ Issue to review</span>
                      <span className="rt-detail-alert-body">{selectedItem.details}</span>
                    </div>
                  )}

                  {/* Why this item is here */}
                  <div className="rt-detail-section">
                    <span className="rt-detail-label">Why this item is here</span>
                    <span className="rt-detail-text">
                      {selectedItem.why_it_matters || selectedItem.summary || 'Matches current workspace filters.'}
                    </span>
                  </div>

                  {/* Next Action */}
                  {selectedItem.next_step && (
                    <div className="rt-detail-section">
                      <span className="rt-detail-label">Next Step</span>
                      <span className="rt-detail-text" style={{ fontWeight: 500, color: 'var(--rt-text-primary)' }}>
                        {selectedItem.next_step}
                      </span>
                    </div>
                  )}

                  {/* Source evidence preview card */}
                  <div className="rt-detail-section">
                    <span className="rt-detail-label">Source evidence</span>
                    <div className="rt-source-card">
                      <div className="rt-source-header">
                        <div className="rt-source-sender-info">
                          <div className="rt-source-gmail-logo">M</div>
                          <span className="rt-source-sender">{selectedItem.sender || selectedItem.lead_client || 'Gmail User'}</span>
                        </div>
                        <span className="rt-source-date">{selectedItem.date || selectedItem.date_received || 'Recent'}</span>
                      </div>
                      <div className="rt-source-subject">{selectedItem.subject || 'Correspondence details'}</div>
                      <div className="rt-source-snippet">{selectedItem.snippet || 'Email body content snippet...'}</div>
                      {selectedItem.attachment && (
                        <div className="rt-source-attachment">📎 {selectedItem.attachment}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rt-detail-actions">
                  <a className="rt-detail-btn primary" href={`https://mail.google.com/mail/u/0/#inbox/${selectedItem.threadId || ''}`} target="_blank" rel="noopener noreferrer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Open in Gmail
                  </a>
                  <button className="rt-detail-btn secondary" onClick={() => setSelectedItem(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* 3. Bottom Control Desk */}
          <div className="rt-control-desk">
            <div className="rt-control-row">
              <button className="rt-control-btn active" onClick={() => setActiveFilter('all')}>All Items</button>
              <button className="rt-control-btn" onClick={() => setActiveFilter('Needs action now')}>Needs Action</button>
              <button className="rt-control-btn" onClick={() => setHideLowPriority(!hideLowPriority)}>
                {hideLowPriority ? '👁 Show low priority' : '👁 Hide low priority'}
              </button>
              <button className="rt-control-btn" onClick={() => setIsEditorExpanded(!isEditorExpanded)}>
                🛠 Template Settings
              </button>
              <div className="rt-control-spacer"></div>
              <button className="rt-control-btn accent" onClick={() => {
                setActiveFilter('all');
                setHideLowPriority(false);
                setSelectedItem(null);
              }}>Reset workspace</button>
            </div>

            {/* Template Editor Drawer */}
            {isEditorExpanded && (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 4 }}>
                <TemplateEditor template={activeTemplate} onUpdate={onTemplateUpdate} />
              </div>
            )}

            {/* Change Workspace Prompt */}
            <form className="rt-ask-bar" onSubmit={handleAskSubmit}>
              <div className="rt-ask-label-row">
                <div className="rt-ask-label">Ask RedTomato to change this workspace</div>
                <span className="rt-info-icon">ⓘ<span className="rt-tooltip">Type a natural-language instruction to modify the current view.</span></span>
              </div>
              <div className="rt-ask-input-wrap">
                <input
                  type="text"
                  placeholder="e.g. Add a due date field and group cards by urgency."
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button type="submit" className="rt-submit-btn" disabled={isLoading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </form>
          </div>
        </>
      )}
        </div>
      </div>
    </>
  );
}
