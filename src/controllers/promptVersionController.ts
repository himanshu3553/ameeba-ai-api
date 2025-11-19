/**
 * Prompt Version Controller
 * Handles HTTP requests for prompt version endpoints
 */

import { Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';
import { sendCreated, sendSuccess, sendSuccessWithCount, sendSuccessWithMessage } from '../utils/responseHelpers';
import * as promptVersionService from '../services/promptVersionService';
import { AuthenticatedRequest, PromptVersionRequestBody, UpdatePromptVersionRequestBody } from '../types';
import { HTTP_STATUS } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Create a new prompt version
 * POST /api/prompts/:promptId/version/create
 */
export const createPromptVersion = async (
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

    const { promptId } = req.params;
    const { promptText, activePrompt, isActive } = req.body as PromptVersionRequestBody;

    // Validate request data
    validateRequest({ promptText, activePrompt, isActive });

    // Create prompt version
    const version = await promptVersionService.createPromptVersion(
      req.user.userId,
      promptId,
      { promptText, activePrompt, isActive }
    );

    // Return created version
    sendCreated(res, version);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all prompt versions for a prompt
 * GET /api/prompts/:promptId/versions
 */
export const getPromptVersionsByPrompt = async (
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

    const { promptId } = req.params;

    // Get prompt versions
    const versions = await promptVersionService.getPromptVersionsByPrompt(req.user.userId, promptId);

    // Return versions with count
    sendSuccessWithCount(res, versions, versions.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Get the active prompt version for a prompt (public endpoint)
 * GET /api/prompts/:promptId/active
 */
export const getActivePromptVersion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { promptId } = req.params;

    // Get active prompt version (public endpoint, no authentication required)
    const version = await promptVersionService.getActivePromptVersion(promptId);

    // Return active version
    sendSuccess(res, version);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a prompt version by ID
 * GET /api/prompt-versions/:id
 */
export const getPromptVersionById = async (
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

    // Get prompt version
    const version = await promptVersionService.getPromptVersionById(id, req.user.userId);

    // Return version
    sendSuccess(res, version);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a prompt version
 * PUT /api/prompt-versions/:id
 */
export const updatePromptVersion = async (
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
    const { promptText, activePrompt, isActive } = req.body as UpdatePromptVersionRequestBody;

    // Validate update data
    validateRequest({ promptText, activePrompt, isActive });

    // Update prompt version
    const version = await promptVersionService.updatePromptVersion(
      id,
      req.user.userId,
      { promptText, activePrompt, isActive }
    );

    // Return updated version
    sendSuccess(res, version);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a prompt version
 * DELETE /api/prompt-versions/:id
 */
export const deletePromptVersion = async (
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

    // Delete prompt version
    const version = await promptVersionService.deletePromptVersion(id, req.user.userId);

    // Return deleted version with message
    sendSuccessWithMessage(res, version, 'Prompt version deleted successfully');
  } catch (error) {
    next(error);
  }
};

