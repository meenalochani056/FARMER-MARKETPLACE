import api from './api';
export const getMarketPrices = (params) => api.get('/market-prices', { params });
export const saveMarketPrice = (data, id) => api[id ? 'put' : 'post'](`/market-prices${id ? `/${id}` : ''}`, data);
export const deleteMarketPrice = (id) => api.delete(`/market-prices/${id}`);
