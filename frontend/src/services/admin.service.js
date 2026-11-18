// API client service for Institutional Admin Portal
import api from './api';

export const adminService = {
  // 1. Dashboard Overview
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard-stats');
    return res.data;
  },

  // 2. Student Provisioning & Management
  getStudents: async (search = '', department = '', status = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (status) params.append('status', status);
    const res = await api.get(`/admin/students?${params.toString()}`);
    return res.data;
  },

  getStudentById: async (id) => {
    const res = await api.get(`/admin/students/${id}`);
    return res.data;
  },

  createStudent: async (studentData) => {
    const res = await api.post('/admin/students', studentData);
    return res.data;
  },

  updateStudent: async (id, studentData) => {
    const res = await api.put(`/admin/students/${id}`, studentData);
    return res.data;
  },

  deleteStudent: async (id) => {
    const res = await api.delete(`/admin/students/${id}`);
    return res.data;
  },

  // 3. Faculty / Teacher Management
  getTeachers: async (search = '', department = '', status = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (status) params.append('status', status);
    const res = await api.get(`/admin/teachers?${params.toString()}`);
    return res.data;
  },

  getTeacherById: async (id) => {
    const res = await api.get(`/admin/teachers/${id}`);
    return res.data;
  },

  createTeacher: async (teacherData) => {
    const res = await api.post('/admin/teachers', teacherData);
    return res.data;
  },

  updateTeacher: async (id, teacherData) => {
    const res = await api.put(`/admin/teachers/${id}`, teacherData);
    return res.data;
  },

  deleteTeacher: async (id) => {
    const res = await api.delete(`/admin/teachers/${id}`);
    return res.data;
  },

  // 4. Subjects & Classes Management
  getCourses: async (search = '', department = '', semester = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (semester) params.append('semester', semester);
    const res = await api.get(`/admin/courses?${params.toString()}`);
    return res.data;
  },

  getCourseById: async (id) => {
    const res = await api.get(`/admin/courses/${id}`);
    return res.data;
  },

  createCourse: async (courseData) => {
    const res = await api.post('/admin/courses', courseData);
    return res.data;
  },

  updateCourse: async (id, courseData) => {
    const res = await api.put(`/admin/courses/${id}`, courseData);
    return res.data;
  },

  deleteCourse: async (id) => {
    const res = await api.delete(`/admin/courses/${id}`);
    return res.data;
  },

  getDepartments: async () => {
    const res = await api.get('/admin/departments');
    return res.data;
  },

  createDepartment: async (deptData) => {
    const res = await api.post('/admin/departments', deptData);
    return res.data;
  },

  // 5. Overall Attendance Statistics
  getAttendanceStats: async () => {
    const res = await api.get('/admin/attendance/stats');
    return res.data;
  }
};

export default adminService;
