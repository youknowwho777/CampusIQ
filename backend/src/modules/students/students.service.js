// Student demographic profiles, enrollments, courses, attendance, and academic trajectory
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');

// In-memory store extension for student leave/grievance requests
if (!inMemoryStore.leaveRequests) {
  inMemoryStore.leaveRequests = [
    {
      id: 'lvr-101',
      student_id: 'c0000000-0000-0000-0000-000000000004',
      course_id: 'e0000000-0000-0000-0000-000000000003',
      date: '2026-11-06',
      type: 'Medical Leave',
      reason: 'Fever and medical consultation',
      status: 'APPROVED',
      created_at: new Date('2026-11-05')
    }
  ];
}

const fallbackStudent = {
  id: 'c0000000-0000-0000-0000-000000000004',
  first_name: 'Sophia',
  last_name: 'Thompson',
  name: 'Sophia Thompson',
  department: 'CSE',
  year: '2nd Year',
  roll_number: 'CS2024002',
  email: 'sophia.m@campusiq.edu'
};

// Helper to get or fallback student
const resolveStudent = async (studentId) => {
  if (getIsPostgresConnected()) {
    try {
      const { rows } = await query("SELECT id, email, first_name, last_name, department, phone_number FROM users WHERE id = $1", [studentId]);
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.warn('DB query error in resolveStudent:', e.message);
    }
  }
  const u = (inMemoryStore.users || []).find(usr => usr.id === studentId) ||
            (inMemoryStore.users || []).find(usr => usr.first_name === 'Sophia') ||
            (inMemoryStore.users && inMemoryStore.users[3]) ||
            fallbackStudent;
  return u || fallbackStudent;
};

// 1. Student Dashboard Overview
exports.getDashboardOverview = async (studentId) => {
  const student = await resolveStudent(studentId);

  // Student Courses (CS201, CS203, CS205, CS207)
  const coursesData = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      code: 'CS201',
      title: 'Data Structures & Algorithms',
      progress: 88,
      iconType: 'code',
      credits: 4,
      instructor: 'Prof. Sarah Connor',
      schedule: 'Mon, Wed 09:00 - 10:30 AM',
      room: 'Hall 302',
      color: '#10B981', // emerald
      attendanceRate: 88
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      code: 'CS203',
      title: 'Database Management Systems',
      progress: 92,
      iconType: 'database',
      credits: 4,
      instructor: 'Prof. Sarah Connor',
      schedule: 'Tue, Thu 11:00 AM - 12:30 PM',
      room: 'Lab 204',
      color: '#3B82F6', // blue
      attendanceRate: 92
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      code: 'CS205',
      title: 'Operating Systems',
      progress: 84,
      iconType: 'monitor',
      credits: 3,
      instructor: 'Prof. Sarah Connor',
      schedule: 'Wed, Fri 02:00 - 03:30 PM',
      room: 'Hall 410',
      color: '#F59E0B', // amber
      attendanceRate: 84
    },
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      code: 'CS207',
      title: 'Software Engineering',
      progress: 76,
      iconType: 'cube',
      credits: 3,
      instructor: 'Prof. Sarah Connor',
      schedule: 'Mon, Thu 03:45 - 05:15 PM',
      room: 'Seminar Room 1',
      color: '#8B5CF6', // purple
      attendanceRate: 76
    }
  ];

  // Upcoming items from template
  const upcomingItems = [
    {
      id: 'up-1',
      title: 'DBMS Assignment 2',
      courseCode: 'CS203',
      dueDateText: 'Due: 10 Nov, 11:59 PM',
      badgeText: 'Due Today',
      badgeColor: 'danger', // soft red/coral
      iconType: 'document'
    },
    {
      id: 'up-2',
      title: 'OS Quiz',
      courseCode: 'CS205',
      dueDateText: 'Due: 12 Nov, 11:59 PM',
      badgeText: 'In 2 Days',
      badgeColor: 'primary', // soft blue
      iconType: 'quiz'
    },
    {
      id: 'up-3',
      title: 'SE Project – Phase 1',
      courseCode: 'CS207',
      dueDateText: 'Due: 15 Nov, 11:59 PM',
      badgeText: 'In 5 Days',
      badgeColor: 'success', // soft green
      iconType: 'code'
    }
  ];

  return {
    student: {
      id: student?.id || 'c0000000-0000-0000-0000-000000000004',
      firstName: student?.first_name || 'Sophia',
      lastName: student?.last_name || 'Thompson',
      name: `${student?.first_name || 'Sophia'} ${student?.last_name || 'Thompson'}`,
      department: 'CSE',
      year: '2nd Year',
      rollNumber: student?.roll_number || 'CS2024002',
      email: student?.email || 'sophia.m@campusiq.edu',
      avatarInitials: 'ST'
    },
    stats: {
      attendance: {
        value: '92%',
        numericValue: 92,
        change: '+2%',
        trend: 'up',
        label: 'Attendance'
      },
      cgpa: {
        value: '8.72',
        numericValue: 8.72,
        scale: '10.0',
        label: 'Current CGPA'
      },
      credits: {
        earned: 54,
        total: 60,
        display: '54 / 60',
        progressPercent: 90,
        label: 'Credits Earned'
      },
      pendingTasks: {
        count: 3,
        label: 'Pending Tasks'
      }
    },
    courses: coursesData,
    upcoming: upcomingItems
  };
};

