import React, { useState, useContext, useEffect } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { getSocket } from '../services/socket';

export default function MessageInput() {
  const { currentChat, sendMessage, sendMessageWithReply, replyTo, setReplyTo, setTypingUsers } = useContext(ChatContext);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const lastTypingTime = React.useRef(null);

  useEffect(() => {
    return () => { setText(''); setTyping(false); };
  }, [currentChat]);

  const handleTyping = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (!socket || !currentChat) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing', currentChat._id);
    }
    lastTypingTime.current = new Date().getTime();
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const diff = timeNow - lastTypingTime.current;
      if (diff >= 3000 && typing) {
        socket.emit('stop typing', currentChat._id);
        setTyping(false);
      }
    }, 3000);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    if (replyTo) {
      await sendMessageWithReply(text.trim(), currentChat._id, replyTo._id);
      setReplyTo(null);
    } else {
      await sendMessage(text.trim(), currentChat._id);
    }
    setText('');
    const socket = getSocket();
    if (socket) socket.emit('stop typing', currentChat._id);
    setTyping(false);
  };

  const onKeyDown = (e) => { if (e.key === 'Enter') handleSend(); };

  return (
    <div className="input-area">
      {replyTo && (
        <div className="reply-preview">
          <div style={{ fontSize: 12, color: 'var(--wa-gray)' }}>Replying to {replyTo.sender?.name || 'unknown'}</div>
          <div style={{ fontSize: 14 }}>{replyTo.content}</div>
          <button className="btn small" onClick={() => setReplyTo(null)}>✖</button>
        </div>
      )}
      <input style={{flex:1}} value={text} onChange={handleTyping} onKeyDown={onKeyDown} placeholder={currentChat ? 'Type a message' : 'Select a chat...'} disabled={!currentChat} />
      <button className="btn" onClick={handleSend} disabled={!currentChat} style={{width:56, height:40, borderRadius:20}}>Send</button>
    </div>
  );
}
