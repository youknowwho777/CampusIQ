// Teacher assignments management: create, review submissions, and manage assessment deadlines
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';
import assignmentService from '../../services/assignment.service';

const AssignmentList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100
  });
  const [feedback, setFeedback] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await teacherService.getAssignedClasses();
        if (res?.data && res.data.length > 0) {
          setClasses(res.data);
          setSelectedCourseId(res.data[0].id);
        }
      } catch (e) {
        console.error('Failed to load classes', e);
      }
    };
    loadClasses();
  }, []);

  const loadAssignments = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await assignmentService.getByCourse(selectedCourseId);
      if (res?.data) {
        setAssignments(res.data);
      }
    } catch (e) {
      console.error('Failed to load assignments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [selectedCourseId]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      setFeedback({ type: 'error', message: 'Title and due date are required.' });
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const res = await assignmentService.createAssignment({
        courseId: selectedCourseId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        maxScore: Number(formData.maxScore) || 100
      });

      if (res?.success) {
        setFeedback({ type: 'success', message: 'Assignment created successfully!' });
        setFormData({ title: '', description: '', dueDate: '', maxScore: 100 });
        setIsModalOpen(false);
        await loadAssignments();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error creating assignment.'
      });
    } finally {
      setCreating(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedCourseId);

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
              Assignments & Coursework
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Create homework assignments, set deadlines, and monitor student submission progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              background: '#166534',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>+</span> Create New Assignment
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: 600
          }}>
            {feedback.message}
          </div>
        )}

        {/* Class Filter Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #dde3d5',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
            Filter by Course:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              minWidth: '240px'
            }}
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.code} – {cls.title} ({cls.section || 'Sec A'})
              </option>
            ))}
          </select>
        </div>

        {/* Assignments List Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading course assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1'
          }}>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              No assignments published for {selectedClass?.code || 'this class'} yet.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#166534',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {assignments.map((asn) => (
              <div
                key={asn.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #dde3d5',
                  padding: '20px 24px',
                  boxShadow: '0 4px 16px rgba(8, 56, 43, 0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#ecfdf5',
                      color: '#059669',
                      fontWeight: 800,
                      fontSize: '0.78rem'
                    }}>
                      {asn.courseCode || selectedClass?.code}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {asn.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                    {asn.description || 'No additional instructions.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Due: <strong>{new Date(asn.dueDate || asn.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                      Max Score: <strong>{asn.maxScore || asn.max_score} pts</strong> • Submissions: <strong>{asn.submissionCount || 2}</strong>
                    </div>
                  </div>

                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb'
                  }}>
                    Published
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Assignment */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Create New Assignment
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                Course: {selectedClass?.code} – {selectedClass?.title}
              </p>

              <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab Exercise 3 – Balanced Trees"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Instructions / Description
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Provide assignment guidelines or submission format..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Maximum Score
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={formData.maxScore}
                      onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#166534',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {creating ? 'Creating...' : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssignmentList;
