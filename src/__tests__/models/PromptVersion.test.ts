/**
 * Prompt Version Model Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import PromptVersion from '../../models/PromptVersion';
import Prompt from '../../models/Prompt';
import Project from '../../models/Project';

describe('Prompt Version Model', () => {
  const userId = new mongoose.Types.ObjectId();
  let projectId: mongoose.Types.ObjectId;
  let promptId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    await PromptVersion.deleteMany({});
    await Prompt.deleteMany({});
    await Project.deleteMany({});

    const project = await Project.create({
      userId,
      name: 'Test Project',
      isActive: true,
    });
    projectId = project._id as mongoose.Types.ObjectId;

    const prompt = await Prompt.create({
      userId,
      projectId,
      name: 'Test Prompt',
      isActive: true,
    });
    promptId = prompt._id as mongoose.Types.ObjectId;
  });

  describe('Schema Validation', () => {
    it('should create a prompt version with valid data', async () => {
      const versionData = {
        userId,
        promptId,
        promptText: 'Test prompt text',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: false,
        isActive: true,
      };

      const version = new PromptVersion(versionData);
      const savedVersion = await version.save();

      expect(savedVersion.promptText).toBe('Test prompt text');
      expect(savedVersion.userId.toString()).toBe(userId.toString());
      expect(savedVersion.promptId.toString()).toBe(promptId.toString());
      expect(savedVersion.version).toBe('v1');
      expect(savedVersion.versionName).toBe('Version 1');
      expect(savedVersion.activePrompt).toBe(false);
      expect(savedVersion.isActive).toBe(true);
    });

    it('should require userId', async () => {
      const version = new PromptVersion({
        promptId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
      });

      await expect(version.save()).rejects.toThrow();
    });

    it('should require promptId', async () => {
      const version = new PromptVersion({
        userId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
      });

      await expect(version.save()).rejects.toThrow();
    });

    it('should require promptText', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        version: 'v1',
        versionName: 'Version 1',
      });

      await expect(version.save()).rejects.toThrow();
    });

    it('should require version', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: 'Test text',
        versionName: 'Version 1',
      });

      await expect(version.save()).rejects.toThrow();
    });

    it('should require versionName', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: 'Test text',
        version: 'v1',
      });

      await expect(version.save()).rejects.toThrow();
    });

    it('should validate promptText min length', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: '',
        version: 'v1',
        versionName: 'Version 1',
      });

      await expect(version.save()).rejects.toThrow();
    });

    it('should trim promptText', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: '  Test text  ',
        version: 'v1',
        versionName: 'Version 1',
      });

      const savedVersion = await version.save();
      expect(savedVersion.promptText).toBe('Test text');
    });

    it('should default activePrompt to false', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
      });

      const savedVersion = await version.save();
      expect(savedVersion.activePrompt).toBe(false);
    });

    it('should default isActive to true', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
      });

      const savedVersion = await version.save();
      expect(savedVersion.isActive).toBe(true);
    });
  });

  describe('Unique Active Prompt Constraint', () => {
    it('should enforce unique active prompt per promptId', async () => {
      const version1 = await PromptVersion.create({
        userId,
        promptId,
        promptText: 'Version 1',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: true,
        isActive: true,
      });

      expect(version1).toBeDefined();
      expect(version1.activePrompt).toBe(true);

      // Attempting to create another active version should fail due to unique index
      await expect(
        PromptVersion.create({
          userId,
          promptId,
          promptText: 'Version 2',
          version: 'v2',
          versionName: 'Version 2',
          activePrompt: true,
          isActive: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const version = new PromptVersion({
        userId,
        promptId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
      });

      const savedVersion = await version.save();

      expect(savedVersion.createdAt).toBeDefined();
      expect(savedVersion.updatedAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have indexes for efficient queries', async () => {
      const indexes = await PromptVersion.collection.getIndexes();
      
      // Check for compound indexes
      expect(indexes).toHaveProperty('userId_1_promptId_1_isActive_1');
      expect(indexes).toHaveProperty('promptId_1_activePrompt_1');
    });
  });
});

