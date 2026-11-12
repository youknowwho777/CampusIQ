// Examination records, internal assessments, grading logic, and report cards: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');
const { verifyCourseTeacher } = require('../teachers/teachers.service');

// Get Marks for a Course and Assessment Type
exports.getMarksByCourseAndAssessment = async (courseId, assessmentType, userId, userRole) => {
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not assigned to instruct this course.');
    err.statusCode = 403;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      SELECT 
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.email,
        m.id as mark_id,
        m.assessment_type,
        m.score_obtained,
        m.maximum_score,
        m.weightage_percent
      FROM users u
      JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1 AND e.status = 'ACTIVE'
      LEFT JOIN marks m ON m.student_id = u.id AND m.course_id = $1 AND m.assessment_type = $2
      ORDER BY u.last_name ASC, u.first_name ASC
    `, [courseId, assessmentType]);

    return rows;
  }

  const courseEnrollments = inMemoryStore.enrollments.filter(e => e.course_id === courseId && e.status === 'ACTIVE');
  const studentIds = courseEnrollments.map(e => e.student_id);

  return inMemoryStore.users
    .filter(u => studentIds.includes(u.id))
    .map(u => {
      const existing = inMemoryStore.marks.find(m =>
        m.course_id === courseId && m.student_id === u.id && m.assessment_type === assessmentType
      );

      return {
        studentId: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        rollNumber: u.roll_number || `CS20240${u.id.slice(-2)}`,
        assessmentType,
        scoreObtained: existing ? existing.score_obtained : '',
        maximumScore: existing ? existing.maximum_score : 100,
        weightagePercent: existing ? existing.weightage_percent : 20,
        markId: existing ? existing.id : null,
        isExistingRecord: !!existing
      };
    });
};

// Batch Submit / Upsert Student Assessment Marks
exports.recordBatchMarks = async (courseId, assessmentType, maximumScore, records, userId, userRole) => {
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not authorized to record marks for this course.');
    err.statusCode = 403;
    throw err;
  }

  const maxScore = Number(maximumScore);
  if (isNaN(maxScore) || maxScore <= 0) {
    const err = new Error('Maximum score must be a positive numeric value.');
    err.statusCode = 400;
    throw err;
  }

  if (!assessmentType || typeof assessmentType !== 'string' || !assessmentType.trim()) {
    const err = new Error('Assessment type is required.');
    err.statusCode = 400;
    throw err;
  }

  // Validate student entries and numeric scores
  const seenStudents = new Set();
  for (const rec of records) {
    if (!rec.studentId) {
      const err = new Error('Each marks record must contain a valid studentId.');
      err.statusCode = 400;
      throw err;
    }

    if (seenStudents.has(rec.studentId)) {
      const err = new Error(`Duplicate entry for student ID '${rec.studentId}' in marks submission.`);
      err.statusCode = 400;
      throw err;
    }
    seenStudents.add(rec.studentId);

    const score = Number(rec.scoreObtained);
    if (isNaN(score)) {
      const err = new Error(`Invalid score '${rec.scoreObtained}' for student ${rec.studentId}. Score must be numeric.`);
      err.statusCode = 400;
      throw err;
    }
    if (score < 0) {
      const err = new Error(`Score cannot be negative for student ${rec.studentId}. Received: ${score}`);
      err.statusCode = 400;
      throw err;
    }
    if (score > maxScore) {
      const err = new Error(`Score ${score} exceeds maximum allowed score ${maxScore} for student ${rec.studentId}.`);
      err.statusCode = 400;
      throw err;
    }
    rec.scoreObtained = score;
  }

  // Check enrollment
  let enrolledStudentIds = [];
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT student_id FROM enrollments WHERE course_id = $1 AND status = \'ACTIVE\'', [courseId]);
    enrolledStudentIds = rows.map(r => r.student_id);
  } else {
    enrolledStudentIds = inMemoryStore.enrollments
      .filter(e => e.course_id === courseId && e.status === 'ACTIVE')
      .map(e => e.student_id);
  }

  for (const rec of records) {
    if (!enrolledStudentIds.includes(rec.studentId)) {
      const err = new Error(`Student ${rec.studentId} is not enrolled in course ${courseId}.`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (getIsPostgresConnected()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const rec of records) {
        await client.query(`
          INSERT INTO marks (course_id, student_id, assessment_type, score_obtained, maximum_score, weightage_percent)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET score_obtained = EXCLUDED.score_obtained
        `, [courseId, rec.studentId, assessmentType, rec.scoreObtained, maxScore, rec.weightagePercent || 20]);
      }
      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    return {
      courseId,
      assessmentType,
      maximumScore: maxScore,
      processedCount: records.length,
      message: 'Marks submitted successfully.'
    };
  }

  // In-memory fallback upsert
  let upsertCount = 0;
  for (const rec of records) {
    const idx = inMemoryStore.marks.findIndex(m =>
      m.course_id === courseId && m.student_id === rec.studentId && m.assessment_type === assessmentType
    );

    if (idx !== -1) {
      inMemoryStore.marks[idx].score_obtained = rec.scoreObtained;
      inMemoryStore.marks[idx].maximum_score = maxScore;
      inMemoryStore.marks[idx].updated_at = new Date();
    } else {
      inMemoryStore.marks.push({
        id: `mrk-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        course_id: courseId,
        student_id: rec.studentId,
        assessment_type: assessmentType,
        score_obtained: rec.scoreObtained,
        maximum_score: maxScore,
        weightage_percent: rec.weightagePercent || 20,
        created_at: new Date()
      });
    }
    upsertCount++;
  }

  return {
    courseId,
    assessmentType,
    maximumScore: maxScore,
    processedCount: upsertCount,
    message: 'Assessment marks submitted and recorded successfully.'
  };
};

