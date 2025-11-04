import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface ApiError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyPattern)[0];
    message = `${field} already exists with this value`;
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationError = err as mongoose.Error.ValidationError;
    const errors = Object.values(validationError.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Handle custom API errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error: ApiError = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

