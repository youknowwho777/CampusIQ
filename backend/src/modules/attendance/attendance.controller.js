// Student attendance session tracking, aggregate statistics, and batch updates: HTTP request handling and response dispatch
const service = require('./attendance.service');
const { success, error } = require('../../utils/responseHandler');

exports.getCourseAttendance = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const data = await service.getAttendanceByCourseAndDate(courseId, date, req.user.id, req.user.role);
    return success(res, data, 'Course attendance session loaded successfully');
  } catch (err) {
    next(err);
  }
};

exports.recordBatchAttendance = async (req, res, next) => {
  try {
    const { courseId, attendanceDate, records } = req.body;
    if (!courseId || !attendanceDate || !Array.isArray(records)) {
      return error(res, 'Missing required fields: courseId, attendanceDate, and records array are required.', 400);
    }
    const result = await service.recordBatchAttendance(courseId, attendanceDate, records, req.user.id, req.user.role);
    return success(res, result, 'Attendance submitted successfully');
  } catch (err) {
    next(err);
  }
};

exports.getCourseHistory = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const history = await service.getCourseAttendanceHistory(courseId, req.user.id, req.user.role);
    return success(res, history, 'Course attendance history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    return success(res, data, 'Attendance records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.findById(req.params.id);
    if (!data) return error(res, 'Attendance record not found', 404);
    return success(res, data, 'Attendance record found');
  } catch (err) {
    next(err);
  }
};
