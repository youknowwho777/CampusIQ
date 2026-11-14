// Service layer handling student attendance sessions and batch submissions
import api from './api';

export const attendanceService = {
  // Get attendance records for a specific course session date
  getCourseAttendance: async (courseId, date) => {
    const params = date ? `?date=${date}` : '';
    const res = await api.get(`/attendance/course/${courseId}${params}`);
    return res.data;
  },

  // Batch record or update student attendance
  submitBatchAttendance: async (payload) => {
    // payload: { courseId, attendanceDate, records: [{ studentId, status }] }
    const res = await api.post('/attendance/batch', payload);
    return res.data;
  },

  // Get historical attendance sessions for a course
  getCourseHistory: async (courseId) => {
    const res = await api.get(`/attendance/course/${courseId}/history`);
    return res.data;
  }
};

export default attendanceService;
