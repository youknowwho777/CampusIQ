// Teacher attendance tracker for recording, updating, and reviewing daily classroom attendance
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';
import attendanceService from '../../services/attendance.service';
import './AttendanceTracker.css';

const AttendanceTracker = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  // Classes & Selection
  const [classes, setClasses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId || '');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Students & Attendance Records State
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Tabs: 'track' or 'history'
  const [activeTab, setActiveTab] = useState('track');
  const [historyList, setHistoryList] = useState([]);

  // Load teacher's assigned classes on mount
  useEffect(() => {
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
  }, []);

  // Fetch student roster and attendance when course or date changes
  useEffect(() => {
    if (!selectedCourseId) return;

    let isMounted = true;
    const fetchSessionData = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const res = await attendanceService.getCourseAttendance(selectedCourseId, attendanceDate);
        if (isMounted && res?.data) {
          setStudents(res.data);

          // Build initial status map
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
        if (isMounted) setLoading(false);
      }
    };

    fetchSessionData();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, attendanceDate]);

  // Load History when history tab is opened
  useEffect(() => {
    if (activeTab === 'history' && selectedCourseId) {
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
    }
  }, [activeTab, selectedCourseId]);

  // Status Change Handler
  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Bulk status controls
  const handleMarkAll = (status) => {
    const map = {};
    students.forEach((s) => {
      const sid = s.studentId || s.student_id || s.id;
      map[sid] = status;
    });
    setAttendanceMap(map);
  };

  // Submit Attendance Handler
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
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error saving attendance records.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Statistics calculation for current view
  const totalCount = students.length;
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;
  const excusedCount = Object.values(attendanceMap).filter((s) => s === 'EXCUSED').length;

  const selectedClassObj = classes.find((c) => c.id === selectedCourseId);

  return (
    <DashboardLayout>
      <div className="attendance-tracker-container">
        {/* Top Control Card */}
        <div className="attendance-header-card">
          <div className="attendance-title-row">
            <div>
              <h1 className="attendance-main-title">Attendance Management</h1>
              <p className="attendance-subtitle">
                Record classroom attendance, track absences, and audit historical sessions.
              </p>
            </div>

            {/* Tab Toggles: Track vs History */}
            <div className="history-toggle-row">
              <button
                type="button"
                className={`btn-tab-toggle ${activeTab === 'track' ? 'active' : ''}`}
                onClick={() => setActiveTab('track')}
              >
                Take Attendance
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

          {/* Feedback Banner */}
          {feedback && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                marginBottom: '16px',
                backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: feedback.type === 'success' ? '#166534' : '#991b1b',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Selectors Bar */}
          <div className="attendance-controls-bar">
            <div className="control-field">
              <label className="control-label" htmlFor="course-select">Assigned Class</label>
              <select
                id="course-select"
                className="control-select"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSearchParams({ courseId: e.target.value });
                }}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} – {cls.title} ({cls.section || 'Sec A'})
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'track' && (
              <div className="control-field">
                <label className="control-label" htmlFor="attendance-date">Session Date</label>
                <input
                  id="attendance-date"
                  type="date"
                  className="control-date-input"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          {/* Session Metrics Pills */}
          {activeTab === 'track' && (
            <>
              <div className="session-summary-pills">
                <span className="summary-pill total">Total Students: {totalCount}</span>
                <span className="summary-pill present">Present: {presentCount}</span>
                <span className="summary-pill absent">Absent: {absentCount}</span>
                <span className="summary-pill late">Late: {lateCount}</span>
                {excusedCount > 0 && <span className="summary-pill excused">Excused: {excusedCount}</span>}
              </div>

              {/* Bulk Quick Actions Toolbar */}
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
                  onClick={handleSubmitAttendance}
                  disabled={submitting || totalCount === 0}
                >
                  {submitting ? 'Saving...' : 'Save & Submit Attendance'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Tab 1: Take Attendance Roster Table */}
        {activeTab === 'track' && (
          <div className="attendance-roster-card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading enrolled students for {selectedClassObj?.code || 'class'}...
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No active students enrolled in this course section.
              </div>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Course Attendance</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const sid = student.studentId || student.student_id || student.id;
                    const status = attendanceMap[sid] || 'PRESENT';
                    const roll = student.rollNumber || student.roll_number || 'N/A';
                    const name = student.name || `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim();
                    const rate = student.historicalAttendanceRate ?? 95;

                    return (
                      <tr key={sid}>
                        <td className="student-roll">{roll}</td>
                        <td>
                          <div className="student-profile-cell">
                            <div className="student-avatar">
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="student-name-box">
                              <span className="student-name">{name}</span>
                              <span className="student-email">{student.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`rate-badge ${rate >= 85 ? 'good' : rate >= 75 ? 'warning' : 'danger'}`}>
                            {rate}%
                          </span>
                        </td>
                        <td>
                          <div className="status-pill-group">
                            <button
                              type="button"
                              className={`status-pill-btn ${status === 'PRESENT' ? 'active present' : ''}`}
                              onClick={() => handleStatusChange(sid, 'PRESENT')}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`status-pill-btn ${status === 'ABSENT' ? 'active absent' : ''}`}
                              onClick={() => handleStatusChange(sid, 'ABSENT')}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              className={`status-pill-btn ${status === 'LATE' ? 'active late' : ''}`}
                              onClick={() => handleStatusChange(sid, 'LATE')}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              className={`status-pill-btn ${status === 'EXCUSED' ? 'active excused' : ''}`}
                              onClick={() => handleStatusChange(sid, 'EXCUSED')}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Session History Table */}
        {activeTab === 'history' && (
          <div className="attendance-roster-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              Past Attendance Sessions for {selectedClassObj?.code} ({selectedClassObj?.title})
            </h3>
            {historyList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No prior attendance sessions logged for this class.
              </div>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance %</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((item, idx) => (
                    <tr key={item.attendanceDate || idx}>
                      <td style={{ fontWeight: 600 }}>{item.attendanceDate}</td>
                      <td>{item.totalStudents || item.total_students}</td>
                      <td style={{ color: '#166534', fontWeight: 600 }}>{item.presentCount || item.present_count}</td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>{item.absentCount || item.absent_count}</td>
                      <td style={{ color: '#d97706', fontWeight: 600 }}>{item.lateCount || item.late_count}</td>
                      <td>
                        <span className="rate-badge good">
                          {item.percentage}%
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-quick-toggle"
                          onClick={() => {
                            setAttendanceDate(item.attendanceDate);
                            setActiveTab('track');
                          }}
                        >
                          Re-open & Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceTracker;
