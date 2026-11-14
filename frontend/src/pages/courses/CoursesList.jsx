// Assigned classes directory for teachers, and courses catalog & enrollment for students
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';
import { studentService } from '../../services/student.service';
import './CoursesList.css';

const CoursesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'STUDENT';

  // --- Teacher State ---
  const [classes, setClasses] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState('');

  // --- Student State ---
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL', 'ENROLLED', 'AVAILABLE'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (isStudent) {
      loadStudentCourses();
    } else {
      loadTeacherClasses();
    }
  }, [isStudent]);

  // Load classes for teacher
  const loadTeacherClasses = async () => {
    try {
      setTeacherLoading(true);
      const res = await teacherService.getAssignedClasses();
      if (res?.data) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error('Failed to load assigned classes', err);
    } finally {
      setTeacherLoading(false);
    }
  };

  // Load courses for student
  const loadStudentCourses = async () => {
    try {
      setStudentLoading(true);
      const data = await studentService.getCourses();
      setCourses(data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleEnroll = async (course) => {
    try {
      await studentService.enrollCourse(course.id);
      setNotification({
        type: 'success',
        message: `Successfully enrolled in ${course.code} – ${course.title}!`
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isEnrolled: true, progress: 0 } : c))
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Enrollment failed. Please try again.'
      });
    }
  };

  // ----------------------------------------------------
  // 1. STUDENT VIEW
  // ----------------------------------------------------
  if (isStudent) {
    const filteredCourses = courses.filter((c) => {
      const matchesSearch =
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterTab === 'ENROLLED') return c.isEnrolled;
      if (filterTab === 'AVAILABLE') return !c.isEnrolled;
      return true;
    });

    return (
      <div className="courses-page-container">
        {/* Page Header */}
        <div className="courses-page-header">
          <div>
            <h1 className="courses-page-title">My Courses</h1>
            <p className="courses-page-subtitle">
              Manage your academic curriculum, view syllabus progress, and explore available courses.
            </p>
          </div>
        </div>

        {/* Alert Notification */}
        {notification && (
          <div className={`notification-alert ${notification.type}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="courses-filter-bar">
          <div className="courses-tabs">
            <button
              type="button"
              className={`tab-btn ${filterTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTab('ALL')}
            >
              All Courses ({courses.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${filterTab === 'ENROLLED' ? 'active' : ''}`}
              onClick={() => setFilterTab('ENROLLED')}
            >
              Enrolled ({courses.filter((c) => c.isEnrolled).length})
            </button>
            <button
              type="button"
              className={`tab-btn ${filterTab === 'AVAILABLE' ? 'active' : ''}`}
              onClick={() => setFilterTab('AVAILABLE')}
            >
              Available Electives ({courses.filter((c) => !c.isEnrolled).length})
            </button>
          </div>

          <div className="courses-search-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by code, title, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Courses Cards Grid */}
        {studentLoading ? (
          <div className="courses-loading">Loading courses catalog...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="courses-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h3>No courses found</h3>
            <p>Try refining your search keyword or selecting a different tab.</p>
          </div>
        ) : (
          <div className="courses-cards-grid">
            {filteredCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-card-header">
                  <span className="course-code-pill">{course.code}</span>
                  <span className={`enrollment-status-badge ${course.isEnrolled ? 'enrolled' : 'available'}`}>
                    {course.isEnrolled ? 'Enrolled' : 'Elective'}
                  </span>
                </div>

                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-description">{course.description}</p>

                <div className="course-meta-tags">
                  <div className="meta-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{course.instructor}</span>
                  </div>
                  <div className="meta-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{course.schedule}</span>
                  </div>
                  <div className="meta-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span>{course.room}</span>
                  </div>
                  <div className="meta-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    </svg>
                    <span>{course.credits} Credits</span>
                  </div>
                </div>

                {course.isEnrolled ? (
                  <div className="course-card-progress-section">
                    <div className="progress-label-row">
                      <span>Course Progress</span>
                      <span className="progress-pct">{course.progress || 0}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${course.progress || 0}%` }}></div>
                    </div>
                    <div className="course-stat-mini-row">
                      <span>Attendance: <strong>{course.attendanceRate || 92}%</strong> ({course.attendanceFraction || '23/25'})</span>
                      <span>Grade: <strong>{course.grade || 'A'}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="course-card-available-info">
                    <span>Open for Registration • Prerequisites Satisfied</span>
                  </div>
                )}

                <div className="course-card-footer">
                  <button
                    type="button"
                    className="btn-details"
                    onClick={() => setSelectedCourse(course)}
                  >
                    View Syllabus & Details
                  </button>
                  {!course.isEnrolled && (
                    <button
                      type="button"
                      className="btn-enroll"
                      onClick={() => handleEnroll(course)}
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Syllabus / Course Details Modal */}
        {selectedCourse && (
          <div className="course-modal-backdrop" onClick={() => setSelectedCourse(null)}>
            <div className="course-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <span className="modal-code-badge">{selectedCourse.code}</span>
                  <h2>{selectedCourse.title}</h2>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedCourse(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-description">{selectedCourse.description}</p>

                <div className="modal-info-grid">
                  <div className="info-box">
                    <span className="info-box-title">Instructor</span>
                    <span className="info-box-value">{selectedCourse.instructor}</span>
                    <span className="info-box-sub">{selectedCourse.instructorEmail || 'faculty@campusiq.edu'}</span>
                  </div>
                  <div className="info-box">
                    <span className="info-box-title">Classroom & Timing</span>
                    <span className="info-box-value">{selectedCourse.room}</span>
                    <span className="info-box-sub">{selectedCourse.schedule}</span>
                  </div>
                  <div className="info-box">
                    <span className="info-box-title">Academic Weight</span>
                    <span className="info-box-value">{selectedCourse.credits} Credits</span>
                    <span className="info-box-sub">{selectedCourse.section || 'Sec A'}</span>
                  </div>
                </div>

                <div className="modal-syllabus-section">
                  <h3>Syllabus Modules</h3>
                  <ul className="syllabus-list">
                    {(selectedCourse.syllabus || [
                      'Introduction & Core Fundamentals',
                      'Design Patterns and Theoretical Frameworks',
                      'Practical Laboratory Implementations',
                      'Project Case Studies & Advanced Architecture'
                    ]).map((topic, i) => (
                      <li key={i} className="syllabus-item">
                        <span className="module-index">Module {i + 1}</span>
                        <span className="module-name">{topic}</span>
                        <span className="module-status">Completed</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setSelectedCourse(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. TEACHER VIEW (Default)
  // ----------------------------------------------------
  const filteredTeacherClasses = classes.filter((c) =>
    (c.code || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (c.title || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (c.section && c.section.toLowerCase().includes(teacherSearch.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #dde3d5',
          padding: '24px 28px',
          boxShadow: '0 4px 16px rgba(8, 56, 43, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              My Assigned Classes
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Classes, sections, and academic courses assigned to your instruction.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search classes by name or code..."
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              width: '300px',
              maxWidth: '100%',
              outline: 'none'
            }}
          />
        </div>

        {/* Classes Grid */}
        {teacherLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading your assigned classes...
          </div>
        ) : filteredTeacherClasses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No assigned classes found matching your query.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredTeacherClasses.map((cls) => (
              <div
                key={cls.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #dde3d5',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(8, 56, 43, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    {cls.code}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.78rem'
                  }}>
                    {cls.section || 'Sec A'}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    {cls.title}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '10px' }}>
                    <span>Credits: {cls.credits || 3}</span>
                    <span>•</span>
                    <span>Semester {cls.semester || 3}</span>
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  color: '#334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Enrolled Students:</span>
                    <strong style={{ color: '#0f172a' }}>{cls.studentCount || cls.student_count || 30} students</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Attendance Rate:</span>
                    <strong style={{ color: '#16a34a' }}>{cls.attendanceRate || 90}%</strong>
                  </div>
                  {cls.schedule && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Schedule:</span>
                      <span>{cls.schedule}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Roster
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/attendance?courseId=${cls.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#166534',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/marks?courseId=${cls.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #2563eb',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Marks
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoursesList;
