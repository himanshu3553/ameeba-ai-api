/**
 * Authentication Middleware Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth';
import { AuthenticatedRequest } from '../../types';
import { ApiError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../constants';
import { ERROR_MESSAGES } from '../../constants/errorMessages';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe('authenticate', () => {
    it('should authenticate valid token', () => {
      const token = jwt.sign({ userId: 'user123', email: 'test@example.com' }, 'test-secret-key');
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
      });
    });

    it('should throw error if authorization header is missing', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.AUTH_REQUIRED);
    });

    it('should throw error if authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'Invalid token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.AUTH_REQUIRED);
    });

    it('should throw error if token is empty', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.AUTH_REQUIRED);
    });

    it('should throw error if JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;
      const token = jwt.sign({ userId: 'user123', email: 'test@example.com' }, 'test-secret-key');
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe(ERROR_MESSAGES.JWT_SECRET_NOT_CONFIGURED);
    });

    it('should throw error for expired token', () => {
      const token = jwt.sign({ userId: 'user123', email: 'test@example.com' }, 'test-secret-key', {
        expiresIn: '-1h',
      });
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.TOKEN_EXPIRED);
    });

    it('should throw error for invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.INVALID_TOKEN);
    });

    it('should throw error for token signed with different secret', () => {
      const token = jwt.sign({ userId: 'user123', email: 'test@example.com' }, 'different-secret');
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.INVALID_TOKEN);
    });

    it('should throw TOKEN_VERIFICATION_FAILED for other jwt.verify errors', () => {
      // Mock jwt.verify to throw a generic error (not JsonWebTokenError or TokenExpiredError)
      const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Generic verification error');
        error.name = 'NotJsonWebTokenError';
        throw error;
      });

      mockRequest.headers = {
        authorization: 'Bearer some.token.here',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe(ERROR_MESSAGES.TOKEN_VERIFICATION_FAILED);

      verifySpy.mockRestore();
    });
  });
});

