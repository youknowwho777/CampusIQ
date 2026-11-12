// Teacher assigned courses and class sections directory
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';

const CoursesList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await teacherService.getAssignedClasses();
        if (res?.data) {
          setClasses(res.data);
        }
      } catch (err) {
        console.error('Failed to load assigned classes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const filtered = classes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.section && c.section.toLowerCase().includes(search.toLowerCase()))
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading your assigned classes...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No assigned classes found matching your query.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filtered.map((cls) => (
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
