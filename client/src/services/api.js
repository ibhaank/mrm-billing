import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if it's already a refresh token request or already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await api.post('/auth/refresh-token', { refreshToken });
        const { accessToken } = res.data;

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and reload
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // For refresh token failures or other errors, just clear and reload
    if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh-token')) {
      localStorage.clear();
      window.location.href = '/';
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Client API
export const clientApi = {
  getAll: (search = '') => api.get(`/clients${search ? `?search=${search}` : ''}`),
  getById: (clientId) => api.get(`/clients/${clientId}`),
  create: (clientData) => api.post('/clients', clientData),
  update: (clientId, clientData) => api.put(`/clients/${clientId}`, clientData),
  delete: (clientId, permanent = false) => 
    api.delete(`/clients/${clientId}${permanent ? '?permanent=true' : ''}`),
  bulkImport: (clients) => api.post('/clients/bulk', { clients }),
};

// Billing API
export const billingApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/billing${params ? `?${params}` : ''}`);
  },
  getEntry: (clientId, month, financialYear) => 
    api.get(`/billing/${clientId}/${month}${financialYear ? `?financialYear=${financialYear}` : ''}`),
  saveEntry: (entryData) => api.post('/billing', entryData),
  updateEntry: (id, entryData) => api.put(`/billing/${id}`, entryData),
  deleteEntry: (clientId, month, financialYear) => 
    api.delete(`/billing/${clientId}/${month}${financialYear ? `?financialYear=${financialYear}` : ''}`),
  getSummary: (month, financialYear) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (financialYear) params.append('financialYear', financialYear);
    return api.get(`/billing/reports/summary?${params.toString()}`);
  },
  getClientReport: (clientId, financialYear) => 
    api.get(`/billing/reports/client/${clientId}${financialYear ? `?financialYear=${financialYear}` : ''}`),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/${key}`),
  update: (key, value, description) => api.put(`/settings/${key}`, { value, description }),
  updateFinancialYear: (startYear) => api.put('/settings/financial-year', { startYear }),
  updateExchangeRate: (rate) => api.put('/settings/exchange-rate', { rate }),
  updateUsdExchangeRate: (rate) => api.put('/settings/usd-exchange-rate', { rate }),
  initialize: () => api.post('/settings/initialize'),
};

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { verificationToken: token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { resetPasswordToken: token, newPassword: password }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me')
};

export default api;
