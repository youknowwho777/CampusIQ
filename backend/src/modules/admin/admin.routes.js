// Institutional Administration REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Protect all admin endpoints with authentication and ADMIN / HOD role
router.use(authMiddleware);
router.use(rbacMiddleware('ADMIN', 'HOD'));

// 1. Executive Dashboard Aggregated Stats
router.get('/dashboard-stats', controller.getDashboardStats);

// 2. Student Provisioning & Management
router.get('/students', controller.getStudents);
router.get('/students/:id', controller.getStudentById);
router.post('/students', controller.createStudent);
router.put('/students/:id', controller.updateStudent);
router.delete('/students/:id', controller.deleteStudent);

// 3. Teacher / Faculty Management
router.get('/teachers', controller.getTeachers);
router.get('/teachers/:id', controller.getTeacherById);
router.post('/teachers', controller.createTeacher);
router.put('/teachers/:id', controller.updateTeacher);
router.delete('/teachers/:id', controller.deleteTeacher);

// 4. Subjects & Classes Management
router.get('/courses', controller.getCourses);
router.get('/courses/:id', controller.getCourseById);
router.post('/courses', controller.createCourse);
router.put('/courses/:id', controller.updateCourse);
router.delete('/courses/:id', controller.deleteCourse);

// Departments
router.get('/departments', controller.getDepartments);
router.post('/departments', controller.createDepartment);

// 5. Overall Attendance Statistics
router.get('/attendance/stats', controller.getAttendanceStats);

module.exports = router;
