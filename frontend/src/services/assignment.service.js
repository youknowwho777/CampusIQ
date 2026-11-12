// Service layer handling assignments and submissions
import api from './api';

export const assignmentService = {
  // Get assignments for a course
  getByCourse: async (courseId) => {
    const res = await api.get(`/assignments/course/${courseId}`);
    return res.data;
  },

  // Create a new assignment
  createAssignment: async (payload) => {
    // payload: { courseId, title, description, dueDate, maxScore }
    const res = await api.post('/assignments', payload);
    return res.data;
  }
};

export default assignmentService;
