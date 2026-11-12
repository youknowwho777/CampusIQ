// Faculty profile management, department assignments, and subject allocation: HTTP request handling and response dispatch
const service = require('./teachers.service');
const { success, error } = require('../../utils/responseHandler');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await service.getDashboardStats(req.user.id, req.user.role);
    return success(res, stats, 'Teacher dashboard statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getAssignedClasses = async (req, res, next) => {
  try {
    const classes = await service.getAssignedClasses(req.user.id, req.user.role);
    return success(res, classes, 'Assigned classes retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getClassDetails = async (req, res, next) => {
  try {
    const details = await service.getClassDetails(req.params.id, req.user.id, req.user.role);
    if (!details) {
      return error(res, 'Class not found', 404);
    }
    return success(res, details, 'Class details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getTeacherStudents = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const courseId = req.query.courseId || '';
    const students = await service.getTeacherStudents(req.user.id, req.user.role, search, courseId);
    return success(res, students, 'Enrolled students retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'Teachers retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    if (!data) {
      return error(res, 'Teacher not found', 404);
    }
    return success(res, data, 'Teacher record found');
  } catch (err) {
    next(err);
  }
};
