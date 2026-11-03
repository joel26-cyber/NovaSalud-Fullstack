import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 25000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nova_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nova_token');
      localStorage.removeItem('nova_user');
      window.dispatchEvent(new Event('nova:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export function uploadUrl(filename) {
  return filename ? `/uploads/${filename}` : null;
}
