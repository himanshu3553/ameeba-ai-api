/**
 * Project Service
 * Handles all project-related business logic
 */

import Project, { IProject } from '../models/Project';
import { ApiError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { DEFAULTS } from '../constants';
import { ProjectRequestBody, UpdateProjectRequestBody, ProjectDocument } from '../types';

/**
 * Create a new project
 * @param userId - User ID
 * @param projectData - Project data
 * @returns Created project
 */
export const createProject = async (
  userId: string,
  projectData: ProjectRequestBody
): Promise<ProjectDocument> => {
  const { name, isActive } = projectData;

  const project: IProject = new Project({
    userId,
    name: name.trim(),
    isActive: isActive !== undefined ? isActive : DEFAULTS.IS_ACTIVE,
  });

  const savedProject = await project.save();
  return savedProject as ProjectDocument;
};

/**
 * Get all projects for a user
 * @param userId - User ID
 * @param includeInactive - Whether to include inactive projects
 * @returns Array of projects
 */
export const getProjects = async (
  userId: string,
  includeInactive: boolean = false
): Promise<ProjectDocument[]> => {
  const filter: { userId: any; isActive?: boolean } = {
    userId,
  };

  // Only include active projects by default
  if (!includeInactive) {
    filter.isActive = true;
  }

  const projects = await Project.find(filter).sort({ createdAt: -1 });
  return projects as ProjectDocument[];
};

/**
 * Get a project by ID
 * @param projectId - Project ID
 * @param userId - User ID (optional, for ownership verification)
 * @returns Project document
 */
export const getProjectById = async (
  projectId: string,
  userId?: string
): Promise<ProjectDocument> => {
  const filter: { _id: any; userId?: any } = {
    _id: projectId,
  };

  if (userId) {
    filter.userId = userId;
  }

  const project = await Project.findOne(filter);

  if (!project) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (!project.isActive) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_DELETED);
    error.statusCode = 404;
    throw error;
  }

  return project as ProjectDocument;
};

/**
 * Update a project
 * @param projectId - Project ID
 * @param userId - User ID
 * @param updateData - Fields to update
 * @returns Updated project
 */
export const updateProject = async (
  projectId: string,
  userId: string,
  updateData: UpdateProjectRequestBody
): Promise<ProjectDocument> => {
  // First verify the project exists and belongs to the user
  const existingProject = await Project.findOne({
    _id: projectId,
    userId,
  });

  if (!existingProject) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
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

  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!project) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return project as ProjectDocument;
};

/**
 * Soft delete a project
 * @param projectId - Project ID
 * @param userId - User ID
 * @returns Deleted project
 */
export const deleteProject = async (
  projectId: string,
  userId: string
): Promise<ProjectDocument> => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!project) {
    const error: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return project as ProjectDocument;
};

