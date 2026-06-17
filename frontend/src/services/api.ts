import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, fullName: string, role: string) =>
    api.post('/auth/register', { email, password, fullName, role }),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  
  getProfile: () => api.get('/auth/profile'),
};

// Transaction endpoints
export const transactionAPI = {
  create: (data: any) => api.post('/transactions', data),
  
  getAll: (params?: any) => api.get('/transactions', { params }),
  
  getByService: (serviceType: string) => 
    api.get(`/transactions/service/${serviceType}`),
};

// Dashboard endpoints
export const dashboardAPI = {
  getData: () => api.get('/dashboard/data'),
  
  getProfitLoss: (days?: number) => 
    api.get('/dashboard/profit-loss', { params: { days } }),
};

// Registered Lines endpoints
export const registeredLinesAPI = {
  getAll: () => api.get('/registered-lines'),
  
  save: (lines: Array<{ serviceType: string; lineCard: string }>) =>
    api.post('/registered-lines', { lines }),
};

// Report endpoints
export const reportAPI = {
  generate: (params?: any) => api.get('/reports/generate', { params }),
  
  download: (params?: any) => 
    api.get('/reports/download', { 
      params,
      responseType: 'blob'
    }),
};

export default api;
