// Student attendance session tracking, aggregate statistics, and batch updates: REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./attendance.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Specific Course Session Attendance
router.get('/course/:courseId', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getCourseAttendance);
router.get('/course/:courseId/history', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getCourseHistory);

// Batch Submit Attendance
router.post('/batch', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.recordBatchAttendance);

// General Attendance lookup
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

module.exports = router;
