// Faculty profile management, department assignments, and subject allocation: Business logic execution and database query invocation
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');

// Helper to check if teacher owns course (or is HOD/ADMIN)
exports.verifyCourseTeacher = async (courseId, userId, userRole) => {
  if (userRole === 'ADMIN' || userRole === 'HOD') return true;

  if (getIsPostgresConnected()) {
    const { rows } = await query('SELECT id FROM courses WHERE id = $1 AND teacher_id = $2', [courseId, userId]);
    return rows.length > 0;
  } else {
    const course = inMemoryStore.courses.find(c => c.id === courseId);
    return course && course.teacher_id === userId;
  }
};

// Get Dashboard Statistics for Authenticated Teacher
exports.getDashboardStats = async (teacherId, role = 'TEACHER') => {
  if (getIsPostgresConnected()) {
    // PostgreSQL query implementation
    const isElevated = (role === 'ADMIN' || role === 'HOD');
    const teacherFilter = isElevated ? '' : 'WHERE c.teacher_id = $1';
    const params = isElevated ? [] : [teacherId];

    const coursesQuery = `
      SELECT 
        c.id, c.code, c.title, c.section, c.credits, c.semester,
        COUNT(DISTINCT e.student_id)::int AS student_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'ACTIVE'
      ${teacherFilter}
      GROUP BY c.id, c.code, c.title, c.section, c.credits, c.semester
      ORDER BY c.code ASC
    `;
    const coursesRes = await query(coursesQuery, params);
    const assignedClasses = coursesRes.rows;

    const courseIds = assignedClasses.map(c => c.id);

    let totalAttendanceSessions = 0;
    let avgAttendance = 90.0;
    let pendingMarks = 0;
    let upcomingAssignments = [];

    if (courseIds.length > 0) {
      // Distinct attendance dates per course
      const attRes = await query(
        `SELECT COUNT(DISTINCT (course_id, attendance_date))::int AS session_count,
                ROUND(AVG(CASE WHEN status = 'PRESENT' THEN 100.0 ELSE 0.0 END), 1) as avg_rate
         FROM attendance WHERE course_id = ANY($1)`,
        [courseIds]
      );
      totalAttendanceSessions = attRes.rows[0]?.session_count || 0;
      avgAttendance = parseFloat(attRes.rows[0]?.avg_rate) || 88.5;

      // Pending grading / upcoming tasks
      const asnRes = await query(
        `SELECT a.id, a.title, a.due_date, a.course_id, c.code as course_code
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         WHERE a.course_id = ANY($1)
         ORDER BY a.due_date ASC LIMIT 5`,
        [courseIds]
      );
      upcomingAssignments = asnRes.rows;
      pendingMarks = upcomingAssignments.length;
    }

    // Total distinct students
    const totalStudents = assignedClasses.reduce((sum, c) => sum + (c.student_count || 0), 0);

    return {
      teacherId,
      assignedClassesCount: assignedClasses.length,
      totalStudentsCount: totalStudents,
      attendanceSessionsCount: totalAttendanceSessions,
      averageAttendanceRate: avgAttendance,
      pendingMarksCount: pendingMarks,
      assignedClasses,
      upcomingTasks: upcomingAssignments
    };
  }

  // Fallback in-memory query execution
  const isElevated = (role === 'ADMIN' || role === 'HOD');
  const myCourses = isElevated 
    ? inMemoryStore.courses 
    : inMemoryStore.courses.filter(c => c.teacher_id === teacherId);

  const courseIds = new Set(myCourses.map(c => c.id));
  const myEnrollments = inMemoryStore.enrollments.filter(e => courseIds.has(e.course_id) && e.status === 'ACTIVE');
  const uniqueStudents = new Set(myEnrollments.map(e => e.student_id));

  // Compute stats per class
  const assignedClasses = myCourses.map(c => {
    const enrolled = inMemoryStore.enrollments.filter(e => e.course_id === c.id && e.status === 'ACTIVE');
    const courseAtt = inMemoryStore.attendance.filter(a => a.course_id === c.id);
    const presentCount = courseAtt.filter(a => a.status === 'PRESENT').length;
    const rate = courseAtt.length > 0 ? Math.round((presentCount / courseAtt.length) * 100) : 92;

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      section: c.section || 'Sec A',
      credits: c.credits,
      semester: c.semester,
      schedule: c.schedule || 'Mon, Wed 10:00 AM',
      room: c.room || 'Room 101',
      studentCount: enrolled.length,
      attendanceRate: rate
    };
  });

  const myAttendance = inMemoryStore.attendance.filter(a => courseIds.has(a.course_id));
  const distinctSessions = new Set(myAttendance.map(a => `${a.course_id}_${a.attendance_date}`)).size;
  const totalPresents = myAttendance.filter(a => a.status === 'PRESENT').length;
  const avgAttendance = myAttendance.length > 0 ? Math.round((totalPresents / myAttendance.length) * 100) : 91.5;

  const upcomingTasks = inMemoryStore.assignments
    .filter(a => courseIds.has(a.course_id))
    .map(a => {
      const course = inMemoryStore.courses.find(c => c.id === a.course_id);
      return {
        id: a.id,
        title: a.title,
        dueDate: a.due_date,
        maxScore: a.max_score,
        courseCode: course ? course.code : 'COURSE',
        courseTitle: course ? course.title : ''
      };
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const recentActivities = [
    { type: 'ATTENDANCE', text: 'Attendance recorded for CS201 (Sec A)', date: '2026-11-10T10:00:00Z' },
    { type: 'MARKS', text: 'Quiz 1 scores submitted for CS203', date: '2026-11-09T14:30:00Z' },
    { type: 'ASSIGNMENT', text: 'Published DBMS Assignment 2', date: '2026-11-08T16:00:00Z' }
  ];

  return {
    teacherId,
    assignedClassesCount: assignedClasses.length,
    totalStudentsCount: uniqueStudents.size,
    attendanceSessionsCount: distinctSessions,
    averageAttendanceRate: avgAttendance,
    pendingMarksCount: 3,
    assignedClasses,
    upcomingTasks,
    recentActivities
  };
};

// Get Classes Assigned to Teacher
exports.getAssignedClasses = async (teacherId, role = 'TEACHER') => {
  if (getIsPostgresConnected()) {
    const isElevated = (role === 'ADMIN' || role === 'HOD');
    const filter = isElevated ? '' : 'WHERE c.teacher_id = $1';
    const params = isElevated ? [] : [teacherId];

    const { rows } = await query(`
      SELECT 
        c.id, c.code, c.title, c.section, c.credits, c.semester,
        COUNT(DISTINCT e.student_id)::int AS student_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'ACTIVE'
      ${filter}
      GROUP BY c.id, c.code, c.title, c.section, c.credits, c.semester
      ORDER BY c.code ASC
    `, params);

    return rows;
  }

  const isElevated = (role === 'ADMIN' || role === 'HOD');
  const myCourses = isElevated 
    ? inMemoryStore.courses 
    : inMemoryStore.courses.filter(c => c.teacher_id === teacherId);

  return myCourses.map(c => {
    const enrolled = inMemoryStore.enrollments.filter(e => e.course_id === c.id && e.status === 'ACTIVE');
    const courseAtt = inMemoryStore.attendance.filter(a => a.course_id === c.id);
    const presentCount = courseAtt.filter(a => a.status === 'PRESENT').length;
    const rate = courseAtt.length > 0 ? Math.round((presentCount / courseAtt.length) * 100) : 90;

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      section: c.section || 'Sec A',
      credits: c.credits,
      semester: c.semester,
      schedule: c.schedule || 'Mon, Wed 10:00 AM',
      room: c.room || 'Hall 201',
      studentCount: enrolled.length,
      attendanceRate: rate
    };
  });
};

