// Student demographic profiles, enrollments, and academic trajectories: REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./students.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Student specific portal routes
router.get('/dashboard', authMiddleware, controller.getDashboard);
router.get('/courses', authMiddleware, controller.getCourses);
router.post('/courses/enroll', authMiddleware, controller.enrollCourse);
router.get('/attendance', authMiddleware, controller.getAttendance);
router.post('/attendance/leave-request', authMiddleware, controller.submitLeaveRequest);

// Generic students list & lookup
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

module.exports = router;
