import axios from 'axios';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const apiBaseUrl = configuredApiUrl
  ? (/\/api$/i.test(configuredApiUrl) ? configuredApiUrl : `${configuredApiUrl}/api`)
  : 'http://localhost:5000/api';
const api = axios.create({ baseURL: apiBaseUrl });
export function mediaUrl(path) {
  if (path?.startsWith('/images/produce/')) return `${import.meta.env.BASE_URL}${path.slice(1)}`;
  if (!path || /^https?:\/\//i.test(path)) return path || '';
  return `${apiBaseUrl.replace(/\/api\/?$/i, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('farmlink-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const messageFromError = (error) => error.response?.data?.message
  || (error.request ? `Unable to reach the API at ${apiBaseUrl}. Check that the server is running and VITE_API_URL is correct.` : 'Unable to complete the request. Please try again.');
export default api;
