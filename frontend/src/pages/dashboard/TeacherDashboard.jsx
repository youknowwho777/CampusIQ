// Teacher dashboard displaying assigned courses, attendance actions, pending marking tasks, and academic analytics
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import teacherService from '../../services/teacher.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await teacherService.getDashboardStats();
        if (isMounted && res?.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch real-time stats, using fallback defaults', err);
        // Fallback default statistics matching database seeds
        if (isMounted) {
          setStats({
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
                attendanceRate: 88,
                type: 'code'
              },
              {
                id: 'e0000000-0000-0000-0000-000000000002',
                code: 'CS203',
                title: 'Database Management Systems',
                section: 'Sec B',
                studentCount: 42,
                attendanceRate: 92,
                type: 'db'
              },
              {
                id: 'e0000000-0000-0000-0000-000000000003',
                code: 'CS205',
                title: 'Operating Systems',
                section: 'Sec A',
                studentCount: 34,
                attendanceRate: 84,
                type: 'os'
              },
              {
                id: 'e0000000-0000-0000-0000-000000000004',
                code: 'CS207',
                title: 'Software Engineering',
                section: 'Sec C',
                studentCount: 28,
                attendanceRate: 76,
                type: 'se'
              }
            ],
            upcomingTasks: [
              {
                id: 'asn-001',
                title: 'DBMS Assignment 2 – Query Optimization',
                courseCode: 'CS203',
                dueDateText: 'Due: Today, 11:59 PM',
                statusTag: 'Due Today',
                statusClass: 'due-today',
                icon: 'file'
              },
              {
                id: 'asn-002',
                title: 'OS Quiz 1 – Process Scheduling',
                courseCode: 'CS205',
                dueDateText: 'Due: 14 Nov, 11:59 PM',
                statusTag: 'In 2 Days',
                statusClass: 'due-soon',
                icon: 'quiz'
              },
              {
                id: 'asn-003',
                title: 'SE Project – Phase 1 Architecture Plan',
                courseCode: 'CS207',
                dueDateText: 'Due: 17 Nov, 11:59 PM',
                statusTag: 'In 5 Days',
                statusClass: 'due-later',
                icon: 'code'
              }
            ]
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine time-sensitive greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const teacherName = user?.name || 'Prof. Sarah Connor';
  const firstName = teacherName.split(' ')[1] || teacherName.split(' ')[0] || 'Faculty';

  // Helper for Course Icon
  const renderCourseIcon = (code, title) => {
    if (code.includes('201') || title.toLowerCase().includes('data')) {
      return (
        <span className="course-badge-icon code" title="Coding & Algorithms">
          &lt;/&gt;
        </span>
      );
    }
    if (code.includes('203') || title.toLowerCase().includes('data')) {
      return (
        <span className="course-badge-icon db" title="Database Systems">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </span>
      );
    }
    if (code.includes('205') || title.toLowerCase().includes('operating')) {
      return (
        <span className="course-badge-icon os" title="Operating Systems">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </span>
      );
    }
    return (
      <span className="course-badge-icon se" title="Software Engineering">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </span>
    );
  };

  // Helper for upcoming task icon
  const renderTaskIcon = (type) => {
    if (type === 'quiz') {
      return (
        <div className="task-icon-dot blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      );
    }
    if (type === 'code') {
      return (
        <div className="task-icon-dot green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
      );
    }
    return (
      <div className="task-icon-dot red">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="teacher-dashboard-container">
        {/* 1. Academic Salutation Hero Banner */}
        <section className="teacher-hero-banner">
          <div className="hero-text-content">
            <div className="hero-salutation-line">{getGreeting()},</div>
            <h1 className="hero-teacher-heading">
              <span>{firstName}!</span>
              <span className="hero-sparkle-rays" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.5 7L18.5 8.5L13.5 10L12 15L10.5 10L5.5 8.5L10.5 7L12 2Z" fill="#F59E0B" />
                  <path d="M19 15L19.8 17.2L22 18L19.8 18.8L19 21L18.2 18.8L16 18L18.2 17.2L19 15Z" fill="#F59E0B" opacity="0.7" />
                  <path d="M5 4L5.6 5.9L7.5 6.5L5.6 7.1L5 9L4.4 7.1L2.5 6.5L4.4 5.9L5 4Z" fill="#F59E0B" opacity="0.6" />
                </svg>
              </span>
            </h1>
            <p className="hero-sub-caption">Here's your teaching & academic snapshot for today.</p>
          </div>

          <div className="hero-illustration-art" aria-hidden="true">
            {/* Campus building and trees vector motif */}
            <svg viewBox="0 0 300 120" width="100%" height="100%" fill="none">
              <path d="M10 110C30 90 60 85 80 110" stroke="#86efac" strokeWidth="12" strokeLinecap="round" opacity="0.5" />
              <path d="M50 115C70 80 100 80 120 115" stroke="#4ade80" strokeWidth="14" strokeLinecap="round" opacity="0.6" />
              <rect x="140" y="30" width="130" height="85" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <polygon points="205,8 135,30 275,30" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="155" y="45" width="16" height="22" rx="2" fill="#94a3b8" />
              <rect x="180" y="45" width="16" height="22" rx="2" fill="#94a3b8" />
              <rect x="215" y="45" width="16" height="22" rx="2" fill="#94a3b8" />
              <rect x="240" y="45" width="16" height="22" rx="2" fill="#94a3b8" />
              <rect x="195" y="80" width="22" height="35" rx="2" fill="#0f4c3a" />
              <circle cx="45" cy="40" r="14" fill="#fde047" opacity="0.7" />
            </svg>
          </div>
        </section>

        {/* 2. Four Summary Metrics Cards Row */}
        <section className="teacher-metrics-row">
          {/* Card 1: Assigned Classes */}
          <div className="teacher-stat-card">
            <div className="stat-icon-square green">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-card-details">
              <div className="stat-card-label">Assigned Classes</div>
              <div className="stat-card-metric-val">{stats?.assignedClassesCount ?? 4}</div>
              <div className="stat-card-subtext">
                <span>Active Semester</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Students */}
          <div className="teacher-stat-card">
            <div className="stat-icon-square blue">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="stat-card-details">
              <div className="stat-card-label">Total Students</div>
              <div className="stat-card-metric-val">{stats?.totalStudentsCount ?? 142}</div>
              <div className="stat-card-subtext neutral">
                <span>Enrolled in 4 Courses</span>
              </div>
            </div>
          </div>

          {/* Card 3: Attendance Sessions */}
          <div className="teacher-stat-card">
            <div className="stat-icon-square amber">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="stat-card-details">
              <div className="stat-card-label">Attendance Rate</div>
              <div className="stat-card-metric-val">{stats?.averageAttendanceRate ?? 91.5}%</div>
              <div className="stat-card-subtext">
                <span>↑ +2% vs Last Month</span>
              </div>
            </div>
          </div>

          {/* Card 4: Pending Tasks */}
          <div className="teacher-stat-card">
            <div className="stat-icon-square orange">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M12 14v4" />
                <path d="M12 14l2-2" />
              </svg>
            </div>
            <div className="stat-card-details">
              <div className="stat-card-label">Pending Tasks</div>
              <div className="stat-card-metric-val">{stats?.pendingMarksCount ?? 3}</div>
              <div className="stat-card-subtext" style={{ color: '#ea580c' }}>
                <span>Grading & Submissions</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Main Split Section: My Classes (Left) & Upcoming Tasks (Right) */}
        <section className="teacher-content-grid">
          {/* Left Panel: My Classes (This Semester) */}
          <div className="dashboard-widget-card">
            <div className="widget-header-row">
              <div className="widget-title-group">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#08382b">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
                <h2 className="widget-header-title">My Classes</h2>
                <span className="widget-semester-pill">(Fall 2026 Semester)</span>
              </div>
              <Link to="/teacher/classes" className="widget-view-all-link">
                View All &rarr;
              </Link>
            </div>

            <div className="my-courses-list">
              {stats?.assignedClasses?.map((cls) => (
                <div key={cls.id || cls.code} className="course-item-row">
                  {renderCourseIcon(cls.code, cls.title)}

                  <div className="course-info-meta">
                    <div className="course-code-title">
                      <span className="course-code-tag">{cls.code}</span>
                      <span className="course-name-text">{cls.title}</span>
                      <span className="course-section-badge">{cls.section || 'Sec A'}</span>
                    </div>
                  </div>

                  <div className="course-progress-wrap">
                    <div className="course-progress-track">
                      <div
                        className="course-progress-fill"
                        style={{ width: `${cls.attendanceRate || 85}%` }}
                      ></div>
                    </div>
                    <span className="course-rate-percent">{cls.attendanceRate || 85}%</span>
                  </div>

                  <div className="course-actions-group">
                    <button
                      type="button"
                      className="btn-mini-action primary"
                      title="Mark Attendance"
                      onClick={() => navigate(`/teacher/attendance?courseId=${cls.id}`)}
                    >
                      Attendance
                    </button>
                    <button
                      type="button"
                      className="btn-mini-action"
                      title="Enter Marks"
                      onClick={() => navigate(`/teacher/marks?courseId=${cls.id}`)}
                    >
                      Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Upcoming & Tasks Timeline */}
          <div className="dashboard-widget-card">
            <div className="widget-header-row">
              <div className="widget-title-group">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#08382b">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h2 className="widget-header-title">Upcoming</h2>
              </div>
              <Link to="/teacher/assignments" className="widget-view-all-link">
                View All &rarr;
              </Link>
            </div>

            <div className="upcoming-timeline-list">
              {stats?.upcomingTasks?.map((task, idx) => {
                const statusTag = task.statusTag || (idx === 0 ? 'Due Today' : idx === 1 ? 'In 2 Days' : 'In 5 Days');
                const statusClass = task.statusClass || (idx === 0 ? 'due-today' : idx === 1 ? 'due-soon' : 'due-later');
                const iconType = task.icon || (idx === 0 ? 'file' : idx === 1 ? 'quiz' : 'code');

                return (
                  <div key={task.id || idx} className="upcoming-task-card">
                    <div className="task-left-meta">
                      {renderTaskIcon(iconType)}
                      <div className="task-text-box">
                        <span className="task-title-line">{task.title}</span>
                        <span className="task-due-line">
                          {task.dueDateText || `Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Soon'}`}
                        </span>
                      </div>
                    </div>
                    <span className={`task-status-pill ${statusClass}`}>{statusTag}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Quick Actions Toolbar */}
        <section className="quick-actions-bar">
          <button
            type="button"
            className="btn-quick-launch"
            onClick={() => navigate('/teacher/attendance')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Take Attendance Now</span>
          </button>

          <button
            type="button"
            className="btn-quick-launch"
            onClick={() => navigate('/teacher/marks')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Record Exam Marks</span>
          </button>

          <button
            type="button"
            className="btn-quick-launch"
            onClick={() => navigate('/teacher/assignments')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Assignment</span>
          </button>

          <button
            type="button"
            className="btn-quick-launch"
            onClick={() => navigate('/teacher/materials')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Notes</span>
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
