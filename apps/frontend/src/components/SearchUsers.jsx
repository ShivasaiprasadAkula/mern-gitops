import React, { useState, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export default function SearchUsers() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { searchUsers, accessChat, selectChat, fetchChats } = useContext(ChatContext);

  const handleSearch = async () => {
    if (!query.trim()) return setResults([]);
    try {
      const users = await searchUsers(query);
      setResults(users);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  };

  const handleStartChat = async (user) => {
    try {
      const chat = await accessChat(user._id);
      await fetchChats(); // Refresh chat list
      selectChat(chat);
      setResults([]); // Clear search results
      setQuery(''); // Clear search query
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="search-users-container">
      <div className="search-users-header">
        <h3>Start New Chat</h3>
      </div>

      <div className="search-users-search">
        <input
          placeholder="Search users by name or email"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn small" onClick={handleSearch}>Search</button>
      </div>

      <div className="search-users-results">
        {results.length > 0 && (
          <div className="search-results-label">Found {results.length} user{results.length !== 1 ? 's' : ''}</div>
        )}
        {results.map(u => (
          <div key={u._id} className="search-user-item">
            <div className="avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
              {u.name[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
              <div className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </div>
            </div>
            <button className="btn small" onClick={() => handleStartChat(u)}>
              Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
