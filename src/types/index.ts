/**
 * Shared type definitions and interfaces
 * Centralized location for common types used across the application
 */

import { Request } from 'express';
import { Document } from 'mongoose';

/**
 * Extended Express Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Standard API Response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

/**
 * Query filter options
 */
export interface QueryFilter {
  includeInactive?: boolean;
}

/**
 * Base document interface with common fields
 */
export interface BaseDocument extends Document {
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User document interface (Mongoose document)
 */
export interface UserDocument extends BaseDocument {
  _id: any;
  email: string;
  name?: string;
}

/**
 * User response interface (plain object, no Mongoose methods)
 */
export interface UserResponse {
  _id: any;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project document interface
 */
export interface ProjectDocument extends BaseDocument {
  _id: any;
  userId: any;
  name: string;
}

/**
 * Prompt document interface
 */
export interface PromptDocument extends BaseDocument {
  _id: any;
  userId: any;
  projectId: any;
  name: string;
}

/**
 * Prompt version document interface
 */
export interface PromptVersionDocument extends BaseDocument {
  _id: any;
  userId: any;
  promptId: any;
  promptText: string;
  version: string;
  versionName: string;
  activePrompt: boolean;
}

/**
 * Request body types
 */
export interface SignupRequestBody {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface ProjectRequestBody {
  name: string;
  isActive?: boolean;
}

export interface PromptRequestBody {
  name: string;
  isActive?: boolean;
}

export interface PromptVersionRequestBody {
  promptText: string;
  activePrompt?: boolean;
  isActive?: boolean;
}

/**
 * Update request body types (all fields optional)
 */
export interface UpdateProjectRequestBody {
  name?: string;
  isActive?: boolean;
}

export interface UpdatePromptRequestBody {
  name?: string;
  isActive?: boolean;
}

export interface UpdatePromptVersionRequestBody {
  promptText?: string;
  activePrompt?: boolean;
  isActive?: boolean;
}

