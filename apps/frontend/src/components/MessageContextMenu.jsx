import React from 'react';

export default function MessageContextMenu({ message, position, onClose, onAction, currentUser, isGroupChat }) {
  if (!message) return null;

  const isMyMessage = message.sender && message.sender._id === currentUser?._id;

  const style = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    background: '#233138',
    color: '#E9EDEF',
    borderRadius: 8,
    boxShadow: '0 2px 5px 0 rgba(11,20,26,.26), 0 2px 10px 0 rgba(11,20,26,.16)',
    padding: '6px 0',
    zIndex: 9999,
    minWidth: 200,
    maxHeight: '80vh',
    overflowY: 'auto',
  };

  const menuItem = (label, icon, handler, danger = false) => (
    <div
      className="context-item"
      onClick={() => { handler(); onClose(); }}
      style={{
        padding: '12px 24px 12px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        fontSize: 14.5,
        color: danger ? '#EA4335' : '#E9EDEF',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 18, width: 20, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );

  const emojiRow = (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: '8px 12px 12px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 4
    }}>
      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(e => (
        <button
          key={e}
          className="emoji-btn"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAction('reaction', e);
            onClose();
          }}
          style={{
            background: 'transparent',
            border: 0,
            fontSize: 20,
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            transition: 'background 0.1s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {e}
        </button>
      ))}
    </div>
  );

  return (
    <div style={style} className="message-context-menu">
      {emojiRow}

      {/* Info - only for group messages from others */}
      {isGroupChat && !isMyMessage && menuItem('Message info', 'ℹ️', () => onAction('info'))}

      {/* Reply */}
      {menuItem('Reply', '↩️', () => onAction('reply'))}

      {/* React - alternative to emoji row */}
      {/* {menuItem('React', '😊', () => onAction('react'))} */}

      {/* Forward */}
      {menuItem('Forward message', '➡️', () => onAction('forward'))}

      {/* Star */}
      {menuItem('Star message', '⭐', () => onAction('star'))}

      {/* Copy */}
      {message.content && menuItem('Copy', '📋', () => onAction('copy'))}

      {/* Pin - only in group chats */}
      {isGroupChat && menuItem('Pin', '📌', () => onAction('pin'))}

      {/* Delete */}
      {menuItem('Delete message', '🗑️', () => onAction('delete'), true)}

      {/* Select - for multi-select mode */}
      {menuItem('Select', '✓', () => onAction('select'))}
    </div>
  );
}
