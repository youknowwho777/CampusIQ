// Student attendance session tracking, aggregate statistics, and batch updates: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');
const { verifyCourseTeacher } = require('../teachers/teachers.service');

// Get Attendance for a course on a specific date (or default latest date)
exports.getAttendanceByCourseAndDate = async (courseId, date, userId, userRole) => {
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
        COALESCE(a.status, 'PRESENT') as status,
        a.id as attendance_id,
        a.attendance_date,
        a.source
      FROM users u
      JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1 AND e.status = 'ACTIVE'
      LEFT JOIN attendance a ON a.student_id = u.id AND a.course_id = $1 AND a.attendance_date = $2
      ORDER BY u.last_name ASC, u.first_name ASC
    `, [courseId, date]);

    return rows;
  }

  const courseEnrollments = inMemoryStore.enrollments.filter(e => e.course_id === courseId && e.status === 'ACTIVE');
  const studentIds = courseEnrollments.map(e => e.student_id);

  return inMemoryStore.users
    .filter(u => studentIds.includes(u.id))
    .map(u => {
      const existing = inMemoryStore.attendance.find(a =>
        a.course_id === courseId && a.student_id === u.id && a.attendance_date === date
      );

      // Student historical attendance percentage in this course
      const allStudentAtt = inMemoryStore.attendance.filter(a => a.course_id === courseId && a.student_id === u.id);
      const pres = allStudentAtt.filter(a => a.status === 'PRESENT').length;
      const rate = allStudentAtt.length > 0 ? Math.round((pres / allStudentAtt.length) * 100) : 100;

      return {
        studentId: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        rollNumber: u.roll_number || `CS20240${u.id.slice(-2)}`,
        status: existing ? existing.status : 'PRESENT',
        attendanceId: existing ? existing.id : null,
        attendanceDate: date,
        historicalAttendanceRate: rate,
        isExistingRecord: !!existing
      };
    });
};

// Batch Record / Upsert Attendance for a Course Session
exports.recordBatchAttendance = async (courseId, attendanceDate, records, userId, userRole) => {
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not authorized to mark attendance for this course.');
    err.statusCode = 403;
    throw err;
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    const err = new Error('Invalid attendance date format. Expected YYYY-MM-DD.');
    err.statusCode = 400;
    throw err;
  }

  // Validate allowed statuses
  const ALLOWED_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  for (const rec of records) {
    if (!rec.studentId) {
      const err = new Error('Each attendance record must contain a valid studentId.');
      err.statusCode = 400;
      throw err;
    }
    const st = String(rec.status).toUpperCase();
    if (!ALLOWED_STATUSES.includes(st)) {
      const err = new Error(`Invalid attendance status '${rec.status}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    rec.status = st;
  }

  // Check duplicate student IDs in submission
  const seenStudents = new Set();
  for (const rec of records) {
    if (seenStudents.has(rec.studentId)) {
      const err = new Error(`Duplicate entry for student ID '${rec.studentId}' in attendance submission.`);
      err.statusCode = 400;
      throw err;
    }
    seenStudents.add(rec.studentId);
  }

  // Verify that all submitted students are actually enrolled in the course
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
          INSERT INTO attendance (course_id, student_id, attendance_date, status, source)
          VALUES ($1, $2, $3, $4, 'MANUAL')
          ON CONFLICT (course_id, student_id, attendance_date)
          DO UPDATE SET status = EXCLUDED.status, created_at = CURRENT_TIMESTAMP
        `, [courseId, rec.studentId, attendanceDate, rec.status]);
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
      attendanceDate,
      processedCount: records.length,
      message: 'Attendance saved successfully.'
    };
  }

  // In-memory fallback upsert
  let upsertCount = 0;
  for (const rec of records) {
    const idx = inMemoryStore.attendance.findIndex(a =>
      a.course_id === courseId && a.student_id === rec.studentId && a.attendance_date === attendanceDate
    );

    if (idx !== -1) {
      inMemoryStore.attendance[idx].status = rec.status;
      inMemoryStore.attendance[idx].updated_at = new Date();
    } else {
      inMemoryStore.attendance.push({
        id: `att-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        course_id: courseId,
        student_id: rec.studentId,
        attendance_date: attendanceDate,
        status: rec.status,
        source: 'MANUAL',
        created_at: new Date()
      });
    }
    upsertCount++;
  }

  return {
    courseId,
    attendanceDate,
    processedCount: upsertCount,
    message: 'Attendance session recorded and synced successfully.'
  };
};

// Get Session History for a Course
exports.getCourseAttendanceHistory = async (courseId, userId, userRole) => {
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not assigned to instruct this course.');
    err.statusCode = 403;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      SELECT 
        attendance_date,
        COUNT(id)::int as total_students,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END)::int as present_count,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END)::int as absent_count,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END)::int as late_count,
        ROUND((SUM(CASE WHEN status = 'PRESENT' THEN 1.0 ELSE 0.0 END) / COUNT(id)) * 100, 1) as percentage
      FROM attendance
      WHERE course_id = $1
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
    `, [courseId]);

    return rows;
  }

  const courseAtt = inMemoryStore.attendance.filter(a => a.course_id === courseId);
  const dateMap = new Map();

  for (const a of courseAtt) {
    if (!dateMap.has(a.attendance_date)) {
      dateMap.set(a.attendance_date, {
        attendanceDate: a.attendance_date,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0
      });
    }
    const entry = dateMap.get(a.attendance_date);
    entry.totalStudents++;
    if (a.status === 'PRESENT') entry.presentCount++;
    else if (a.status === 'ABSENT') entry.absentCount++;
    else if (a.status === 'LATE') entry.lateCount++;
    else if (a.status === 'EXCUSED') entry.excusedCount++;
  }

  const history = Array.from(dateMap.values()).map(h => ({
    ...h,
    percentage: h.totalStudents > 0 ? Math.round((h.presentCount / h.totalStudents) * 100) : 0
  }));

  return history.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
};

exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM attendance ORDER BY created_at DESC LIMIT 100');
    return rows;
  }
  return inMemoryStore.attendance.slice(-100);
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM attendance WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return inMemoryStore.attendance.find(a => a.id === id) || null;
};
