// Examination records, internal assessments, grading logic, and report cards: REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./marks.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Specific Course Assessment Marks
router.get('/course/:courseId', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getCourseMarks);
router.get('/course/:courseId/assessments', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.getCourseAssessments);

// Batch Submit Marks
router.post('/batch', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.recordBatchMarks);

// General Marks lookup
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

module.exports = router;
