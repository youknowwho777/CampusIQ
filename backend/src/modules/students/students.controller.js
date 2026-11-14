// Student demographic profiles, enrollments, and academic trajectories: HTTP request handling and response dispatch
const service = require('./students.service');
const { success, error } = require('../../utils/responseHandler');

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'students retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    return success(res, data, 'students record found');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/students/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const studentId = req.user?.id || 'c0000000-0000-0000-0000-000000000004';
    const data = await service.getDashboardOverview(studentId);
    return success(res, data, 'Student dashboard overview retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/students/courses
exports.getCourses = async (req, res, next) => {
  try {
    const studentId = req.user?.id || 'c0000000-0000-0000-0000-000000000004';
    const query = req.query.search || '';
    const data = await service.getStudentCourses(studentId, query);
    return success(res, data, 'Student courses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/students/courses/enroll
exports.enrollCourse = async (req, res, next) => {
  try {
    const studentId = req.user?.id || 'c0000000-0000-0000-0000-000000000004';
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }
    const data = await service.enrollInCourse(studentId, courseId);
    return success(res, data, data.message);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/students/attendance
exports.getAttendance = async (req, res, next) => {
  try {
    const studentId = req.user?.id || 'c0000000-0000-0000-0000-000000000004';
    const course = req.query.course || null;
    const data = await service.getStudentAttendance(studentId, course);
    return success(res, data, 'Student attendance statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/students/attendance/leave-request
exports.submitLeaveRequest = async (req, res, next) => {
  try {
    const studentId = req.user?.id || 'c0000000-0000-0000-0000-000000000004';
    const data = await service.submitLeaveRequest(studentId, req.body);
    return success(res, data, data.message);
  } catch (err) {
    next(err);
  }
};
