import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch (e) { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
  }, [token]);
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/user/login', { email, password });
    const data = res.data;
    setUser({ _id: data._id, name: data.name, email: data.email, avatar: data.avatar });
    setToken(data.token);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/user/register', { name, email, password });
    const data = res.data;
    setUser({ _id: data._id, name: data.name, email: data.email, avatar: data.avatar });
    setToken(data.token);
  };

  const logout = () => { setUser(null); setToken(null); };
  const safeLogout = () => { disconnectSocket(); logout(); };

  const value = { user, token, login, register, logout: safeLogout, setToken, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
