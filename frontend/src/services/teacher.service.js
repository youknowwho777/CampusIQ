// API Service layer for Teacher Dashboard, Assigned Classes, and Student Directory
import api from './api';

export const teacherService = {
  // Fetch overall statistics for authenticated teacher
  getDashboardStats: async () => {
    const res = await api.get('/teachers/dashboard-stats');
    return res.data;
  },

  // Fetch list of classes assigned to teacher
  getAssignedClasses: async () => {
    const res = await api.get('/teachers/classes');
    return res.data;
  },

  // Fetch class details and enrolled students roster
  getClassDetails: async (classId) => {
    const res = await api.get(`/teachers/classes/${classId}`);
    return res.data;
  },

  // Fetch directory of students enrolled in teacher's classes with optional filtering
  getStudents: async (search = '', courseId = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (courseId) params.append('courseId', courseId);
    const res = await api.get(`/teachers/students?${params.toString()}`);
    return res.data;
  }
};

export default teacherService;
