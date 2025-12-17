import React from 'react';

export default function ChatDeleteConfirm({ visible, chat, onClose, onDelete }) {
  if (!visible || !chat) return null;
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-inner modal-dark" onClick={e => e.stopPropagation()}>
        <h3>Delete chat</h3>
        <p>Are you sure you want to delete the chat <strong>{chat.chatName || (chat.users && chat.users.length && chat.users.find(u => u._id)?.name)}</strong>? This will remove it from your list.</p>
        <div className="modal-actions">
          <button className="btn small" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onDelete(chat._id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
