import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TeacherDashboard from './TeacherDashboard';
import './Dashboard.css';

/**
 * Dashboard Page
 * Role-aware post-authentication landing view.
 * If authenticated user is a TEACHER or faculty, renders TeacherDashboard.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setUser, setToken } = useAuth();

  const handleLogout = () => {
    if (setUser) setUser(null);
    if (setToken) setToken(null);
    localStorage.removeItem('campusiq_token');
    localStorage.removeItem('campusiq_user');
    navigate('/login');
  };

  const displayName = user?.name || 'Academic User';
  const displayRole = (user?.role || 'STUDENT').toUpperCase();

  // If authenticated user is a Teacher, direct them to TeacherDashboard
  if (displayRole === 'TEACHER' || displayRole === 'FACULTY' || displayRole === 'HOD') {
    return <TeacherDashboard />;
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <path d="M24 6L4 17L24 28L44 17L24 6Z" fill="#F59E0B" />
            <path d="M10 21.5V31C10 35.5 16.2 39 24 39C31.8 39 38 35.5 38 31V21.5" stroke="#F59E0B" strokeWidth="2.5" />
          </svg>
          <span className="brand-logo-text">Campus<strong>IQ</strong></span>
        </div>

        <div className="dashboard-user-bar">
          <span className={`role-badge ${displayRole.toLowerCase()}`}>
            {displayRole}
          </span>
          <span className="user-name">{displayName}</span>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="welcome-banner">
          <h1>Welcome, {displayName}!</h1>
          <p>You have successfully logged in to the CampusIQ Academic Management Platform.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Attendance Rate</h3>
            <p className="stat-value">94.5%</p>
            <span className="stat-status good">On Track</span>
          </div>

          <div className="stat-card">
            <h3>Current CGPA</h3>
            <p className="stat-value">3.82</p>
            <span className="stat-status good">Dean's List</span>
          </div>

          <div className="stat-card">
            <h3>Enrolled Courses</h3>
            <p className="stat-value">6</p>
            <span className="stat-status info">Fall Semester 2026</span>
          </div>

          <div className="stat-card">
            <h3>Pending Tasks</h3>
            <p className="stat-value">2</p>
            <span className="stat-status warning">Due This Week</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
