import axios, { AxiosInstance } from 'axios';

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "https://surakshasetu-1-e5nk.onrender.com";

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
  // Backend expects POST /query/ask with JSON body { question: string }
  aiQuery: (question: string) => api.post('/query/ask', { question }),
};

export const ubidAPI = {
  // Backend uses offset-based pagination, not page-based
  list: (page = 1, limit = 20, search?: string) =>
    api.get('/ubid/list', { params: { offset: (page - 1) * limit, limit, search } }),
  getById: (id: string) => api.get(`/ubid/${id}`),
  getNetwork: (id: string) => api.get(`/ubid/${id}/network`),
  getAuditTrail: (id: string) => api.get(`/admin/audit`, { params: { ubid: id } }),
  split: (ubidId: string, data: { master_record_id: string; reason: string }) =>
    api.post(`/ubid/${ubidId}/split`, null, { params: data }),
  reclassify: (id: string) => api.post(`/ubid/${id}/reclassify`),
  override: (id: string, new_status: string, reason: string) =>
    api.post(`/ubid/${id}/override`, null, { params: { new_status, reason } }),
};

export const ingestionAPI = {
  uploadCSV: (file: File, type: 'master' | 'events', department?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    // Master data requires ?department= as a query param; events endpoint does not
    const url =
      type === 'master'
        ? `/ingest/csv?department=${department || 'shop_establishment'}`
        : '/ingest/events';
    return api.post(url, formData);
  },
  // Backend job-status route is /ingest/status/{job_id}
  getJobStatus: (jobId: string) => api.get(`/ingest/status/${jobId}`),
};

export const reviewAPI = {
  getQueue: (page = 1, limit = 20) =>
    api.get('/review/queue', { params: { limit, offset: (page - 1) * limit } }),
  // Backend endpoint is /merge, not /approve
  approveMatch: (id: string) => api.post(`/review/queue/${id}/merge`, {}),
  rejectMatch: (id: string) => api.post(`/review/queue/${id}/reject`, {}),
  escalateMatch: (id: string) => api.post(`/review/queue/${id}/escalate`, {}),
  getOrphans: (page = 1, limit = 20) =>
    api.get('/review/orphans', { params: { limit, offset: (page - 1) * limit } }),
  // Backend expects ubid as query param, not in request body
  assignOrphan: (orphanId: string, ubidId: string) =>
    api.post(`/review/orphans/${orphanId}/assign`, null, { params: { ubid: ubidId } }),
  suggestOrphan: (id: string) => api.post(`/review/orphans/${id}/ai-suggest`, {}),
};

export const adminAPI = {
  getAuditLogs: (page = 1, limit = 20) =>
    api.get('/admin/audit', { params: { limit, offset: (page - 1) * limit } }),
  getUsers: () => api.get('/admin/users'),
  // Records for Privacy Playground — returns scrambled + raw field pairs
  getRecords: (page = 1, limit = 20, department?: string) =>
    api.get('/admin/records', { params: { limit, offset: (page - 1) * limit, department } }),
  // Backend expects { text: string } for both scramble and unscramble
  scramble: (data: { text: string }) => api.post('/admin/scramble', data),
  unscramble: (data: { text: string }) => api.post('/admin/unscramble', data),
  retrain: () => api.post('/admin/retrain', {}),
};

export default api;
