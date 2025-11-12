import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../middleware/errorHandler';
import Project from '../models/Project';

export const validateObjectId = (id: string, fieldName: string = 'ID'): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error: ApiError = new Error(`Invalid ${fieldName} format`);
    error.statusCode = 400;
    throw error;
  }
};

export const validateProjectId = (req: Request, _res: Response, next: NextFunction): void => {
  const { projectId } = req.params;
  if (projectId) {
    validateObjectId(projectId, 'Project ID');
  }
  next();
};

export const validatePromptId = (req: Request, _res: Response, next: NextFunction): void => {
  // Check both 'id' and 'promptId' params to support different route patterns
  const promptId = req.params.promptId || req.params.id;
  if (promptId) {
    validateObjectId(promptId, 'Prompt ID');
  }
  next();
};

export const validatePromptVersionId = (req: Request, _res: Response, next: NextFunction): void => {
  const { id } = req.params;
  if (id) {
    validateObjectId(id, 'Prompt Version ID');
  }
  next();
};

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
    const error: ApiError = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  
  if (!project.isActive) {
    const error: ApiError = new Error('Project has been deleted');
    error.statusCode = 404;
    throw error;
  }
};

export const validateRequest = (schema: {
  name?: string;
  promptText?: string;
  isActive?: boolean;
  activePrompt?: boolean;
  email?: string;
  password?: string;
}): void => {
  if (schema.name !== undefined) {
    if (typeof schema.name !== 'string' || schema.name.trim().length === 0) {
      const error: ApiError = new Error('Name is required and must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
    if (schema.name.length > 200) {
      const error: ApiError = new Error('Name must not exceed 200 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  if (schema.promptText !== undefined) {
    if (typeof schema.promptText !== 'string' || schema.promptText.trim().length === 0) {
      const error: ApiError = new Error('Prompt text is required and must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
  }

  if (schema.isActive !== undefined && typeof schema.isActive !== 'boolean') {
    const error: ApiError = new Error('isActive must be a boolean');
    error.statusCode = 400;
    throw error;
  }

  if (schema.activePrompt !== undefined && typeof schema.activePrompt !== 'boolean') {
    const error: ApiError = new Error('activePrompt must be a boolean');
    error.statusCode = 400;
    throw error;
  }

  if (schema.email !== undefined) {
    if (typeof schema.email !== 'string' || schema.email.trim().length === 0) {
      const error: ApiError = new Error('Email is required and must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(schema.email)) {
      const error: ApiError = new Error('Please provide a valid email address');
      error.statusCode = 400;
      throw error;
    }
  }

  if (schema.password !== undefined) {
    if (typeof schema.password !== 'string') {
      const error: ApiError = new Error('Password must be a string');
      error.statusCode = 400;
      throw error;
    }
    const minLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '6', 10);
    if (schema.password.length < minLength) {
      const error: ApiError = new Error(`Password must be at least ${minLength} characters`);
      error.statusCode = 400;
      throw error;
    }
  }
};