// 2. Student Courses List & Details
exports.getStudentCourses = async (studentId, queryFilter = '') => {
  const student = await resolveStudent(studentId);

  const allCourses = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      code: 'CS201',
      title: 'Data Structures & Algorithms',
      credits: 4,
      semester: 3,
      section: 'Sec A',
      instructor: 'Prof. Sarah Connor',
      instructorEmail: 'faculty@campusiq.edu',
      schedule: 'Mon, Wed 09:00 - 10:30 AM',
      room: 'Hall 302',
      progress: 88,
      attendanceRate: 88,
      attendanceFraction: '22 / 25',
      grade: 'A',
      iconType: 'code',
      color: '#10B981',
      description: 'Comprehensive study of linear and non-linear data structures, trees, graphs, hashing, and asymptotic analysis.',
      syllabus: ['Arrays & Linked Lists', 'Stacks & Queues', 'Trees & Balanced BSTs', 'Graph Algorithms & Shortest Paths', 'Dynamic Programming'],
      materialsCount: 14,
      assignmentsCount: 3,
      isEnrolled: true
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      code: 'CS203',
      title: 'Database Management Systems',
      credits: 4,
      semester: 3,
      section: 'Sec B',
      instructor: 'Prof. Sarah Connor',
      instructorEmail: 'faculty@campusiq.edu',
      schedule: 'Tue, Thu 11:00 AM - 12:30 PM',
      room: 'Lab 204',
      progress: 92,
      attendanceRate: 92,
      attendanceFraction: '23 / 25',
      grade: 'A+',
      iconType: 'database',
      color: '#3B82F6',
      description: 'Relational database model, relational algebra, SQL optimization, normalization (1NF-BCNF), transaction concurrency and ACID properties.',
      syllabus: ['Relational Model & SQL', 'ER Modeling & Relational Algebra', 'Normalization & Dependencies', 'Indexing & B-Trees', 'Transactions & Concurrency'],
      materialsCount: 18,
      assignmentsCount: 2,
      isEnrolled: true
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      code: 'CS205',
      title: 'Operating Systems',
      credits: 3,
      semester: 3,
      section: 'Sec A',
      instructor: 'Prof. Sarah Connor',
      instructorEmail: 'faculty@campusiq.edu',
      schedule: 'Wed, Fri 02:00 - 03:30 PM',
      room: 'Hall 410',
      progress: 84,
      attendanceRate: 84,
      attendanceFraction: '21 / 25',
      grade: 'A-',
      iconType: 'monitor',
      color: '#F59E0B',
      description: 'Core concepts of operating systems: process scheduling, threads, synchronization primitives, virtual memory management, and file systems.',
      syllabus: ['Processes & Threads', 'CPU Scheduling Algorithms', 'Process Synchronization & Semaphores', 'Virtual Memory & Paging', 'File Systems & Storage'],
      materialsCount: 11,
      assignmentsCount: 2,
      isEnrolled: true
    },
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      code: 'CS207',
      title: 'Software Engineering',
      credits: 3,
      semester: 3,
      section: 'Sec C',
      instructor: 'Prof. Sarah Connor',
      instructorEmail: 'faculty@campusiq.edu',
      schedule: 'Mon, Thu 03:45 - 05:15 PM',
      room: 'Seminar Room 1',
      progress: 76,
      attendanceRate: 76,
      attendanceFraction: '19 / 25',
      grade: 'B+',
      iconType: 'cube',
      color: '#8B5CF6',
      description: 'Software development lifecycle models, Agile methodologies, requirement engineering, system design architectures, testing, and CI/CD.',
      syllabus: ['Agile & Scrum Methodologies', 'Software Architecture Patterns', 'Object-Oriented Design & UML', 'Verification, Validation & Testing', 'DevOps & CI/CD Pipelines'],
      materialsCount: 9,
      assignmentsCount: 2,
      isEnrolled: true
    },
    {
      id: 'e0000000-0000-0000-0000-000000000005',
      code: 'CS209',
      title: 'Computer Networks',
      credits: 3,
      semester: 3,
      section: 'Sec A',
      instructor: 'Dr. Alan Turing',
      instructorEmail: 'alan@campusiq.edu',
      schedule: 'Tue, Fri 08:30 - 10:00 AM',
      room: 'Hall 105',
      progress: 0,
      attendanceRate: 100,
      attendanceFraction: '0 / 0',
      grade: 'N/A',
      iconType: 'network',
      color: '#EC4899',
      description: 'OSI and TCP/IP stack layers, socket programming, routing algorithms, transport layer protocols (TCP/UDP), and network security fundamentals.',
      syllabus: ['Physical & Data Link Layers', 'Network Layer & IP Addressing', 'Routing Protocols (OSPF, BGP)', 'Transport Protocols & Flow Control', 'Application Layer & TLS/HTTPS'],
      materialsCount: 8,
      assignmentsCount: 1,
      isEnrolled: false
    }
  ];

  if (queryFilter && queryFilter.trim()) {
    const q = queryFilter.toLowerCase().trim();
    return allCourses.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q)
    );
  }

  return allCourses;
};

