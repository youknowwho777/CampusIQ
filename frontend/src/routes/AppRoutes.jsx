// Main client route table mapping paths to pages and handling protected route boundaries
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import CoursesList from '../pages/courses/CoursesList';
import AttendanceTracker from '../pages/attendance/AttendanceTracker';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import NotFound from '../pages/notfound/NotFound';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication Routes (Public) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Student Experience */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CoursesList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-courses"
          element={
            <Navigate to="/courses" replace />
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AttendanceTracker />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Root Route:
            If user is authenticated -> goes directly to /dashboard
            If user is NOT authenticated -> ProtectedRoute redirects automatically to /login */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
