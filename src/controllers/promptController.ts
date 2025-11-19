/**
 * Prompt Controller
 * Handles HTTP requests for prompt endpoints
 */

import { Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';
import { sendCreated, sendSuccess, sendSuccessWithCount, sendSuccessWithMessage } from '../utils/responseHelpers';
import * as promptService from '../services/promptService';
import { AuthenticatedRequest, PromptRequestBody, UpdatePromptRequestBody } from '../types';
import { HTTP_STATUS } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Create a new prompt
 * POST /api/projects/:projectId/prompt/create
 */
export const createPrompt = async (
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

    const { projectId } = req.params;
    const { name, isActive } = req.body as PromptRequestBody;

    // Validate request data
    validateRequest({ name, isActive });

    // Create prompt
    const prompt = await promptService.createPrompt(req.user.userId, projectId, { name, isActive });

    // Return created prompt
    sendCreated(res, prompt);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all prompts for a project
 * GET /api/projects/:projectId/prompts
 */
export const getPromptsByProject = async (
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

    const { projectId } = req.params;

    // Get prompts
    const prompts = await promptService.getPromptsByProject(req.user.userId, projectId);

    // Return prompts with count
    sendSuccessWithCount(res, prompts, prompts.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a prompt by ID
 * GET /api/prompt/:id
 */
export const getPromptById = async (
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

    const { id } = req.params;

    // Get prompt
    const prompt = await promptService.getPromptById(id, req.user.userId);

    // Return prompt
    sendSuccess(res, prompt);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a prompt
 * PUT /api/prompt/:id
 */
export const updatePrompt = async (
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

    const { id } = req.params;
    const { name, isActive } = req.body as UpdatePromptRequestBody;

    // Validate update data
    validateRequest({ name, isActive });

    // Update prompt
    const prompt = await promptService.updatePrompt(id, req.user.userId, { name, isActive });

    // Return updated prompt
    sendSuccess(res, prompt);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a prompt
 * DELETE /api/prompt/:id
 */
export const deletePrompt = async (
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

    const { id } = req.params;

    // Delete prompt
    const prompt = await promptService.deletePrompt(id, req.user.userId);

    // Return deleted prompt with message
    sendSuccessWithMessage(res, prompt, 'Prompt deleted successfully');
  } catch (error) {
    next(error);
  }
};

