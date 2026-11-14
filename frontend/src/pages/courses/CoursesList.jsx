// My Courses Page with course cards, search, syllabus details modal, and course enrollment
import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/student.service';
import './CoursesList.css';

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL', 'ENROLLED', 'AVAILABLE'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await studentService.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course) => {
    try {
      const res = await studentService.enrollCourse(course.id);
      setNotification({
        type: 'success',
        message: `Successfully enrolled in ${course.code} – ${course.title}!`
      });
      // Update local state
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

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchTerm.toLowerCase());

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
      {loading ? (
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
              {/* Card Top */}
              <div className="course-card-header">
                <span className="course-code-pill">{course.code}</span>
                <span className={`enrollment-status-badge ${course.isEnrolled ? 'enrolled' : 'available'}`}>
                  {course.isEnrolled ? 'Enrolled' : 'Elective'}
                </span>
              </div>

              {/* Course Title and Description */}
              <h3 className="course-card-title">{course.title}</h3>
              <p className="course-card-description">{course.description}</p>

              {/* Course Meta Info */}
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

              {/* Progress & Attendance for enrolled courses */}
              {course.isEnrolled ? (
                <div className="course-card-progress-section">
                  <div className="progress-label-row">
                    <span>Course Progress</span>
                    <span className="progress-pct">{course.progress}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }}></div>
                  </div>
                  <div className="course-stat-mini-row">
                    <span>Attendance: <strong>{course.attendanceRate}%</strong> ({course.attendanceFraction})</span>
                    <span>Grade: <strong>{course.grade}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="course-card-available-info">
                  <span>Open for Spring Registration • Prerequisites Satisfied</span>
                </div>
              )}

              {/* Card Footer Actions */}
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
                  <span className="info-box-sub">{selectedCourse.instructorEmail}</span>
                </div>
                <div className="info-box">
                  <span className="info-box-title">Classroom & Timing</span>
                  <span className="info-box-value">{selectedCourse.room}</span>
                  <span className="info-box-sub">{selectedCourse.schedule}</span>
                </div>
                <div className="info-box">
                  <span className="info-box-title">Academic Weight</span>
                  <span className="info-box-value">{selectedCourse.credits} Credits</span>
                  <span className="info-box-sub">{selectedCourse.section}</span>
                </div>
              </div>

              <div className="modal-syllabus-section">
                <h3>Syllabus Modules</h3>
                <ul className="syllabus-list">
                  {selectedCourse.syllabus?.map((topic, i) => (
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
};

export default CoursesList;
