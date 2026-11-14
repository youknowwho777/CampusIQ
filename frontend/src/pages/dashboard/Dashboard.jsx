import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import DashboardLayout from '../../layouts/DashboardLayout';
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
    <DashboardLayout>
      <StudentDashboard />
    </DashboardLayout>
  );
};

export default Dashboard;
