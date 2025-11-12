import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: ApiError = new Error('Authentication required. Please provide a valid token.');
      error.statusCode = 401;
      throw error;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      const error: ApiError = new Error('Authentication required. Please provide a valid token.');
      error.statusCode = 401;
      throw error;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      const error: ApiError = new Error('JWT secret is not configured');
      error.statusCode = 500;
      throw error;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        iat?: number;
        exp?: number;
      };

      // Attach user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        const error: ApiError = new Error('Token has expired. Please login again.');
        error.statusCode = 401;
        throw error;
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        const error: ApiError = new Error('Invalid token. Please login again.');
        error.statusCode = 401;
        throw error;
      } else {
        const error: ApiError = new Error('Token verification failed');
        error.statusCode = 401;
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

