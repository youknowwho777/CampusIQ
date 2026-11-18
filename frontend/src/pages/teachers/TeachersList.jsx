// Faculty directory displaying academic qualifications, department affiliations, and subject allocations
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/admin.service';

const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const res = await adminService.getTeachers(search, deptFilter === 'ALL' ? '' : deptFilter);
        if (isMounted && res?.data) {
          setTeachers(res.data);
        }
      } catch (err) {
        console.error('Failed to load faculty directory:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchTeachers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, deptFilter]);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Banner */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #dde3d5',
          padding: '24px 28px',
          boxShadow: '0 4px 16px rgba(8, 56, 43, 0.03)'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Academic Faculty Directory
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '6px' }}>
            Professors, department heads, and faculty members instructing courses this academic term.
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '20px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Search faculty by name, department, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: '42px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                flex: 1,
                minWidth: '240px',
                outline: 'none'
              }}
            />

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                height: '42px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                minWidth: '220px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science & Engineering</option>
            </select>
          </div>
        </div>

        {/* Faculty Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', gridColumn: '1 / -1' }}>
              Loading faculty directory...
            </div>
          ) : teachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', gridColumn: '1 / -1' }}>
              No faculty members found matching your search.
            </div>
          ) : (
            teachers.map((t) => (
              <div
                key={t.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(8, 56, 43, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#08382b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {t.name}
                    </h3>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: t.role === 'HOD' ? '#b45309' : '#1e40af' }}>
                      {t.role === 'HOD' ? 'Head of Department' : 'Associate Professor'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                  <div><strong>Department:</strong> {t.department}</div>
                  <div style={{ marginTop: '4px' }}><strong>Email:</strong> {t.email}</div>
                  <div style={{ marginTop: '4px' }}><strong>Phone:</strong> {t.phoneNumber}</div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Assigned Classes:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {t.assignedClasses?.map((c) => (
                      <span
                        key={c.id}
                        style={{
                          background: '#dcfce7',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {c.code} ({c.section})
                      </span>
                    ))}
                    {(!t.assignedClasses || t.assignedClasses.length === 0) && (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None currently assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeachersList;