// 3. Enroll in Course
exports.enrollInCourse = async (studentId, courseId) => {
  const student = await resolveStudent(studentId);
  const existing = inMemoryStore.enrollments.find(e => e.student_id === student.id && e.course_id === courseId);
  if (existing) {
    return { success: true, message: 'Already enrolled in this course.' };
  }

  const newEnrollment = {
    id: `enr-${Date.now()}`,
    student_id: student.id,
    course_id: courseId,
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  };
  inMemoryStore.enrollments.push(newEnrollment);

  if (getIsPostgresConnected()) {
    try {
      await query('INSERT INTO enrollments (student_id, course_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [student.id, courseId, 'ACTIVE']);
    } catch (e) {
      console.warn('Postgres enroll error:', e.message);
    }
  }

  return { success: true, message: 'Successfully enrolled in course!', enrollment: newEnrollment };
};

// 4. Student Attendance Detail and Breakdown
exports.getStudentAttendance = async (studentId, courseFilter = null) => {
  const student = await resolveStudent(studentId);

  // Overall attendance statistics
  const summary = {
    overallPercentage: 92,
    totalAttended: 81,
    totalClasses: 88,
    minimumThreshold: 75,
    status: 'Good Standing',
    statusTag: 'SAFE',
    trend: '+2% from previous month'
  };

  // Course-wise breakdown
  const coursesBreakdown = [
    {
      courseId: 'e0000000-0000-0000-0000-000000000001',
      courseCode: 'CS201',
      courseTitle: 'Data Structures & Algorithms',
      attended: 22,
      total: 25,
      percentage: 88,
      status: 'On Track',
      color: '#10B981',
      instructor: 'Prof. Sarah Connor'
    },
    {
      courseId: 'e0000000-0000-0000-0000-000000000002',
      courseCode: 'CS203',
      courseTitle: 'Database Management Systems',
      attended: 23,
      total: 25,
      percentage: 92,
      status: 'Excellent',
      color: '#3B82F6',
      instructor: 'Prof. Sarah Connor'
    },
    {
      courseId: 'e0000000-0000-0000-0000-000000000003',
      courseCode: 'CS205',
      courseTitle: 'Operating Systems',
      attended: 21,
      total: 25,
      percentage: 84,
      status: 'On Track',
      color: '#F59E0B',
      instructor: 'Prof. Sarah Connor'
    },
    {
      courseId: 'e0000000-0000-0000-0000-000000000004',
      courseCode: 'CS207',
      courseTitle: 'Software Engineering',
      attended: 19,
      total: 25,
      percentage: 76,
      status: 'Attention Needed',
      color: '#EF4444',
      instructor: 'Prof. Sarah Connor'
    }
  ];

  // Detailed Attendance History Records
  const attendanceLogs = [
    { id: 'att-log-01', date: '2026-11-10', time: '11:00 AM', courseCode: 'CS203', courseTitle: 'Database Management Systems', status: 'PRESENT', room: 'Lab 204' },
    { id: 'att-log-02', date: '2026-11-10', time: '03:45 PM', courseCode: 'CS207', courseTitle: 'Software Engineering', status: 'PRESENT', room: 'Seminar Room 1' },
    { id: 'att-log-03', date: '2026-11-09', time: '09:00 AM', courseCode: 'CS201', courseTitle: 'Data Structures & Algorithms', status: 'PRESENT', room: 'Hall 302' },
    { id: 'att-log-04', date: '2026-11-08', time: '02:00 PM', courseCode: 'CS205', courseTitle: 'Operating Systems', status: 'PRESENT', room: 'Hall 410' },
    { id: 'att-log-05', date: '2026-11-07', time: '11:00 AM', courseCode: 'CS203', courseTitle: 'Database Management Systems', status: 'PRESENT', room: 'Lab 204' },
    { id: 'att-log-06', date: '2026-11-06', time: '02:00 PM', courseCode: 'CS205', courseTitle: 'Operating Systems', status: 'EXCUSED', room: 'Hall 410', remark: 'Medical Certificate' },
    { id: 'att-log-07', date: '2026-11-05', time: '09:00 AM', courseCode: 'CS201', courseTitle: 'Data Structures & Algorithms', status: 'PRESENT', room: 'Hall 302' },
    { id: 'att-log-08', date: '2026-11-04', time: '03:45 PM', courseCode: 'CS207', courseTitle: 'Software Engineering', status: 'LATE', room: 'Seminar Room 1' },
    { id: 'att-log-09', date: '2026-11-03', time: '11:00 AM', courseCode: 'CS203', courseTitle: 'Database Management Systems', status: 'PRESENT', room: 'Lab 204' },
    { id: 'att-log-10', date: '2026-11-02', time: '09:00 AM', courseCode: 'CS201', courseTitle: 'Data Structures & Algorithms', status: 'PRESENT', room: 'Hall 302' },
    { id: 'att-log-11', date: '2026-10-31', time: '02:00 PM', courseCode: 'CS205', courseTitle: 'Operating Systems', status: 'ABSENT', room: 'Hall 410' },
    { id: 'att-log-12', date: '2026-10-30', time: '03:45 PM', courseCode: 'CS207', courseTitle: 'Software Engineering', status: 'PRESENT', room: 'Seminar Room 1' }
  ];

  let filteredLogs = attendanceLogs;
  if (courseFilter && courseFilter !== 'ALL') {
    filteredLogs = attendanceLogs.filter(log => log.courseCode === courseFilter);
  }

  const leaveRequests = (inMemoryStore.leaveRequests || []).filter(r => r.student_id === student.id);

  return {
    summary,
    coursesBreakdown,
    attendanceLogs: filteredLogs,
    leaveRequests
  };
};

// 5. Submit Leave / Attendance Grievance Request
exports.submitLeaveRequest = async (studentId, data) => {
  const student = await resolveStudent(studentId);
  const { date, courseCode, reason, type } = data;

  if (!date || !reason) {
    const error = new Error('Date and Reason are required.');
    error.statusCode = 400;
    throw error;
  }

  const newRequest = {
    id: `lvr-${Date.now()}`,
    student_id: student.id,
    course_code: courseCode || 'ALL',
    date,
    type: type || 'Medical Leave',
    reason,
    status: 'PENDING',
    created_at: new Date()
  };

  inMemoryStore.leaveRequests.unshift(newRequest);

  return {
    success: true,
    message: 'Leave request submitted successfully for faculty review.',
    request: newRequest
  };
};

// 6. Generic Finders
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
