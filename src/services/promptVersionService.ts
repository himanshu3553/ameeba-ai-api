/**
 * Prompt Version Service
 * Handles all prompt version-related business logic
 */

import PromptVersion, { IPromptVersion } from '../models/PromptVersion';
import Prompt from '../models/Prompt';
import { ApiError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { DEFAULTS } from '../constants';
import {
  PromptVersionRequestBody,
  UpdatePromptVersionRequestBody,
  PromptVersionDocument,
} from '../types';

/**
 * Helper function to deactivate other prompt versions when setting activePrompt=true
 * @param promptId - Prompt ID
 * @param excludeVersionId - Version ID to exclude from deactivation
 * @param userId - User ID (optional, for ownership verification)
 */
const deactivateOtherVersions = async (
  promptId: string,
  excludeVersionId?: string,
  userId?: string
): Promise<void> => {
  const filter: { promptId: any; activePrompt: boolean; _id?: any; userId?: any } = {
    promptId,
    activePrompt: true,
  };

  if (userId) {
    filter.userId = userId;
  }

  if (excludeVersionId) {
    filter._id = { $ne: excludeVersionId };
  }

  await PromptVersion.updateMany(filter, { $set: { activePrompt: false } });
};

/**
 * Validate that prompt exists, is active, and optionally belongs to user
 * @param promptId - Prompt ID
 * @param userId - User ID (optional, for ownership verification)
 */
const validatePromptExists = async (promptId: string, userId?: string): Promise<void> => {
  const filter: { _id: any; isActive?: boolean; userId?: any } = {
    _id: promptId,
  };

  if (userId) {
    filter.userId = userId;
  }

  const prompt = await Prompt.findOne(filter);

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
};

/**
 * Create a new prompt version
 * @param userId - User ID
 * @param promptId - Prompt ID
 * @param versionData - Version data
 * @returns Created prompt version
 */
export const createPromptVersion = async (
  userId: string,
  promptId: string,
  versionData: PromptVersionRequestBody
): Promise<PromptVersionDocument> => {
  // Validate prompt exists, is active, and belongs to user
  await validatePromptExists(promptId, userId);

  const { promptText, activePrompt, isActive } = versionData;

  // Count existing versions for this prompt (including inactive ones to maintain sequence)
  const existingVersionsCount = await PromptVersion.countDocuments({
    promptId,
    userId,
  });

  // Calculate next version number (v1, v2, v3, etc.)
  const nextVersionNumber = existingVersionsCount + 1;
  const version = `v${nextVersionNumber}`;
  const versionName = `Version ${nextVersionNumber}`;

  // If setting activePrompt=true, deactivate other versions of the same prompt
  if (activePrompt === true) {
    await deactivateOtherVersions(promptId, undefined, userId);
  }

  const promptVersion: IPromptVersion = new PromptVersion({
    userId,
    promptId,
    promptText: promptText.trim(),
    version,
    versionName,
    activePrompt: activePrompt !== undefined ? activePrompt : DEFAULTS.ACTIVE_PROMPT,
    isActive: isActive !== undefined ? isActive : DEFAULTS.IS_ACTIVE,
  });

  const savedVersion = await promptVersion.save();
  return savedVersion as PromptVersionDocument;
};

/**
 * Get all prompt versions for a prompt
 * @param userId - User ID
 * @param promptId - Prompt ID
 * @returns Array of prompt versions
 */
export const getPromptVersionsByPrompt = async (
  userId: string,
  promptId: string
): Promise<PromptVersionDocument[]> => {
  // Validate prompt exists and belongs to user
  await validatePromptExists(promptId, userId);

  // Only return active prompt versions for this user
  const filter: { userId: any; promptId: any; isActive: boolean } = {
    userId,
    promptId,
    isActive: true,
  };

  const versions = await PromptVersion.find(filter)
    .populate({
      path: 'promptId',
      select: 'name projectId',
      populate: {
        path: 'projectId',
        select: 'name',
      },
    })
    .sort({ createdAt: -1 });

  return versions as PromptVersionDocument[];
};

/**
 * Get the active prompt version for a prompt (public endpoint)
 * @param promptId - Prompt ID
 * @returns Active prompt version
 */
export const getActivePromptVersion = async (
  promptId: string
): Promise<PromptVersionDocument> => {
  // Validate prompt exists and is active (no userId check - public endpoint)
  await validatePromptExists(promptId);

  // Find the active version for this prompt (no userId filter - public endpoint)
  const version = await PromptVersion.findOne({
    promptId,
    activePrompt: true,
    isActive: true,
  })
    .populate({
      path: 'promptId',
      select: 'name projectId',
      populate: {
        path: 'projectId',
        select: 'name',
      },
    });

  if (!version) {
    const error: ApiError = new Error(ERROR_MESSAGES.NO_ACTIVE_VERSION_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return version as PromptVersionDocument;
};

/**
 * Get a prompt version by ID
 * @param versionId - Version ID
 * @param userId - User ID (optional, for ownership verification)
 * @returns Prompt version document
 */
export const getPromptVersionById = async (
  versionId: string,
  userId?: string
): Promise<PromptVersionDocument> => {
  const filter: { _id: any; userId?: any } = {
    _id: versionId,
  };

  if (userId) {
    filter.userId = userId;
  }

  const version = await PromptVersion.findOne(filter)
    .populate({
      path: 'promptId',
      select: 'name projectId',
      populate: {
        path: 'projectId',
        select: 'name',
      },
    });

  if (!version) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (!version.isActive) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_DELETED);
    error.statusCode = 404;
    throw error;
  }

  return version as PromptVersionDocument;
};

/**
 * Update a prompt version
 * @param versionId - Version ID
 * @param userId - User ID
 * @param updateData - Fields to update
 * @returns Updated prompt version
 */
export const updatePromptVersion = async (
  versionId: string,
  userId: string,
  updateData: UpdatePromptVersionRequestBody
): Promise<PromptVersionDocument> => {
  // First verify the version exists and belongs to the user
  const existingVersion = await PromptVersion.findOne({
    _id: versionId,
    userId,
  });

  if (!existingVersion) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  const updateFields: {
    promptText?: string;
    activePrompt?: boolean;
    isActive?: boolean;
  } = {};

  if (updateData.promptText !== undefined) {
    updateFields.promptText = updateData.promptText.trim();
  }

  if (updateData.activePrompt !== undefined) {
    updateFields.activePrompt = updateData.activePrompt;

    // If setting activePrompt=true, deactivate other versions of the same prompt
    if (updateData.activePrompt === true) {
      await deactivateOtherVersions(
        existingVersion.promptId.toString(),
        versionId,
        userId
      );
    }
  }

  if (updateData.isActive !== undefined) {
    updateFields.isActive = updateData.isActive;
  }

  if (Object.keys(updateFields).length === 0) {
    const error: ApiError = new Error(ERROR_MESSAGES.NO_VALID_FIELDS_TO_UPDATE);
    error.statusCode = 400;
    throw error;
  }

  const updatedVersion = await PromptVersion.findOneAndUpdate(
    { _id: versionId, userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .populate({
      path: 'promptId',
      select: 'name projectId',
      populate: {
        path: 'projectId',
        select: 'name',
      },
    });

  if (!updatedVersion) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return updatedVersion as PromptVersionDocument;
};

/**
 * Soft delete a prompt version
 * @param versionId - Version ID
 * @param userId - User ID
 * @returns Deleted prompt version
 */
export const deletePromptVersion = async (
  versionId: string,
  userId: string
): Promise<PromptVersionDocument> => {
  const version = await PromptVersion.findOneAndUpdate(
    { _id: versionId, userId },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!version) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return version as PromptVersionDocument;
};

