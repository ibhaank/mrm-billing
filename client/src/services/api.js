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
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  initialize: () => api.post('/settings/initialize'),
};

export default api;
