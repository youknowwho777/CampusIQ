// Automated integration test suite for Person 4: Admin Dashboard & Announcements Module
const request = require('supertest');
const app = require('../app');
const { testDbConnection, inMemoryStore } = require('../config/db.config');

beforeAll(async () => {
  await testDbConnection();
});

describe('CampusIQ Person 4: Admin Dashboard & Announcements Test Suite', () => {
  let adminToken = '';
  let teacherToken = '';
  let studentToken = '';

  let createdStudentId = '';
  let createdTeacherId = '';
  let createdCourseId = '';
  let createdAnnouncementId = '';

  test('1. Setup: Authenticate Admin (System Administrator)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@campusiq.edu',
        password: 'Admin@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    adminToken = res.body.data.tokens.accessToken;
  });

  test('2. Setup: Authenticate Faculty Teacher for RBAC Tests', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'faculty@campusiq.edu',
        password: 'Teacher@123'
      });

    expect(res.statusCode).toBe(200);
    teacherToken = res.body.data.tokens.accessToken;
  });

  test('3. Setup: Authenticate Student for RBAC Tests', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'student@campusiq.edu',
        password: 'Student@123'
      });

    expect(res.statusCode).toBe(200);
    studentToken = res.body.data.tokens.accessToken;
  });

  // ==========================================
  // Admin Dashboard Statistics
  // ==========================================
  test('4. Admin Dashboard Stats: GET /api/v1/admin/dashboard-stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard-stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.totalStudents).toBeGreaterThanOrEqual(1);
    expect(res.body.data.metrics.totalTeachers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.metrics.totalCourses).toBeGreaterThanOrEqual(1);
    expect(res.body.data.metrics.campusAttendanceRate).toBeDefined();
    expect(Array.isArray(res.body.data.recentActivities)).toBe(true);
    expect(Array.isArray(res.body.data.departmentsSummary)).toBe(true);
  });

  test('5. Security: Student and Teacher forbidden from Admin Dashboard Stats (403)', async () => {
    const res1 = await request(app)
      .get('/api/v1/admin/dashboard-stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res1.statusCode).toBe(403);

    const res2 = await request(app)
      .get('/api/v1/admin/dashboard-stats')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res2.statusCode).toBe(403);
  });

  // ==========================================
  // Student Management (CRUD)
  // ==========================================
  test('6. Add Student: POST /api/v1/admin/students', async () => {
    const res = await request(app)
      .post('/api/v1/admin/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Lucas',
        lastName: 'Scott',
        email: 'lucas.scott@campusiq.edu',
        password: 'Student@123',
        department: 'Computer Science & Engineering',
        phoneNumber: '+1-555-8888',
        rollNumber: 'CS2026101'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('lucas.scott@campusiq.edu');
    expect(res.body.data.rollNumber).toBe('CS2026101');
    createdStudentId = res.body.data.id;
  });

  test('7. Get Students: GET /api/v1/admin/students with search filter', async () => {
    const res = await request(app)
      .get('/api/v1/admin/students?search=Lucas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].email).toBe('lucas.scott@campusiq.edu');
  });

  test('8. Update Student: PUT /api/v1/admin/students/:id', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Lucas Updated',
        phoneNumber: '+1-555-9999',
        isActive: true
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Lucas Updated');
    expect(res.body.data.phoneNumber).toBe('+1-555-9999');
  });

  test('9. Delete Student: DELETE /api/v1/admin/students/:id', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deleted
    const verifyRes = await request(app)
      .get(`/api/v1/admin/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(verifyRes.statusCode).toBe(404);
  });

  // ==========================================
  // Teacher Management (CRUD)
  // ==========================================
  test('10. Add Teacher: POST /api/v1/admin/teachers', async () => {
    const res = await request(app)
      .post('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Prof. John',
        lastName: 'Nash',
        email: 'john.nash@campusiq.edu',
        password: 'Teacher@123',
        department: 'Computer Science & Engineering',
        phoneNumber: '+1-555-7777',
        role: 'TEACHER'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('john.nash@campusiq.edu');
    expect(res.body.data.role).toBe('TEACHER');
    createdTeacherId = res.body.data.id;
  });

  test('11. Get Teachers: GET /api/v1/admin/teachers', async () => {
    const res = await request(app)
      .get('/api/v1/admin/teachers?search=Nash')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].email).toBe('john.nash@campusiq.edu');
  });

  test('12. Update Teacher: PUT /api/v1/admin/teachers/:id', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/teachers/${createdTeacherId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Prof. John R.',
        phoneNumber: '+1-555-6666'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Nash');
  });

  test('13. Delete Teacher: DELETE /api/v1/admin/teachers/:id', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/teachers/${createdTeacherId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ==========================================
  // Subjects and Classes Management (CRUD)
  // ==========================================
  test('14. Add Subject / Course: POST /api/v1/admin/courses', async () => {
    const res = await request(app)
      .post('/api/v1/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'CS301',
        title: 'Compiler Design',
        section: 'Sec A',
        credits: 4,
        semester: 5,
        schedule: 'Tue, Thu 02:00 - 03:30 PM',
        room: 'Lab 102'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('CS301');
    expect(res.body.data.title).toBe('Compiler Design');
    createdCourseId = res.body.data.id;
  });

  test('15. Get Courses: GET /api/v1/admin/courses', async () => {
    const res = await request(app)
      .get('/api/v1/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const codes = res.body.data.map(c => c.code);
    expect(codes).toContain('CS301');
    expect(codes).toContain('CS201');
  });

  test('16. Update Course: PUT /api/v1/admin/courses/:id', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/courses/${createdCourseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Advanced Compiler Design & Optimization',
        credits: 4,
        section: 'Sec B'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Advanced Compiler Design & Optimization');
    expect(res.body.data.section).toBe('Sec B');
  });

  test('17. Delete Course: DELETE /api/v1/admin/courses/:id', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/courses/${createdCourseId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ==========================================
  // Overall Attendance Statistics
  // ==========================================
  test('18. Overall Attendance Stats: GET /api/v1/admin/attendance/stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/attendance/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overallPercentage).toBeDefined();
    expect(res.body.data.distribution).toBeDefined();
    expect(res.body.data.distribution.present).toBeDefined();
    expect(Array.isArray(res.body.data.courseStats)).toBe(true);
    expect(Array.isArray(res.body.data.dailyTrend)).toBe(true);
    expect(res.body.data.statutoryThreshold).toBe(75);
  });

  // ==========================================
  // Announcements Management (CRUD)
  // ==========================================
  test('19. Create Announcement: POST /api/v1/announcements', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Semester End Project Exhibition 2026',
        content: 'All final year and third year students must submit and showcase their capstone software engineering projects.',
        targetRole: 'ALL',
        category: 'EVENT',
        priority: 'HIGH',
        isPinned: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Semester End Project Exhibition 2026');
    expect(res.body.data.isPinned).toBe(true);
    createdAnnouncementId = res.body.data.id;
  });

  test('20. Get Announcements: GET /api/v1/announcements', async () => {
    const res = await request(app)
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${studentToken}`); // Accessible to students too!

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const titles = res.body.data.map(a => a.title);
    expect(titles).toContain('Semester End Project Exhibition 2026');
  });

  test('21. Update Announcement: PUT /api/v1/announcements/:id', async () => {
    const res = await request(app)
      .put(`/api/v1/announcements/${createdAnnouncementId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Semester End Project Exhibition 2026 – Final Dates',
        priority: 'URGENT'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Final Dates');
    expect(res.body.data.priority).toBe('URGENT');
  });

  test('22. Toggle Announcement Pin: PATCH /api/v1/announcements/:id/pin', async () => {
    const res = await request(app)
      .patch(`/api/v1/announcements/${createdAnnouncementId}/pin`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('23. Delete Announcement: DELETE /api/v1/announcements/:id', async () => {
    const res = await request(app)
      .delete(`/api/v1/announcements/${createdAnnouncementId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('24. Security: Student forbidden from creating announcements (403)', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Hacked Announcement',
        content: 'This should be blocked'
      });

    expect(res.statusCode).toBe(403);
  });
});
