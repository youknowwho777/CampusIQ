// API client service for Campus Announcements & Bulletins
import api from './api';

export const announcementService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.targetRole) query.append('targetRole', params.targetRole);
    if (params.category) query.append('category', params.category);
    if (params.priority) query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);

    const res = await api.get(`/announcements?${query.toString()}`);
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/announcements/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/announcements', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/announcements/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },

  togglePin: async (id) => {
    const res = await api.patch(`/announcements/${id}/pin`);
    return res.data;
  }
};

export default announcementService;
