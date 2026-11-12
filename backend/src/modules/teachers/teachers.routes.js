// Faculty profile management, department assignments, and subject allocation: REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./teachers.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Teacher Dashboard Overview
router.get('/dashboard-stats', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getDashboardStats);

// Teacher Assigned Classes
router.get('/classes', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getAssignedClasses);
router.get('/classes/:id', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getClassDetails);
router.get('/classes/:id/students', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getClassDetails);

// Teacher Students Directory
router.get('/students', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getTeacherStudents);

// Faculty directory endpoints
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

module.exports = router;
