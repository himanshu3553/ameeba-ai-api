import { Request, Response, NextFunction } from 'express';
import Prompt, { IPrompt } from '../models/Prompt';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest, validateProjectExists } from '../utils/validation';

export const createPrompt = async (
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

    const { projectId } = req.params;
    const { name, isActive } = req.body;

    // Validate project exists, is active, and belongs to user
    await validateProjectExists(projectId, req.user.userId);

    validateRequest({ name, isActive });

    const prompt: IPrompt = new Prompt({
      userId: req.user.userId,
      projectId,
      name: name.trim(),
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
    if (!req.user) {
      const error: ApiError = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const { projectId } = req.params;

    // Validate project exists and belongs to user
    await validateProjectExists(projectId, req.user.userId);

    // Only return active prompts for this user
    const filter: { userId: any; projectId: any; isActive: boolean } = {
      userId: req.user.userId,
      projectId,
      isActive: true,
    };

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

// Note: getActivePrompt removed - active prompt logic is now handled at the version level
// Use PromptVersion endpoints to get active versions

export const getPromptById = async (
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

    const prompt = await Prompt.findOne({
      _id: id,
      userId: req.user.userId,
    }).populate('projectId', 'name');

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
    if (!req.user) {
      const error: ApiError = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;
    const { name, isActive } = req.body;

    // First verify the prompt exists and belongs to the user
    const existingPrompt = await Prompt.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!existingPrompt) {
      const error: ApiError = new Error('Prompt not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData: {
      name?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      validateRequest({ name });
      updateData.name = name.trim();
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

    const updatedPrompt = await Prompt.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('projectId', 'name');

    if (!updatedPrompt) {
      const error: ApiError = new Error('Prompt not found');
      error.statusCode = 404;
      throw error;
    }

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
    if (!req.user) {
      const error: ApiError = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const prompt = await Prompt.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
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

