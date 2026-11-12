// Class details view displaying enrolled students roster, academic statistics, and quick actions
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await teacherService.getClassDetails(id);
        if (res?.data) {
          setClassDetails(res.data);
        }
      } catch (err) {
        console.error('Failed to load class details', err);
        setError('Unauthorized or class not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading class details and roster...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classDetails) {
    return (
      <DashboardLayout>
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #fee2e2'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Class Not Accessible</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            {error || 'You are not assigned to instruct this class section.'}
          </p>
          <Link to="/teacher/classes" style={{
            padding: '10px 20px',
            background: '#166534',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            Back to Assigned Classes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const course = classDetails.course || classDetails;
  const students = classDetails.students || [];

  const filteredStudents = students.filter(s =>
    (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
    (s.first_name && s.first_name.toLowerCase().includes(search.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
    (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Course Header Banner */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #dde3d5',
          padding: '28px 32px',
          boxShadow: '0 4px 16px rgba(8, 56, 43, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: '#ecfdf5',
                color: '#059669',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                {course.code}
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}>
                {course.section || 'Sec A'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {course.title}
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Credits: {course.credits || 3} • Semester {course.semester || 3} • {course.schedule || 'Scheduled Weekly'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(`/teacher/attendance?courseId=${course.id}`)}
              style={{
                padding: '10px 20px',
                background: '#166534',
                color: '#ffffff',
                borderRadius: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 101, 52, 0.2)'
              }}
            >
              Take Attendance
            </button>
            <button
              type="button"
              onClick={() => navigate(`/teacher/marks?courseId=${course.id}`)}
              style={{
                padding: '10px 20px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Enter Marks
            </button>
          </div>
        </div>

        {/* Enrolled Students Roster Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #dde3d5',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(8, 56, 43, 0.03)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Enrolled Students ({students.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Students registered and active in this course section.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search enrolled students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: '40px',
                padding: '0 14px',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '260px',
                outline: 'none'
              }}
            />
          </div>

          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No students found matching your search.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Roll Number</th>
                    <th style={{ padding: '12px 14px' }}>Student Name</th>
                    <th style={{ padding: '12px 14px' }}>Email</th>
                    <th style={{ padding: '12px 14px' }}>Attendance Rate</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const roll = s.rollNumber || `CS20240${(s.id || '').slice(-2)}`;
                    const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim();
                    const rate = s.attendanceRate || s.attendance_rate || 90;

                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                          {roll}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{name}</span>
                        </td>
                        <td style={{ padding: '14px', color: '#64748b', fontSize: '0.85rem' }}>
                          {s.email}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            fontWeight: 700,
                            color: rate >= 85 ? '#16a34a' : rate >= 75 ? '#d97706' : '#dc2626'
                          }}>
                            {rate}%
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: '#dcfce7',
                            color: '#166534'
                          }}>
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetails;
