// Homework, project assignments, student submissions, and grading workflows: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');
const { verifyCourseTeacher } = require('../teachers/teachers.service');

exports.findByCourse = async (courseId, userId, userRole) => {
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not assigned to instruct this course.');
    err.statusCode = 403;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      SELECT 
        a.id, a.title, a.description, a.due_date, a.max_score, a.created_by, a.created_at,
        c.code as course_code, c.title as course_title,
        COUNT(s.id)::int as submission_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
      WHERE a.course_id = $1
      GROUP BY a.id, a.title, a.description, a.due_date, a.max_score, a.created_by, a.created_at, c.code, c.title
      ORDER BY a.due_date DESC
    `, [courseId]);
    return rows;
  }

  return inMemoryStore.assignments
    .filter(a => a.course_id === courseId)
    .map(a => {
      const course = inMemoryStore.courses.find(c => c.id === a.course_id);
      const subs = inMemoryStore.assignmentSubmissions.filter(s => s.assignment_id === a.id);
      return {
        id: a.id,
        courseId: a.course_id,
        courseCode: course ? course.code : '',
        courseTitle: course ? course.title : '',
        title: a.title,
        description: a.description,
        dueDate: a.due_date,
        maxScore: a.max_score,
        createdBy: a.created_by,
        createdAt: a.created_at,
        submissionCount: subs.length
      };
    });
};

exports.createAssignment = async (data, userId, userRole) => {
  const { courseId, title, description, dueDate, maxScore } = data;
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You can only create assignments for assigned courses.');
    err.statusCode = 403;
    throw err;
  }

  if (!title || !dueDate) {
    const err = new Error('Title and due date are required.');
    err.statusCode = 400;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      INSERT INTO assignments (course_id, title, description, due_date, max_score, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [courseId, title, description || '', dueDate, maxScore || 100, userId]);
    return rows[0];
  }

  const newAssignment = {
    id: `asn-${Date.now()}`,
    course_id: courseId,
    title,
    description: description || '',
    due_date: dueDate,
    max_score: Number(maxScore) || 100,
    created_by: userId,
    created_at: new Date()
  };

  inMemoryStore.assignments.push(newAssignment);
  return newAssignment;
};

exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM assignments ORDER BY due_date DESC');
    return rows;
  }
  return inMemoryStore.assignments;
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM assignments WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return inMemoryStore.assignments.find(a => a.id === id) || null;
};
