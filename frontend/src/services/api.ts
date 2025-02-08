import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const apiService = {
  get: <T>(url: string) => api.get<T, T>(url),
  post: <T>(url: string, data: unknown) => api.post<T, T>(url, data),
  put: <T>(url: string, data: unknown) => api.put<T, T>(url, data),
  patch: <T>(url: string, data: unknown) => api.patch<T, T>(url, data),
  delete: <T>(url: string) => api.delete<T, T>(url),
}; 