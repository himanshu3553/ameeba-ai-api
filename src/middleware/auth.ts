/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user information to requests
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS, ENV_KEYS } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * JWT Token payload interface
 */
interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Validates JWT token from Authorization header and attaches user to request
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: ApiError = new Error(ERROR_MESSAGES.AUTH_REQUIRED);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      const error: ApiError = new Error(ERROR_MESSAGES.AUTH_REQUIRED);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    // Verify token
    const jwtSecret = process.env[ENV_KEYS.JWT_SECRET];
    if (!jwtSecret) {
      const error: ApiError = new Error(ERROR_MESSAGES.JWT_SECRET_NOT_CONFIGURED);
      error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw error;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Attach user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        const error: ApiError = new Error(ERROR_MESSAGES.TOKEN_EXPIRED);
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        const error: ApiError = new Error(ERROR_MESSAGES.INVALID_TOKEN);
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
      } else {
        const error: ApiError = new Error(ERROR_MESSAGES.TOKEN_VERIFICATION_FAILED);
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

