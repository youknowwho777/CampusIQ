// Automated integration test suite for Person 3: Teacher Dashboard & Teacher Module
const request = require('supertest');
const app = require('../app');
const { testDbConnection, inMemoryStore } = require('../config/db.config');

beforeAll(async () => {
  await testDbConnection();
});

describe('CampusIQ Person 3: Teacher Dashboard & Module Test Suite', () => {
  let teacherToken = '';
  let studentToken = '';
  let sampleCourseId = 'e0000000-0000-0000-0000-000000000001'; // CS201 taught by Prof. Sarah Connor
  let studentId1 = 'c0000000-0000-0000-0000-000000000003';
  let studentId2 = 'c0000000-0000-0000-0000-000000000004';

  test('1. Setup: Authenticate Faculty Teacher (Prof. Sarah Connor)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'faculty@campusiq.edu',
        password: 'Teacher@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('TEACHER');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    teacherToken = res.body.data.tokens.accessToken;
  });

  test('2. Setup: Authenticate Student (Alex Johnson)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'student@campusiq.edu',
        password: 'Student@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');
    studentToken = res.body.data.tokens.accessToken;
  });

  test('3. Teacher Dashboard Stats: GET /api/v1/teachers/dashboard-stats', async () => {
    const res = await request(app)
      .get('/api/v1/teachers/dashboard-stats')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedClassesCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalStudentsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.averageAttendanceRate).toBeDefined();
    expect(Array.isArray(res.body.data.assignedClasses)).toBe(true);
    expect(Array.isArray(res.body.data.upcomingTasks)).toBe(true);
  });

  test('4. Security: Student forbidden from accessing Teacher Dashboard Stats (403)', async () => {
    const res = await request(app)
      .get('/api/v1/teachers/dashboard-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  test('5. Assigned Classes: GET /api/v1/teachers/classes', async () => {
    const res = await request(app)
      .get('/api/v1/teachers/classes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    const codes = res.body.data.map(c => c.code);
    expect(codes).toContain('CS201');
    expect(codes).toContain('CS203');
  });

  test('6. Class Details & Roster: GET /api/v1/teachers/classes/:id', async () => {
    const res = await request(app)
      .get(`/api/v1/teachers/classes/${sampleCourseId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('CS201');
    expect(Array.isArray(res.body.data.students)).toBe(true);
    expect(res.body.data.students.length).toBeGreaterThan(0);
    expect(res.body.data.students[0].email).toBeDefined();
    expect(res.body.data.students[0].rollNumber).toBeDefined();
  });

  test('7. Teacher Students Directory: GET /api/v1/teachers/students', async () => {
    const res = await request(app)
      .get('/api/v1/teachers/students')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data[0].overallAttendanceRate).toBeDefined();
  });

  test('8. Attendance: GET /api/v1/attendance/course/:courseId', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/course/${sampleCourseId}?date=2026-11-10`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data[0].status).toBeDefined();
  });

  test('9. Attendance Batch Submission: POST /api/v1/attendance/batch', async () => {
    const testDate = '2026-11-11';
    const res = await request(app)
      .post('/api/v1/attendance/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        attendanceDate: testDate,
        records: [
          { studentId: studentId1, status: 'PRESENT' },
          { studentId: studentId2, status: 'LATE' }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processedCount).toBe(2);

    // Verify submission persisted
    const verifyRes = await request(app)
      .get(`/api/v1/attendance/course/${sampleCourseId}?date=${testDate}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(verifyRes.statusCode).toBe(200);
    const rec1 = verifyRes.body.data.find(r => r.studentId === studentId1);
    expect(rec1.status).toBe('PRESENT');
    const rec2 = verifyRes.body.data.find(r => r.studentId === studentId2);
    expect(rec2.status).toBe('LATE');
  });

  test('10. Attendance Validation: Reject invalid attendance status', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        attendanceDate: '2026-11-12',
        records: [
          { studentId: studentId1, status: 'UNKNOWN_STATUS' }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('11. Attendance Validation: Reject duplicate student in same batch', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        attendanceDate: '2026-11-12',
        records: [
          { studentId: studentId1, status: 'PRESENT' },
          { studentId: studentId1, status: 'ABSENT' }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('12. Attendance History: GET /api/v1/attendance/course/:courseId/history', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/course/${sampleCourseId}/history`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].attendanceDate).toBeDefined();
    expect(res.body.data[0].presentCount).toBeDefined();
  });

  test('13. Marks: GET /api/v1/marks/course/:courseId', async () => {
    const res = await request(app)
      .get(`/api/v1/marks/course/${sampleCourseId}?assessmentType=Quiz 1`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('14. Marks Batch Submission: POST /api/v1/marks/batch', async () => {
    const res = await request(app)
      .post('/api/v1/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        assessmentType: 'Midterm Exam 2',
        maximumScore: 100,
        records: [
          { studentId: studentId1, scoreObtained: 88.5, remarks: 'Good work' },
          { studentId: studentId2, scoreObtained: 92.0, remarks: 'Excellent' }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processedCount).toBe(2);

    // Verify marks persisted
    const verifyRes = await request(app)
      .get(`/api/v1/marks/course/${sampleCourseId}?assessmentType=Midterm Exam 2`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(verifyRes.statusCode).toBe(200);
    const m1 = verifyRes.body.data.find(r => r.studentId === studentId1);
    expect(m1.scoreObtained).toBe(88.5);
  });

  test('15. Marks Validation: Reject score exceeding maximum score', async () => {
    const res = await request(app)
      .post('/api/v1/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        assessmentType: 'Quiz 3',
        maximumScore: 50,
        records: [
          { studentId: studentId1, scoreObtained: 55 } // Exceeds 50
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('16. Marks Validation: Reject negative score', async () => {
    const res = await request(app)
      .post('/api/v1/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        assessmentType: 'Quiz 3',
        maximumScore: 50,
        records: [
          { studentId: studentId1, scoreObtained: -5 }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('17. Security: Student forbidden from submitting attendance or marks (403)', async () => {
    const attRes = await request(app)
      .post('/api/v1/attendance/batch')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        courseId: sampleCourseId,
        attendanceDate: '2026-11-12',
        records: [{ studentId: studentId1, status: 'PRESENT' }]
      });
    expect(attRes.statusCode).toBe(403);

    const mrkRes = await request(app)
      .post('/api/v1/marks/batch')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        courseId: sampleCourseId,
        assessmentType: 'Fake Quiz',
        maximumScore: 100,
        records: [{ studentId: studentId1, scoreObtained: 100 }]
      });
    expect(mrkRes.statusCode).toBe(403);
  });

  test('18. Assignments: Create and Fetch assignments', async () => {
    const createRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        title: 'DSA Lab Assignment 4 – Graph Traversal',
        description: 'Implement BFS and DFS with adjacency list representation.',
        dueDate: '2026-11-25T23:59:00Z',
        maxScore: 50
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe('DSA Lab Assignment 4 – Graph Traversal');

    const getRes = await request(app)
      .get(`/api/v1/assignments/course/${sampleCourseId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);
    const titles = getRes.body.data.map(a => a.title);
    expect(titles).toContain('DSA Lab Assignment 4 – Graph Traversal');
  });

  test('19. Study Materials: Upload and Fetch course materials', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/materials')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        courseId: sampleCourseId,
        title: 'Lecture 12 – Minimum Spanning Trees (Kruskal & Prim).pdf',
        fileUrl: 'https://storage.campusiq.edu/materials/cs201-mst.pdf',
        fileType: 'PDF'
      });

    expect(uploadRes.statusCode).toBe(201);
    expect(uploadRes.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/materials/course/${sampleCourseId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);
    const matTitles = getRes.body.data.map(m => m.title);
    expect(matTitles).toContain('Lecture 12 – Minimum Spanning Trees (Kruskal & Prim).pdf');
  });
});
