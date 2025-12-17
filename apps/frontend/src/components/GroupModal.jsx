import React, { useState, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export default function GroupModal({ onClose }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const { searchUsers, createGroup, selectChat } = useContext(ChatContext);

  const handleSearch = async () => {
    if (!query) setResults([]);
    const res = await searchUsers(query);
    setResults(res);
  };

  const toggleSelect = (u) => {
    if (selected.find(s => s._id === u._id)) setSelected(prev => prev.filter(s => s._id !== u._id));
    else setSelected(prev => [...prev, u]);
  };

  const handleCreate = async () => {
    if (!name || selected.length === 0) return alert('Group name and at least one member required');
    const uids = selected.map(s => s._id);
    const newGroup = await createGroup(name, uids);
    selectChat(newGroup);
    onClose();
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create New Group</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="group-name">Group Name</label>
            <input
              id="group-name"
              placeholder="Enter group name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>Add Members</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Search users by name or email"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ flex: 1 }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn small" onClick={handleSearch}>Search</button>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="selected-users">
              <div className="selected-users-label">Selected ({selected.length})</div>
              <div className="selected-users-list">
                {selected.map(s => (
                  <div key={s._id} className="selected-user-chip">
                    <div className="avatar small" style={{ width: 28, height: 28, fontSize: 12 }}>
                      {s.name[0]?.toUpperCase()}
                    </div>
                    <span>{s.name}</span>
                    <button
                      className="chip-remove"
                      onClick={() => toggleSelect(s)}
                      aria-label="Remove user"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="search-results">
              <div className="search-results-label">Search Results</div>
              <div className="user-list">
                {results.map(u => {
                  const isSelected = selected.find(s => s._id === u._id);
                  return (
                    <div key={u._id} className="user-list-item">
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                        <div className="avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                          <div className="small">{u.email}</div>
                        </div>
                      </div>
                      <button
                        className={`btn small ${isSelected ? 'secondary' : ''}`}
                        onClick={() => toggleSelect(u)}
                      >
                        {isSelected ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn"
            onClick={handleCreate}
            disabled={!name || selected.length === 0}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
