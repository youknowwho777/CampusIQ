// Top header bar matching template: search input with shortcut chip, notifications, and profile avatar
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = ({ onSearch }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const initials = 'ST';

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="campusiq-topbar">
      {/* Search Input Container */}
      <div className="topbar-search-box">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search courses, notes, resources..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="search-shortcut-badge">
          Ctrl + K
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="topbar-actions">
        {/* Notification Bell Button */}
        <button type="button" className="action-circle-btn notification-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="bell-badge-dot"></span>
        </button>

        {/* User Initials Avatar Circle */}
        <div className="action-circle-btn user-avatar-pill" title={user?.name || 'Sophia Thompson'}>
          <span>{initials}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
