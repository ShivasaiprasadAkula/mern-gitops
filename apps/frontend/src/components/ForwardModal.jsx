import React, { useEffect, useState, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export default function ForwardModal({ visible, onClose, onSend }) {
  const { searchUsers } = useContext(ChatContext);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await searchUsers('');
      setUsers(data);
    };
    if (visible) {
      fetchUsers();
      setSelected(new Set());
      setQuery('');
    }
  }, [visible]);

  const handleSearch = async (q) => {
    setQuery(q);
    const data = await searchUsers(q);
    setUsers(data);
  };

  const toggle = (u) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(u._id)) s.delete(u._id); else s.add(u._id);
      return s;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    await onSend(Array.from(selected));
    setSelected(new Set());
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-inner modal-dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 500 }}>Forward message to...</h3>

        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search contacts..."
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--wa-dark-text)',
            fontSize: 14,
            marginBottom: 16
          }}
        />

        {selected.size > 0 && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: 'rgba(37, 211, 102, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(37, 211, 102, 0.3)'
          }}>
            <div style={{ fontSize: 13, color: 'var(--wa-green)', marginBottom: 8, fontWeight: 500 }}>
              {selected.size} contact{selected.size > 1 ? 's' : ''} selected
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.from(selected).map(userId => {
                const user = users.find(u => u._id === userId);
                return user ? (
                  <div
                    key={userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      background: 'rgba(37, 211, 102, 0.2)',
                      borderRadius: 16,
                      fontSize: 13
                    }}
                  >
                    <span>{user.name}</span>
                    <button
                      onClick={() => toggle(user)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--wa-dark-text)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 16,
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--wa-dark-text-secondary)' }}>
              No contacts found
            </div>
          ) : (
            users.map(u => (
              <div
                key={u._id}
                onClick={() => toggle(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  background: selected.has(u._id) ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (!selected.has(u._id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  if (!selected.has(u._id)) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #128C7E, #25D366)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 16,
                  flexShrink: 0
                }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--wa-dark-text-secondary)' }}>{u.email}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selected.has(u._id)}
                  onChange={() => { }}
                  style={{
                    width: 20,
                    height: 20,
                    cursor: 'pointer',
                    accentColor: 'var(--wa-green)'
                  }}
                />
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            className="btn secondary small"
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--wa-dark-text-secondary)',
              border: 'none',
              padding: '10px 24px',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            className="btn small"
            onClick={handleSend}
            disabled={selected.size === 0}
            style={{
              background: selected.size > 0 ? 'var(--wa-green)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              fontWeight: 500,
              opacity: selected.size > 0 ? 1 : 0.5,
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
