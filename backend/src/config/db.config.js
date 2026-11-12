// PostgreSQL database configuration & resilient data adapter
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'campusiq_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000
});

let isPostgresConnected = false;

// In-memory fallback repository for resilient development when local PostgreSQL service is not yet started
const inMemoryStore = {
  roles: [
    { id: 1, name: 'ADMIN', description: 'Institutional administrator' },
    { id: 2, name: 'TEACHER', description: 'Academic faculty' },
    { id: 3, name: 'STUDENT', description: 'Enrolled student' },
    { id: 4, name: 'HOD', description: 'Head of department' }
  ],
  users: [],
  refreshTokens: new Set()
};

// Seed initial demo users in memory
async function seedDefaultUsersInMemory() {
  if (inMemoryStore.users.length > 0) return;

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const teacherHash = await bcrypt.hash('Teacher@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  inMemoryStore.users.push(
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@campusiq.edu',
      password_hash: adminHash,
      role: 'ADMIN',
      first_name: 'System',
      last_name: 'Administrator',
      department: 'Administration',
      phone_number: '+1-555-0100',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      email: 'faculty@campusiq.edu',
      password_hash: teacherHash,
      role: 'TEACHER',
      first_name: 'Prof. Sarah',
      last_name: 'Connor',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0101',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      email: 'student@campusiq.edu',
      password_hash: studentHash,
      role: 'STUDENT',
      first_name: 'Alex',
      last_name: 'Johnson',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0102',
      is_active: true,
      created_at: new Date()
    }
  );
}

// Initialize PostgreSQL schema if connected
async function initPostgresSchema(client) {
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'HOD', 'TEACHER', 'STUDENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name user_role NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'STUDENT',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        phone_number VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO roles (name, description) VALUES
      ('ADMIN', 'Full system access and institutional governance'),
      ('HOD', 'Head of Department overseeing faculty and syllabi'),
      ('TEACHER', 'Faculty recording attendance, marks, and assignments'),
      ('STUDENT', 'Enrolled student accessing courses and viewing marks')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed default admin if table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count, 10) === 0) {
      const adminHash = await bcrypt.hash('Admin@123', 10);
      const teacherHash = await bcrypt.hash('Teacher@123', 10);
      const studentHash = await bcrypt.hash('Student@123', 10);

      await client.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name, department) VALUES
        ('admin@campusiq.edu', $1, 'ADMIN', 'System', 'Administrator', 'Administration'),
        ('faculty@campusiq.edu', $2, 'TEACHER', 'Prof. Sarah', 'Connor', 'Computer Science & Engineering'),
        ('student@campusiq.edu', $3, 'STUDENT', 'Alex', 'Johnson', 'Computer Science & Engineering')
      `, [adminHash, teacherHash, studentHash]);
      console.log('[Database] Seeded initial administrator, faculty, and student accounts into PostgreSQL.');
    }
  } catch (err) {
    console.error('[Database] Schema auto-initialization warning:', err.message);
  }
}

async function testDbConnection() {
  await seedDefaultUsersInMemory();
  try {
    const client = await pool.connect();
    isPostgresConnected = true;
    console.log('[Database] Connected successfully to PostgreSQL database:', process.env.DB_NAME || 'campusiq_db');
    await initPostgresSchema(client);
    client.release();
    return true;
  } catch (error) {
    isPostgresConnected = false;
    console.log('[Database] PostgreSQL service not detected on host (fallback active):', error.message);
    console.log('[Database] In-memory persistence engine activated with default accounts: admin@campusiq.edu, faculty@campusiq.edu, student@campusiq.edu');
    return false;
  }
}

// Unified Query interface wrapping PostgreSQL pool with in-memory fallback
async function query(text, params = []) {
  if (isPostgresConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('[Database Error]', err.message);
      throw err;
    }
  }

  // Handle fallback in-memory queries for Auth & User tables
  const upperQuery = text.toUpperCase();

  // Find user by ID
  if (upperQuery.includes('FROM USERS') && (upperQuery.includes('WHERE ID =') || upperQuery.includes('WHERE ID='))) {
    const id = params[0];
    const user = inMemoryStore.users.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Find user by email
  if (upperQuery.includes('FROM USERS') && (upperQuery.includes('WHERE EMAIL =') || upperQuery.includes('WHERE EMAIL='))) {
    const email = params[0]?.toLowerCase().trim();
    const user = inMemoryStore.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // List users with optional role filtering
  if (upperQuery.includes('SELECT') && upperQuery.includes('FROM USERS')) {
    let result = [...inMemoryStore.users];
    if (upperQuery.includes('WHERE ROLE') && params.length > 0 && params[0]) {
      result = result.filter(u => u.role === params[0].toUpperCase());
    }
    return { rows: result, rowCount: result.length };
  }

  // Insert user
  if (upperQuery.includes('INSERT INTO USERS')) {
    // $1: email, $2: password_hash, $3: role, $4: first_name, $5: last_name, $6: department, $7: phone_number
    const crypto = require('crypto');
    const newUser = {
      id: crypto.randomUUID(),
      email: params[0].toLowerCase().trim(),
      password_hash: params[1],
      role: params[2],
      first_name: params[3],
      last_name: params[4],
      department: params[5] || null,
      phone_number: params[6] || null,
      is_active: true,
      created_at: new Date()
    };
    inMemoryStore.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  // Update user role
  if (upperQuery.includes('UPDATE USERS SET ROLE')) {
    const role = params[0];
    const id = params[1];
    const user = inMemoryStore.users.find(u => u.id === id);
    if (user) user.role = role;
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Update user active status
  if (upperQuery.includes('UPDATE USERS SET IS_ACTIVE')) {
    const isActive = params[0];
    const id = params[1];
    const user = inMemoryStore.users.find(u => u.id === id);
    if (user) user.is_active = isActive;
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Refresh token store
  if (upperQuery.includes('INSERT INTO REFRESH_TOKENS')) {
    inMemoryStore.refreshTokens.add(params[0]);
    return { rows: [], rowCount: 1 };
  }

  if (upperQuery.includes('DELETE FROM REFRESH_TOKENS')) {
    inMemoryStore.refreshTokens.delete(params[0]);
    return { rows: [], rowCount: 1 };
  }

  if (upperQuery.includes('SELECT') && upperQuery.includes('FROM REFRESH_TOKENS')) {
    const exists = inMemoryStore.refreshTokens.has(params[0]);
    return { rows: exists ? [{ token: params[0] }] : [], rowCount: exists ? 1 : 0 };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  pool,
  query,
  testDbConnection,
  getIsPostgresConnected: () => isPostgresConnected,
  inMemoryStore
};
