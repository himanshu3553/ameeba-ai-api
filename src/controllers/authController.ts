/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';
import { sendCreated, sendSuccess } from '../utils/responseHelpers';
import * as authService from '../services/authService';
import { AuthenticatedRequest, SignupRequestBody, LoginRequestBody } from '../types';
import { HTTP_STATUS } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
export const signup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body as SignupRequestBody;

    // Validate required fields
    validateRequest({ email, password });

    // Create user and generate token
    const result = await authService.signupUser({ email, password, name });

    // Return user data with token
    sendCreated(res, {
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    // Handle duplicate email error (MongoDB unique constraint)
    if ((error as any).code === 11000) {
      const apiError: ApiError = new Error(ERROR_MESSAGES.UNABLE_TO_CREATE_ACCOUNT);
      apiError.statusCode = HTTP_STATUS.BAD_REQUEST;
      return next(apiError);
    }
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequestBody;

    // Validate required fields
    validateRequest({ email, password });

    // Authenticate user and generate token
    const result = await authService.loginUser({ email, password });

    // Return user data with token
    sendSuccess(res, {
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user details
 * GET /api/auth/getUserDetails
 */
export const getUserDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: ApiError = new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    // Get user details
    const user = await authService.getUserById(req.user.userId);

    // Return user data
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

