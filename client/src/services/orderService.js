import api from './api';
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const placeOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, status) => api.put(`/orders/${id}/status`, { status });
export const createPayment = (orderId, method) => api.post('/payments/create', { orderId, method });
export const verifyPayment = (paymentId, success) => api.post('/payments/verify', { paymentId, success });
export const getTracking = (id) => api.get(`/logistics/${id}`);
export const updateTracking = (id, status) => api.put(`/logistics/${id}/status`, { status });
