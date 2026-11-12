// Teacher examination records, internal assessments, and student marks evaluation
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import teacherService from '../../services/teacher.service';
import marksService from '../../services/marks.service';
import './MarksEntry.css';

const ASSESSMENT_OPTIONS = [
  'Quiz 1',
  'Midterm Exam',
  'Quiz 2',
  'Assignment 1',
  'Project Milestone',
  'Final Exam'
];

const MarksEntry = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  // Controls
  const [classes, setClasses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId || '');
  const [assessmentType, setAssessmentType] = useState('Midterm Exam');
  const [maxScore, setMaxScore] = useState(100);

  // Students & Scores State
  const [students, setStudents] = useState([]);
  const [scoreMap, setScoreMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Load classes
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

  // Fetch Marks for selected class and assessment type
  useEffect(() => {
    if (!selectedCourseId) return;

    let isMounted = true;
    const fetchMarks = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const res = await marksService.getCourseMarks(selectedCourseId, assessmentType);
        if (isMounted && res?.data) {
          setStudents(res.data);

          const scores = {};
          const remarks = {};
          let detectedMax = maxScore;

          res.data.forEach((s) => {
            const sid = s.studentId || s.student_id || s.id;
            scores[sid] = s.scoreObtained !== '' && s.scoreObtained !== null && s.scoreObtained !== undefined
              ? s.scoreObtained
              : '';
            remarks[sid] = s.remarks || '';
            if (s.maximumScore) detectedMax = Number(s.maximumScore);
          });

          setScoreMap(scores);
          setRemarksMap(remarks);
          setMaxScore(detectedMax);
        }
      } catch (err) {
        console.error('Failed to load marks', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMarks();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, assessmentType]);

  // Score change handler with validation check
  const handleScoreChange = (studentId, value) => {
    setScoreMap((prev) => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleRemarkChange = (studentId, value) => {
    setRemarksMap((prev) => ({
      ...prev,
      [studentId]: value
    }));
  };

  // Compute Grade letter from percentage
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return { label: 'A+', class: 'grade-A' };
    if (percentage >= 80) return { label: 'A', class: 'grade-A' };
    if (percentage >= 70) return { label: 'B', class: 'grade-B' };
    if (percentage >= 60) return { label: 'C', class: 'grade-C' };
    if (percentage >= 50) return { label: 'D', class: 'grade-D' };
    return { label: 'F', class: 'grade-F' };
  };

  // Submit Marks
  const handleSubmitMarks = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || students.length === 0) return;

    // Validate all entered scores
    for (const student of students) {
      const sid = student.studentId || student.student_id || student.id;
      const rawVal = scoreMap[sid];
      if (rawVal === '' || rawVal === undefined) {
        setFeedback({
          type: 'error',
          message: `Please provide a score for ${student.name || 'all students'}.`
        });
        return;
      }
      const num = Number(rawVal);
      if (isNaN(num)) {
        setFeedback({
          type: 'error',
          message: `Score for ${student.name || 'student'} must be a valid number.`
        });
        return;
      }
      if (num < 0) {
        setFeedback({
          type: 'error',
          message: `Score cannot be negative (${num}).`
        });
        return;
      }
      if (num > maxScore) {
        setFeedback({
          type: 'error',
          message: `Score ${num} cannot exceed the maximum score of ${maxScore}.`
        });
        return;
      }
    }

    setSubmitting(true);
    setFeedback(null);

    const records = students.map((s) => {
      const sid = s.studentId || s.student_id || s.id;
      return {
        studentId: sid,
        scoreObtained: Number(scoreMap[sid]),
        remarks: remarksMap[sid] || ''
      };
    });

    try {
      const res = await marksService.submitBatchMarks({
        courseId: selectedCourseId,
        assessmentType,
        maximumScore: maxScore,
        records
      });

      if (res?.success) {
        setFeedback({
          type: 'success',
          message: `Marks for ${assessmentType} saved successfully for ${records.length} students!`
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error saving assessment marks.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Analytics Calculation
  const validScores = Object.values(scoreMap)
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 0);

  const avgScore = validScores.length > 0
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : '0.0';
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const passCount = validScores.filter((s) => (s / maxScore) >= 0.5).length;
  const passRate = validScores.length > 0 ? Math.round((passCount / validScores.length) * 100) : 0;

  const selectedClassObj = classes.find((c) => c.id === selectedCourseId);

  return (
    <DashboardLayout>
      <div className="marks-entry-container">
        {/* Header and Controls Card */}
        <div className="marks-header-card">
          <div className="marks-title-row">
            <div>
              <h1 className="marks-main-title">Marks & Grades Management</h1>
              <p className="marks-subtitle">
                Enter, validate, and publish marks for coursework, quizzes, and semester examinations.
              </p>
            </div>

            <button
              type="button"
              className="btn-submit-attendance"
              onClick={handleSubmitMarks}
              disabled={submitting || students.length === 0}
            >
              {submitting ? 'Saving Marks...' : 'Save & Submit Marks'}
            </button>
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

          {/* Controls Bar */}
          <div className="marks-controls-bar">
            {/* Class Selector */}
            <div className="control-field">
              <label className="control-label" htmlFor="marks-course-select">Assigned Class</label>
              <select
                id="marks-course-select"
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

            {/* Assessment Type Selector */}
            <div className="control-field">
              <label className="control-label" htmlFor="assessment-select">Assessment Type</label>
              <select
                id="assessment-select"
                className="control-select"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
              >
                {ASSESSMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Score Input */}
            <div className="control-field">
              <label className="control-label" htmlFor="max-score">Maximum Marks</label>
              <input
                id="max-score"
                type="number"
                min="1"
                max="500"
                className="control-date-input"
                style={{ width: '130px', minWidth: 'unset', textAlign: 'center' }}
                value={maxScore}
                onChange={(e) => setMaxScore(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* Analytics Summary Row */}
          <div className="marks-stats-cards-row">
            <div className="assessment-metric-card">
              <span className="metric-label">Class Average</span>
              <span className="metric-value">{avgScore} / {maxScore}</span>
            </div>
            <div className="assessment-metric-card">
              <span className="metric-label">Highest Score</span>
              <span className="metric-value" style={{ color: '#16a34a' }}>{highestScore} / {maxScore}</span>
            </div>
            <div className="assessment-metric-card">
              <span className="metric-label">Lowest Score</span>
              <span className="metric-value" style={{ color: lowestScore < maxScore * 0.5 ? '#dc2626' : '#0f172a' }}>
                {lowestScore} / {maxScore}
              </span>
            </div>
            <div className="assessment-metric-card">
              <span className="metric-label">Passing Rate</span>
              <span className="metric-value">{passRate}%</span>
            </div>
          </div>
        </div>

        {/* Marks Entry Table Card */}
        <div className="attendance-roster-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading enrolled students for {selectedClassObj?.code || 'class'}...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No students enrolled in this course section.
            </div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Score (Max: {maxScore})</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Feedback / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const sid = student.studentId || student.student_id || student.id;
                  const score = scoreMap[sid] !== undefined ? scoreMap[sid] : '';
                  const numScore = Number(score);
                  const isInvalid = score !== '' && (isNaN(numScore) || numScore < 0 || numScore > maxScore);
                  const percentage = score !== '' && !isNaN(numScore) && maxScore > 0
                    ? Math.round((numScore / maxScore) * 100)
                    : null;
                  const grade = percentage !== null ? getLetterGrade(percentage) : null;
                  const roll = student.rollNumber || student.roll_number || 'N/A';
                  const name = student.name || `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim();

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
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={maxScore}
                          className={`marks-score-input ${isInvalid ? 'error' : ''}`}
                          placeholder="0.0"
                          value={score}
                          onChange={(e) => handleScoreChange(sid, e.target.value)}
                        />
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#334155' }}>
                          {percentage !== null ? `${percentage}%` : '—'}
                        </span>
                      </td>
                      <td>
                        {grade ? (
                          <span className={`grade-badge-pill ${grade.class}`}>
                            {grade.label}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="marks-remarks-input"
                          placeholder="Optional feedback..."
                          value={remarksMap[sid] || ''}
                          onChange={(e) => handleRemarkChange(sid, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarksEntry;
