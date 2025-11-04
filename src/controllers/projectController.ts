import { Request, Response, NextFunction } from 'express';
import Project, { IProject } from '../models/Project';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, isActive } = req.body;

    validateRequest({ name, isActive });

    const project: IProject = new Project({
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedProject = await project.save();

    res.status(201).json({
      success: true,
      data: savedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    const filter: { isActive?: boolean } = {};

    // Only include active projects by default
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

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

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const updateData: { name?: string; isActive?: boolean } = {};

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

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!project) {
      const error: ApiError = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!project) {
      const error: ApiError = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

