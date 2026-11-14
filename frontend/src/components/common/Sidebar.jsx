// Navigation sidebar component with student navigation, user profile, and session logout
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const studentName = user?.name || 'Sophia Thompson';
  const departmentMeta = `${user?.department || 'CSE'} • ${user?.year || '2nd Year'}`;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  return (
    <aside className="campusiq-sidebar">
      {/* 1. Brand Logo Header */}
      <div className="sidebar-brand-section">
        <div className="brand-cap-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="#F59E0B" />
            <path d="M5 13.18V17C5 19.21 8.13 21 12 21C15.87 21 19 19.21 19 17V13.18L12 17L5 13.18Z" fill="#F59E0B" opacity="0.8" />
          </svg>
        </div>
        <div className="brand-text-wrap">
          <span className="brand-primary-name">Campus<strong>IQ</strong></span>
          <span className="brand-platform-tag">Smart Academic Platform</span>
        </div>
      </div>

      {/* 2. User Profile Card with Dropdown */}
      <div className="sidebar-user-card-wrapper">
        <div
          className="sidebar-user-card"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title="Click to view profile options or log out"
        >
          <div className="user-avatar-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="user-details-box">
            <div className="user-full-name">{studentName}</div>
            <div className="user-role-meta">{departmentMeta}</div>
          </div>
          <div className={`user-chevron ${showProfileMenu ? 'open' : ''}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Profile Dropdown */}
        {showProfileMenu && (
          <div className="user-dropdown-popover">
            <div className="user-popover-info">
              <span className="popover-name">{studentName}</span>
              <span className="popover-email">{user?.email || 'sophia.m@campusiq.edu'}</span>
              <span className="popover-role">Role: Enrolled Student</span>
            </div>
            <div className="popover-divider"></div>
            <button type="button" className="popover-btn logout" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out & Switch Account</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Navigation Links */}
      <nav className="sidebar-nav">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={`nav-link-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="nav-item-label">Dashboard</span>
        </NavLink>

        {/* My Courses */}
        <NavLink
          to="/courses"
          className={`nav-link-item ${isActive('/courses') ? 'active' : ''}`}
        >
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span className="nav-item-label">My Courses</span>
        </NavLink>

        {/* Attendance */}
        <NavLink
          to="/attendance"
          className={`nav-link-item ${isActive('/attendance') ? 'active' : ''}`}
        >
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </span>
          <span className="nav-item-label">Attendance</span>
        </NavLink>

        {/* Grades & Records */}
        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span className="nav-item-label">Grades & Records</span>
        </div>

        {/* Assignments */}
        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </span>
          <span className="nav-item-label">Assignments</span>
        </div>

        {/* Resources */}
        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </span>
          <span className="nav-item-label">Resources</span>
        </div>

        {/* Smart Tools Section */}
        <div className="nav-group-header">Smart Tools</div>

        <div className="nav-link-item coming-soon has-submenu">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
          </span>
          <span className="nav-item-label">AI & Analytics</span>
          <svg className="submenu-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </span>
          <span className="nav-item-label">OCR Documents</span>
        </div>

        {/* Secondary Nav Features */}
        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="nav-item-label">Notifications</span>
          <span className="nav-badge-dot" aria-label="Unread updates"></span>
        </div>

        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <span className="nav-item-label">Reports</span>
        </div>

        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <span className="nav-item-label">Help & Support</span>
        </div>

        <div className="nav-link-item coming-soon">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="nav-item-label">Settings</span>
        </div>

        {/* Explicit Log Out Link */}
        <div className="nav-link-item logout-link-item" onClick={handleLogout} title="Sign out and return to Login screen">
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="nav-item-label">Log Out</span>
        </div>
      </nav>

      {/* 4. Campus Building Silhouette Bottom Decoration */}
      <div className="sidebar-footer-backdrop" aria-hidden="true">
        <svg className="campus-silhouette-svg" viewBox="0 0 240 60" fill="currentColor">
          <path d="M10 60V30H25V60H35V20H55V60H65V35H80V60H120V15L135 5L150 15V60H160V32H175V60H185V24H205V60H215V38H230V60H10Z" />
          <rect x="42" y="28" width="6" height="8" fill="#041d16" />
          <rect x="130" y="22" width="10" height="12" fill="#041d16" />
          <rect x="192" y="32" width="6" height="8" fill="#041d16" />
        </svg>
        <div className="sidebar-version-tag">CampusIQ • Academic Edition</div>
      </div>
    </aside>
  );
};

export default Sidebar;
