// Homework, project assignments, student submissions, and grading workflows: REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./assignments.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

router.get('/course/:courseId', authMiddleware, controller.getByCourse);
router.post('/', authMiddleware, rbacMiddleware('TEACHER', 'HOD', 'ADMIN'), controller.create);
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

module.exports = router;
