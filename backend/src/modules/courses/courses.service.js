// Curriculum, subjects, course catalogs, and syllabus definitions: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');

exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM courses ORDER BY code ASC');
    return rows;
  }
  return inMemoryStore.courses;
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT * FROM courses WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return inMemoryStore.courses.find(c => c.id === id) || null;
};
