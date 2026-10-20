import Notification from '../models/Notification.js';
export const notify = (user, title, message, type = 'info') => Notification.create({ user, title, message, type });
