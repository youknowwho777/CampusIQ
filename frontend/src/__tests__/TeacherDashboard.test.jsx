import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import TeacherDashboard from '../pages/dashboard/TeacherDashboard';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import CoursesList from '../pages/courses/CoursesList';
import AttendanceTracker from '../pages/attendance/AttendanceTracker';
import MarksEntry from '../pages/marks/MarksEntry';

// Mock teacherService and attendance/marks services
vi.mock('../services/teacher.service', () => ({
  default: {
    getDashboardStats: vi.fn().mockResolvedValue({
      success: true,
      data: {
        assignedClassesCount: 4,
        totalStudentsCount: 142,
        attendanceSessionsCount: 28,
        averageAttendanceRate: 91.5,
        pendingMarksCount: 3,
        assignedClasses: [
          {
            id: 'e0000000-0000-0000-0000-000000000001',
            code: 'CS201',
            title: 'Data Structures & Algorithms',
            section: 'Sec A',
            studentCount: 38,
            attendanceRate: 88
          },
          {
            id: 'e0000000-0000-0000-0000-000000000002',
            code: 'CS203',
            title: 'Database Management Systems',
            section: 'Sec B',
            studentCount: 42,
            attendanceRate: 92
          }
        ],
        upcomingTasks: [
          {
            id: 'task-1',
            title: 'DBMS Assignment 2 – Query Optimization',
            dueDateText: 'Due: Today, 11:59 PM',
            statusTag: 'Due Today'
          }
        ]
      }
    }),
    getAssignedClasses: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: '1', code: 'CS201', title: 'Data Structures & Algorithms', section: 'Sec A', credits: 4, semester: 3, studentCount: 38, attendanceRate: 88 },
        { id: '2', code: 'CS203', title: 'Database Management Systems', section: 'Sec B', credits: 4, semester: 3, studentCount: 42, attendanceRate: 92 }
      ]
    }),
    getStudents: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: 's1', name: 'Alex Johnson', rollNumber: 'CS2024001', email: 'alex@campusiq.edu', overallAttendanceRate: 94 }
      ]
    })
  }
}));

vi.mock('../services/attendance.service', () => ({
  default: {
    getCourseAttendance: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { studentId: 's1', name: 'Alex Johnson', rollNumber: 'CS2024001', status: 'PRESENT', historicalAttendanceRate: 92 }
      ]
    }),
    submitBatchAttendance: vi.fn().mockResolvedValue({ success: true }),
    getCourseHistory: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}));

vi.mock('../services/marks.service', () => ({
  default: {
    getCourseMarks: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { studentId: 's1', name: 'Alex Johnson', rollNumber: 'CS2024001', scoreObtained: 85, maximumScore: 100 }
      ]
    }),
    submitBatchMarks: vi.fn().mockResolvedValue({ success: true }),
    getCourseAssessments: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CampusIQ Person 3: Teacher Frontend Test Suite', () => {
  it('1. Teacher Dashboard: Renders personalized greeting banner and subtitle', () => {
    renderWithProviders(<TeacherDashboard />);
    expect(screen.getByText(/teaching & academic snapshot/i)).toBeDefined();
  });

  it('2. Teacher Dashboard: Displays 4 summary metrics cards', () => {
    renderWithProviders(<TeacherDashboard />);
    expect(screen.getByText('Assigned Classes')).toBeDefined();
    expect(screen.getByText('Total Students')).toBeDefined();
    expect(screen.getByText('Attendance Rate')).toBeDefined();
    expect(screen.getByText('Pending Tasks')).toBeDefined();
  });

  it('3. Sidebar Navigation: Renders brand, profile, and all navigation links', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getAllByText(/Campus/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Smart Academic Platform/i)).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('My Classes')).toBeDefined();
    expect(screen.getByText('Students')).toBeDefined();
    expect(screen.getByText('Attendance')).toBeDefined();
    expect(screen.getByText('Marks & Grades')).toBeDefined();
    expect(screen.getByText('Assignments')).toBeDefined();
    expect(screen.getByText('Study Materials')).toBeDefined();
    expect(screen.getByText('AI & Analytics')).toBeDefined();
    expect(screen.getByText('OCR Documents')).toBeDefined();
    expect(screen.getByText('Notifications')).toBeDefined();
    expect(screen.getByText('Reports')).toBeDefined();
    expect(screen.getByText('Help & Support')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('4. Navbar: Renders search input, shortcuts, and action buttons', () => {
    renderWithProviders(<Navbar />);
    const searchInput = screen.getByPlaceholderText(/search courses, notes, resources/i);
    expect(searchInput).toBeDefined();
    expect(screen.getByText('Ctrl + K')).toBeDefined();
    expect(screen.getByText('Sign Out')).toBeDefined();
  });

  it('5. Teacher Dashboard: Displays quick action buttons', () => {
    renderWithProviders(<TeacherDashboard />);
    expect(screen.getByText('Take Attendance Now')).toBeDefined();
    expect(screen.getByText('Record Exam Marks')).toBeDefined();
    expect(screen.getByText('Create Assignment')).toBeDefined();
    expect(screen.getByText('Upload Notes')).toBeDefined();
  });

  it('6. My Classes Page: Renders assigned classes list and search bar', () => {
    renderWithProviders(<CoursesList />);
    expect(screen.getByText('My Assigned Classes')).toBeDefined();
    expect(screen.getByPlaceholderText(/search classes/i)).toBeDefined();
  });

  it('7. Attendance Tracker: Renders class selector, date input, and action buttons', () => {
    renderWithProviders(<AttendanceTracker />);
    expect(screen.getByText('Attendance Management')).toBeDefined();
    expect(screen.getByText('Session Date')).toBeDefined();
    expect(screen.getByText('✓ Mark All Present')).toBeDefined();
    expect(screen.getByText('✕ Mark All Absent')).toBeDefined();
  });

  it('8. Marks & Grades Entry: Renders assessment selector, max marks input, and analytics', () => {
    renderWithProviders(<MarksEntry />);
    expect(screen.getByText('Marks & Grades Management')).toBeDefined();
    expect(screen.getByText('Assessment Type')).toBeDefined();
    expect(screen.getByText('Maximum Marks')).toBeDefined();
    expect(screen.getByText('Class Average')).toBeDefined();
  });
});
