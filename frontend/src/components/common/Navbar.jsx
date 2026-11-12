// Global navigation bar with search bar, notification indicators, user profile pill, and logout
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const displayName = user?.name || 'Prof. Sarah Connor';
  const displayRole = user?.role || 'TEACHER';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SC';

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/teacher/students?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="campusiq-navbar">
      {/* 1. Pill Search Bar */}
      <form className="navbar-search-wrapper" onSubmit={handleSearchSubmit}>
        <span className="search-glass-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search courses, notes, resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="search-shortcut-badge" aria-hidden="true">Ctrl + K</span>
      </form>

      {/* 2. Right Actions: Notifications & User Profile */}
      <div className="navbar-actions-right">
        {/* Notification Bell */}
        <button
          type="button"
          className="btn-icon-nav"
          title="Notifications"
          onClick={() => navigate('/teacher/notifications')}
          aria-label="View notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="badge-alert-dot" aria-hidden="true"></span>
        </button>

        {/* User Pill */}
        <div className="navbar-profile-pill" onClick={() => navigate('/teacher/settings')}>
          <div className="navbar-user-initials">{initials}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{displayName}</span>
            <span className="navbar-user-role">{displayRole}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          className="btn-navbar-logout"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