// Get Specific Class Details with Enrolled Students
exports.getClassDetails = async (courseId, teacherId, role = 'TEACHER') => {
  const isAuthorized = await exports.verifyCourseTeacher(courseId, teacherId, role);
  if (!isAuthorized) {
    const err = new Error('Unauthorized: You are not assigned to instruct this course.');
    err.statusCode = 403;
    throw err;
  }

  if (getIsPostgresConnected()) {
    const courseRes = await query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) return null;
    const course = courseRes.rows[0];

    const studentsRes = await query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.department,
        ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS attendance_rate
      FROM users u
      JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1 AND e.status = 'ACTIVE'
      LEFT JOIN attendance a ON a.student_id = u.id AND a.course_id = $1
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.department
      ORDER BY u.last_name ASC, u.first_name ASC
    `, [courseId]);

    return {
      course,
      students: studentsRes.rows
    };
  }

  const course = inMemoryStore.courses.find(c => c.id === courseId);
  if (!course) return null;

  const enrollments = inMemoryStore.enrollments.filter(e => e.course_id === courseId && e.status === 'ACTIVE');
  const studentIds = enrollments.map(e => e.student_id);

  const students = inMemoryStore.users
    .filter(u => studentIds.includes(u.id))
    .map(u => {
      const attRecords = inMemoryStore.attendance.filter(a => a.course_id === courseId && a.student_id === u.id);
      const presents = attRecords.filter(a => a.status === 'PRESENT').length;
      const rate = attRecords.length > 0 ? Math.round((presents / attRecords.length) * 100) : 95;

      const marks = inMemoryStore.marks.filter(m => m.course_id === courseId && m.student_id === u.id);

      return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        rollNumber: u.roll_number || `CS20240${u.id.slice(-2)}`,
        department: u.department,
        attendanceRate: rate,
        marks
      };
    });

  return {
    ...course,
    studentCount: students.length,
    students
  };
};

// Get All Enrolled Students Across Teacher's Courses
exports.getTeacherStudents = async (teacherId, role = 'TEACHER', search = '', courseFilter = '') => {
  const isElevated = (role === 'ADMIN' || role === 'HOD');
  let myCourses = isElevated 
    ? inMemoryStore.courses 
    : inMemoryStore.courses.filter(c => c.teacher_id === teacherId);

  if (courseFilter) {
    myCourses = myCourses.filter(c => c.id === courseFilter || c.code === courseFilter);
  }

  const courseIds = new Set(myCourses.map(c => c.id));
  const myEnrollments = inMemoryStore.enrollments.filter(e => courseIds.has(e.course_id) && e.status === 'ACTIVE');
  const studentMap = new Map();

  for (const enr of myEnrollments) {
    const student = inMemoryStore.users.find(u => u.id === enr.student_id);
    const course = inMemoryStore.courses.find(c => c.id === enr.course_id);
    if (!student) continue;

    if (!studentMap.has(student.id)) {
      studentMap.set(student.id, {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        rollNumber: student.roll_number || `CS20240${student.id.slice(-2)}`,
        department: student.department || 'Computer Science & Engineering',
        courses: []
      });
    }

    if (course) {
      // Calculate attendance in this course
      const att = inMemoryStore.attendance.filter(a => a.course_id === course.id && a.student_id === student.id);
      const pres = att.filter(a => a.status === 'PRESENT').length;
      const rate = att.length > 0 ? Math.round((pres / att.length) * 100) : 90;

      studentMap.get(student.id).courses.push({
        courseId: course.id,
        code: course.code,
        title: course.title,
        section: course.section,
        attendanceRate: rate
      });
    }
  }

  let result = Array.from(studentMap.values());

  // Calculate overall attendance
  result = result.map(s => {
    const avgAtt = s.courses.length > 0
      ? Math.round(s.courses.reduce((sum, c) => sum + c.attendanceRate, 0) / s.courses.length)
      : 90;
    return { ...s, overallAttendanceRate: avgAtt };
  });

  // Apply search query
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q)
    );
  }

  return result;
};

// Generic Find All Teachers (for directory / administration)
exports.findAll = async () => {
  if (getIsPostgresConnected()) {
    const { rows } = await query("SELECT id, email, first_name, last_name, department, phone_number, is_active FROM users WHERE role = 'TEACHER'");
    return rows;
  }
  return inMemoryStore.users
    .filter(u => u.role === 'TEACHER')
    .map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      department: u.department,
      phoneNumber: u.phone_number,
      isActive: u.is_active
    }));
};

exports.findById = async (id) => {
  if (getIsPostgresConnected()) {
    const { rows } = await query("SELECT id, email, first_name, last_name, department, phone_number, is_active FROM users WHERE id = $1 AND role = 'TEACHER'", [id]);
    return rows[0] || null;
  }
  const u = inMemoryStore.users.find(user => user.id === id && user.role === 'TEACHER');
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    department: u.department,
    phoneNumber: u.phone_number,
    isActive: u.is_active
  };
};
