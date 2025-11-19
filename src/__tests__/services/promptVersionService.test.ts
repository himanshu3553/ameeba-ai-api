/**
 * Prompt Version Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import PromptVersion from '../../models/PromptVersion';
import Prompt from '../../models/Prompt';
import Project from '../../models/Project';
import * as promptVersionService from '../../services/promptVersionService';
import { ERROR_MESSAGES } from '../../constants/errorMessages';

describe('Prompt Version Service', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  let projectId: string;
  let promptId: string;

  beforeEach(async () => {
    await PromptVersion.deleteMany({});
    await Prompt.deleteMany({});
    await Project.deleteMany({});

    const project = await Project.create({
      userId,
      name: 'Test Project',
      isActive: true,
    });
    projectId = (project._id as mongoose.Types.ObjectId).toString();

    const prompt = await Prompt.create({
      userId,
      projectId,
      name: 'Test Prompt',
      isActive: true,
    });
    promptId = (prompt._id as mongoose.Types.ObjectId).toString();
  });

  describe('createPromptVersion', () => {
    it('should create a new prompt version', async () => {
      const versionData = {
        promptText: 'Test prompt text',
        activePrompt: false,
        isActive: true,
      };

      const version = await promptVersionService.createPromptVersion(
        userId,
        promptId,
        versionData
      );

      expect(version.promptText).toBe('Test prompt text');
      expect(version.promptId.toString()).toBe(promptId);
      expect(version.userId.toString()).toBe(userId);
      expect(version.version).toBe('v1');
      expect(version.versionName).toBe('Version 1');
    });

    it('should auto-increment version numbers', async () => {
      const versionData = {
        promptText: 'First version',
        activePrompt: false,
      };

      await promptVersionService.createPromptVersion(userId, promptId, versionData);

      const versionData2 = {
        promptText: 'Second version',
        activePrompt: false,
      };

      const version2 = await promptVersionService.createPromptVersion(
        userId,
        promptId,
        versionData2
      );

      expect(version2.version).toBe('v2');
      expect(version2.versionName).toBe('Version 2');
    });

    it('should deactivate other versions when setting activePrompt=true', async () => {
      const version1 = await promptVersionService.createPromptVersion(userId, promptId, {
        promptText: 'Version 1',
        activePrompt: true,
      });

      const version2 = await promptVersionService.createPromptVersion(userId, promptId, {
        promptText: 'Version 2',
        activePrompt: true,
      });

      const v1 = await PromptVersion.findById(version1._id);
      expect(v1?.activePrompt).toBe(false);
      expect(version2.activePrompt).toBe(true);
    });

    it('should throw error if prompt does not exist', async () => {
      const fakePromptId = new mongoose.Types.ObjectId().toString();
      const versionData = {
        promptText: 'Test text',
      };

      await expect(
        promptVersionService.createPromptVersion(userId, fakePromptId, versionData)
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    });

    it('should throw error if prompt is inactive', async () => {
      // Create an inactive prompt
      const inactivePrompt = await Prompt.create({
        userId,
        projectId,
        name: 'Inactive Prompt',
        isActive: false,
      });
      const inactivePromptId = (inactivePrompt._id as mongoose.Types.ObjectId).toString();

      const versionData = {
        promptText: 'Test text',
      };

      await expect(
        promptVersionService.createPromptVersion(userId, inactivePromptId, versionData)
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_DELETED);
    });
  });

  describe('getPromptVersionsByPrompt', () => {
    beforeEach(async () => {
      await PromptVersion.create([
        {
          userId,
          promptId,
          promptText: 'Active Version 1',
          version: 'v1',
          versionName: 'Version 1',
          activePrompt: true,
          isActive: true,
        },
        {
          userId,
          promptId,
          promptText: 'Active Version 2',
          version: 'v2',
          versionName: 'Version 2',
          activePrompt: false,
          isActive: true,
        },
        {
          userId,
          promptId,
          promptText: 'Inactive Version',
          version: 'v3',
          versionName: 'Version 3',
          activePrompt: false,
          isActive: false,
        },
      ]);
    });

    it('should return only active versions', async () => {
      const versions = await promptVersionService.getPromptVersionsByPrompt(userId, promptId);

      expect(versions).toHaveLength(2);
      expect(versions.every((v) => v.isActive)).toBe(true);
    });

    it('should throw error if prompt does not exist', async () => {
      const fakePromptId = new mongoose.Types.ObjectId().toString();

      await expect(
        promptVersionService.getPromptVersionsByPrompt(userId, fakePromptId)
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    });
  });

  describe('getActivePromptVersion', () => {
    beforeEach(async () => {
      await PromptVersion.create([
        {
          userId,
          promptId,
          promptText: 'Inactive Version',
          version: 'v1',
          versionName: 'Version 1',
          activePrompt: false,
          isActive: true,
        },
        {
          userId,
          promptId,
          promptText: 'Active Version',
          version: 'v2',
          versionName: 'Version 2',
          activePrompt: true,
          isActive: true,
        },
      ]);
    });

    it('should return the active prompt version', async () => {
      const version = await promptVersionService.getActivePromptVersion(promptId);

      expect(version.activePrompt).toBe(true);
      expect(version.isActive).toBe(true);
      expect(version.promptText).toBe('Active Version');
    });

    it('should throw error if no active version exists', async () => {
      await PromptVersion.updateMany({ promptId }, { activePrompt: false });

      await expect(promptVersionService.getActivePromptVersion(promptId)).rejects.toThrow(
        ERROR_MESSAGES.NO_ACTIVE_VERSION_FOUND
      );
    });

    it('should throw error if prompt does not exist', async () => {
      const fakePromptId = new mongoose.Types.ObjectId().toString();

      await expect(promptVersionService.getActivePromptVersion(fakePromptId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_NOT_FOUND
      );
    });
  });

  describe('getPromptVersionById', () => {
    let versionId: string;

    beforeEach(async () => {
      const version = await PromptVersion.create({
        userId,
        promptId,
        promptText: 'Test version',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: true,
        isActive: true,
      });
      versionId = (version._id as mongoose.Types.ObjectId).toString();
    });

    it('should return prompt version by ID', async () => {
      const version = await promptVersionService.getPromptVersionById(versionId);

      expect(version.promptText).toBe('Test version');
      expect(version._id.toString()).toBe(versionId);
    });

    it('should return prompt version by ID with userId', async () => {
      const version = await promptVersionService.getPromptVersionById(versionId, userId);

      expect(version.promptText).toBe('Test version');
      expect(version._id.toString()).toBe(versionId);
    });

    it('should throw error for non-existent version', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(promptVersionService.getPromptVersionById(fakeId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND
      );
    });

    it('should throw error for inactive version', async () => {
      await PromptVersion.updateOne({ _id: versionId }, { isActive: false });

      await expect(promptVersionService.getPromptVersionById(versionId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_VERSION_DELETED
      );
    });
  });

  describe('updatePromptVersion', () => {
    let versionId: string;

    beforeEach(async () => {
      const version = await PromptVersion.create({
        userId,
        promptId,
        promptText: 'Original text',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: false,
        isActive: true,
      });
      versionId = (version._id as mongoose.Types.ObjectId).toString();
    });

    it('should update prompt text', async () => {
      const updateData = {
        promptText: 'Updated text',
      };

      const version = await promptVersionService.updatePromptVersion(
        versionId,
        userId,
        updateData
      );

      expect(version.promptText).toBe('Updated text');
    });

    it('should update activePrompt and deactivate others', async () => {
      // Create another version
      const version2 = await PromptVersion.create({
        userId,
        promptId,
        promptText: 'Version 2',
        version: 'v2',
        versionName: 'Version 2',
        activePrompt: true,
        isActive: true,
      });

      const updateData = {
        activePrompt: true,
      };

      const updatedVersion = await promptVersionService.updatePromptVersion(
        versionId,
        userId,
        updateData
      );

      expect(updatedVersion.activePrompt).toBe(true);

      const v2 = await PromptVersion.findById(version2._id);
      expect(v2?.activePrompt).toBe(false);
    });

    it('should throw error if no fields to update', async () => {
      const updateData = {};

      await expect(
        promptVersionService.updatePromptVersion(versionId, userId, updateData)
      ).rejects.toThrow(ERROR_MESSAGES.NO_VALID_FIELDS_TO_UPDATE);
    });

    it('should throw error for non-existent version', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        promptVersionService.updatePromptVersion(fakeId, userId, { promptText: 'New' })
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
    });

    it('should update isActive field', async () => {
      const updateData = {
        isActive: false,
      };

      const version = await promptVersionService.updatePromptVersion(
        versionId,
        userId,
        updateData
      );

      expect(version.isActive).toBe(false);
    });

    it('should throw error when findOneAndUpdate returns null', async () => {
      // Mock findOneAndUpdate to return a query with populate that resolves to null
      const mockPopulate = jest.fn().mockImplementation(() => Promise.resolve(null));
      const mockQuery = {
        populate: mockPopulate,
      };
      const findOneAndUpdateSpy = jest.spyOn(PromptVersion, 'findOneAndUpdate').mockReturnValue(mockQuery as any);

      await expect(
        promptVersionService.updatePromptVersion(versionId, userId, { promptText: 'New text' })
      ).rejects.toThrow(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);

      findOneAndUpdateSpy.mockRestore();
    });
  });

  describe('deletePromptVersion', () => {
    let versionId: string;

    beforeEach(async () => {
      const version = await PromptVersion.create({
        userId,
        promptId,
        promptText: 'Test version',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: true,
        isActive: true,
      });
      versionId = (version._id as mongoose.Types.ObjectId).toString();
    });

    it('should soft delete prompt version', async () => {
      const version = await promptVersionService.deletePromptVersion(versionId, userId);

      expect(version.isActive).toBe(false);
    });

    it('should throw error for non-existent version', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(promptVersionService.deletePromptVersion(fakeId, userId)).rejects.toThrow(
        ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND
      );
    });
  });
});

