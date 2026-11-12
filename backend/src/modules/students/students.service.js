// Student demographic profiles, enrollments, and academic trajectories: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');

exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query("SELECT id, email, first_name, last_name, department, phone_number, is_active FROM users WHERE role = 'STUDENT'");
    return rows;
  }
  return inMemoryStore.users
    .filter(u => u.role === 'STUDENT')
    .map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      rollNumber: u.roll_number || `CS20240${u.id.slice(-2)}`,
      department: u.department,
      phoneNumber: u.phone_number,
      isActive: u.is_active
    }));
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query("SELECT id, email, first_name, last_name, department, phone_number, is_active FROM users WHERE id = $1 AND role = 'STUDENT'", [id]);
    return rows[0] || null;
  }
  const u = inMemoryStore.users.find(usr => usr.id === id && usr.role === 'STUDENT');
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    rollNumber: u.roll_number || `CS20240${u.id.slice(-2)}`,
    department: u.department,
    phoneNumber: u.phone_number,
    isActive: u.is_active
  };
};
