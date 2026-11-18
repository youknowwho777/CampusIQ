// Announcements controller handling client HTTP requests
const service = require('./announcements.service');
const { success } = require('../../utils/responseHandler');

exports.getAll = async (req, res, next) => {
  try {
    const { targetRole, category, priority, search } = req.query;
    const announcements = await service.findAll({ targetRole, category, priority, search });
    return success(res, announcements, 'Announcements retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const announcement = await service.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    return success(res, announcement, 'Announcement retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, content, targetRole, category, priority, isPinned } = req.body;
    const authorId = req.user?.id || null;
    const authorName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'CampusIQ Administration';

    const created = await service.create({
      title,
      content,
      targetRole,
      category,
      priority,
      authorId,
      authorName,
      isPinned
    });

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Announcement published successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);
    return success(res, updated, 'Announcement updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const result = await service.delete(req.params.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

exports.togglePin = async (req, res, next) => {
  try {
    const result = await service.togglePin(req.params.id);
    return success(res, result, 'Announcement pin state updated successfully');
  } catch (err) {
    next(err);
  }
};
