import { validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';
export default function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array().map((item) => item.msg).join(', '), 422));
  next();
}
