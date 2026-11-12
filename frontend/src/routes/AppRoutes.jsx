// Main client route table mapping paths to pages and handling protected route boundaries
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Dashboard & Role Pages
import Dashboard from '../pages/dashboard/Dashboard';
import TeacherDashboard from '../pages/dashboard/TeacherDashboard';
import CoursesList from '../pages/courses/CoursesList';
import CourseDetails from '../pages/courses/CourseDetails';
import StudentsList from '../pages/students/StudentsList';
import AttendanceTracker from '../pages/attendance/AttendanceTracker';
import MarksEntry from '../pages/marks/MarksEntry';
import AssignmentList from '../pages/assignments/AssignmentList';
import StudyMaterials from '../pages/materials/StudyMaterials';
import NotFound from '../pages/notfound/NotFound';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Generic Dashboard Landing (Role Aware) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher Module Dedicated Routes (Guarded for TEACHER, HOD, ADMIN) */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <CoursesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <StudentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <AttendanceTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/marks"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <MarksEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <AssignmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/materials"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD', 'ADMIN']}>
              <StudyMaterials />
            </ProtectedRoute>
          }
        />

        {/* Fallback & Not Found */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
