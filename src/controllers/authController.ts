import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';

/**
 * Generate JWT token for user
 */
const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';

  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  } as SignOptions);
};

/**
 * Sign up a new user
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    validateRequest({ email, password });

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Use generic error message to prevent email enumeration
      const error: ApiError = new Error('Unable to create account. Please try again.');
      error.statusCode = 400;
      throw error;
    }

    // Create new user
    const user: IUser = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name ? name.trim() : undefined,
      isActive: true,
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = generateToken((savedUser._id as any).toString(), savedUser.email);

    // Return user data (without password)
    const userResponse = {
      _id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
    };

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    // Handle duplicate email error (MongoDB unique constraint)
    if ((error as any).code === 11000) {
      const apiError: ApiError = new Error('Unable to create account. Please try again.');
      apiError.statusCode = 400;
      return next(apiError);
    }
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    validateRequest({ email, password });

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Use generic error message to prevent email enumeration
      const error: ApiError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if user is active
    if (!user.isActive) {
      const error: ApiError = new Error('Account has been deactivated');
      error.statusCode = 403;
      throw error;
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Use generic error message to prevent email enumeration
      const error: ApiError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = generateToken((user._id as any).toString(), user.email);

    // Return user data (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user details
 */
export const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: ApiError = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      const error: ApiError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.isActive) {
      const error: ApiError = new Error('Account has been deactivated');
      error.statusCode = 403;
      throw error;
    }

    // Return user data (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

