/**
 * Prompt Service
 * Handles all prompt-related business logic
 */

import Prompt, { IPrompt } from '../models/Prompt';
import { ApiError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { DEFAULTS } from '../constants';
import { validateProjectExists } from '../utils/validation';
import { PromptRequestBody, UpdatePromptRequestBody, PromptDocument } from '../types';

/**
 * Create a new prompt
 * @param userId - User ID
 * @param projectId - Project ID
 * @param promptData - Prompt data
 * @returns Created prompt
 */
export const createPrompt = async (
  userId: string,
  projectId: string,
  promptData: PromptRequestBody
): Promise<PromptDocument> => {
  // Validate project exists, is active, and belongs to user
  await validateProjectExists(projectId, userId);

  const { name, isActive } = promptData;

  const prompt: IPrompt = new Prompt({
    userId,
    projectId,
    name: name.trim(),
    isActive: isActive !== undefined ? isActive : DEFAULTS.IS_ACTIVE,
  });

  const savedPrompt = await prompt.save();
  return savedPrompt as PromptDocument;
};

/**
 * Get all prompts for a project
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns Array of prompts
 */
export const getPromptsByProject = async (
  userId: string,
  projectId: string
): Promise<PromptDocument[]> => {
  // Validate project exists and belongs to user
  await validateProjectExists(projectId, userId);

  // Only return active prompts for this user
  const filter: { userId: any; projectId: any; isActive: boolean } = {
    userId,
    projectId,
    isActive: true,
  };

  const prompts = await Prompt.find(filter).sort({ createdAt: -1 });
  return prompts as PromptDocument[];
};

/**
 * Get a prompt by ID
 * @param promptId - Prompt ID
 * @param userId - User ID (optional, for ownership verification)
 * @returns Prompt document
 */
export const getPromptById = async (
  promptId: string,
  userId?: string
): Promise<PromptDocument> => {
  const filter: { _id: any; userId?: any } = {
    _id: promptId,
  };

  if (userId) {
    filter.userId = userId;
  }

  const prompt = await Prompt.findOne(filter).populate('projectId', 'name');

  if (!prompt) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (!prompt.isActive) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_DELETED);
    error.statusCode = 404;
    throw error;
  }

  return prompt as PromptDocument;
};

/**
 * Update a prompt
 * @param promptId - Prompt ID
 * @param userId - User ID
 * @param updateData - Fields to update
 * @returns Updated prompt
 */
export const updatePrompt = async (
  promptId: string,
  userId: string,
  updateData: UpdatePromptRequestBody
): Promise<PromptDocument> => {
  // First verify the prompt exists and belongs to the user
  const existingPrompt = await Prompt.findOne({
    _id: promptId,
    userId,
  });

  if (!existingPrompt) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  const updateFields: { name?: string; isActive?: boolean } = {};

  if (updateData.name !== undefined) {
    updateFields.name = updateData.name.trim();
  }

  if (updateData.isActive !== undefined) {
    updateFields.isActive = updateData.isActive;
  }

  if (Object.keys(updateFields).length === 0) {
    const error: ApiError = new Error(ERROR_MESSAGES.NO_VALID_FIELDS_TO_UPDATE);
    error.statusCode = 400;
    throw error;
  }

  const updatedPrompt = await Prompt.findOneAndUpdate(
    { _id: promptId, userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  ).populate('projectId', 'name');

  if (!updatedPrompt) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return updatedPrompt as PromptDocument;
};

/**
 * Soft delete a prompt
 * @param promptId - Prompt ID
 * @param userId - User ID
 * @returns Deleted prompt
 */
export const deletePrompt = async (
  promptId: string,
  userId: string
): Promise<PromptDocument> => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: promptId, userId },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!prompt) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return prompt as PromptDocument;
};

