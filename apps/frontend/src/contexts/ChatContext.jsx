import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const socketRef = useRef(null);
  const currentChatRef = useRef(null);

  useEffect(() => {
    if (token) {
      socketRef.current = connectSocket(token);
      socketRef.current.on('connect', () => {
        socketRef.current.emit('setup', user._id);
      });
      socketRef.current.on('message received', (newMessage) => {
        const current = currentChatRef.current;
        if (!current || newMessage.chat._id !== current._id) {
          setNotifications(prev => [newMessage, ...prev]);
        } else {
          setMessages(prev => [...prev, newMessage]);
        }
        setChats(prev => prev.map(c => c._id === newMessage.chat._id ? { ...c, latestMessage: newMessage } : c));
      });
      socketRef.current.on('typing', ({ chatId, user: tUser }) => {
        setTypingUsers(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), tUser] }));
      });
      socketRef.current.on('stop typing', ({ chatId, user: tUser }) => {
        setTypingUsers(prev => ({ ...prev, [chatId]: (prev[chatId] || []).filter(u => u._id !== tUser._id) }));
      });
      socketRef.current.on('message status update', ({ messageId, status, chatId }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
        setChats(prev => prev.map(c => {
          if (c._id === chatId && c.latestMessage && c.latestMessage._id === messageId) {
            return { ...c, latestMessage: { ...c.latestMessage, status } };
          }
          return c;
        }));
      });
      socketRef.current.on('messages read', ({ chatId }) => {
        setMessages(prev => prev.map(m => {
          if (m.chat._id === chatId || m.chat === chatId) {
            return { ...m, status: 'read' };
          }
          return m;
        }));
      });
      socketRef.current.on('message updated', (updatedMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? { ...m, ...updatedMessage } : m));
      });

      socketRef.current.on('message deleted for me', ({ messageId, userId }) => {
        if (userId === user._id) {
          setMessages(prev => prev.filter(m => m._id !== messageId));
        }
      });
      socketRef.current.on('message deleted', ({ messageId }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m));
      });
    }
    return () => disconnectSocket();
  }, [token]);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  const fetchChats = async () => {
    const res = await api.get('/chat');
    setChats(res.data);
  };
  const accessChat = async (userId) => {
    const res = await api.post('/chat', { userId });
    // if chat exists in list, select that
    await fetchChats();
    return res.data;
  };

  const selectChat = async (chat) => {
    setCurrentChat(chat);
    const res = await api.get(`/message/${chat._id}`);
    setMessages(res.data);
    const socket = getSocket();
    if (socket) socket.emit('join chat', chat._id);
    setNotifications(n => n.filter(noti => noti.chat._id !== chat._id));
    return chat;
  };

  const sendMessage = async (content, chatId) => {
    const res = await api.post('/message', { content, chatId });
    socketRef.current.emit('new message', res.data);
    setMessages(prev => [...prev, res.data]);
    await fetchChats();
  };

  const sendMessageWithReply = async (content, chatId, replyTo) => {
    const res = await api.post('/message', { content, chatId, replyTo });
    socketRef.current.emit('new message', res.data);
    setMessages(prev => [...prev, res.data]);
    await fetchChats();
  };

  const toggleStarMessage = async (messageId) => {
    const res = await api.patch(`/message/${messageId}/star`);
    setMessages(prev => prev.map(m => m._id === res.data._id ? res.data : m));
  };

  const addReaction = async (messageId, reaction) => {
    const res = await api.patch(`/message/${messageId}/reaction`, { reaction });
    setMessages(prev => prev.map(m => m._id === res.data._id ? res.data : m));
  };

  const deleteForMeMessage = async (messageId) => {
    await api.delete(`/message/${messageId}/delete-for-me`);
    setMessages(prev => prev.filter(m => m._id !== messageId));
  };

  const forwardMessage = async (messageId, ids, isUserIds = true) => {
    const body = isUserIds ? { userIds: ids } : { chatIds: ids };
    const res = await api.post(`/message/${messageId}/forward`, body);
    // If current chat is one of forwarded chats, append
    const created = res.data.forwarded;
    for (const m of created) {
      if (m.chat._id === (currentChat && currentChat._id)) {
        setMessages(prev => [...prev, m]);
      }
    }
    await fetchChats();
    return created;
  };

  const deleteForEveryoneMessage = async (messageId) => {
    await api.delete(`/message/${messageId}/delete-for-everyone`);
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m));
  };

  const searchUsers = async (query) => {
    const res = await api.get(`/user?search=${encodeURIComponent(query)}`);
    return res.data;
  };

  const createGroup = async (name, users) => {
    const res = await api.post('/chat/group', { name, users: JSON.stringify(users) });
    await fetchChats();
    return res.data;
  };

  const addToGroup = async (chatId, userId) => {
    return (await api.put('/chat/groupadd', { chatId, userId })).data;
  };

  const removeFromGroup = async (chatId, userId) => {
    return (await api.put('/chat/groupremove', { chatId, userId })).data;
  };

  const exitGroup = async (chatId) => {
    const res = await api.put('/chat/exit', { chatId });
    await fetchChats();
    setCurrentChat(null);
    setMessages([]);
    return res.data;
  };

  const deleteGroup = async (chatId) => {
    await api.delete(`/chat/${chatId}`);
    await fetchChats();
    setCurrentChat(null);
    setMessages([]);
  };

  const markMessagesAsRead = (chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('mark messages read', { chatId, userId: user._id });
    }
  };

  const pinChat = async (chatId) => {
    const res = await api.put(`/chat/${chatId}/pin`);
    await fetchChats();
    if (currentChat && currentChat._id === chatId) setCurrentChat(res.data);
    return res.data;
  };

  const value = { chats, fetchChats, currentChat, selectChat, messages, sendMessage, sendMessageWithReply, toggleStarMessage, addReaction, deleteForMeMessage, deleteForEveryoneMessage, forwardMessage, pinChat, replyTo, setReplyTo, searchUsers, createGroup, addToGroup, removeFromGroup, accessChat, typingUsers, setTypingUsers, notifications, setNotifications, exitGroup, deleteGroup, markMessagesAsRead };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
