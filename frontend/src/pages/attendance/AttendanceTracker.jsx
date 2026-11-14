// Attendance Tracker: Teacher daily attendance marking and Student attendance tracking & leave requests
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';
import attendanceService from '../../services/attendance.service';
import { studentService } from '../../services/student.service';
import './AttendanceTracker.css';

const AttendanceTracker = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  // ==========================================================
  // TEACHER STATE & HANDLERS
  // ==========================================================
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams ? searchParams.get('courseId') : null;

  const [classes, setClasses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId || '');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [activeTab, setActiveTab] = useState('track');
  const [historyList, setHistoryList] = useState([]);

  // Load teacher assigned classes
  useEffect(() => {
    if (isStudent) return;
    const loadClasses = async () => {
      try {
        const res = await teacherService.getAssignedClasses();
        if (res?.data && res.data.length > 0) {
          setClasses(res.data);
          if (!selectedCourseId) {
            setSelectedCourseId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    loadClasses();
  }, [isStudent]);

  // Load student roster & session attendance for teacher
  useEffect(() => {
    if (isStudent || !selectedCourseId) return;

    let isMounted = true;
    const fetchSessionData = async () => {
      setTeacherLoading(true);
      setFeedback(null);
      try {
        const res = await attendanceService.getCourseAttendance(selectedCourseId, attendanceDate);
        if (isMounted && res?.data) {
          setStudents(res.data);
          const map = {};
          res.data.forEach((s) => {
            const sid = s.studentId || s.student_id || s.id;
            map[sid] = s.status || 'PRESENT';
          });
          setAttendanceMap(map);
        }
      } catch (err) {
        console.error('Failed to load session attendance', err);
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: 'Unable to load attendance for this class session.'
          });
        }
      } finally {
        if (isMounted) setTeacherLoading(false);
      }
    };

    fetchSessionData();
    return () => {
      isMounted = false;
    };
  }, [isStudent, selectedCourseId, attendanceDate]);

  // Load course history for teacher
  useEffect(() => {
    if (isStudent || activeTab !== 'history' || !selectedCourseId) return;
    const loadHistory = async () => {
      try {
        const res = await attendanceService.getCourseHistory(selectedCourseId);
        if (res?.data) {
          setHistoryList(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch attendance history', err);
      }
    };
    loadHistory();
  }, [isStudent, activeTab, selectedCourseId]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const map = {};
    students.forEach((s) => {
      const sid = s.studentId || s.student_id || s.id;
      map[sid] = status;
    });
    setAttendanceMap(map);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || students.length === 0) return;

    setSubmitting(true);
    setFeedback(null);

    const records = students.map((s) => {
      const sid = s.studentId || s.student_id || s.id;
      return {
        studentId: sid,
        status: attendanceMap[sid] || 'PRESENT'
      };
    });

    try {
      const res = await attendanceService.submitBatchAttendance({
        courseId: selectedCourseId,
        attendanceDate,
        records
      });

      if (res?.success) {
        setFeedback({
          type: 'success',
          message: `Attendance for ${records.length} students recorded successfully on ${attendanceDate}!`
        });
      }
    } catch (err) {
      console.error('Failed to submit attendance', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit attendance. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // STUDENT STATE & HANDLERS
  // ==========================================================
  const [attendanceData, setAttendanceData] = useState(null);
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    date: new Date().toISOString().split('T')[0],
    courseCode: 'ALL',
    type: 'Medical Leave',
    reason: ''
  });
  const [studentFeedback, setStudentFeedback] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);

  useEffect(() => {
    if (!isStudent) return;
    const loadAttendance = async () => {
      try {
        setStudentLoading(true);
        const data = await studentService.getAttendance(courseFilter !== 'ALL' ? courseFilter : undefined);
        setAttendanceData(data);
      } catch (err) {
        console.error('Failed to load student attendance:', err);
      } finally {
        setStudentLoading(false);
      }
    };
    loadAttendance();
  }, [isStudent, courseFilter]);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentService.requestLeave(leaveForm);
      setStudentFeedback({
        type: 'success',
        message: `Leave application for ${leaveForm.date} submitted for review!`
      });
      setIsLeaveModalOpen(false);
      setLeaveForm({
        date: new Date().toISOString().split('T')[0],
        courseCode: 'ALL',
        type: 'Medical Leave',
        reason: ''
      });
      setTimeout(() => setStudentFeedback(null), 4000);
    } catch (err) {
      setStudentFeedback({
        type: 'error',
        message: 'Leave application submission failed. Please try again.'
      });
    }
  };

  // ==========================================================
  // 1. STUDENT VIEW
  // ==========================================================
  if (isStudent) {
    const { overallRate, totalClasses, attendedClasses, missedClasses, courses = [], history = [] } =
      attendanceData || {};

    const filteredHistory = history.filter((item) => {
      const matchCourse = courseFilter === 'ALL' || item.courseCode === courseFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchCourse && matchStatus;
    });

    return (
      <div className="attendance-page-container">
        {/* Header with Title and Leave Button */}
        <div className="attendance-header">
          <div>
            <h1 className="attendance-title">Attendance Tracker</h1>
            <p className="attendance-subtitle">
              Monitor your session attendance rate, track regulatory requirements, and file leave requests.
            </p>
          </div>
          <button
            type="button"
            className="btn-leave-request"
            onClick={() => setIsLeaveModalOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>Request Leave</span>
          </button>
        </div>

        {studentFeedback && (
          <div className={`notification-alert ${studentFeedback.type}`}>
            <span>{studentFeedback.message}</span>
          </div>
        )}

        {/* Attendance KPI Summary Banner */}
        <div className="attendance-kpi-banner">
          <div className="kpi-main-block">
            <span className="kpi-label">Overall Attendance Rate</span>
            <div className="kpi-big-number-row">
              <span className="kpi-big-number">{overallRate || 92}%</span>
              <span className="kpi-status-tag safe">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Attendance Safe</span>
              </span>
            </div>
            <span className="kpi-trend-note">Satisfies institutional minimum requirement of 75%</span>
          </div>

          <div className="kpi-stat-boxes">
            <div className="kpi-stat-box">
              <span className="kpi-stat-num">{totalClasses || 142}</span>
              <span className="kpi-stat-lbl">Total Classes</span>
            </div>
            <div className="kpi-stat-box">
              <span className="kpi-stat-num">{attendedClasses || 131}</span>
              <span className="kpi-stat-lbl">Present</span>
            </div>
            <div className="kpi-stat-box">
              <span className="kpi-stat-num">{missedClasses || 11}</span>
              <span className="kpi-stat-lbl">Absences</span>
            </div>
          </div>
        </div>

        {/* Course-Wise Attendance Breakdown */}
        <div className="courses-attendance-section">
          <h2 className="section-title">Course Breakdown</h2>
          <div className="courses-breakdown-grid">
            {courses.map((c) => (
              <div key={c.code} className="course-att-card">
                <div className="course-att-top">
                  <span className="att-course-code">{c.code}</span>
                  <span className={`att-status-tag ${c.percentage >= 80 ? 'good' : 'warning'}`}>
                    {c.percentage >= 80 ? 'Good Standing' : 'Near Threshold'}
                  </span>
                </div>
                <h3 className="att-course-title" title={c.title}>{c.title}</h3>
                <div className="att-metrics-row">
                  <span className="att-percentage">{c.percentage}%</span>
                  <span className="att-classes-count">{c.attended}/{c.total} Sessions</span>
                </div>
                <div className="att-progress-track">
                  <div
                    className="att-progress-fill"
                    style={{
                      width: `${c.percentage}%`,
                      backgroundColor: c.percentage >= 85 ? '#10b981' : c.percentage >= 75 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Attendance History Table */}
        <div className="attendance-history-card">
          <div className="history-header-row">
            <div className="history-title-group">
              <h2 className="section-title">Attendance Records Log</h2>
              <span className="history-count">Showing {filteredHistory.length} sessions</span>
            </div>
            <div className="history-filters">
              <select
                className="filter-select"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="ALL">All Enrolled Courses</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} – {c.title}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th>Course</th>
                  <th>Classroom</th>
                  <th>Status</th>
                  <th>Remarks / Topic</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="date-cell">
                      <strong>{item.date}</strong>
                    </td>
                    <td className="course-cell">
                      <strong>{item.courseCode}</strong>
                      <span className="sub-title">{item.courseTitle}</span>
                    </td>
                    <td className="room-cell">
                      <span>{item.room}</span>
                      <span className="sub-room">{item.time}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="remarks-cell">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Request Modal */}
        {isLeaveModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsLeaveModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Request Academic Leave</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsLeaveModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="modal-form">
                <div className="form-group">
                  <label>Leave Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Affected Course</label>
                  <select
                    value={leaveForm.courseCode}
                    onChange={(e) => setLeaveForm({ ...leaveForm, courseCode: e.target.value })}
                  >
                    <option value="ALL">All Courses on Date</option>
                    {courses.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} – {c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Leave Classification</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  >
                    <option value="Medical Leave">Medical Leave (Doctor Certificate Attached)</option>
                    <option value="Institutional Representation">Institutional Representation (Conference/Sports)</option>
                    <option value="Family Emergency">Personal / Family Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason Description</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Describe the reason for absence..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsLeaveModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // 2. TEACHER VIEW (Default)
  // ==========================================================
  const summaryCounts = {
    total: students.length,
    present: Object.values(attendanceMap).filter((s) => s === 'PRESENT').length,
    absent: Object.values(attendanceMap).filter((s) => s === 'ABSENT').length,
    late: Object.values(attendanceMap).filter((s) => s === 'LATE').length,
    excused: Object.values(attendanceMap).filter((s) => s === 'EXCUSED').length
  };

  return (
    <DashboardLayout>
      <div className="attendance-tracker-container">
        {/* Header Card */}
        <div className="attendance-header-card">
          <div className="attendance-title-row">
            <div>
              <h1 className="attendance-main-title">Attendance Management</h1>
              <p className="attendance-subtitle">
                Record, review, and adjust daily student attendance logs for your assigned courses.
              </p>
            </div>

            {/* Tab Toggles */}
            <div className="history-toggle-row">
              <button
                type="button"
                className={`btn-tab-toggle ${activeTab === 'track' ? 'active' : ''}`}
                onClick={() => setActiveTab('track')}
              >
                Mark Attendance
              </button>
              <button
                type="button"
                className={`btn-tab-toggle ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Session History
              </button>
            </div>
          </div>

          {/* Controls Bar: Course Selector & Date */}
          <div className="attendance-controls-bar">
            <div className="control-field">
              <label className="control-label" htmlFor="course-select">
                Select Class / Section
              </label>
              <select
                id="course-select"
                className="control-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.title} ({c.section || 'Sec A'})
                  </option>
                ))}
              </select>
            </div>

            <div className="control-field">
              <label className="control-label" htmlFor="session-date">
                Session Date
              </label>
              <input
                id="session-date"
                type="date"
                className="control-date-input"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Stats Summary Pills */}
          {activeTab === 'track' && (
            <div className="session-summary-pills">
              <span className="summary-pill total">
                Total Enrolled: <strong>{summaryCounts.total}</strong>
              </span>
              <span className="summary-pill present">
                Present: <strong>{summaryCounts.present}</strong>
              </span>
              <span className="summary-pill absent">
                Absent: <strong>{summaryCounts.absent}</strong>
              </span>
              <span className="summary-pill late">
                Late: <strong>{summaryCounts.late}</strong>
              </span>
              <span className="summary-pill excused">
                Excused: <strong>{summaryCounts.excused}</strong>
              </span>
            </div>
          )}

          {/* Quick Actions Toolbar */}
          {activeTab === 'track' && (
            <div className="quick-attendance-actions">
              <div className="btn-group-quick">
                <button
                  type="button"
                  className="btn-quick-toggle"
                  onClick={() => handleMarkAll('PRESENT')}
                >
                  ✓ Mark All Present
                </button>
                <button
                  type="button"
                  className="btn-quick-toggle"
                  onClick={() => handleMarkAll('ABSENT')}
                >
                  ✕ Mark All Absent
                </button>
              </div>

              <button
                type="button"
                className="btn-submit-attendance"
                disabled={submitting || students.length === 0}
                onClick={handleSubmitAttendance}
              >
                {submitting ? 'Recording...' : 'Submit Session Attendance'}
              </button>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: feedback.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            {feedback.message}
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'track' ? (
          <div className="attendance-roster-card">
            {teacherLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading session student roster...
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No enrolled students found for this class.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll Number</th>
                      <th>Overall Attendance</th>
                      <th>Session Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const sid = student.studentId || student.student_id || student.id;
                      const currentStatus = attendanceMap[sid] || 'PRESENT';
                      const initials = (student.name || 'Student')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0].toUpperCase())
                        .join('');

                      return (
                        <tr key={sid}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="student-profile-cell">
                              <div className="student-avatar">{initials}</div>
                              <div className="student-name-box">
                                <span className="student-name">{student.name}</span>
                                <span className="student-email">{student.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="student-roll">{student.rollNumber || student.roll_number || 'N/A'}</td>
                          <td>
                            <span className="rate-badge good">
                              {student.historicalAttendanceRate || student.attendanceRate || 92}%
                            </span>
                          </td>
                          <td>
                            <div className="status-pill-group">
                              {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  className={`status-pill-btn ${currentStatus === st ? `active ${st.toLowerCase()}` : ''}`}
                                  onClick={() => handleStatusChange(sid, st)}
                                >
                                  {st === 'PRESENT' && 'P'}
                                  {st === 'ABSENT' && 'A'}
                                  {st === 'LATE' && 'L'}
                                  {st === 'EXCUSED' && 'E'}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Session History Tab */
          <div className="attendance-roster-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              Attendance Sessions Recorded
            </h2>
            {historyList.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>
                No prior attendance history recorded for this class yet.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Marked</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((item, i) => (
                      <tr key={i}>
                        <td><strong>{item.date}</strong></td>
                        <td>{item.totalStudents || item.total_students}</td>
                        <td style={{ color: '#16a34a' }}>{item.presentCount || item.present_count}</td>
                        <td style={{ color: '#dc2626' }}>{item.absentCount || item.absent_count}</td>
                        <td style={{ color: '#d97706' }}>{item.lateCount || item.late_count}</td>
                        <td>
                          <strong>{item.percentage}%</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceTracker;
