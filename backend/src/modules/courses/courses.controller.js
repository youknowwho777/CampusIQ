// Curriculum, subjects, course catalogs, and syllabus definitions: HTTP request handling and response dispatch
const service = require('./courses.service');
const { success, error } = require('../../utils/responseHandler');

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'courses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    return success(res, data, 'courses record found');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    return res.status(201).json({ success: true, data, message: 'Course created successfully' });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return success(res, data, 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const data = await service.delete(req.params.id);
    return success(res, data, data.message);
  } catch (err) {
    next(err);
  }
};
