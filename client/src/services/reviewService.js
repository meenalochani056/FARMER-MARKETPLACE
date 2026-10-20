import api from './api';
export const createReview = (data) => api.post('/reviews', data);
export const getFarmerReviews = (id) => api.get(`/reviews/farmers/${id}/reviews`);
