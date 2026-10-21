import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return next(new AppError('Authentication required.', 401));
  try {
    const secret = process.env.JWT_SECRET || 'FarmLink_Production_JWT_Secret_2026_SecureKey';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('Your account is unavailable.', 401);
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Invalid or expired session.', 401));
  }
}

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError('You are not authorized to perform this action.', 403));
  next();
};
