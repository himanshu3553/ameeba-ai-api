/**
 * Authentication Service
 * Handles all authentication-related business logic
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { ApiError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { ENV_KEYS, DEFAULTS } from '../constants';
import { SignupRequestBody, LoginRequestBody, UserResponse } from '../types';

/**
 * Generate JWT token for user
 * @param userId - User ID
 * @param email - User email
 * @returns JWT token string
 */
export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env[ENV_KEYS.JWT_SECRET];
  const jwtExpiresIn = process.env[ENV_KEYS.JWT_EXPIRES_IN] || DEFAULTS.JWT_EXPIRES_IN;

  if (!jwtSecret) {
    throw new Error(ERROR_MESSAGES.JWT_SECRET_NOT_CONFIGURED);
  }

  return jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  } as SignOptions);
};

/**
 * Create a new user account
 * @param userData - User signup data
 * @returns Created user and JWT token
 */
export const signupUser = async (userData: SignupRequestBody): Promise<{
  user: UserResponse;
  token: string;
}> => {
  const { email, password, name } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error: ApiError = new Error(ERROR_MESSAGES.UNABLE_TO_CREATE_ACCOUNT);
    error.statusCode = 400;
    throw error;
  }

  // Create new user
  const user: IUser = new User({
    email: email.toLowerCase().trim(),
    password,
    name: name ? name.trim() : undefined,
    isActive: DEFAULTS.IS_ACTIVE,
  });

  const savedUser = await user.save();

  // Generate JWT token
  const token = generateToken((savedUser._id as any).toString(), savedUser.email);

  // Return user data (without password)
  const userResponse: UserResponse = {
    _id: savedUser._id,
    email: savedUser.email,
    name: savedUser.name,
    isActive: savedUser.isActive,
    createdAt: savedUser.createdAt,
    updatedAt: savedUser.updatedAt,
  };

  return {
    user: userResponse,
    token,
  };
};

/**
 * Authenticate user and generate token
 * @param credentials - User login credentials
 * @returns User and JWT token
 */
export const loginUser = async (credentials: LoginRequestBody): Promise<{
  user: UserResponse;
  token: string;
}> => {
  const { email, password } = credentials;

  // Find user by email and include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const error: ApiError = new Error(ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD);
    error.statusCode = 401;
    throw error;
  }

  // Check if user is active
  if (!user.isActive) {
    const error: ApiError = new Error(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    error.statusCode = 403;
    throw error;
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error: ApiError = new Error(ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD);
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateToken((user._id as any).toString(), user.email);

  // Return user data (without password)
  const userResponse: UserResponse = {
    _id: user._id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: userResponse,
    token,
  };
};

/**
 * Get user details by ID
 * @param userId - User ID
 * @returns User document
 */
export const getUserById = async (userId: string): Promise<UserResponse> => {
  const user = await User.findById(userId);

  if (!user) {
    const error: ApiError = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error: ApiError = new Error(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    error.statusCode = 403;
    throw error;
  }

  const userResponse: UserResponse = {
    _id: user._id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return userResponse;
};

