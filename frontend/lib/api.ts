import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
});

// Request interceptor to add auth token and language
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const language = localStorage.getItem('language') || 'en';
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['Accept-Language'] = language;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string, role: string) =>
    api.post('/auth/login', { email, password, role }),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/stats'),
  aiQuery: (query: string) => api.get('/query/ask', { params: { query } }),
};

export const ubidAPI = {
  list: (page = 1, limit = 20, search?: string) =>
    api.get('/ubid/list', { params: { page, limit, search } }),
  getById: (id: string) => api.get(`/ubid/${id}`),
  getNetwork: (id: string) => api.get(`/ubid/${id}/network`),
  getAuditTrail: (id: string) => api.get(`/ubid/${id}/audit-trail`),
  split: (id: string, data: any) => api.post(`/ubid/${id}/split`, data),
  reclassify: (id: string, status: string) =>
    api.post(`/ubid/${id}/reclassify`, { status }),
  override: (id: string, status: string) =>
    api.post(`/ubid/${id}/override`, { status }),
};

export const ingestionAPI = {
  uploadCSV: (file: File, type: 'master' | 'events') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/ingest/${type === 'master' ? 'csv' : 'events'}`, formData);
  },
  getJobStatus: (jobId: string) => api.get(`/ingest/job-status/${jobId}`),
};

export const reviewAPI = {
  getQueue: (page = 1, limit = 20) =>
    api.get('/review/queue', { params: { page, limit } }),
  approveMatch: (id: string) => api.post(`/review/queue/${id}/approve`, {}),
  rejectMatch: (id: string) => api.post(`/review/queue/${id}/reject`, {}),
  escalateMatch: (id: string) => api.post(`/review/queue/${id}/escalate`, {}),
  getOrphans: (page = 1, limit = 20) =>
    api.get('/review/orphans', { params: { page, limit } }),
  assignOrphan: (id: string, ubidId: string) =>
    api.post(`/review/orphans/${id}/assign`, { ubid_id: ubidId }),
  suggestOrphan: (id: string) => api.post(`/review/orphans/${id}/ai-suggest`, {}),
};

export const adminAPI = {
  getAuditLogs: (page = 1, limit = 20) =>
    api.get('/admin/audit', { params: { page, limit } }),
  unscramble: (data: any) => api.post('/admin/unscramble', data),
  scramble: (data: any) => api.post('/admin/scramble', data),
  retrain: () => api.post('/admin/retrain', {}),
};

export default api;
