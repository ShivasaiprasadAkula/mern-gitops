import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';
import MessageInput from './MessageInput';
import MessageContextMenu from './MessageContextMenu';
import ForwardModal from './ForwardModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import GroupInfoModal from './GroupInfoModal';
import ProfileModal from './ProfileModal';
import ChatDeleteConfirm from './ChatDeleteConfirm';
import api from '../services/api';
import ChatContextMenu from './ChatContextMenu';

// Function to get consistent color for a user based on their ID
const getUserColor = (userId) => {
  const colors = [
    '#00897B', // Teal
    '#1976D2', // Blue
    '#7B1FA2', // Purple
    '#C2185B', // Pink
    '#F57C00', // Orange
    '#388E3C', // Green
    '#D32F2F', // Red
    '#5D4037', // Brown
    '#303F9F', // Indigo
    '#0097A7', // Cyan
  ];

  // Generate a hash from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export default function ChatWindow({ onBack }) {
  const { currentChat, messages, typingUsers, markMessagesAsRead, setReplyTo, toggleStarMessage, deleteForMeMessage, deleteForEveryoneMessage, forwardMessage, addReaction, pinChat, fetchChats, exitGroup } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [forwardModal, setForwardModal] = useState({ visible: false, message: null });
  const [deleteModal, setDeleteModal] = useState({ visible: false, type: 'message', message: null, canDeleteForEveryone: false });
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [chatMenu, setChatMenu] = useState({ visible: false, x: 0, y: 0, chat: null });
  const bottomRef = useRef();
  const messagesEndRef = useRef();
  const prevMessageCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. It's a new message (count increased)
    // 2. User is not manually scrolling up
    const isNewMessage = messages.length > prevMessageCountRef.current;

    if (bottomRef.current && isNewMessage && !isUserScrollingRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCountRef.current = messages.length;

    if (currentChat && messages.length > 0) {
      markMessagesAsRead(currentChat._id);
    }
  }, [messages, currentChat]);

  // Detect when user scrolls up
  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    isUserScrollingRef.current = !isAtBottom;
  };

  // Listen for dispatches from ChatList right-click
  useEffect(() => {
    const handler = (e) => {
      setChatMenu({ visible: true, x: e.detail.x, y: e.detail.y, chat: e.detail.chat });
    };
    window.addEventListener('chat-context-open', handler);
    return () => window.removeEventListener('chat-context-open', handler);
  }, []);

  const renderMessages = () => {
    if (!currentChat) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--wa-gray-dark)',
          fontSize: 16
        }}>
          Select a chat to start messaging
        </div>
      );
    }

    return (
      <div className="messages" onClick={() => setContextMenu({ visible: false, x: 0, y: 0, message: null })} onScroll={handleScroll}>
        {messages.map((m) => {
          // System message
          if (m.isSystemMessage) {
            return (
              <div key={m._id} className="system-message">
                <div className="system-message-content">
                  {m.content}
                </div>
              </div>
            );
          }

          // Regular message
          const isMe = m.sender && m.sender._id === user?._id;
          const senderColor = m.sender ? getUserColor(m.sender._id) : '#000';

          return (
            <div key={m._id} className={`message ${isMe ? 'me' : 'other'} ${selectedMessages.has(m._id) ? 'selected' : ''}`} onContextMenu={(e) => {
              e.preventDefault();

              const menuW = 200;
              const menuH = 400; // Approximate max height
              const padding = 10;

              let x, y;

              // WhatsApp-style positioning:
              // - For messages on the right (isMe), show menu on the LEFT of the message
              // - For messages on the left (others), show menu on the RIGHT of the message

              if (isMe) {
                // My message (right side) - show menu on the left
                x = e.clientX - menuW - padding;
                // If no space on left, show on right
                if (x < padding) {
                  x = e.clientX + padding;
                }
              } else {
                // Other's message (left side) - show menu on the right
                x = e.clientX + padding;
                // If no space on right, show on left
                if (x + menuW > window.innerWidth - padding) {
                  x = e.clientX - menuW - padding;
                }
              }

              // Vertical positioning
              y = e.clientY;

              // If menu would go below viewport, show it above the click point
              if (y + menuH > window.innerHeight - padding) {
                y = Math.max(padding, window.innerHeight - menuH - padding);
              }

              // Ensure menu doesn't go above viewport
              if (y < padding) {
                y = padding;
              }

              setContextMenu({ visible: true, x, y, message: m });
            }}>
              {!isMe && currentChat.isGroupChat && (
                <div className="avatar small" style={{ background: senderColor }}>
                  {m.sender?.name?.[0]}
                </div>
              )}
              <div className="bubble">
                {!isMe && currentChat.isGroupChat && (
                  <div className="sender-name" style={{ color: senderColor }}>
                    {m.sender?.name}
                  </div>
                )}
                {m.isForwarded && (
                  <div className="forwarded-label">Forwarded</div>
                )}
                {m.replyTo && (
                  <div className="reply-quote">
                    <div className="reply-from">{m.replyTo.sender?.name || 'unknown'}</div>
                    <div className="reply-content">{m.replyTo.content}</div>
                  </div>
                )}
                {m.isDeleted ? (
                  <div className="deleted-placeholder" style={{ fontStyle: 'italic', color: 'var(--wa-gray-dark)' }}>
                    <span style={{ marginRight: 6 }}>🚫</span>
                    This message was deleted
                  </div>
                ) : (
                  m.content
                )}
                {m.reactions && m.reactions.length > 0 && (
                  <div className="reactions">
                    {(() => {
                      const map = {};
                      m.reactions.forEach(r => { const k = r.reaction; map[k] = (map[k] || 0) + 1; });
                      return Object.keys(map).map(k => (
                        <span key={k} className="reaction">{k} {map[k] > 1 ? map[k] : ''}</span>
                      ));
                    })()}
                  </div>
                )}
                <div className="meta">
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  {isMe && (
                    <span className={`tick ${m.status}`}>
                      {m.status === 'sent' && (
                        <svg viewBox="0 0 16 15" width="16" height="15" className="tick-icon">
                          <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 14.302 1.932 11.5a.365.365 0 0 0-.51-.063l-.478.372a.365.365 0 0 0-.063.51l3.526 3.754a.365.365 0 0 0 .51.063l10.156-12.302a.365.365 0 0 0-.063-.51z" />
                        </svg>
                      )}
                      {(m.status === 'delivered' || m.status === 'read') && (
                        <div className="double-tick-icon">
                          <svg viewBox="0 0 16 15" width="16" height="15" className="tick-icon">
                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 14.302 1.932 11.5a.365.365 0 0 0-.51-.063l-.478.372a.365.365 0 0 0-.063.51l3.526 3.754a.365.365 0 0 0 .51.063l10.156-12.302a.365.365 0 0 0-.063-.51z" />
                          </svg>
                          <svg viewBox="0 0 16 15" width="16" height="15" className="tick-icon second-tick">
                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 14.302 1.932 11.5a.365.365 0 0 0-.51-.063l-.478.372a.365.365 0 0 0-.063.51l3.526 3.754a.365.365 0 0 0 .51.063l10.156-12.302a.365.365 0 0 0-.063-.51z" />
                          </svg>
                        </div>
                      )}
                    </span>
                  )}
                  {m.starredBy && m.starredBy.some(u => (u._id ? u._id === user._id : u === user._id)) && (
                    <span title="Starred" style={{ marginLeft: 6 }}>⭐</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    );
  };

  const otherUser = currentChat && !currentChat.isGroupChat ? currentChat.users.find(u => u._id !== user._id) : null;

  return (
    <div className="main" onClick={() => { setContextMenu({ visible: false, x: 0, y: 0, message: null }); setChatMenu({ visible: false, x: 0, y: 0, chat: null }); }}>
      <div className="chat-container">
        <div className="header">
          <div className="left">
            {onBack && (
              <button className="btn secondary small" onClick={onBack} style={{ marginRight: 8 }}>← Back</button>
            )}
            <div className="avatar">
              {currentChat ? (currentChat.isGroupChat ? currentChat.chatName?.[0] : otherUser?.name?.[0]) : 'C'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="title">
                {currentChat ? (currentChat.isGroupChat ? currentChat.chatName : otherUser?.name) : 'No chat selected'}
              </div>
              <div className="subtitle">
                {currentChat ? (currentChat.isGroupChat ? `${currentChat.users.length} members` : (otherUser?.email)) : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentChat && (
              <button
                className="btn secondary small"
                onClick={() => currentChat.isGroupChat ? setShowGroupInfo(true) : setShowProfile(true)}
              >
                Info
              </button>
            )}
          </div>
        </div>

        {renderMessages()}

        <div className="typing">
          {currentChat && typingUsers[currentChat._id] && typingUsers[currentChat._id].length > 0 && (
            <div>{typingUsers[currentChat._id].map(u => u.name).join(', ')} typing...</div>
          )}
        </div>

        <MessageInput />
      </div>

      {contextMenu.visible && (
        <MessageContextMenu
          message={contextMenu.message}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu({ visible: false, x: 0, y: 0, message: null })}
          onAction={async (type, payload) => {
            const msg = contextMenu.message;
            if (!msg) return;
            switch (type) {
              case 'reply':
                setReplyTo(msg);
                break;
              case 'copy':
                if (navigator.clipboard) await navigator.clipboard.writeText(msg.content || '');
                break;
              case 'forward':
                // open forward modal
                setForwardModal({ visible: true, message: msg });
                break;
              case 'star':
                await toggleStarMessage(msg._id);
                break;
              case 'pin':
                if (currentChat) await pinChat(currentChat._id);
                break;
              case 'deleteForMe':
              case 'delete':
                // open delete modal
                setDeleteModal({ visible: true, type: 'message', message: msg, canDeleteForEveryone: (msg.sender && (msg.sender._id ? msg.sender._id === user._id : msg.sender === user._id)) });
                break;
                break;
              case 'select':
                setSelectedMessages(s => {
                  const copy = new Set([...s]);
                  if (copy.has(msg._id)) copy.delete(msg._id); else copy.add(msg._id);
                  return copy;
                });
                break;
              case 'share':
                if (navigator.share) navigator.share({ text: msg.content || '' }).catch(() => { });
                else if (navigator.clipboard) await navigator.clipboard.writeText(msg.content || '');
                break;
              case 'reaction':
                await addReaction(msg._id, payload);
                break;
              default:
                break;
            }
          }}
          currentUser={user}
          isGroupChat={currentChat?.isGroupChat || false}
        />
      )}

      {chatMenu.visible && (
        <ChatContextMenu chat={chatMenu.chat} position={{ x: chatMenu.x, y: chatMenu.y }} currentUser={user} onClose={() => setChatMenu({ visible: false, x: 0, y: 0, chat: null })} onAction={async (type) => {
          if (!chatMenu.chat) return;
          switch (type) {
            case 'pin':
              await pinChat(chatMenu.chat._id);
              break;
            case 'delete':
              // open delete UI for chat
              setDeleteModal({ visible: true, type: 'chat', message: { _id: chatMenu.chat._id, chatName: chatMenu.chat.chatName, isGroupChat: chatMenu.chat.isGroupChat }, canDeleteForEveryone: chatMenu.chat.isGroupChat && ((chatMenu.chat.groupAdmin && chatMenu.chat.groupAdmin._id) ? chatMenu.chat.groupAdmin._id === user._id : false) });
              break;
            case 'exit':
              // Exit group
              if (chatMenu.chat.isGroupChat && window.confirm('Are you sure you want to exit this group?')) {
                await exitGroup(chatMenu.chat._id);
              }
              break;
            case 'info':
              if (chatMenu.chat.isGroupChat) setShowGroupInfo(true); else setShowProfile(true);
              break;
            default:
              break;
          }
        }} />
      )}

      <ForwardModal visible={forwardModal.visible} onClose={() => setForwardModal({ visible: false, message: null })} onSend={async (userIds) => {
        // call forwardMessage on selected users
        const msg = forwardModal.message;
        if (!msg) return;
        await forwardMessage(msg._id, userIds, true);
      }} />

      <DeleteConfirmModal visible={deleteModal.visible && deleteModal.type === 'message'} message={deleteModal.message} canDeleteForEveryone={deleteModal.canDeleteForEveryone} onClose={() => setDeleteModal({ visible: false, type: 'message', message: null, canDeleteForEveryone: false })} onDelete={async (mode) => {
        // mode: 'me' or 'everyone'
        const msg = deleteModal.message;
        if (!msg) return;
        if (mode === 'me') {
          await deleteForMeMessage(msg._id);
        } else {
          await deleteForEveryoneMessage(msg._id);
        }
        setDeleteModal({ visible: false, type: 'message', message: null, canDeleteForEveryone: false });
      }} />

      <ChatDeleteConfirm visible={deleteModal.visible && deleteModal.type === 'chat'} chat={deleteModal.message && deleteModal.message._id ? { ...deleteModal.message, isGroupChat: deleteModal.message.isGroupChat } : null} onClose={() => setDeleteModal({ visible: false, type: 'message', message: null, canDeleteForEveryone: false })} onDelete={async (chatId) => {
        try {
          await api.delete(`/chat/${chatId}`);
          // refresh chats and clear current chat if it was the one deleted
          await fetchChats();
          if (currentChat && currentChat._id === chatId) {
            setCurrentChat(null);
            setMessages([]);
          }
        } finally {
          setDeleteModal({ visible: false, type: 'message', message: null, canDeleteForEveryone: false });
        }
      }} />

      {showGroupInfo && currentChat && currentChat.isGroupChat && (
        <GroupInfoModal chat={currentChat} onClose={() => setShowGroupInfo(false)} />
      )}
      {showProfile && otherUser && (
        <ProfileModal user={otherUser} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
