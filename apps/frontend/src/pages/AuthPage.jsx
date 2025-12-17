import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      navigate('/chat');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#25D366" />
              <path d="M34 14L24 24L14 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 24L24 34L34 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-title">CHAT APP</h1>
          <p className="auth-subtitle">Connect with friends and family</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-card-subtitle">
            {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn auth-submit-btn" type="submit">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="btn secondary auth-toggle-btn" onClick={() => setIsLogin(v => !v)}>
            {isLogin ? 'Create new account' : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="auth-footer">
          <p>© 2025 Chat App. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
