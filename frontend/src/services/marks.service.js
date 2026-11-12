// Service layer handling examination records, marks entry, and assessment analytics
import api from './api';

export const marksService = {
  // Get marks for a course and specific assessment type
  getCourseMarks: async (courseId, assessmentType = 'Midterm Exam') => {
    const res = await api.get(`/marks/course/${courseId}?assessmentType=${encodeURIComponent(assessmentType)}`);
    return res.data;
  },

  // Batch submit or update student scores
  submitBatchMarks: async (payload) => {
    // payload: { courseId, assessmentType, maximumScore, records: [{ studentId, scoreObtained, remarks }] }
    const res = await api.post('/marks/batch', payload);
    return res.data;
  },

  // Get course assessments summary and distribution
  getCourseAssessments: async (courseId) => {
    const res = await api.get(`/marks/course/${courseId}/assessments`);
    return res.data;
  }
};

export default marksService;
