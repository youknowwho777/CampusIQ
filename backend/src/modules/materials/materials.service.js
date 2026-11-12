// Course study materials, syllabi, and reference document repository: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');
const { verifyCourseTeacher } = require('../teachers/teachers.service');

exports.findByCourse = async (courseId, userId, userRole) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      SELECT m.*, u.first_name, u.last_name, c.code as course_code
      FROM study_materials m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.course_id = $1
      ORDER BY m.created_at DESC
    `, [courseId]);
    return rows;
  }

  return inMemoryStore.studyMaterials
    .filter(m => m.course_id === courseId)
    .map(m => {
      const u = inMemoryStore.users.find(usr => usr.id === m.uploaded_by);
      const c = inMemoryStore.courses.find(crs => crs.id === m.course_id);
      return {
        id: m.id,
        courseId: m.course_id,
        courseCode: c ? c.code : '',
        title: m.title,
        fileUrl: m.file_url,
        fileType: m.file_type || 'PDF',
        uploadedBy: m.uploaded_by,
        uploaderName: u ? `${u.first_name} ${u.last_name}` : 'Faculty',
        createdAt: m.created_at
      };
    });
};

exports.createMaterial = async (data, userId, userRole) => {
  const { courseId, title, fileUrl, fileType } = data;
  const isAuthorized = await verifyCourseTeacher(courseId, userId, userRole);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You can only upload materials for your assigned courses.');
    err.statusCode = 403;
    throw err;
  }

  if (!title) {
    const err = new Error('Material title is required.');
    err.statusCode = 400;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const { rows } = await query(`
      INSERT INTO study_materials (course_id, title, file_url, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [courseId, title, fileUrl || 'https://storage.campusiq.edu/materials/doc.pdf', fileType || 'PDF', userId]);
    return rows[0];
  }

  const newMat = {
    id: `mat-${Date.now()}`,
    course_id: courseId,
    title,
    file_url: fileUrl || 'https://storage.campusiq.edu/materials/doc.pdf',
    file_type: fileType || 'PDF',
    uploaded_by: userId,
    created_at: new Date()
  };

  inMemoryStore.studyMaterials.push(newMat);
  return newMat;
};

exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM study_materials ORDER BY created_at DESC');
    return rows;
  }
  return inMemoryStore.studyMaterials;
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM study_materials WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return inMemoryStore.studyMaterials.find(m => m.id === id) || null;
};
