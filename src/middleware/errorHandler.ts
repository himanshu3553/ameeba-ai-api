/**
 * Error Handler Middleware
 * Handles all errors and provides consistent error responses
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS, ENV_KEYS } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { ApiResponse } from '../types';

/**
 * Extended Error interface for API errors
 */
export interface ApiError extends Error {
  statusCode?: number;
  code?: number;
}

/**
 * Global error handler middleware
 * Catches all errors and formats them into consistent API responses
 */
export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys((err as any).keyPattern)[0];
    message = ERROR_MESSAGES.DUPLICATE_KEY(field);
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    const validationError = err as mongoose.Error.ValidationError;
    const errors = Object.values(validationError.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = ERROR_MESSAGES.INVALID_ID_FORMAT;
  }

  // Handle custom API errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  const response: ApiResponse = {
    success: false,
    error: {
      message,
      ...(process.env[ENV_KEYS.NODE_ENV] === 'development' && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler middleware
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error: ApiError = new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND(req.originalUrl));
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

