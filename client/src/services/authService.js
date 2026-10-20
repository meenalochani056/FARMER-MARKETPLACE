import api from './api';
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (details) => api.post('/auth/register', details);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (details) => api.put('/auth/profile', details);
