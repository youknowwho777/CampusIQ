// Supertest automated integration test suite for Authentication and RBAC
const mime = require('mime');
if (!mime.getType) {
  mime.getType = (path) => mime.lookup(path);
}
if (!mime.getExtension) {
  mime.getExtension = (type) => mime.extension(type);
}

const request = require('supertest');
const app = require('../../backend/src/app');
const { testDbConnection } = require('../../backend/src/config/db.config');

beforeAll(async () => {
  await testDbConnection();
});

describe('CampusIQ Person 1: Authentication & RBAC Test Suite', () => {
  let studentToken = '';
  let adminToken = '';
  let refreshToken = '';

  test('1. System Health Check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('2. Public Registration: Create new Student account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newstudent@campusiq.edu',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
        department: 'Computer Science & Engineering'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  test('3. Public Registration: Prevent unauthorized ADMIN account creation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'fakeadmin@campusiq.edu',
        password: 'Password@123',
        firstName: 'Hacker',
        lastName: 'Man',
        role: 'ADMIN'
      });

    expect([400, 403]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });

  test('4. Public Registration: Prevent duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newstudent@campusiq.edu',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('5. Login: Student authentication with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'newstudent@campusiq.edu',
        password: 'Password@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    studentToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  test('6. Login: Rejection of incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'newstudent@campusiq.edu',
        password: 'WrongPassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('7. Protected Route: GET /api/v1/auth/me with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('newstudent@campusiq.edu');
    expect(res.body.data.role).toBe('STUDENT');
  });

  test('8. Protected Route: Reject request with missing Bearer token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('9. Token Refresh: Obtain new Access Token using Refresh Token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('10. RBAC Protection: Student accessing ADMIN user directory is Forbidden (403)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  test('11. RBAC Protection: Admin authentication & privileged access to user directory', async () => {
    // Login as pre-seeded Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@campusiq.edu',
        password: 'Admin@123'
      });

    expect(loginRes.statusCode).toBe(200);
    adminToken = loginRes.body.data.tokens.accessToken;

    // Access privileged /api/v1/users
    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(usersRes.statusCode).toBe(200);
    expect(usersRes.body.success).toBe(true);
    expect(Array.isArray(usersRes.body.data)).toBe(true);
  });

  test('12. Logout: Revoke session refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
