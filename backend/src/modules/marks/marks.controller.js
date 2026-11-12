// Examination records, internal assessments, grading logic, and report cards: HTTP request handling and response dispatch
const service = require('./marks.service');
const { success, error } = require('../../utils/responseHandler');

exports.getCourseMarks = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const assessmentType = req.query.assessmentType || 'Midterm Exam';
    const data = await service.getMarksByCourseAndAssessment(courseId, assessmentType, req.user.id, req.user.role);
    return success(res, data, 'Assessment marks loaded successfully');
  } catch (err) {
    next(err);
  }
};

exports.recordBatchMarks = async (req, res, next) => {
  try {
    const { courseId, assessmentType, maximumScore, records } = req.body;
    if (!courseId || !assessmentType || maximumScore === undefined || !Array.isArray(records)) {
      return error(res, 'Missing required fields: courseId, assessmentType, maximumScore, and records are required.', 400);
    }
    const result = await service.recordBatchMarks(courseId, assessmentType, maximumScore, records, req.user.id, req.user.role);
    return success(res, result, 'Assessment marks saved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getCourseAssessments = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const assessments = await service.getCourseAssessments(courseId, req.user.id, req.user.role);
    return success(res, assessments, 'Course assessments summary retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'Marks records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    if (!data) return error(res, 'Marks record not found', 404);
    return success(res, data, 'Marks record found');
  } catch (err) {
    next(err);
  }
};
