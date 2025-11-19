/**
 * Project Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Project from '../../models/Project';
import * as projectService from '../../services/projectService';
import { ERROR_MESSAGES } from '../../constants/errorMessages';

describe('Project Service', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await Project.deleteMany({});
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        isActive: true,
      };

      const project = await projectService.createProject(userId, projectData);

      expect(project.name).toBe('Test Project');
      expect(project.userId.toString()).toBe(userId);
      expect(project.isActive).toBe(true);
    });

    it('should default isActive to true if not provided', async () => {
      const projectData = {
        name: 'Test Project',
      };

      const project = await projectService.createProject(userId, projectData);

      expect(project.isActive).toBe(true);
    });

    it('should trim project name', async () => {
      const projectData = {
        name: '  Test Project  ',
      };

      const project = await projectService.createProject(userId, projectData);

      expect(project.name).toBe('Test Project');
    });
  });

  describe('getProjects', () => {
    beforeEach(async () => {
      await Project.create([
        { userId, name: 'Active Project 1', isActive: true },
        { userId, name: 'Active Project 2', isActive: true },
        { userId, name: 'Inactive Project', isActive: false },
      ]);
    });

    it('should return only active projects by default', async () => {
      const projects = await projectService.getProjects(userId);

      expect(projects).toHaveLength(2);
      expect(projects.every((p) => p.isActive)).toBe(true);
    });

    it('should return all projects when includeInactive is true', async () => {
      const projects = await projectService.getProjects(userId, true);

      expect(projects).toHaveLength(3);
    });

    it('should return empty array for user with no projects', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const projects = await projectService.getProjects(otherUserId);

      expect(projects).toHaveLength(0);
    });

    it('should sort projects by createdAt descending', async () => {
      const projects = await projectService.getProjects(userId);

      for (let i = 0; i < projects.length - 1; i++) {
        expect(projects[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          projects[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe('getProjectById', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await Project.create({
        userId,
        name: 'Test Project',
        isActive: true,
      });
      projectId = (project._id as mongoose.Types.ObjectId).toString();
    });

    it('should return project by ID', async () => {
      const project = await projectService.getProjectById(projectId);

      expect(project.name).toBe('Test Project');
      expect(project._id.toString()).toBe(projectId);
    });

    it('should throw error for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(projectService.getProjectById(fakeId)).rejects.toThrow();
      await expect(projectService.getProjectById(fakeId)).rejects.toThrow(
        ERROR_MESSAGES.PROJECT_NOT_FOUND
      );
    });

    it('should throw error for inactive project', async () => {
      await Project.updateOne({ _id: projectId }, { isActive: false });

      await expect(projectService.getProjectById(projectId)).rejects.toThrow();
      await expect(projectService.getProjectById(projectId)).rejects.toThrow(
        ERROR_MESSAGES.PROJECT_DELETED
      );
    });

    it('should verify ownership when userId is provided', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(projectService.getProjectById(projectId, otherUserId)).rejects.toThrow(
        ERROR_MESSAGES.PROJECT_NOT_FOUND
      );
    });
  });

  describe('updateProject', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await Project.create({
        userId,
        name: 'Original Name',
        isActive: true,
      });
      projectId = (project._id as mongoose.Types.ObjectId).toString();
    });

    it('should update project name', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const project = await projectService.updateProject(projectId, userId, updateData);

      expect(project.name).toBe('Updated Name');
    });

    it('should update isActive status', async () => {
      const updateData = {
        isActive: false,
      };

      const project = await projectService.updateProject(projectId, userId, updateData);

      expect(project.isActive).toBe(false);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        name: 'Updated Name',
        isActive: false,
      };

      const project = await projectService.updateProject(projectId, userId, updateData);

      expect(project.name).toBe('Updated Name');
      expect(project.isActive).toBe(false);
    });

    it('should update only name when isActive is not provided', async () => {
      const updateData = {
        name: 'Updated Name Only',
      };

      const project = await projectService.updateProject(projectId, userId, updateData);

      expect(project.name).toBe('Updated Name Only');
      // isActive should remain unchanged
      expect(project.isActive).toBe(true);
    });

    it('should update only isActive when name is not provided', async () => {
      const updateData = {
        isActive: false,
      };

      const project = await projectService.updateProject(projectId, userId, updateData);

      expect(project.isActive).toBe(false);
      // name should remain unchanged
      expect(project.name).toBe('Original Name');
    });

    it('should throw error if no fields to update', async () => {
      const updateData = {};

      await expect(projectService.updateProject(projectId, userId, updateData)).rejects.toThrow(
        ERROR_MESSAGES.NO_VALID_FIELDS_TO_UPDATE
      );
    });

    it('should throw error for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        projectService.updateProject(fakeId, userId, { name: 'New Name' })
      ).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    });

    it('should throw error if project does not belong to user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        projectService.updateProject(projectId, otherUserId, { name: 'New Name' })
      ).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    });

    it('should throw error when findOneAndUpdate returns null', async () => {
      // Mock findOneAndUpdate to return null to test defensive error handling
      const findOneAndUpdateSpy = jest.spyOn(Project, 'findOneAndUpdate').mockResolvedValueOnce(null as any);

      await expect(
        projectService.updateProject(projectId, userId, { name: 'New Name' })
      ).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);

      findOneAndUpdateSpy.mockRestore();
    });
  });

  describe('deleteProject', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await Project.create({
        userId,
        name: 'Test Project',
        isActive: true,
      });
      projectId = (project._id as mongoose.Types.ObjectId).toString();
    });

    it('should soft delete project', async () => {
      const project = await projectService.deleteProject(projectId, userId);

      expect(project.isActive).toBe(false);
    });

    it('should throw error for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(projectService.deleteProject(fakeId, userId)).rejects.toThrow(
        ERROR_MESSAGES.PROJECT_NOT_FOUND
      );
    });

    it('should throw error if project does not belong to user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(projectService.deleteProject(projectId, otherUserId)).rejects.toThrow(
        ERROR_MESSAGES.PROJECT_NOT_FOUND
      );
    });
  });
});