// List all Assessments recorded for a Course with Class Statistics
exports.getCourseAssessments = async (courseId, userId, userRole) => {
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not assigned to instruct this course.');
    err.statusCode = 403;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      SELECT 
        assessment_type,
        maximum_score,
        COUNT(id)::int as student_count,
        ROUND(AVG(score_obtained), 1) as average_score,
        MAX(score_obtained) as highest_score,
        MIN(score_obtained) as lowest_score
      FROM marks
      WHERE course_id = $1
      GROUP BY assessment_type, maximum_score
      ORDER BY assessment_type ASC
    `, [courseId]);

    return rows;
  }

  const courseMarks = inMemoryStore.marks.filter(m => m.course_id === courseId);
  const map = new Map();

  for (const m of courseMarks) {
    if (!map.has(m.assessment_type)) {
      map.set(m.assessment_type, {
        assessmentType: m.assessment_type,
        maximumScore: m.maximum_score,
        scores: []
      });
    }
    map.get(m.assessment_type).scores.push(Number(m.score_obtained));
  }

  return Array.from(map.values()).map(entry => {
    const sum = entry.scores.reduce((a, b) => a + b, 0);
    const avg = entry.scores.length > 0 ? Math.round((sum / entry.scores.length) * 10) / 10 : 0;
    const max = entry.scores.length > 0 ? Math.max(...entry.scores) : 0;
    const min = entry.scores.length > 0 ? Math.min(...entry.scores) : 0;
    const passingCount = entry.scores.filter(s => (s / entry.maximumScore) >= 0.5).length;

    return {
      assessmentType: entry.assessmentType,
      maximumScore: entry.maximumScore,
      studentCount: entry.scores.length,
      averageScore: avg,
      highestScore: max,
      lowestScore: min,
      passingRate: entry.scores.length > 0 ? Math.round((passingCount / entry.scores.length) * 100) : 0
    };
  });
};

exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM marks ORDER BY created_at DESC LIMIT 100');
    return rows;
  }
  return inMemoryStore.marks.slice(-100);
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM marks WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return inMemoryStore.marks.find(m => m.id === id) || null;
};
