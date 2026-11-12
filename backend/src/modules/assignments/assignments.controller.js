// Homework, project assignments, student submissions, and grading workflows: HTTP request handling and response dispatch
const service = require('./assignments.service');
const { success, error } = require('../../utils/responseHandler');

exports.getByCourse = async (req, res, next) => {
  try {
    const data = await service.findByCourse(req.params.courseId, req.user.id, req.user.role);
    return success(res, data, 'Assignments for course retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await service.createAssignment(req.body, req.user.id, req.user.role);
    return success(res, data, 'Assignment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'Assignments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    if (!data) return error(res, 'Assignment not found', 404);
    return success(res, data, 'Assignment record found');
  } catch (err) {
    next(err);
  }
};
