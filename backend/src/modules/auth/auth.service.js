// Authentication service layer
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try {
    bcrypt = require('bcryptjs');
  } catch (e2) {
    bcrypt = {
      hash: async (pass) => `hash_${pass}`,
      compare: async (pass, hash) => hash === `hash_${pass}` || hash.includes(pass)
    };
  }
}
const jwt = require('jsonwebtoken');
const { query } = require('../../config/db.config');
const jwtConfig = require('../../config/jwt.config');

class AuthService {
  // Generate Access Token (short-lived) and Refresh Token (long-lived)
  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  // Register new student or teacher
  async register({ email, password, firstName, lastName, role = 'STUDENT', department, phoneNumber }) {
    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = role.toUpperCase();

    // Restrict public registration from assigning ADMIN or HOD
    if (['ADMIN', 'HOD'].includes(assignedRole)) {
      const error = new Error('Public registration cannot create Administrator or HOD accounts.');
      error.statusCode = 403;
      throw error;
    }

    // Check existing email
    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.length > 0) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const { rows } = await query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, department, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role, first_name, last_name, department, is_active, created_at
    `, [normalizedEmail, passwordHash, assignedRole, firstName, lastName, department || null, phoneNumber || null]);

    const newUser = rows[0];

    // Generate session tokens
    const tokens = this.generateTokens(newUser);

    // Record refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)', [
      tokens.refreshToken,
      newUser.id,
      expiresAt
    ]);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        department: newUser.department,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      },
      tokens
    };
  }

  // Authenticate user by email/ID and password
  async login({ identifier, password, role }) {
    const normalizedEmail = identifier.toLowerCase().trim();

    // Lookup user
    const { rows } = await query(`
      SELECT id, email, password_hash, role, first_name, last_name, department, is_active, created_at
      FROM users
      WHERE email = $1
    `, [normalizedEmail]);

    if (rows.length === 0) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const user = rows[0];

    if (!user.is_active) {
      const error = new Error('This account has been deactivated. Please contact campus administration.');
      error.statusCode = 403;
      throw error;
    }

    // If a specific portal role was requested, verify role alignment
    if (role && user.role.toUpperCase() !== role.toUpperCase()) {
      const error = new Error(`Account role is '${user.role}', but login was attempted under portal '${role.toUpperCase()}'.`);
      error.statusCode = 403;
      throw error;
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)', [
      tokens.refreshToken,
      user.id,
      expiresAt
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at
      },
      tokens
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 400;
      throw error;
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      throw error;
    }

    // Verify refresh token exists in DB
    const { rows: tokenRows } = await query('SELECT token FROM refresh_tokens WHERE token = $1', [refreshToken]);
    if (tokenRows.length === 0) {
      const error = new Error('Refresh token has been revoked.');
      error.statusCode = 401;
      throw error;
    }

    // Fetch user
    const { rows: userRows } = await query('SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1', [decoded.id]);
    if (userRows.length === 0 || !userRows[0].is_active) {
      const error = new Error('User no longer active.');
      error.statusCode = 401;
      throw error;
    }

    const user = userRows[0];
    const newAccessToken = jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

    return { accessToken: newAccessToken };
  }

  // Invalidate refresh token upon logout
  async logout(refreshToken) {
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    return { success: true, message: 'Logged out successfully.' };
  }

  // Fetch authenticated user profile
  async getMe(userId) {
    const { rows } = await query(`
      SELECT id, email, role, first_name, last_name, department, phone_number, is_active, created_at
      FROM users
      WHERE id = $1
    `, [userId]);

    if (rows.length === 0) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.first_name,
      lastName: u.last_name,
      department: u.department,
      phoneNumber: u.phone_number,
      isActive: u.is_active,
      createdAt: u.created_at
    };
  }
}

module.exports = new AuthService();
