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
  refreshTokens: new Set(),
  departments: [],
  courses: [],
  enrollments: [],
  attendance: [],
  marks: [],
  assignments: [],
  assignmentSubmissions: [],
  studyMaterials: []
};

// Seed initial demo users and academic data in memory
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
      roll_number: 'CS2024001',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      email: 'sophia.m@campusiq.edu',
      password_hash: studentHash,
      role: 'STUDENT',
      first_name: 'Sophia',
      last_name: 'Thompson',
      year: '2nd Year',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0103',
      roll_number: 'CS2024002',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      email: 'liam.c@campusiq.edu',
      password_hash: studentHash,
      role: 'STUDENT',
      first_name: 'Liam',
      last_name: 'Chen',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0104',
      roll_number: 'CS2024003',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000006',
      email: 'emma.d@campusiq.edu',
      password_hash: studentHash,
      role: 'STUDENT',
      first_name: 'Emma',
      last_name: 'Davis',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0105',
      roll_number: 'CS2024004',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000007',
      email: 'noah.p@campusiq.edu',
      password_hash: studentHash,
      role: 'STUDENT',
      first_name: 'Noah',
      last_name: 'Patel',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0106',
      roll_number: 'CS2024005',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000008',
      email: 'olivia.w@campusiq.edu',
      password_hash: studentHash,
      role: 'STUDENT',
      first_name: 'Olivia',
      last_name: 'Wilson',
      department: 'Computer Science & Engineering',
      phone_number: '+1-555-0107',
      roll_number: 'CS2024006',
      is_active: true,
      created_at: new Date()
    }
  );

  // Seed Departments
  inMemoryStore.departments.push({
    id: 'd0000000-0000-0000-0000-000000000001',
    code: 'CSE',
    name: 'Computer Science & Engineering',
    head_of_department_id: 'b0000000-0000-0000-0000-000000000002',
    created_at: new Date()
  });

  // Seed Assigned Courses for Prof. Sarah Connor
  inMemoryStore.courses.push(
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      code: 'CS201',
      title: 'Data Structures & Algorithms',
      department_id: 'd0000000-0000-0000-0000-000000000001',
      teacher_id: 'b0000000-0000-0000-0000-000000000002',
      section: 'Sec A',
      credits: 4,
      semester: 3,
      schedule: 'Mon, Wed 09:00 - 10:30 AM',
      room: 'Hall 302',
      created_at: new Date()
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      code: 'CS203',
      title: 'Database Management Systems',
      department_id: 'd0000000-0000-0000-0000-000000000001',
      teacher_id: 'b0000000-0000-0000-0000-000000000002',
      section: 'Sec B',
      credits: 4,
      semester: 3,
      schedule: 'Tue, Thu 11:00 AM - 12:30 PM',
      room: 'Lab 204',
      created_at: new Date()
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      code: 'CS205',
      title: 'Operating Systems',
      department_id: 'd0000000-0000-0000-0000-000000000001',
      teacher_id: 'b0000000-0000-0000-0000-000000000002',
      section: 'Sec A',
      credits: 3,
      semester: 5,
      schedule: 'Wed, Fri 02:00 - 03:30 PM',
      room: 'Hall 410',
      created_at: new Date()
    },
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      code: 'CS207',
      title: 'Software Engineering',
      department_id: 'd0000000-0000-0000-0000-000000000001',
      teacher_id: 'b0000000-0000-0000-0000-000000000002',
      section: 'Sec C',
      credits: 3,
      semester: 5,
      schedule: 'Mon, Thu 03:45 - 05:15 PM',
      room: 'Seminar Room 1',
      created_at: new Date()
    }
  );

  // Seed Enrollments
  const enroll = (studentId, courseId) => ({
    id: `enr-${studentId.slice(-3)}-${courseId.slice(-3)}`,
    student_id: studentId,
    course_id: courseId,
    enrollment_date: '2026-08-15',
    status: 'ACTIVE'
  });

  // CS201: 6 students
  ['c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008']
    .forEach(sid => inMemoryStore.enrollments.push(enroll(sid, 'e0000000-0000-0000-0000-000000000001')));

  // CS203: 4 students
  ['c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006']
    .forEach(sid => inMemoryStore.enrollments.push(enroll(sid, 'e0000000-0000-0000-0000-000000000002')));

  // CS205: 4 students
  ['c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000007']
    .forEach(sid => inMemoryStore.enrollments.push(enroll(sid, 'e0000000-0000-0000-0000-000000000003')));

  // CS207: 4 students
  ['c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008']
    .forEach(sid => inMemoryStore.enrollments.push(enroll(sid, 'e0000000-0000-0000-0000-000000000004')));

  // Seed Attendance Sessions across recent dates
  const pastDates = ['2026-11-04', '2026-11-06', '2026-11-08', '2026-11-10'];
  let attCounter = 1;

  for (const c of inMemoryStore.courses) {
    const courseEnrolled = inMemoryStore.enrollments.filter(e => e.course_id === c.id);
    for (const d of pastDates) {
      for (const enr of courseEnrolled) {
        // Mostly present, occasional late or absent
        const isAbsent = (attCounter % 11 === 0);
        const isLate = (attCounter % 7 === 0);
        const status = isAbsent ? 'ABSENT' : (isLate ? 'LATE' : 'PRESENT');
        inMemoryStore.attendance.push({
          id: `att-${attCounter++}`,
          course_id: c.id,
          student_id: enr.student_id,
          attendance_date: d,
          status,
          source: 'MANUAL',
          created_at: new Date(d)
        });
      }
    }
  }

  // Seed Marks
  let markCounter = 1;
  const assessmentTypes = [
    { type: 'Quiz 1', max: 50, weight: 10 },
    { type: 'Midterm Exam', max: 100, weight: 30 }
  ];

  for (const c of inMemoryStore.courses) {
    const courseEnrolled = inMemoryStore.enrollments.filter(e => e.course_id === c.id);
    for (const asm of assessmentTypes) {
      for (const enr of courseEnrolled) {
        // Realistic score between 70% and 95%
        const score = Math.round(asm.max * (0.68 + (markCounter % 30) / 100) * 10) / 10;
        inMemoryStore.marks.push({
          id: `mrk-${markCounter++}`,
          course_id: c.id,
          student_id: enr.student_id,
          assessment_type: asm.type,
          score_obtained: score,
          maximum_score: asm.max,
          weightage_percent: asm.weight,
          created_at: new Date('2026-10-25')
        });
      }
    }
  }

  // Seed Assignments created by Prof. Sarah Connor
  inMemoryStore.assignments.push(
    {
      id: 'asn-001',
      course_id: 'e0000000-0000-0000-0000-000000000002',
      title: 'DBMS Assignment 2 – SQL Query Optimization',
      description: 'Analyze execution plans and implement B-tree indexing strategies on the sample dataset.',
      due_date: '2026-11-12T23:59:00Z',
      max_score: 100,
      created_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-11-01')
    },
    {
      id: 'asn-002',
      course_id: 'e0000000-0000-0000-0000-000000000003',
      title: 'OS Quiz 1 – Process Scheduling Analysis',
      description: 'Short-answer assessment covering Round-Robin, Priority Preemptive, and Multi-level Feedback Queues.',
      due_date: '2026-11-14T23:59:00Z',
      max_score: 50,
      created_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-11-03')
    },
    {
      id: 'asn-003',
      course_id: 'e0000000-0000-0000-0000-000000000004',
      title: 'SE Project – Phase 1 Architecture Document',
      description: 'Submit system architectural diagrams, domain component breakdowns, and API contracts.',
      due_date: '2026-11-17T23:59:00Z',
      max_score: 100,
      created_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-11-05')
    },
    {
      id: 'asn-004',
      course_id: 'e0000000-0000-0000-0000-000000000001',
      title: 'DSA Problem Set 3 – Balanced BSTs & Heaps',
      description: 'Implement AVL tree balance rotations and max-heap priority queue operations with complexity analysis.',
      due_date: '2026-11-20T23:59:00Z',
      max_score: 50,
      created_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-11-06')
    }
  );

  // Seed Submissions for DBMS Assignment 2
  inMemoryStore.assignmentSubmissions.push(
    {
      id: 'sub-001',
      assignment_id: 'asn-001',
      student_id: 'c0000000-0000-0000-0000-000000000003',
      file_url: 'https://storage.campusiq.edu/submissions/dbms-alex-johnson.pdf',
      submission_date: new Date('2026-11-10T14:30:00Z'),
      grade: null,
      feedback: null
    },
    {
      id: 'sub-002',
      assignment_id: 'asn-001',
      student_id: 'c0000000-0000-0000-0000-000000000004',
      file_url: 'https://storage.campusiq.edu/submissions/dbms-sophia-miller.pdf',
      submission_date: new Date('2026-11-10T16:45:00Z'),
      grade: null,
      feedback: null
    }
  );

  // Seed Study Materials uploaded by Prof. Sarah Connor
  inMemoryStore.studyMaterials.push(
    {
      id: 'mat-001',
      course_id: 'e0000000-0000-0000-0000-000000000001',
      title: 'CS201 Lecture Notes – Trees, Graphs & Shortest Path Algorithms.pdf',
      file_url: 'https://storage.campusiq.edu/materials/cs201-graphs-notes.pdf',
      file_type: 'PDF',
      uploaded_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-09-15')
    },
    {
      id: 'mat-002',
      course_id: 'e0000000-0000-0000-0000-000000000002',
      title: 'CS203 SQL Normalization & Indexing Cheat Sheet.pdf',
      file_url: 'https://storage.campusiq.edu/materials/cs203-normalization.pdf',
      file_type: 'PDF',
      uploaded_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-09-20')
    },
    {
      id: 'mat-003',
      course_id: 'e0000000-0000-0000-0000-000000000003',
      title: 'CS205 Virtual Memory & Page Replacement Slides.pptx',
      file_url: 'https://storage.campusiq.edu/materials/cs205-virtual-memory.pptx',
      file_type: 'SLIDES',
      uploaded_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-10-02')
    },
    {
      id: 'mat-004',
      course_id: 'e0000000-0000-0000-0000-000000000004',
      title: 'CS207 Agile & Clean Architecture Guidelines.pdf',
      file_url: 'https://storage.campusiq.edu/materials/cs207-clean-arch.pdf',
      file_type: 'PDF',
      uploaded_by: 'b0000000-0000-0000-0000-000000000002',
      created_at: new Date('2026-10-10')
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

      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        head_of_department_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
        section VARCHAR(10) DEFAULT 'Sec A',
        credits INT NOT NULL DEFAULT 3,
        semester INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        enrollment_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        UNIQUE (student_id, course_id)
      );

      DO $$ BEGIN
        CREATE TYPE attendance_state AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        status attendance_state NOT NULL DEFAULT 'PRESENT',
        source VARCHAR(50) DEFAULT 'MANUAL',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (course_id, student_id, attendance_date)
      );

      CREATE TABLE IF NOT EXISTS marks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assessment_type VARCHAR(50) NOT NULL,
        score_obtained NUMERIC(5, 2) NOT NULL,
        maximum_score NUMERIC(5, 2) NOT NULL,
        weightage_percent NUMERIC(5, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        max_score NUMERIC(5, 2) DEFAULT 100.0,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_url VARCHAR(500) NOT NULL,
        submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        plagiarism_score NUMERIC(4, 2),
        grade NUMERIC(5, 2),
        feedback TEXT,
        UNIQUE(assignment_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS study_materials (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        uploaded_by UUID REFERENCES users(id),
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

  // Find user by ID (checked before email to avoid matching column lists containing 'email')
  if (upperQuery.includes('FROM USERS') && (upperQuery.includes('WHERE ID =') || upperQuery.includes('WHERE ID='))) {
    const id = params[0];
    const user = inMemoryStore.users.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Find user by email
  if (upperQuery.includes('FROM USERS') && (upperQuery.includes('WHERE EMAIL') || upperQuery.includes('WHERE LOWER(EMAIL)') || upperQuery.includes('EMAIL =') || upperQuery.includes('WHERE EMAIL='))) {
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
