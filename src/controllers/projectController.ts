/**
 * Project Controller
 * Handles HTTP requests for project endpoints
 */

import { Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { validateRequest } from '../utils/validation';
import { sendCreated, sendSuccess, sendSuccessWithCount, sendSuccessWithMessage } from '../utils/responseHelpers';
import * as projectService from '../services/projectService';
import { AuthenticatedRequest, ProjectRequestBody, UpdateProjectRequestBody } from '../types';
import { HTTP_STATUS } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Create a new project
 * POST /api/project/create
 */
export const createProject = async (
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

    const { name, isActive } = req.body as ProjectRequestBody;

    // Validate request data
    validateRequest({ name, isActive });

    // Create project
    const project = await projectService.createProject(req.user.userId, { name, isActive });

    // Return created project
    sendCreated(res, project);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects for the authenticated user
 * GET /api/project/getProjects
 */
export const getProjects = async (
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

    const { includeInactive } = req.query;
    const includeInactiveFlag = includeInactive === 'true';

    // Get projects
    const projects = await projectService.getProjects(req.user.userId, includeInactiveFlag);

    // Return projects with count
    sendSuccessWithCount(res, projects, projects.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a project by ID
 * GET /api/project/:id
 */
export const getProjectById = async (
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

    // Get project
    const project = await projectService.getProjectById(id, req.user.userId);

    // Return project
    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a project
 * PUT /api/project/:id
 */
export const updateProject = async (
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
    const { name, isActive } = req.body as UpdateProjectRequestBody;

    // Validate update data
    validateRequest({ name, isActive });

    // Update project
    const project = await projectService.updateProject(id, req.user.userId, { name, isActive });

    // Return updated project
    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a project
 * DELETE /api/project/:id
 */
export const deleteProject = async (
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

    // Delete project
    const project = await projectService.deleteProject(id, req.user.userId);

    // Return deleted project with message
    sendSuccessWithMessage(res, project, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

