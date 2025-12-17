import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function ProfileModal({ onClose, user: otherUser }) {
  const { user, logout } = useContext(AuthContext);
  const me = otherUser || user;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-inner profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{otherUser ? 'User Profile' : 'My Profile'}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="profile-content">
            <div className="profile-avatar-large">
              {me?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <div className="profile-name">{me?.name}</div>
              <div className="profile-email">{me?.email}</div>
            </div>
          </div>

          {!otherUser && (
            <div className="profile-stats">
              <div className="profile-stat-item">
                <div className="profile-stat-label">Member since</div>
                <div className="profile-stat-value">
                  {new Date(me?.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {otherUser ? (
            <button className="btn secondary" onClick={onClose}>Close</button>
          ) : (
            <>
              <button className="btn secondary" onClick={onClose}>Close</button>
              <button className="btn" onClick={logout} style={{ background: '#dc3545' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
