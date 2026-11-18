// Announcements REST API route declarations
const express = require('express');
const router = express.Router();
const controller = require('./announcements.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Public/authenticated announcements list & detail
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

// Admin / Authority announcement management
router.post('/', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.create);
router.put('/:id', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.update);
router.delete('/:id', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.delete);
router.patch('/:id/pin', authMiddleware, rbacMiddleware('ADMIN', 'HOD'), controller.togglePin);

module.exports = router;
