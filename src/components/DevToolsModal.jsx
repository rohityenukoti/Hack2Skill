import React from 'react';
import { X, Database, Cloud, Sparkles, Settings } from 'lucide-react';

export default function DevToolsModal({
  isOpen,
  onClose,
  isLive,
  hasAiBackend,
  userRole,
  seedStatus,
  functionsTestStatus,
  onTestFunctions,
  onSeedDemo,
  onResetDb,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="devtools-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="devtools-modal glass-card">
        <div className="devtools-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="var(--primary)" />
            <h2>DevTools</h2>
          </div>
          <button type="button" className="devtools-close" onClick={onClose} aria-label="Close DevTools">
            <X size={22} />
          </button>
        </div>

        <div className="devtools-status-grid">
          <div
            className="devtools-status-card"
            style={{
              background: isLive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              borderColor: isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            }}
          >
            <Database size={16} color={isLive ? 'var(--status-success)' : 'var(--status-warning)'} />
            <div>
              <span style={{ fontWeight: 600, color: isLive ? 'var(--status-success)' : 'var(--status-warning)' }}>
                {isLive ? 'Live Firestore DB' : 'Offline Local DB'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isLive ? 'Firebase Auth + Firestore' : 'LocalStorage Cache'}
              </span>
            </div>
          </div>

          <div
            className="devtools-status-card"
            style={{
              background: hasAiBackend ? 'rgba(187, 92, 45, 0.06)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: hasAiBackend ? 'var(--primary-glow)' : 'var(--border-color)',
            }}
          >
            <Cloud size={16} color={hasAiBackend ? 'var(--primary)' : 'var(--text-muted)'} />
            <div>
              <span style={{ fontWeight: 600, color: hasAiBackend ? 'var(--primary)' : 'var(--text-muted)' }}>
                {hasAiBackend ? 'Cloud Functions AI' : 'Local Simulation'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {hasAiBackend ? 'Gemini via Cloud Functions' : 'Offline fallback engine'}
              </span>
            </div>
          </div>
        </div>

        {userRole === 'admin' && (
          <div className="devtools-setup">
            <h3>System Setup</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure Firebase via <code>.env</code> (see <code>.env.example</code>). Gemini API keys are stored
              server-side in Cloud Functions secrets — never in the browser.
            </p>

            <button type="button" className="btn-secondary" onClick={onTestFunctions} style={{ justifyContent: 'center' }}>
              <Cloud size={16} />
              Test Cloud Functions
            </button>
            {functionsTestStatus && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: functionsTestStatus.startsWith('Cloud Functions OK')
                    ? 'var(--status-success)'
                    : 'var(--status-critical)',
                }}
              >
                {functionsTestStatus}
              </p>
            )}

            <button type="button" className="btn-primary" onClick={onSeedDemo} style={{ justifyContent: 'center' }}>
              <Sparkles size={16} />
              Seed Demo Accounts &amp; Data
            </button>
            {seedStatus && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{seedStatus}</p>}

            <button
              type="button"
              className="btn-secondary"
              onClick={onResetDb}
              style={{ border: '1px solid var(--status-critical)', color: 'var(--status-critical)' }}
            >
              Reset Local DB Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
