/**
 * Validation Utilities
 * Provides validation functions for request data and IDs
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../middleware/errorHandler';
import Project from '../models/Project';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { VALIDATION, HTTP_STATUS } from '../constants';

/**
 * Validate MongoDB ObjectId format
 * @param id - ID to validate
 * @param fieldName - Name of the field for error message
 */
export const validateObjectId = (id: string, fieldName: string = 'ID'): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error: ApiError = new Error(`Invalid ${fieldName} format`);
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }
};

/**
 * Middleware to validate project ID parameter
 */
export const validateProjectId = (req: Request, _res: Response, next: NextFunction): void => {
  const { projectId } = req.params;
  if (projectId) {
    validateObjectId(projectId, 'Project ID');
  }
  next();
};

/**
 * Middleware to validate prompt ID parameter
 * Supports both 'id' and 'promptId' params for different route patterns
 */
export const validatePromptId = (req: Request, _res: Response, next: NextFunction): void => {
  const promptId = req.params.promptId || req.params.id;
  if (promptId) {
    validateObjectId(promptId, 'Prompt ID');
  }
  next();
};

/**
 * Middleware to validate prompt version ID parameter
 */
export const validatePromptVersionId = (req: Request, _res: Response, next: NextFunction): void => {
  const { id } = req.params;
  if (id) {
    validateObjectId(id, 'Prompt Version ID');
  }
  next();
};

/**
 * Validate that a project exists, is active, and optionally belongs to user
 * @param projectId - Project ID to validate
 * @param userId - User ID (optional, for ownership verification)
 */
export const validateProjectExists = async (
  projectId: string,
  userId?: string
): Promise<void> => {
  validateObjectId(projectId, 'Project ID');
  
  const filter: { _id: any; isActive?: boolean; userId?: any } = {
    _id: projectId,
  };

  if (userId) {
    filter.userId = userId;
  }
  
  const project = await Project.findOne(filter);
  
  if (!project) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    error.statusCode = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  
  if (!project.isActive) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_DELETED);
    error.statusCode = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
};

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  name?: string;
  promptText?: string;
  isActive?: boolean;
  activePrompt?: boolean;
  email?: string;
  password?: string;
}

/**
 * Validate request body fields
 * @param schema - Object containing fields to validate
 */
export const validateRequest = (schema: ValidationSchema): void => {
  // Validate name field
  if (schema.name !== undefined) {
    if (typeof schema.name !== 'string' || schema.name.trim().length === 0) {
      const error: ApiError = new Error(ERROR_MESSAGES.NAME_REQUIRED);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
    if (schema.name.length > VALIDATION.NAME_MAX_LENGTH) {
      const error: ApiError = new Error(ERROR_MESSAGES.NAME_TOO_LONG);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }

  // Validate prompt text field
  if (schema.promptText !== undefined) {
    if (typeof schema.promptText !== 'string' || schema.promptText.trim().length === 0) {
      const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_TEXT_REQUIRED);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }

  // Validate isActive field
  if (schema.isActive !== undefined && typeof schema.isActive !== 'boolean') {
    const error: ApiError = new Error(ERROR_MESSAGES.IS_ACTIVE_MUST_BE_BOOLEAN);
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // Validate activePrompt field
  if (schema.activePrompt !== undefined && typeof schema.activePrompt !== 'boolean') {
    const error: ApiError = new Error(ERROR_MESSAGES.ACTIVE_PROMPT_MUST_BE_BOOLEAN);
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // Validate email field
  if (schema.email !== undefined) {
    if (typeof schema.email !== 'string' || schema.email.trim().length === 0) {
      const error: ApiError = new Error(ERROR_MESSAGES.EMAIL_REQUIRED);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
    if (!VALIDATION.EMAIL_REGEX.test(schema.email)) {
      const error: ApiError = new Error(ERROR_MESSAGES.EMAIL_INVALID);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }

  // Validate password field
  if (schema.password !== undefined) {
    if (typeof schema.password !== 'string') {
      const error: ApiError = new Error(ERROR_MESSAGES.PASSWORD_REQUIRED);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
    if (schema.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      const error: ApiError = new Error(
        ERROR_MESSAGES.PASSWORD_TOO_SHORT(VALIDATION.PASSWORD_MIN_LENGTH)
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }
};

