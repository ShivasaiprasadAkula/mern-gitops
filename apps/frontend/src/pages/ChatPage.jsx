import React, { useContext } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const { notifications, selectChat } = useContext(ChatContext);

  return (
    <div className="app">
      <ChatList />
      <ChatWindow />
      <div className="notifications">
        {notifications.map(n => (
          <div key={n._id} className="notification">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="avatar small" style={{ background: '#8696A0' }}>
                {n.sender?.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {n.sender?.name}
                  <span className="small"> in {n.chat.chatName || (n.chat.users?.find(u => u._id !== user._id)?.name)}</span>
                </div>
                <div className="small">{n.content}</div>
              </div>
              <button className="btn small" onClick={() => { selectChat(n.chat); }}>
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
