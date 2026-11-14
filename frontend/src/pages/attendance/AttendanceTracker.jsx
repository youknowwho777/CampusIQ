// Attendance Tracker Page with attendance metrics, course breakdown, history log, filter, and leave request
import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/student.service';
import './AttendanceTracker.css';

const AttendanceTracker = () => {
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
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [courseFilter]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAttendance(courseFilter);
      setAttendanceData(data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert('Please provide a reason for the absence/leave request.');
      return;
    }

    try {
      const res = await studentService.submitLeaveRequest(leaveForm);
      setNotification({
        type: 'success',
        message: res.message || 'Leave request submitted successfully!'
      });
      setIsLeaveModalOpen(false);
      setLeaveForm({
        date: new Date().toISOString().split('T')[0],
        courseCode: 'ALL',
        type: 'Medical Leave',
        reason: ''
      });
      loadAttendance();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to submit leave request.'
      });
    }
  };

  const { summary, coursesBreakdown, attendanceLogs, leaveRequests } = attendanceData || {};

  const filteredLogs = (attendanceLogs || []).filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="attendance-page-container">
      {/* Header */}
      <div className="attendance-header">
        <div>
          <h1 className="attendance-title">Attendance Tracker</h1>
          <p className="attendance-subtitle">
            Track your semester attendance records, course compliance, and submit absence leave requests.
          </p>
        </div>
        <button
          type="button"
          className="btn-leave-request"
          onClick={() => setIsLeaveModalOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Request Leave / Grievance
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`notification-alert ${notification.type}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="attendance-kpi-banner">
        <div className="kpi-main-block">
          <span className="kpi-label">Cumulative Attendance</span>
          <div className="kpi-big-number-row">
            <span className="kpi-big-number">{summary?.overallPercentage || 92}%</span>
            <span className="kpi-status-tag safe">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Good Standing ({summary?.minimumThreshold || 75}% Required)
            </span>
          </div>
          <span className="kpi-trend-note">{summary?.trend || '+2% from previous month'}</span>
        </div>

        <div className="kpi-stat-boxes">
          <div className="kpi-stat-box">
            <span className="kpi-stat-num">{summary?.totalAttended || 81}</span>
            <span className="kpi-stat-lbl">Classes Attended</span>
          </div>
          <div className="kpi-stat-box">
            <span className="kpi-stat-num">{summary?.totalClasses || 88}</span>
            <span className="kpi-stat-lbl">Total Classes Held</span>
          </div>
          <div className="kpi-stat-box">
            <span className="kpi-stat-num">{((summary?.totalClasses || 88) - (summary?.totalAttended || 81))}</span>
            <span className="kpi-stat-lbl">Absences / Excused</span>
          </div>
        </div>
      </div>

      {/* Course Breakdown Cards */}
      <div className="courses-attendance-section">
        <h2 className="section-title">Course-wise Attendance Breakdown</h2>
        <div className="courses-breakdown-grid">
          {coursesBreakdown?.map((item) => (
            <div key={item.courseCode} className="course-att-card">
              <div className="course-att-top">
                <span className="att-course-code">{item.courseCode}</span>
                <span className={`att-status-tag ${item.percentage >= 80 ? 'good' : 'warning'}`}>
                  {item.status}
                </span>
              </div>
              <h4 className="att-course-title">{item.courseTitle}</h4>
              <div className="att-metrics-row">
                <span className="att-percentage">{item.percentage}%</span>
                <span className="att-classes-count">{item.attended} / {item.total} Classes</span>
              </div>
              <div className="att-progress-track">
                <div
                  className="att-progress-fill"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.percentage >= 80 ? '#10b981' : '#f59e0b'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History Log Table */}
      <div className="attendance-history-card">
        <div className="history-header-row">
          <div className="history-title-group">
            <h2 className="section-title">Attendance Session History</h2>
            <span className="history-count">Showing {filteredLogs.length} sessions</span>
          </div>

          <div className="history-filters">
            {/* Filter by Course */}
            <select
              className="filter-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="ALL">All Enrolled Courses</option>
              <option value="CS201">CS201 – Data Structures</option>
              <option value="CS203">CS203 – Database Systems</option>
              <option value="CS205">CS205 – Operating Systems</option>
              <option value="CS207">CS207 – Software Engineering</option>
            </select>

            {/* Filter by Status */}
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time & Room</th>
                <th>Course</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="date-cell">
                    <strong>{log.date}</strong>
                  </td>
                  <td className="room-cell">
                    <span>{log.time}</span>
                    <span className="sub-room">{log.room}</span>
                  </td>
                  <td className="course-cell">
                    <strong>{log.courseCode}</strong>
                    <span className="sub-title">{log.courseTitle}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${log.status.toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="remarks-cell">
                    {log.remark || 'Regular lecture session'}
                  </td>
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
              <h2>Request Absence / Attendance Grievance</h2>
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
                <label>Date of Absence</label>
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
                  <option value="ALL">All Courses on this date</option>
                  <option value="CS201">CS201 – Data Structures & Algorithms</option>
                  <option value="CS203">CS203 – Database Management Systems</option>
                  <option value="CS205">CS205 – Operating Systems</option>
                  <option value="CS207">CS207 – Software Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label>Absence Category</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                >
                  <option value="Medical Leave">Medical Leave (Doctor's Note Attached)</option>
                  <option value="Official Institutional Duty">Official Institutional Duty / Competition</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Attendance Discrepancy Correction">Attendance Discrepancy Correction</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason / Explanation</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe the reason for absence or request..."
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
};

export default AttendanceTracker;
