import { Request, Response, NextFunction } from 'express';
import Prompt, { IPrompt } from '../models/Prompt';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest, validateProjectExists } from '../utils/validation';

/**
 * Helper function to deactivate other prompts when setting activePrompt=true
 */
const deactivateOtherPrompts = async (
  projectId: string,
  excludePromptId?: string
): Promise<void> => {
  const filter: { projectId: any; activePrompt: boolean; _id?: any } = {
    projectId,
    activePrompt: true,
  };

  if (excludePromptId) {
    filter._id = { $ne: excludePromptId };
  }

  await Prompt.updateMany(filter, { $set: { activePrompt: false } });
};

export const createPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, promptText, activePrompt, isActive } = req.body;

    // Validate project exists and is active
    await validateProjectExists(projectId);

    validateRequest({ name, promptText, activePrompt, isActive });

    // If setting activePrompt=true, deactivate other prompts in the project
    if (activePrompt === true) {
      await deactivateOtherPrompts(projectId);
    }

    const prompt: IPrompt = new Prompt({
      projectId,
      name: name.trim(),
      promptText: promptText.trim(),
      activePrompt: activePrompt !== undefined ? activePrompt : false,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedPrompt = await prompt.save();

    res.status(201).json({
      success: true,
      data: savedPrompt,
    });
  } catch (error) {
    next(error);
  }
};

export const getPromptsByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { includeInactive } = req.query;

    // Validate project exists
    await validateProjectExists(projectId);

    const filter: { projectId: any; isActive?: boolean } = { projectId };

    // Only include active prompts by default
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    const prompts = await Prompt.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prompts.length,
      data: prompts,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivePrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    // Validate project exists and is active
    await validateProjectExists(projectId);

    // Find the active prompt for this project
    const prompt = await Prompt.findOne({
      projectId,
      activePrompt: true,
      isActive: true,
    }).populate('projectId', 'name');

    if (!prompt) {
      const error: ApiError = new Error('No active prompt found for this project');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

export const getPromptById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const prompt = await Prompt.findById(id).populate('projectId', 'name');

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

    res.status(200).json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, promptText, activePrompt, isActive } = req.body;

    const prompt = await Prompt.findById(id);

    if (!prompt) {
      const error: ApiError = new Error('Prompt not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData: {
      name?: string;
      promptText?: string;
      activePrompt?: boolean;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      validateRequest({ name });
      updateData.name = name.trim();
    }

    if (promptText !== undefined) {
      validateRequest({ promptText });
      updateData.promptText = promptText.trim();
    }

    if (activePrompt !== undefined) {
      validateRequest({ activePrompt });
      updateData.activePrompt = activePrompt;

      // If setting activePrompt=true, deactivate other prompts in the same project
      if (activePrompt === true) {
        await deactivateOtherPrompts(prompt.projectId.toString(), id);
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

    const updatedPrompt = await Prompt.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('projectId', 'name');

    res.status(200).json({
      success: true,
      data: updatedPrompt,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const prompt = await Prompt.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!prompt) {
      const error: ApiError = new Error('Prompt not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Prompt deleted successfully',
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

