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
  excludeVersionId?: string
): Promise<void> => {
  const filter: { promptId: any; activePrompt: boolean; _id?: any } = {
    promptId,
    activePrompt: true,
  };

  if (excludeVersionId) {
    filter._id = { $ne: excludeVersionId };
  }

  await PromptVersion.updateMany(filter, { $set: { activePrompt: false } });
};

/**
 * Validate that prompt exists and is active
 */
const validatePromptExists = async (promptId: string): Promise<void> => {
  const prompt = await Prompt.findById(promptId);

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
    const { promptId } = req.params;
    const { promptText, activePrompt, isActive } = req.body;

    // Validate prompt exists and is active
    await validatePromptExists(promptId);

    validateRequest({ promptText, activePrompt, isActive });

    // If setting activePrompt=true, deactivate other versions of the same prompt
    if (activePrompt === true) {
      await deactivateOtherVersions(promptId);
    }

    const promptVersion: IPromptVersion = new PromptVersion({
      promptId,
      promptText: promptText.trim(),
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
    const { promptId } = req.params;
    const { includeInactive } = req.query;

    // Validate prompt exists
    await validatePromptExists(promptId);

    const filter: { promptId: any; isActive?: boolean } = { promptId };

    // Only include active versions by default
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

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

    // Validate prompt exists and is active
    await validatePromptExists(promptId);

    // Find the active version for this prompt
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
    const { id } = req.params;

    const version = await PromptVersion.findById(id)
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
    const { id } = req.params;
    const { promptText, activePrompt, isActive } = req.body;

    const version = await PromptVersion.findById(id);

    if (!version) {
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
        await deactivateOtherVersions(version.promptId.toString(), id);
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

    const updatedVersion = await PromptVersion.findByIdAndUpdate(
      id,
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
    const { id } = req.params;

    const version = await PromptVersion.findByIdAndUpdate(
      id,
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

