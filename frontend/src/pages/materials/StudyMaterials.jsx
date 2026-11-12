// Teacher study materials, lecture slides, and notes repository
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';
import materialService from '../../services/material.service';

const StudyMaterials = () => {
  const [classes, setClasses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fileUrl: '',
    fileType: 'PDF'
  });
  const [feedback, setFeedback] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const loadMaterials = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await materialService.getByCourse(selectedCourseId);
      if (res?.data) {
        setMaterials(res.data);
      }
    } catch (e) {
      console.error('Failed to load materials', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [selectedCourseId]);

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setFeedback({ type: 'error', message: 'Material title is required.' });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      const res = await materialService.createMaterial({
        courseId: selectedCourseId,
        title: formData.title,
        fileUrl: formData.fileUrl || `https://storage.campusiq.edu/materials/${encodeURIComponent(formData.title.toLowerCase().replace(/\s+/g, '-'))}.pdf`,
        fileType: formData.fileType
      });

      if (res?.success) {
        setFeedback({ type: 'success', message: 'Study material uploaded and shared with students successfully!' });
        setFormData({ title: '', fileUrl: '', fileType: 'PDF' });
        setIsModalOpen(false);
        await loadMaterials();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error uploading material.'
      });
    } finally {
      setUploading(false);
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
              Course Study Materials
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Publish lecture slides, syllabi, cheat sheets, and reference notes for your enrolled students.
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
            <span>+</span> Upload Material
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

        {/* Course Filter Bar */}
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

        {/* Materials List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading course study materials...
          </div>
        ) : materials.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1'
          }}>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              No study materials uploaded for {selectedClass?.code || 'this course'} yet.
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
              Upload First Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {materials.map((mat) => (
              <div
                key={mat.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: mat.fileType === 'SLIDES' ? '#fffbeb' : '#fee2e2',
                    color: mat.fileType === 'SLIDES' ? '#d97706' : '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {mat.fileType || 'PDF'}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {mat.title}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      <span>Course: {mat.courseCode || selectedClass?.code}</span>
                      <span> • </span>
                      <span>Uploaded {mat.createdAt ? new Date(mat.createdAt).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={mat.fileUrl || mat.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download / View</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Upload Study Material */}
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
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Upload Study Material
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                Course: {selectedClass?.code} – {selectedClass?.title}
              </p>

              <form onSubmit={handleUploadMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 4 – Binary Search Trees.pdf"
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
                    Material Type
                  </label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="SLIDES">Lecture Presentation (Slides)</option>
                    <option value="NOTES">Revision Notes</option>
                    <option value="SYLLABUS">Syllabus & Curriculum</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Document URL or Storage Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://storage.campusiq.edu/materials/notes.pdf"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
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
                    disabled={uploading}
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
                    {uploading ? 'Uploading...' : 'Publish Material'}
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

export default StudyMaterials;
