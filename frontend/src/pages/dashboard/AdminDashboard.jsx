// Institutional Administrator Console for CampusIQ: Student/Teacher Governance, Curriculum, Attendance Analytics, and Announcements
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/admin.service';
import announcementService from '../../services/announcement.service';
import './AdminDashboard.css';

const AdminDashboard = ({ initialTab = 'overview' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Core Data States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('ALL');

  const [courseSearch, setCourseSearch] = useState('');
  const [courseDeptFilter, setCourseDeptFilter] = useState('ALL');

  const [announcementFilterRole, setAnnouncementFilterRole] = useState('ALL');
  const [announcementFilterCategory, setAnnouncementFilterCategory] = useState('ALL');

  // Modal Control States
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    phoneNumber: '',
    rollNumber: '',
    isActive: true
  });

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    phoneNumber: '',
    role: 'TEACHER',
    isActive: true
  });

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    id: null,
    code: '',
    title: '',
    departmentId: '',
    teacherId: '',
    section: 'Sec A',
    credits: 3,
    semester: 3,
    schedule: 'Mon, Wed 10:00 AM',
    room: 'Hall 302'
  });

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    id: null,
    title: '',
    content: '',
    targetRole: 'ALL',
    category: 'GENERAL',
    priority: 'NORMAL',
    isPinned: false
  });

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'student' | 'teacher' | 'course' | 'announcement'
    id: null,
    title: ''
  });

  // Show Toast
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Load of All Data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, teachersRes, coursesRes, deptsRes, attRes, annRes] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        adminService.getStudents().catch(() => ({ data: [] })),
        adminService.getTeachers().catch(() => ({ data: [] })),
        adminService.getCourses().catch(() => ({ data: [] })),
        adminService.getDepartments().catch(() => ({ data: [] })),
        adminService.getAttendanceStats().catch(() => null),
        announcementService.getAll().catch(() => ({ data: [] }))
      ]);

      if (statsRes?.data) setDashboardStats(statsRes.data);
      if (studentsRes?.data) setStudents(studentsRes.data);
      if (teachersRes?.data) setTeachers(teachersRes.data);
      if (coursesRes?.data) setCourses(coursesRes.data);
      if (deptsRes?.data) setDepartments(deptsRes.data);
      if (attRes?.data) setAttendanceData(attRes.data);
      if (annRes?.data) setAnnouncements(annRes.data);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase().trim();
    const matchQuery = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
    const matchDept = studentDeptFilter === 'ALL' || s.department.toLowerCase().includes(studentDeptFilter.toLowerCase());
    const matchStatus = studentStatusFilter === 'ALL' || (studentStatusFilter === 'ACTIVE' ? s.isActive : !s.isActive);
    return matchQuery && matchDept && matchStatus;
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter(t => {
    const q = teacherSearch.toLowerCase().trim();
    const matchQuery = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
    const matchDept = teacherDeptFilter === 'ALL' || t.department.toLowerCase().includes(teacherDeptFilter.toLowerCase());
    return matchQuery && matchDept;
  });

  // Filtered Courses
  const filteredCourses = courses.filter(c => {
    const q = courseSearch.toLowerCase().trim();
    const matchQuery = !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.teacherName.toLowerCase().includes(q);
    const matchDept = courseDeptFilter === 'ALL' || c.departmentName.toLowerCase().includes(courseDeptFilter.toLowerCase());
    return matchQuery && matchDept;
  });

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter(a => {
    const matchRole = announcementFilterRole === 'ALL' || a.targetRole === announcementFilterRole || a.targetRole === 'ALL';
    const matchCategory = announcementFilterCategory === 'ALL' || a.category === announcementFilterCategory;
    return matchRole && matchCategory;
  });

  // ==========================================
  // Student Actions
  // ==========================================
  const handleOpenStudentModal = (student = null) => {
    if (student) {
      setStudentForm({
        id: student.id,
        firstName: student.firstName || student.name.split(' ')[0] || '',
        lastName: student.lastName || student.name.split(' ').slice(1).join(' ') || '',
        email: student.email,
        password: '',
        department: student.department || 'Computer Science & Engineering',
        phoneNumber: student.phoneNumber || '',
        rollNumber: student.rollNumber || '',
        isActive: student.isActive !== undefined ? student.isActive : true
      });
    } else {
      setStudentForm({
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        password: 'Student@123',
        department: 'Computer Science & Engineering',
        phoneNumber: '',
        rollNumber: '',
        isActive: true
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (studentForm.id) {
        await adminService.updateStudent(studentForm.id, studentForm);
        showToast('Student profile updated successfully!');
      } else {
        await adminService.createStudent(studentForm);
        showToast('New student provisioned and enrolled successfully!');
      }
      setIsStudentModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save student.', 'error');
    }
  };

  // ==========================================
  // Teacher Actions
  // ==========================================
  const handleOpenTeacherModal = (teacher = null) => {
    if (teacher) {
      setTeacherForm({
        id: teacher.id,
        firstName: teacher.firstName || teacher.name.split(' ')[0] || '',
        lastName: teacher.lastName || teacher.name.split(' ').slice(1).join(' ') || '',
        email: teacher.email,
        password: '',
        department: teacher.department || 'Computer Science & Engineering',
        phoneNumber: teacher.phoneNumber || '',
        role: teacher.role || 'TEACHER',
        isActive: teacher.isActive !== undefined ? teacher.isActive : true
      });
    } else {
      setTeacherForm({
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        password: 'Teacher@123',
        department: 'Computer Science & Engineering',
        phoneNumber: '',
        role: 'TEACHER',
        isActive: true
      });
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      if (teacherForm.id) {
        await adminService.updateTeacher(teacherForm.id, teacherForm);
        showToast('Faculty profile updated successfully!');
      } else {
        await adminService.createTeacher(teacherForm);
        showToast('Faculty member added successfully!');
      }
      setIsTeacherModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save faculty.', 'error');
    }
  };

  // ==========================================
  // Course / Subject Actions
  // ==========================================
  const handleOpenCourseModal = (course = null) => {
    if (course) {
      setCourseForm({
        id: course.id,
        code: course.code,
        title: course.title,
        departmentId: course.departmentId || '',
        teacherId: course.teacherId || '',
        section: course.section || 'Sec A',
        credits: course.credits || 3,
        semester: course.semester || 3,
        schedule: course.schedule || 'Mon, Wed 10:00 AM',
        room: course.room || 'Hall 302'
      });
    } else {
      setCourseForm({
        id: null,
        code: '',
        title: '',
        departmentId: departments[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        section: 'Sec A',
        credits: 3,
        semester: 3,
        schedule: 'Mon, Wed 10:00 AM',
        room: 'Hall 302'
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      if (courseForm.id) {
        await adminService.updateCourse(courseForm.id, courseForm);
        showToast('Subject / Class updated successfully!');
      } else {
        await adminService.createCourse(courseForm);
        showToast('New Subject / Class allocated successfully!');
      }
      setIsCourseModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save course.', 'error');
    }
  };

  // ==========================================
  // Announcement Actions
  // ==========================================
  const handleOpenAnnouncementModal = (ann = null) => {
    if (ann) {
      setAnnouncementForm({
        id: ann.id,
        title: ann.title,
        content: ann.content,
        targetRole: ann.targetRole || 'ALL',
        category: ann.category || 'GENERAL',
        priority: ann.priority || 'NORMAL',
        isPinned: Boolean(ann.isPinned)
      });
    } else {
      setAnnouncementForm({
        id: null,
        title: '',
        content: '',
        targetRole: 'ALL',
        category: 'GENERAL',
        priority: 'NORMAL',
        isPinned: false
      });
    }
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      if (announcementForm.id) {
        await announcementService.update(announcementForm.id, announcementForm);
        showToast('Announcement updated successfully!');
      } else {
        await announcementService.create(announcementForm);
        showToast('Institutional announcement published successfully!');
      }
      setIsAnnouncementModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement.', 'error');
    }
  };

  const handleTogglePinAnnouncement = async (id) => {
    try {
      await announcementService.togglePin(id);
      showToast('Announcement pin status updated.');
      loadAllData();
    } catch (err) {
      showToast('Failed to update pin status.', 'error');
    }
  };

  // ==========================================
  // Generic Delete Confirmation & Execution
  // ==========================================
  const requestDelete = (type, id, title) => {
    setDeleteConfirm({ isOpen: true, type, id, title });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'student') {
        await adminService.deleteStudent(id);
        showToast('Student deleted successfully.');
      } else if (type === 'teacher') {
        await adminService.deleteTeacher(id);
        showToast('Faculty member removed.');
      } else if (type === 'course') {
        await adminService.deleteCourse(id);
        showToast('Course / Subject deleted.');
      } else if (type === 'announcement') {
        await announcementService.delete(id);
        showToast('Announcement deleted.');
      }
      setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' });
      loadAllData();
    } catch (err) {
      showToast('Deletion failed. Please try again.', 'error');
    }
  };

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const adminName = user?.name || 'Administrator';

  return (
    <DashboardLayout>
      <div className="admin-dashboard-container">
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`admin-toast-banner ${toastMessage.type}`}>
            <span>{toastMessage.message}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. Executive Hero Salutation Banner */}
        <section className="admin-hero-banner">
          <div className="admin-hero-content">
            <span className="admin-hero-greeting">{getGreeting()}, Administrator</span>
            <h1 className="admin-hero-heading">
              <span>{adminName}</span>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.5 7L18.5 8.5L13.5 10L12 15L10.5 10L5.5 8.5L10.5 7L12 2Z" fill="#F59E0B" />
                <path d="M19 15L19.8 17.2L22 18L19.8 18.8L19 21L18.2 18.8L16 18L18.2 17.2L19 15Z" fill="#F59E0B" opacity="0.7" />
              </svg>
            </h1>
            <p className="admin-hero-subtext">
              Institutional Governance Console: Monitor campus enrollment, faculty workload, subjects, campus-wide attendance, and university announcements.
            </p>
          </div>

          <div className="admin-system-status-pill">
            <span className="status-dot-pulse"></span>
            <span>CampusIQ System Online</span>
          </div>
        </section>

        {/* 2. Primary Navigation Tabs */}
        <nav className="admin-nav-tabs" aria-label="Admin Navigation Tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Overview & Analytics</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Students</span>
            <span className="tab-badge-pill">{students.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Faculty & Teachers</span>
            <span className="tab-badge-pill">{teachers.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span>Subjects & Classes</span>
            <span className="tab-badge-pill">{courses.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="m9 16 2 2 4-4" />
            </svg>
            <span>Overall Attendance</span>
            <span className="tab-badge-pill">{dashboardStats?.metrics?.campusAttendanceRate ?? 91.2}%</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Announcements</span>
            <span className="tab-badge-pill">{announcements.length}</span>
          </button>
        </nav>

        {/* 3. Five Top KPI Stat Metric Cards */}
        <section className="admin-metrics-grid">
          {/* Card 1: Total Students */}
          <div className="admin-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon-square green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <span className="metric-change-tag positive">Active</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-number">{dashboardStats?.metrics?.totalStudents ?? students.length}</div>
              <div className="metric-card-label">Enrolled Students</div>
            </div>
            <div className="metric-card-footer">
              <span>{dashboardStats?.metrics?.activeStudents ?? students.length} Active in current session</span>
            </div>
          </div>

          {/* Card 2: Faculty */}
          <div className="admin-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon-square blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="metric-change-tag positive">Faculty</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-number">{dashboardStats?.metrics?.totalTeachers ?? teachers.length}</div>
              <div className="metric-card-label">Teaching Faculty</div>
            </div>
            <div className="metric-card-footer">
              <span>Full-time and adjunct instructors</span>
            </div>
          </div>

          {/* Card 3: Subjects & Classes */}
          <div className="admin-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon-square amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                </svg>
              </div>
              <span className="metric-change-tag">Classes</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-number">{dashboardStats?.metrics?.totalCourses ?? courses.length}</div>
              <div className="metric-card-label">Subjects & Classes</div>
            </div>
            <div className="metric-card-footer">
              <span>Across {departments.length || 1} Departments</span>
            </div>
          </div>

          {/* Card 4: Attendance Rate */}
          <div className="admin-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon-square purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                </svg>
              </div>
              <span className="metric-change-tag positive">Target 75%+</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-number">{dashboardStats?.metrics?.campusAttendanceRate ?? 91.2}%</div>
              <div className="metric-card-label">Campus Attendance</div>
            </div>
            <div className="metric-card-footer">
              <span style={{ color: '#16a34a' }}>Institutional Good Standing</span>
            </div>
          </div>

          {/* Card 5: Announcements */}
          <div className="admin-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon-square coral">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
              </div>
              <span className="metric-change-tag warning">Bulletins</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-number">{dashboardStats?.metrics?.totalAnnouncements ?? announcements.length}</div>
              <div className="metric-card-label">Announcements</div>
            </div>
            <div className="metric-card-footer">
              <span>{announcements.filter(a => a.isPinned).length} Pinned Priority Bulletins</span>
            </div>
          </div>
        </section>

        {/* ========================================================
            TAB 1: OVERVIEW & ANALYTICS
        ======================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Action Launchpad */}
            <div className="admin-card-container" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  Administrative Quick Actions:
                </span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-admin-primary" onClick={() => handleOpenStudentModal()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Student</span>
                  </button>

                  <button type="button" className="btn-admin-secondary" onClick={() => handleOpenTeacherModal()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Teacher</span>
                  </button>

                  <button type="button" className="btn-admin-secondary" onClick={() => handleOpenCourseModal()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Subject / Class</span>
                  </button>

                  <button type="button" className="btn-admin-primary" style={{ background: '#d97706' }} onClick={() => handleOpenAnnouncementModal()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    </svg>
                    <span>Publish Announcement</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split Grid: Attendance Summary & Activities */}
            <div className="admin-overview-grid">
              {/* Left: Overall Attendance Performance by Subject */}
              <div className="attendance-chart-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Course-Wise Attendance Rates
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                      Real-time attendance averages across scheduled classes this semester
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => setActiveTab('attendance')}
                  >
                    Detailed View &rarr;
                  </button>
                </div>

                <div className="attendance-progress-bar-group">
                  {attendanceData?.courseStats?.map((c, idx) => {
                    const color = c.attendanceRate >= 90 ? 'green' : c.attendanceRate >= 80 ? 'blue' : c.attendanceRate >= 75 ? 'amber' : 'coral';
                    return (
                      <div key={c.courseId || idx} className="attendance-subject-row">
                        <div className="att-subject-meta">
                          <span className="att-subject-name">
                            <strong>{c.code}</strong> – {c.title} ({c.section})
                          </span>
                          <span className="att-subject-percent">{c.attendanceRate}%</span>
                        </div>
                        <div className="att-progress-track">
                          <div
                            className={`att-progress-fill ${color}`}
                            style={{ width: `${c.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* At-Risk Students Banner */}
                {attendanceData?.atRiskCount > 0 && (
                  <div className="at-risk-alert-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      <div className="alert-title">
                        Academic Alert: {attendanceData.atRiskCount} Student(s) Below 75% Attendance Threshold
                      </div>
                      <div className="alert-desc">
                        These students require academic counseling to avoid examination debarment.
                        <button
                          type="button"
                          onClick={() => setActiveTab('attendance')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#b45309',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginLeft: '6px',
                            textDecoration: 'underline'
                          }}
                        >
                          Review At-Risk Students
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Recent Activity Log */}
              <div className="activities-feed-card">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Recent Campus Activity
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Latest academic system updates
                </p>

                <div className="activity-feed-list">
                  {dashboardStats?.recentActivities?.map((act) => (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon-bubble">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="activity-text-box">
                        <span className="activity-title">{act.title}</span>
                        <span className="activity-desc">{act.description}</span>
                        <span className="activity-time">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Announcements Strip */}
            <div className="admin-card-container">
              <div className="admin-card-header">
                <div className="header-title-box">
                  <h2>Active Institutional Announcements</h2>
                  <p>Campus notices visible to students and faculty</p>
                </div>
                <button
                  type="button"
                  className="btn-admin-primary"
                  onClick={() => setActiveTab('announcements')}
                >
                  Manage All &rarr;
                </button>
              </div>

              <div className="announcements-cards-grid">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className={`announcement-card ${ann.isPinned ? 'pinned' : ''}`}>
                    {ann.isPinned && (
                      <span className="pinned-banner-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                        PINNED
                      </span>
                    )}
                    <div>
                      <div className="announcement-badges-row">
                        <span className={`announcement-badge badge-role-${ann.targetRole?.toLowerCase() || 'all'}`}>
                          Audience: {ann.targetRole}
                        </span>
                        <span className={`announcement-badge badge-priority-${ann.priority?.toLowerCase() || 'normal'}`}>
                          {ann.priority}
                        </span>
                      </div>
                      <h4 className="announcement-card-title">{ann.title}</h4>
                      <p className="announcement-card-content">{ann.content}</p>
                    </div>

                    <div className="announcement-footer">
                      <div className="announcement-meta-author">
                        <span className="author-name">{ann.authorName}</span>
                        <span className="publish-date">
                          {new Date(ann.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: STUDENT MANAGEMENT (CRUD)
        ======================================================== */}
        {activeTab === 'students' && (
          <div className="admin-card-container">
            <div className="admin-card-header">
              <div className="header-title-box">
                <h2>Enrolled Students Management</h2>
                <p>Provision accounts, manage academic enrollment, and monitor student standing</p>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  className="btn-admin-primary"
                  onClick={() => handleOpenStudentModal()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add New Student</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filters-row">
              <div className="admin-search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search student by name, roll no, email..."
                  className="admin-search-input"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <select
                className="admin-select-filter"
                value={studentDeptFilter}
                onChange={(e) => setStudentDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                <option value="Computer Science">Computer Science & Engineering</option>
              </select>

              <select
                className="admin-select-filter"
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Students Data Table */}
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name & Email</th>
                    <th>Department</th>
                    <th>Enrolled Courses</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span className="table-code-pill">{s.rollNumber}</span>
                        </td>
                        <td>
                          <div className="user-identity-cell">
                            <div className="user-avatar-badge">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="user-name-title">{s.name}</div>
                              <div className="user-subtext-email">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.department}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {s.enrolledCourses?.map((c) => (
                              <span key={c.courseId} className="table-code-pill">
                                {c.code}
                              </span>
                            ))}
                            {(!s.enrolledCourses || s.enrolledCourses.length === 0) && (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>4 Enrolled</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: s.attendanceRate >= 85 ? '#16a34a' : s.attendanceRate >= 75 ? '#d97706' : '#dc2626'
                          }}>
                            {s.attendanceRate}%
                          </span>
                        </td>
                        <td>
                          {s.isActive ? (
                            <span className="table-badge-active">Active</span>
                          ) : (
                            <span className="table-badge-inactive">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-table-action"
                              title="Edit Student"
                              onClick={() => handleOpenStudentModal(s)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-table-action delete"
                              title="Delete Student"
                              onClick={() => requestDelete('student', s.id, s.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: TEACHER MANAGEMENT (CRUD)
        ======================================================== */}
        {activeTab === 'teachers' && (
          <div className="admin-card-container">
            <div className="admin-card-header">
              <div className="header-title-box">
                <h2>Teaching Faculty Directory & Governance</h2>
                <p>Register new academic staff, assign subjects, and manage departmental appointments</p>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  className="btn-admin-primary"
                  onClick={() => handleOpenTeacherModal()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Faculty Member</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filters-row">
              <div className="admin-search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search faculty by name, department, email..."
                  className="admin-search-input"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
              </div>

              <select
                className="admin-select-filter"
                value={teacherDeptFilter}
                onChange={(e) => setTeacherDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                <option value="Computer Science">Computer Science & Engineering</option>
              </select>
            </div>

            {/* Teachers Data Table */}
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Faculty Name & Email</th>
                    <th>Role & Designation</th>
                    <th>Department</th>
                    <th>Assigned Classes</th>
                    <th>Contact Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No faculty members found.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="user-identity-cell">
                            <div className="user-avatar-badge" style={{ background: '#1e40af' }}>
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="user-name-title">{t.name}</div>
                              <div className="user-subtext-email">{t.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: t.role === 'HOD' ? '#b45309' : '#334155' }}>
                            {t.role === 'HOD' ? 'Head of Department' : 'Faculty Instructor'}
                          </span>
                        </td>
                        <td>{t.department}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {t.assignedClasses?.map((c) => (
                              <span key={c.id} className="table-code-pill">
                                {c.code}
                              </span>
                            ))}
                            {(!t.assignedClasses || t.assignedClasses.length === 0) && (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None Assigned</span>
                            )}
                          </div>
                        </td>
                        <td>{t.phoneNumber}</td>
                        <td>
                          {t.isActive ? (
                            <span className="table-badge-active">Active</span>
                          ) : (
                            <span className="table-badge-inactive">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-table-action"
                              title="Edit Faculty"
                              onClick={() => handleOpenTeacherModal(t)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-table-action delete"
                              title="Delete Faculty"
                              onClick={() => requestDelete('teacher', t.id, t.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: SUBJECTS & CLASSES MANAGEMENT (CRUD)
        ======================================================== */}
        {activeTab === 'courses' && (
          <div className="admin-card-container">
            <div className="admin-card-header">
              <div className="header-title-box">
                <h2>Subjects & Curriculum Classes Management</h2>
                <p>Configure course catalog, credits, semester curriculum, and assign teaching faculty</p>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  className="btn-admin-primary"
                  onClick={() => handleOpenCourseModal()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Subject / Class</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filters-row">
              <div className="admin-search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search courses by code, title, instructor..."
                  className="admin-search-input"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>

              <select
                className="admin-select-filter"
                value={courseDeptFilter}
                onChange={(e) => setCourseDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                <option value="Computer Science">Computer Science & Engineering</option>
              </select>
            </div>

            {/* Courses Table */}
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Title</th>
                    <th>Department</th>
                    <th>Instructor</th>
                    <th>Section</th>
                    <th>Credits</th>
                    <th>Semester</th>
                    <th>Schedule & Room</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No courses / subjects found.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="table-code-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                            {c.code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.title}</td>
                        <td>{c.departmentName}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1e40af' }}>{c.teacherName}</span>
                        </td>
                        <td>
                          <span className="table-code-pill">{c.section}</span>
                        </td>
                        <td>{c.credits} Credits</td>
                        <td>Sem {c.semester}</td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            <div>{c.schedule}</div>
                            <div style={{ color: '#94a3b8' }}>{c.room}</div>
                          </div>
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-table-action"
                              title="Edit Course"
                              onClick={() => handleOpenCourseModal(c)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-table-action delete"
                              title="Delete Course"
                              onClick={() => requestDelete('course', c.id, `${c.code} – ${c.title}`)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: OVERALL ATTENDANCE STATISTICS
        ======================================================== */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Cards Row */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <div className="metric-card-top">
                  <div className="metric-icon-square green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    </svg>
                  </div>
                  <span className="metric-change-tag positive">Safe</span>
                </div>
                <div className="metric-card-body">
                  <div className="metric-card-number">{attendanceData?.overallPercentage ?? 91.2}%</div>
                  <div className="metric-card-label">Campus-Wide Attendance</div>
                </div>
                <div className="metric-card-footer">
                  <span>Minimum Required Threshold: 75%</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-card-top">
                  <div className="metric-icon-square blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="metric-change-tag positive">Present</span>
                </div>
                <div className="metric-card-body">
                  <div className="metric-card-number">{attendanceData?.distribution?.present ?? 146}</div>
                  <div className="metric-card-label">Present Attendances</div>
                </div>
                <div className="metric-card-footer">
                  <span>Across {attendanceData?.totalSessionsRecorded ?? 160} Total Sessions</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-card-top">
                  <div className="metric-icon-square amber">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <span className="metric-change-tag warning">Late</span>
                </div>
                <div className="metric-card-body">
                  <div className="metric-card-number">{attendanceData?.distribution?.late ?? 4}</div>
                  <div className="metric-card-label">Late Arrivals</div>
                </div>
                <div className="metric-card-footer">
                  <span>Within grace period</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-card-top">
                  <div className="metric-icon-square coral">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <span className="metric-change-tag alert">Absent</span>
                </div>
                <div className="metric-card-body">
                  <div className="metric-card-number">{attendanceData?.distribution?.absent ?? 10}</div>
                  <div className="metric-card-label">Unexcused Absences</div>
                </div>
                <div className="metric-card-footer">
                  <span>Requiring medical explanation</span>
                </div>
              </div>
            </div>

            {/* Split Section: Course Breakdown & At-Risk Roster */}
            <div className="admin-overview-grid">
              {/* Left: Course-wise Attendance */}
              <div className="admin-card-container">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Course-wise Attendance Statistics
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Aggregated presence rate per subject
                </p>

                <div className="admin-table-wrapper" style={{ marginTop: '16px' }}>
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Subject Title</th>
                        <th>Section</th>
                        <th>Attendance Rate</th>
                        <th>Standing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.courseStats?.map((c) => (
                        <tr key={c.courseId}>
                          <td><span className="table-code-pill">{c.code}</span></td>
                          <td style={{ fontWeight: 600 }}>{c.title}</td>
                          <td>{c.section}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '80px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${c.attendanceRate}%`,
                                  height: '100%',
                                  background: c.attendanceRate >= 85 ? '#10b981' : c.attendanceRate >= 75 ? '#f59e0b' : '#ef4444'
                                }}></div>
                              </div>
                              <span style={{ fontWeight: 700 }}>{c.attendanceRate}%</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: c.attendanceRate >= 85 ? '#dcfce7' : c.attendanceRate >= 75 ? '#fef3c7' : '#fee2e2',
                              color: c.attendanceRate >= 85 ? '#166534' : c.attendanceRate >= 75 ? '#b45309' : '#991b1b'
                            }}>
                              {c.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Students At Risk of Low Attendance */}
              <div className="admin-card-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  </svg>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    At-Risk Students (&lt; 75%)
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Students flagged for low attendance warning letters
                </p>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {attendanceData?.atRiskStudents?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#16a34a', fontWeight: 600 }}>
                      No students currently below the 75% attendance threshold!
                    </div>
                  ) : (
                    attendanceData?.atRiskStudents?.map((st) => (
                      <div
                        key={st.studentId}
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.88rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.76rem', color: '#78350f' }}>{st.rollNumber} • {st.email}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                            {st.attendanceRate}%
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#b45309' }}>Shortfall: -{st.shortfall}%</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Daily Attendance Trend */}
            <div className="admin-card-container">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Campus Attendance Logs (Past 7 Days)
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Daily aggregation of presence across all academic lectures
              </p>

              <div className="admin-table-wrapper" style={{ marginTop: '14px' }}>
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Present Count</th>
                      <th>Absent Count</th>
                      <th>Late Count</th>
                      <th>Daily Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData?.dailyTrend?.map((day) => (
                      <tr key={day.date}>
                        <td style={{ fontWeight: 600 }}>{day.date}</td>
                        <td style={{ color: '#16a34a', fontWeight: 700 }}>{day.present}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{day.absent}</td>
                        <td style={{ color: '#d97706', fontWeight: 700 }}>{day.late}</td>
                        <td style={{ fontWeight: 800 }}>{day.percentage}%</td>
                        <td>
                          <span className="table-badge-active">Recorded</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: ANNOUNCEMENTS MANAGEMENT (CRUD)
        ======================================================== */}
        {activeTab === 'announcements' && (
          <div className="admin-card-container">
            <div className="admin-card-header">
              <div className="header-title-box">
                <h2>Campus Bulletins & Announcements Management</h2>
                <p>Broadcast institutional news, exam timetables, emergency alerts, and circulars to campus stakeholders</p>
              </div>
              <div className="admin-header-actions">
                <button
                  type="button"
                  className="btn-admin-primary"
                  onClick={() => handleOpenAnnouncementModal()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create Announcement</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filters-row">
              <select
                className="admin-select-filter"
                value={announcementFilterRole}
                onChange={(e) => setAnnouncementFilterRole(e.target.value)}
              >
                <option value="ALL">All Target Audiences</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Faculty Only</option>
              </select>

              <select
                className="admin-select-filter"
                value={announcementFilterCategory}
                onChange={(e) => setAnnouncementFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="EXAM">Examination</option>
                <option value="ACADEMIC">Academic</option>
                <option value="EVENT">Campus Events</option>
                <option value="GENERAL">General Notice</option>
              </select>
            </div>

            {/* Announcements Grid */}
            <div className="announcements-cards-grid">
              {filteredAnnouncements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', gridColumn: '1 / -1' }}>
                  No announcements found matching current filters. Click "Create Announcement" to post a bulletin.
                </div>
              ) : (
                filteredAnnouncements.map((ann) => (
                  <div key={ann.id} className={`announcement-card ${ann.isPinned ? 'pinned' : ''}`}>
                    {ann.isPinned && (
                      <span className="pinned-banner-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                        PINNED
                      </span>
                    )}

                    <div>
                      <div className="announcement-badges-row">
                        <span className={`announcement-badge badge-role-${ann.targetRole?.toLowerCase() || 'all'}`}>
                          {ann.targetRole}
                        </span>
                        <span className={`announcement-badge badge-priority-${ann.priority?.toLowerCase() || 'normal'}`}>
                          {ann.priority}
                        </span>
                        <span className="announcement-badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                          {ann.category}
                        </span>
                      </div>

                      <h3 className="announcement-card-title">{ann.title}</h3>
                      <p className="announcement-card-content">{ann.content}</p>
                    </div>

                    <div className="announcement-footer">
                      <div className="announcement-meta-author">
                        <span className="author-name">{ann.authorName}</span>
                        <span className="publish-date">
                          {new Date(ann.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="announcement-actions">
                        <button
                          type="button"
                          className="btn-table-action"
                          title={ann.isPinned ? 'Unpin Announcement' : 'Pin to Top'}
                          onClick={() => handleTogglePinAnnouncement(ann.id)}
                        >
                          {ann.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          type="button"
                          className="btn-table-action"
                          title="Edit Announcement"
                          onClick={() => handleOpenAnnouncementModal(ann)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-table-action delete"
                          title="Delete Announcement"
                          onClick={() => requestDelete('announcement', ann.id, ann.title)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            MODALS SECTION
        ======================================================== */}

        {/* 1. Student Add / Edit Modal */}
        {isStudentModalOpen && (
          <div className="modal-overlay" onClick={() => setIsStudentModalOpen(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{studentForm.id ? 'Edit Student Profile' : 'Add New Student'}</h3>
                <button type="button" className="btn-close-modal" onClick={() => setIsStudentModalOpen(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveStudent}>
                <div className="modal-body">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={studentForm.firstName}
                        onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={studentForm.lastName}
                        onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institutional Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    />
                  </div>

                  {!studentForm.id && (
                    <div className="form-group">
                      <label className="form-label">Temporary Password *</label>
                      <input
                        type="password"
                        required
                        className="form-input"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">Roll Number</label>
                      <input
                        type="text"
                        placeholder="e.g. CS2026101"
                        className="form-input"
                        value={studentForm.rollNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1-555-0100"
                        className="form-input"
                        value={studentForm.phoneNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={studentForm.isActive}
                        onChange={(e) => setStudentForm({ ...studentForm, isActive: e.target.checked })}
                      />
                      <span>Active Enrollment Status</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsStudentModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    {studentForm.id ? 'Save Changes' : 'Create Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Teacher Add / Edit Modal */}
        {isTeacherModalOpen && (
          <div className="modal-overlay" onClick={() => setIsTeacherModalOpen(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{teacherForm.id ? 'Edit Faculty Profile' : 'Add Faculty Member'}</h3>
                <button type="button" className="btn-close-modal" onClick={() => setIsTeacherModalOpen(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveTeacher}>
                <div className="modal-body">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={teacherForm.firstName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={teacherForm.lastName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institutional Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    />
                  </div>

                  {!teacherForm.id && (
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        required
                        className="form-input"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        value={teacherForm.role}
                        onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value })}
                      >
                        <option value="TEACHER">Faculty Instructor</option>
                        <option value="HOD">Head of Department (HOD)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1-555-0101"
                        className="form-input"
                        value={teacherForm.phoneNumber}
                        onChange={(e) => setTeacherForm({ ...teacherForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={teacherForm.department}
                      onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={teacherForm.isActive}
                        onChange={(e) => setTeacherForm({ ...teacherForm, isActive: e.target.checked })}
                      />
                      <span>Active Faculty Status</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsTeacherModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    {teacherForm.id ? 'Save Changes' : 'Create Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Course / Subject Add / Edit Modal */}
        {isCourseModalOpen && (
          <div className="modal-overlay" onClick={() => setIsCourseModalOpen(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{courseForm.id ? 'Edit Subject / Class' : 'Add Subject / Class'}</h3>
                <button type="button" className="btn-close-modal" onClick={() => setIsCourseModalOpen(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveCourse}>
                <div className="modal-body">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">Course Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS209"
                        className="form-input"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section</label>
                      <input
                        type="text"
                        placeholder="Sec A"
                        className="form-input"
                        value={courseForm.section}
                        onChange={(e) => setCourseForm({ ...courseForm, section: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Networks"
                      className="form-input"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">Assigned Instructor</label>
                      <select
                        className="form-select"
                        value={courseForm.teacherId}
                        onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.department})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        className="form-input"
                        value={courseForm.credits}
                        onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value, 10) || 3 })}
                      />
                    </div>
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="form-input"
                        value={courseForm.semester}
                        onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value, 10) || 1 })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Room</label>
                      <input
                        type="text"
                        placeholder="Hall 302"
                        className="form-input"
                        value={courseForm.room}
                        onChange={(e) => setCourseForm({ ...courseForm, room: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weekly Schedule</label>
                    <input
                      type="text"
                      placeholder="Mon, Wed 09:00 - 10:30 AM"
                      className="form-input"
                      value={courseForm.schedule}
                      onChange={(e) => setCourseForm({ ...courseForm, schedule: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsCourseModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    {courseForm.id ? 'Save Changes' : 'Create Subject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Announcement Add / Edit Modal */}
        {isAnnouncementModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAnnouncementModalOpen(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{announcementForm.id ? 'Edit Announcement' : 'Publish New Announcement'}</h3>
                <button type="button" className="btn-close-modal" onClick={() => setIsAnnouncementModalOpen(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveAnnouncement}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Announcement Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midterm Examination Timetable Released"
                      className="form-input"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label className="form-label">Target Audience</label>
                      <select
                        className="form-select"
                        value={announcementForm.targetRole}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, targetRole: e.target.value })}
                      >
                        <option value="ALL">All Campus Stakeholders</option>
                        <option value="STUDENT">Students Only</option>
                        <option value="TEACHER">Faculty Only</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={announcementForm.priority}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High Priority</option>
                        <option value="URGENT">Urgent / Alert</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={announcementForm.category}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                    >
                      <option value="GENERAL">General Bulletin</option>
                      <option value="ACADEMIC">Academic / Syllabus</option>
                      <option value="EXAM">Examination & Schedules</option>
                      <option value="EVENT">University Event</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content / Message Body *</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Type official notification message here..."
                      className="form-textarea"
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={announcementForm.isPinned}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, isPinned: e.target.checked })}
                      />
                      <span>Pin this bulletin to the top of all user dashboards</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsAnnouncementModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    {announcementForm.id ? 'Save Changes' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. Generic Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' })}>
            <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ color: '#dc2626' }}>Confirm Deletion</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' })}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                  Are you sure you want to permanently delete <strong>{deleteConfirm.title}</strong>?
                </p>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  This action cannot be undone and will cascade to all associated records.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-confirm danger"
                  onClick={handleConfirmDelete}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
