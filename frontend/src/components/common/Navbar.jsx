// Global navigation bar with search bar, notification indicators, user profile avatar, and sign out
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const displayName = user?.name || (user?.role === 'STUDENT' ? 'Sophia Thompson' : 'Prof. Sarah Connor');
  const displayRole = user?.role || (user?.role === 'STUDENT' ? 'STUDENT' : 'TEACHER');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || (user?.role === 'STUDENT' ? 'ST' : 'SC');

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else if (searchTerm.trim()) {
      if (user?.role === 'STUDENT') {
        navigate(`/courses?search=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        navigate(`/teacher/students?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  return (
    <header className="campusiq-navbar campusiq-topbar">
      {/* 1. Pill Search Bar */}
      <form className="navbar-search-wrapper topbar-search-box" onSubmit={handleSearchSubmit}>
        <span className="search-glass-icon search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="navbar-search-input search-input"
          placeholder="Search courses, notes, resources..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <span className="search-shortcut-badge" aria-hidden="true">Ctrl + K</span>
      </form>

      {/* 2. Right Actions: Notifications, Profile & Logout */}
      <div className="navbar-actions-right topbar-actions">
        {/* Notification Bell */}
        <button
          type="button"
          className="btn-icon-nav action-circle-btn notification-btn"
          title="Notifications"
          onClick={() => navigate(user?.role === 'STUDENT' ? '/dashboard' : '/teacher/notifications')}
          aria-label="View notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="badge-alert-dot bell-badge-dot" aria-hidden="true"></span>
        </button>

        {/* User Pill / Avatar */}
        <div
          className="navbar-profile-pill action-circle-btn user-avatar-pill"
          title={`${displayName} (${displayRole})`}
          onClick={() => navigate(user?.role === 'STUDENT' ? '/dashboard' : '/teacher/settings')}
          style={{ cursor: 'pointer' }}
        >
          <span className="navbar-user-initials">{initials}</span>
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
