export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, req, res, next) {
  const status = error.statusCode || (['ValidationError', 'CastError'].includes(error.name) ? 400 : error.code === 11000 ? 409 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({
    message: status === 500 ? 'An unexpected server error occurred.' : error.code === 11000 ? 'A record with that value already exists.' : error.message,
    ...(error.name === 'ValidationError' ? { errors: Object.values(error.errors).map((item) => item.message) } : {})
  });
}
