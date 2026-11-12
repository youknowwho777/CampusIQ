// Service layer handling study materials and curriculum resources
import api from './api';

export const materialService = {
  // Get study materials for a course
  getByCourse: async (courseId) => {
    const res = await api.get(`/materials/course/${courseId}`);
    return res.data;
  },

  // Upload or link new study material
  createMaterial: async (payload) => {
    // payload: { courseId, title, fileUrl, fileType }
    const res = await api.post('/materials', payload);
    return res.data;
  }
};

export default materialService;
