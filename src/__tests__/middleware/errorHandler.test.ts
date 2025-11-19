/**
 * Error Handler Middleware Tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { errorHandler, notFoundHandler, ApiError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../constants';
import { ERROR_MESSAGES } from '../../constants/errorMessages';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle generic errors', () => {
      const error = new Error('Generic error');

      errorHandler(error as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Generic error',
        },
      });
    });

    it('should handle errors with statusCode', () => {
      const error: ApiError = new Error('Not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Not found',
        },
      });
    });

    it('should handle MongoDB duplicate key error', () => {
      const error: any = new Error('Duplicate key');
      error.name = 'MongoServerError';
      error.code = 11000;
      error.keyPattern = { email: 1 };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.DUPLICATE_KEY('email'),
        },
      });
    });

    it('should handle MongoDB validation errors', () => {
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = {
        name: {
          message: 'Name is required',
          name: 'ValidatorError',
        } as any,
        email: {
          message: 'Email is invalid',
          name: 'ValidatorError',
        } as any,
      };

      errorHandler(validationError as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Name is required, Email is invalid',
        },
      });
    });

    it('should handle MongoDB CastError', () => {
      const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', '_id');

      errorHandler(castError as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_ID_FORMAT,
        },
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          stack: 'Error stack trace',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace when NODE_ENV is not set', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle error with statusCode 0 (falsy but valid)', () => {
      const error: ApiError = new Error('Test error');
      error.statusCode = 0;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // statusCode 0 is falsy, so should use default INTERNAL_SERVER_ERROR
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('should handle error without statusCode property', () => {
      const error = new Error('Test error');
      // Ensure statusCode is not set
      delete (error as any).statusCode;

      errorHandler(error as ApiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error and call next', () => {
      mockRequest.originalUrl = '/api/nonexistent';

      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toBe(ERROR_MESSAGES.ROUTE_NOT_FOUND('/api/nonexistent'));
    });
  });
});

