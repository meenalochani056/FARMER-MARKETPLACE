import api from './api';
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getCategories = () => api.get('/products/categories');
export const getFarmer = (id) => api.get(`/farmers/${id}`);
export const saveProduct = (data, id) => api[id ? 'put' : 'post'](`/products${id ? `/${id}` : ''}`, data);
export const removeProduct = (id) => api.delete(`/products/${id}`);
