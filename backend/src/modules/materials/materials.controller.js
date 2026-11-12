// Course study materials, syllabi, and reference document repository: HTTP request handling and response dispatch
const service = require('./materials.service');
const { success, error } = require('../../utils/responseHandler');

exports.getByCourse = async (req, res, next) => {
  try {
    const data = await service.findByCourse(req.params.courseId, req.user.id, req.user.role);
    return success(res, data, 'Study materials retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await service.createMaterial(req.body, req.user.id, req.user.role);
    return success(res, data, 'Study material uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'Study materials catalog retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    if (!data) return error(res, 'Study material record not found', 404);
    return success(res, data, 'Study material record found');
  } catch (err) {
    next(err);
  }
};
