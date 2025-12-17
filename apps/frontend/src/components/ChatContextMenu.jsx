import React from 'react';

export default function ChatContextMenu({ chat, position, onClose, onAction, currentUser }) {
  if (!chat) return null;

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
    maxHeight: '70vh',
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

  const otherUser = !chat.isGroupChat && chat.users && currentUser
    ? chat.users.find(u => u._id !== currentUser._id)
    : null;

  return (
    <div style={style} className="chat-context-menu">
      {/* Chat info */}
      {menuItem('Chat info', 'ℹ️', () => onAction('info'))}

      {/* Pin/Unpin chat */}
      {menuItem(chat.isPinned ? 'Unpin chat' : 'Pin chat', '📌', () => onAction('pin'))}

      {/* Mute notifications */}
      {menuItem('Mute notifications', '🔕', () => onAction('mute'))}

      {/* Archive chat */}
      {menuItem('Archive chat', '📥', () => onAction('archive'))}

      {/* Mark as unread */}
      {menuItem('Mark as unread', '⭕', () => onAction('markUnread'))}

      {/* Delete chat */}
      {menuItem('Delete chat', '🗑️', () => onAction('delete'), true)}

      {/* Exit group - only for group chats */}
      {chat.isGroupChat && menuItem('Exit group', '🚪', () => onAction('exit'), true)}
    </div>
  );
}
