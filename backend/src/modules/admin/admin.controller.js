// Admin Controller handling administrative operations and analytics
const service = require('./admin.service');
const { success } = require('../../utils/responseHandler');

// 1. Dashboard Overview Stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const data = await service.getDashboardStats();
    return success(res, data, 'Admin dashboard statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. Student Management Controllers
// ==========================================
exports.getStudents = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;
    const students = await service.getStudents({ search, department, status });
    return success(res, students, 'Students roster retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const student = await service.getStudentById(req.params.id);
    return success(res, student, 'Student details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const newStudent = await service.createStudent(req.body);
    return res.status(201).json({
      success: true,
      data: newStudent,
      message: 'Student account provisioned and enrolled successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const updated = await service.updateStudent(req.params.id, req.body);
    return success(res, updated, 'Student profile updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const result = await service.deleteStudent(req.params.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. Teacher Management Controllers
// ==========================================
exports.getTeachers = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;
    const teachers = await service.getTeachers({ search, department, status });
    return success(res, teachers, 'Faculty directory retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getTeacherById = async (req, res, next) => {
  try {
    const teacher = await service.getTeacherById(req.params.id);
    return success(res, teacher, 'Faculty details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    const newTeacher = await service.createTeacher(req.body);
    return res.status(201).json({
      success: true,
      data: newTeacher,
      message: 'Faculty account created successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const updated = await service.updateTeacher(req.params.id, req.body);
    return success(res, updated, 'Faculty profile updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    const result = await service.deleteTeacher(req.params.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. Subjects & Classes Management Controllers
// ==========================================
exports.getCourses = async (req, res, next) => {
  try {
    const { search, department, semester } = req.query;
    const courses = await service.getCourses({ search, department, semester });
    return success(res, courses, 'Curriculum courses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await service.getCourseById(req.params.id);
    return success(res, course, 'Course details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const newCourse = await service.createCourse(req.body);
    return res.status(201).json({
      success: true,
      data: newCourse,
      message: 'Subject / Class created and allocated successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const updated = await service.updateCourse(req.params.id, req.body);
    return success(res, updated, 'Course / Class allocation updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const result = await service.deleteCourse(req.params.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const depts = await service.getDepartments();
    return success(res, depts, 'Departments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const newDept = await service.createDepartment(req.body);
    return res.status(201).json({
      success: true,
      data: newDept,
      message: 'Department created successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 5. Overall Attendance Statistics Controller
// ==========================================
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const stats = await service.getOverallAttendanceStats();
    return success(res, stats, 'Overall campus attendance statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};
