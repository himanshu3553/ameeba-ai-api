import { Request, Response, NextFunction } from 'express';
import PromptVersion, { IPromptVersion } from '../models/PromptVersion';
import Prompt from '../models/Prompt';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';

/**
 * Helper function to deactivate other prompt versions when setting activePrompt=true
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
 * Validate that prompt exists, is active, and belongs to user
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
    const error: ApiError = new Error('Prompt not found');
    error.statusCode = 404;
    throw error;
  }

  if (!prompt.isActive) {
    const error: ApiError = new Error('Prompt has been deleted');
    error.statusCode = 404;
    throw error;
  }
};

export const createPromptVersion = async (
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

    const { promptId } = req.params;
    const { promptText, activePrompt, isActive } = req.body;

    // Validate prompt exists, is active, and belongs to user
    await validatePromptExists(promptId, req.user.userId);

    validateRequest({ promptText, activePrompt, isActive });

    // Count existing versions for this prompt (including inactive ones to maintain sequence)
    const existingVersionsCount = await PromptVersion.countDocuments({
      promptId,
      userId: req.user.userId,
    });

    // Calculate next version number (v1, v2, v3, etc.)
    const nextVersionNumber = existingVersionsCount + 1;
    const version = `v${nextVersionNumber}`;
    const versionName = `Version ${nextVersionNumber}`;

    // If setting activePrompt=true, deactivate other versions of the same prompt
    if (activePrompt === true) {
      await deactivateOtherVersions(promptId, undefined, req.user.userId);
    }

    const promptVersion: IPromptVersion = new PromptVersion({
      userId: req.user.userId,
      promptId,
      promptText: promptText.trim(),
      version,
      versionName,
      activePrompt: activePrompt !== undefined ? activePrompt : false,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedVersion = await promptVersion.save();

    res.status(201).json({
      success: true,
      data: savedVersion,
    });
  } catch (error) {
    next(error);
  }
};

export const getPromptVersionsByPrompt = async (
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

    const { promptId } = req.params;

    // Validate prompt exists and belongs to user
    await validatePromptExists(promptId, req.user.userId);

    // Only return active prompt versions for this user
    const filter: { userId: any; promptId: any; isActive: boolean } = {
      userId: req.user.userId,
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

    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivePromptVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { promptId } = req.params;

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
      const error: ApiError = new Error('No active version found for this prompt');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: version,
    });
  } catch (error) {
    next(error);
  }
};

export const getPromptVersionById = async (
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

    const { id } = req.params;

    const version = await PromptVersion.findOne({
      _id: id,
      userId: req.user.userId,
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
      const error: ApiError = new Error('Prompt version not found');
      error.statusCode = 404;
      throw error;
    }

    if (!version.isActive) {
      const error: ApiError = new Error('Prompt version has been deleted');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: version,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePromptVersion = async (
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

    const { id } = req.params;
    const { promptText, activePrompt, isActive } = req.body;

    // First verify the version exists and belongs to the user
    const existingVersion = await PromptVersion.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!existingVersion) {
      const error: ApiError = new Error('Prompt version not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData: {
      promptText?: string;
      activePrompt?: boolean;
      isActive?: boolean;
    } = {};

    if (promptText !== undefined) {
      validateRequest({ promptText });
      updateData.promptText = promptText.trim();
    }

    if (activePrompt !== undefined) {
      validateRequest({ activePrompt });
      updateData.activePrompt = activePrompt;

      // If setting activePrompt=true, deactivate other versions of the same prompt
      if (activePrompt === true) {
        await deactivateOtherVersions(
          existingVersion.promptId.toString(),
          id,
          req.user.userId
        );
      }
    }

    if (isActive !== undefined) {
      validateRequest({ isActive });
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      const error: ApiError = new Error('No valid fields to update');
      error.statusCode = 400;
      throw error;
    }

    const updatedVersion = await PromptVersion.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { $set: updateData },
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
      const error: ApiError = new Error('Prompt version not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: updatedVersion,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePromptVersion = async (
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

    const { id } = req.params;

    const version = await PromptVersion.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!version) {
      const error: ApiError = new Error('Prompt version not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Prompt version deleted successfully',
      data: version,
    });
  } catch (error) {
    next(error);
  }
};

