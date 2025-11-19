/**
 * Prompt Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Prompt from '../../models/Prompt';
import Project from '../../models/Project';
import * as promptService from '../../services/promptService';
import { ERROR_MESSAGES } from '../../constants/errorMessages';

describe('Prompt Service', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  let projectId: string;

  beforeEach(async () => {
    await Prompt.deleteMany({});
    await Project.deleteMany({});
    
    const project = await Project.create({
      userId,
      name: 'Test Project',
      isActive: true,
    });
    projectId = (project._id as mongoose.Types.ObjectId).toString();
  });

  describe('createPrompt', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        name: 'Test Prompt',
        isActive: true,
      };

      const prompt = await promptService.createPrompt(userId, projectId, promptData);

      expect(prompt.name).toBe('Test Prompt');
      expect(prompt.userId.toString()).toBe(userId);
      expect(prompt.projectId.toString()).toBe(projectId);
      expect(prompt.isActive).toBe(true);
    });

    it('should default isActive to true if not provided', async () => {
      const promptData = {
        name: 'Test Prompt',
      };

      const prompt = await promptService.createPrompt(userId, projectId, promptData);

      expect(prompt.isActive).toBe(true);
    });

    it('should trim prompt name', async () => {
      const promptData = {
        name: '  Test Prompt  ',
      };

      const prompt = await promptService.createPrompt(userId, projectId, promptData);

      expect(prompt.name).toBe('Test Prompt');
    });

    it('should throw error if project does not exist', async () => {
      const fakeProjectId = new mongoose.Types.ObjectId().toString();
      const promptData = {
        name: 'Test Prompt',
      };

      await expect(
        promptService.createPrompt(userId, fakeProjectId, promptData)
      ).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    });

    it('should throw error if project does not belong to user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const promptData = {
        name: 'Test Prompt',
      };

      await expect(
        promptService.createPrompt(otherUserId, projectId, promptData)
      ).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    });
  });

  describe('getPromptsByProject', () => {
    beforeEach(async () => {
      await Prompt.create([
        { userId, projectId, name: 'Active Prompt 1', isActive: true },
        { userId, projectId, name: 'Active Prompt 2', isActive: true },
        { userId, projectId, name: 'Inactive Prompt', isActive: false },
      ]);
    });

    it('should return only active prompts', async () => {
      const prompts = await promptService.getPromptsByProject(userId, projectId);

      expect(prompts).toHaveLength(2);
      expect(prompts.every((p) => p.isActive)).toBe(true);
    });

    it('should return empty array if no prompts exist', async () => {
      const otherProject = await Project.create({
        userId,
        name: 'Other Project',
        isActive: true,
      });
      const otherProjectIdStr = (otherProject._id as mongoose.Types.ObjectId).toString();

      const prompts = await promptService.getPromptsByProject(userId, otherProjectIdStr);

      expect(prompts).toHaveLength(0);
    });

    it('should throw error if project does not exist', async () => {
      const fakeProjectId = new mongoose.Types.ObjectId().toString();

      await expect(
        promptService.getPromptsByProject(userId, fakeProjectId)
      ).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    });
  });

  describe('getPromptById', () => {
    let promptId: string;

    beforeEach(async () => {
      const prompt = await Prompt.create({
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: true,
      });
      promptId = (prompt._id as mongoose.Types.ObjectId).toString();
    });

    it('should return prompt by ID', async () => {
      const prompt = await promptService.getPromptById(promptId);

      expect(prompt.name).toBe('Test Prompt');
      expect(prompt._id.toString()).toBe(promptId);
    });

    it('should throw error for non-existent prompt', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(promptService.getPromptById(fakeId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_NOT_FOUND
      );
    });

    it('should throw error for inactive prompt', async () => {
      await Prompt.updateOne({ _id: promptId }, { isActive: false });

      await expect(promptService.getPromptById(promptId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_DELETED
      );
    });

    it('should verify ownership when userId is provided', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(promptService.getPromptById(promptId, otherUserId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_NOT_FOUND
      );
    });
  });

  describe('updatePrompt', () => {
    let promptId: string;

    beforeEach(async () => {
      const prompt = await Prompt.create({
        userId,
        projectId,
        name: 'Original Name',
        isActive: true,
      });
      promptId = (prompt._id as mongoose.Types.ObjectId).toString();
    });

    it('should update prompt name', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const prompt = await promptService.updatePrompt(promptId, userId, updateData);

      expect(prompt.name).toBe('Updated Name');
    });

    it('should update isActive status', async () => {
      const updateData = {
        isActive: false,
      };

      const prompt = await promptService.updatePrompt(promptId, userId, updateData);

      expect(prompt.isActive).toBe(false);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        name: 'Updated Name',
        isActive: false,
      };

      const prompt = await promptService.updatePrompt(promptId, userId, updateData);

      expect(prompt.name).toBe('Updated Name');
      expect(prompt.isActive).toBe(false);
    });

    it('should update only name when isActive is not provided', async () => {
      const updateData = {
        name: 'Updated Name Only',
      };

      const prompt = await promptService.updatePrompt(promptId, userId, updateData);

      expect(prompt.name).toBe('Updated Name Only');
      // isActive should remain unchanged
      expect(prompt.isActive).toBe(true);
    });

    it('should update only isActive when name is not provided', async () => {
      const updateData = {
        isActive: false,
      };

      const prompt = await promptService.updatePrompt(promptId, userId, updateData);

      expect(prompt.isActive).toBe(false);
      // name should remain unchanged
      expect(prompt.name).toBe('Original Name');
    });

    it('should throw error if no fields to update', async () => {
      const updateData = {};

      await expect(promptService.updatePrompt(promptId, userId, updateData)).rejects.toThrow(
        ERROR_MESSAGES.NO_VALID_FIELDS_TO_UPDATE
      );
    });

    it('should throw error for non-existent prompt', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        promptService.updatePrompt(fakeId, userId, { name: 'New Name' })
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    });

    it('should throw error if prompt does not belong to user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        promptService.updatePrompt(promptId, otherUserId, { name: 'New Name' })
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    });

    it('should throw error when findOneAndUpdate returns null', async () => {
      // Mock findOneAndUpdate to return a query with populate that resolves to null
      const mockPopulate = jest.fn().mockImplementation(() => Promise.resolve(null));
      const mockQuery = {
        populate: mockPopulate,
      };
      const findOneAndUpdateSpy = jest.spyOn(Prompt, 'findOneAndUpdate').mockReturnValue(mockQuery as any);

      await expect(
        promptService.updatePrompt(promptId, userId, { name: 'New Name' })
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_NOT_FOUND);

      findOneAndUpdateSpy.mockRestore();
    });
  });

  describe('deletePrompt', () => {
    let promptId: string;

    beforeEach(async () => {
      const prompt = await Prompt.create({
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: true,
      });
      promptId = (prompt._id as mongoose.Types.ObjectId).toString();
    });

    it('should soft delete prompt', async () => {
      const prompt = await promptService.deletePrompt(promptId, userId);

      expect(prompt.isActive).toBe(false);
    });

    it('should throw error for non-existent prompt', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(promptService.deletePrompt(fakeId, userId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_NOT_FOUND
      );
    });

    it('should throw error if prompt does not belong to user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(promptService.deletePrompt(promptId, otherUserId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_NOT_FOUND
      );
    });
  });
});

