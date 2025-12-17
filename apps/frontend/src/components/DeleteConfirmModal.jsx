import React, { useState } from 'react';

export default function DeleteConfirmModal({ visible, message, onClose, onDelete, canDeleteForEveryone = false }) {
  const [mode, setMode] = useState(canDeleteForEveryone ? 'everyone' : 'me');
  if (!visible || !message) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-inner modal-dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 500 }}>Delete message?</h3>

        <div style={{ marginBottom: 20 }}>
          <div
            className="radio"
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              background: mode === 'me' ? 'rgba(255,255,255,0.05)' : 'transparent',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={() => setMode('me')}
          >
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="radio"
                name="deleteOpt"
                checked={mode === 'me'}
                onChange={() => setMode('me')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Delete for me</div>
                <div style={{ fontSize: 13, color: 'var(--wa-dark-text-secondary)' }}>
                  This message will be deleted for you. Other chat participants will still be able to see it.
                </div>
              </div>
            </label>
          </div>

          <div
            className="radio"
            style={{
              padding: 12,
              borderRadius: 8,
              background: mode === 'everyone' ? 'rgba(255,255,255,0.05)' : 'transparent',
              cursor: canDeleteForEveryone ? 'pointer' : 'not-allowed',
              border: '1px solid rgba(255,255,255,0.1)',
              opacity: canDeleteForEveryone ? 1 : 0.5
            }}
            onClick={() => canDeleteForEveryone && setMode('everyone')}
          >
            <label style={{ cursor: canDeleteForEveryone ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="radio"
                name="deleteOpt"
                checked={mode === 'everyone'}
                onChange={() => canDeleteForEveryone && setMode('everyone')}
                disabled={!canDeleteForEveryone}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Delete for everyone</div>
                <div style={{ fontSize: 13, color: 'var(--wa-dark-text-secondary)' }}>
                  {canDeleteForEveryone
                    ? 'This message will be deleted for everyone in the chat.'
                    : 'You can only delete messages you sent.'}
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="modal-actions" style={{ gap: 12 }}>
          <button
            className="btn secondary small"
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--wa-green)',
              border: 'none',
              padding: '10px 24px',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            className="btn small"
            onClick={() => onDelete(mode)}
            style={{
              background: '#EA4335',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              fontWeight: 500
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
