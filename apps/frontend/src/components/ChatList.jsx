import React, { useContext, useEffect, useState } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';
import GroupModal from './GroupModal';
import ProfileModal from './ProfileModal';

export default function ChatList({ onSelect }) {
  const { chats, fetchChats, selectChat, currentChat, notifications, searchUsers, accessChat } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => { fetchChats(); }, []);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearch(value);

    // If search is empty, clear results
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    // Search for new users (not in existing chats)
    try {
      const users = await searchUsers(value);
      // Filter out users who already have chats
      const existingChatUserIds = chats
        .filter(chat => !chat.isGroupChat)
        .flatMap(chat => chat.users.map(u => u._id));

      const newUsers = users.filter(u =>
        u._id !== user._id && !existingChatUserIds.includes(u._id)
      );

      setSearchResults(newUsers);
      setIsSearchingUsers(newUsers.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleStartChat = async (searchUser) => {
    try {
      const chat = await accessChat(searchUser._id);
      await fetchChats();
      selectChat(chat);
      setSearch('');
      setSearchResults([]);
      setIsSearchingUsers(false);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const unreadCount = (chatId) => notifications.filter(n => (n.chat._id || n.chat).toString() === chatId.toString()).length;

  const Avatar = ({ name, group }) => (
    <div className="avatar" style={{ background: group ? 'linear-gradient(135deg, #128C7E, #25D366)' : 'linear-gradient(135deg, #667781, #8696A0)' }}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );

  const filteredChats = chats.filter(chat => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    if ((chat.chatName || '').toLowerCase().includes(q)) return true;
    if ((chat.latestMessage?.content || '').toLowerCase().includes(q)) return true;
    if ((chat.users || []).some(u => u.name?.toLowerCase().includes(q))) return true;
    return false;
  });

  return (
    <div className="sidebar">
      <div className="header">
        <div className="profile-area">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn small" onClick={() => setShowModal(true)}>New Group</button>
          <button className="btn secondary small" onClick={() => setShowProfile(true)}>Profile</button>
          <button className="btn secondary small" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="search">
        <input
          value={search}
          onChange={handleSearchInput}
          placeholder="Search chats or find new users"
        />
      </div>
      <div className="chat-list">
        {/* Show new users found in search */}
        {isSearchingUsers && searchResults.length > 0 && (
          <>
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--wa-gray-dark)', background: 'var(--wa-gray-light)' }}>
              New Users
            </div>
            {searchResults.map(searchUser => (
              <div
                key={searchUser._id}
                className="chat-item"
                onClick={() => handleStartChat(searchUser)}
              >
                <Avatar name={searchUser.name} group={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="name">{searchUser.name}</div>
                  <div className="last">{searchUser.email}</div>
                </div>
                <button
                  className="btn small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartChat(searchUser);
                  }}
                >
                  Chat
                </button>
              </div>
            ))}
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--wa-gray-dark)', background: 'var(--wa-gray-light)', marginTop: 8 }}>
              Your Chats
            </div>
          </>
        )}

        {/* Show existing chats */}
        {filteredChats.map(chat => (
          <div
            key={chat._id}
            className={`chat-item ${currentChat?._id === chat._id ? 'chat-selected' : ''}`}
            onClick={() => { selectChat(chat); if (onSelect) onSelect(); }}
            onContextMenu={(e) => {
              e.preventDefault();
              // create an event to open ChatContextMenu at e.clientX/Y, we will use DOM event system to pass to parent
              const event = new CustomEvent('chat-context-open', { detail: { chat, x: e.clientX, y: e.clientY } });
              window.dispatchEvent(event);
            }}
          >
            <Avatar
              name={chat.isGroupChat ? chat.chatName : (chat.users.find(u => u._id !== user._id)?.name)}
              group={chat.isGroupChat}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div className="name">
                  {chat.isGroupChat ? chat.chatName : (chat.users.find(u => u._id !== user._id)?.name)}
                </div>
                <div className="chat-time">
                  {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="last" style={{ fontStyle: chat.latestMessage?.isDeleted ? 'italic' : 'normal' }}>
                  {chat.latestMessage?.isDeleted
                    ? '🚫 This message was deleted'
                    : (chat.latestMessage?.content || 'No messages yet')}
                </div>
                {unreadCount(chat._id) > 0 && (
                  <div className="chat-badge">{unreadCount(chat._id)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && <GroupModal onClose={() => { setShowModal(false); fetchChats(); }} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
