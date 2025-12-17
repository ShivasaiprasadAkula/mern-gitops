import React, { useState, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';

export default function GroupInfoModal({ chat, onClose }) {
    const { user } = useContext(AuthContext);
    const { addToGroup, removeFromGroup, searchUsers, selectChat, exitGroup, deleteGroup } = useContext(ChatContext);
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isAdmin = chat.groupAdmin?._id === user._id || chat.groupAdmin === user._id;

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const users = await searchUsers(searchQuery);
            // Filter out users already in the group
            const existingUserIds = chat.users.map(u => u._id);
            const filtered = users.filter(u => !existingUserIds.includes(u._id));
            setSearchResults(filtered);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleAddMember = async (userId) => {
        try {
            await addToGroup(chat._id, userId);
            await selectChat(chat);
            setSearchQuery('');
            setSearchResults([]);
            setShowAddMembers(false);
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await removeFromGroup(chat._id, userId);
            await selectChat(chat);
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const handleExitGroup = async () => {
        try {
            await exitGroup(chat._id);
            onClose();
        } catch (error) {
            console.error('Error exiting group:', error);
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await deleteGroup(chat._id);
            onClose();
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    };

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-inner group-info-modal" onClick={(e) => e.stopPropagation()}>
                <div className="group-info-header">
                    <button className="modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="group-info-content">
                    {/* Group Avatar and Name */}
                    <div className="group-info-top">
                        <div className="group-avatar-large">
                            {chat.chatName?.[0]?.toUpperCase()}
                        </div>
                        <h2 className="group-name">{chat.chatName}</h2>
                        <div className="group-meta">Group · {chat.users?.length} members</div>
                    </div>

                    {/* Members Section */}
                    <div className="group-section">
                        <div className="group-section-header">
                            <span>{chat.users?.length} Members</span>
                            {isAdmin && (
                                <button
                                    className="btn small"
                                    onClick={() => setShowAddMembers(!showAddMembers)}
                                >
                                    {showAddMembers ? 'Cancel' : '+ Add'}
                                </button>
                            )}
                        </div>

                        {/* Add Members Section */}
                        {showAddMembers && isAdmin && (
                            <div className="add-members-section">
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <input
                                        placeholder="Search users to add"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="btn small" onClick={handleSearch}>Search</button>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="search-results-list">
                                        {searchResults.map(u => (
                                            <div key={u._id} className="member-item">
                                                <div className="avatar" style={{ width: 40, height: 40 }}>
                                                    {u.name[0]?.toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                    <div className="small">{u.email}</div>
                                                </div>
                                                <button className="btn small" onClick={() => handleAddMember(u._id)}>
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div className="members-list">
                            {chat.users?.map(member => {
                                const isMemberAdmin = (chat.groupAdmin?._id || chat.groupAdmin) === member._id;
                                const isCurrentUser = member._id === user._id;
                                return (
                                    <div key={member._id} className="member-item">
                                        <div className="avatar" style={{ width: 48, height: 48 }}>
                                            {member.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {member.name} {isCurrentUser && <span className="small">(You)</span>}
                                            </div>
                                            {isMemberAdmin && (
                                                <div className="member-role">Group Admin</div>
                                            )}
                                        </div>
                                        {isAdmin && !isCurrentUser && (
                                            <button
                                                className="btn secondary small"
                                                onClick={() => handleRemoveMember(member._id)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="group-actions">
                        <button
                            className="group-action-btn exit-btn"
                            onClick={() => setShowExitConfirm(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Exit Group
                        </button>

                        {isAdmin && (
                            <button
                                className="group-action-btn delete-btn"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Delete Group
                            </button>
                        )}
                    </div>
                </div>

                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="confirm-dialog">
                        <div className="confirm-dialog-content">
                            <h3>Exit Group?</h3>
                            <p>Are you sure you want to exit this group?</p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                <button className="btn secondary" onClick={() => setShowExitConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="btn" style={{ background: '#dc3545' }} onClick={handleExitGroup}>
                                    Exit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="confirm-dialog">
                        <div className="confirm-dialog-content">
                            <h3>Delete Group?</h3>
                            <p>This will permanently delete the group and all its messages. This action cannot be undone.</p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                <button className="btn secondary" onClick={() => setShowDeleteConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="btn" style={{ background: '#dc3545' }} onClick={handleDeleteGroup}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
