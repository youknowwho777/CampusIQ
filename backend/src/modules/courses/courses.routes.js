// Curriculum, subjects, course catalogs, and syllabus definitions: REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./courses.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Route definitions
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

// Admin / HOD Course Management
router.post('/', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.create);
router.put('/:id', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.update);
router.delete('/:id', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.delete);

module.exports = router;
