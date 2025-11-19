/**
 * Prompt Model Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Prompt from '../../models/Prompt';
import Project from '../../models/Project';

describe('Prompt Model', () => {
  const userId = new mongoose.Types.ObjectId();
  let projectId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    await Prompt.deleteMany({});
    await Project.deleteMany({});

    const project = await Project.create({
      userId,
      name: 'Test Project',
      isActive: true,
    });
    projectId = project._id as mongoose.Types.ObjectId;
  });

  describe('Schema Validation', () => {
    it('should create a prompt with valid data', async () => {
      const promptData = {
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: true,
      };

      const prompt = new Prompt(promptData);
      const savedPrompt = await prompt.save();

      expect(savedPrompt.name).toBe('Test Prompt');
      expect(savedPrompt.userId.toString()).toBe(userId.toString());
      expect(savedPrompt.projectId.toString()).toBe(projectId.toString());
      expect(savedPrompt.isActive).toBe(true);
    });

    it('should require userId', async () => {
      const prompt = new Prompt({
        projectId,
        name: 'Test Prompt',
      });

      await expect(prompt.save()).rejects.toThrow();
    });

    it('should require projectId', async () => {
      const prompt = new Prompt({
        userId,
        name: 'Test Prompt',
      });

      await expect(prompt.save()).rejects.toThrow();
    });

    it('should require name', async () => {
      const prompt = new Prompt({
        userId,
        projectId,
      });

      await expect(prompt.save()).rejects.toThrow();
    });

    it('should validate name min length', async () => {
      const prompt = new Prompt({
        userId,
        projectId,
        name: '',
      });

      await expect(prompt.save()).rejects.toThrow();
    });

    it('should validate name max length', async () => {
      const prompt = new Prompt({
        userId,
        projectId,
        name: 'a'.repeat(201),
      });

      await expect(prompt.save()).rejects.toThrow();
    });

    it('should trim name', async () => {
      const prompt = new Prompt({
        userId,
        projectId,
        name: '  Test Prompt  ',
      });

      const savedPrompt = await prompt.save();
      expect(savedPrompt.name).toBe('Test Prompt');
    });

    it('should default isActive to true', async () => {
      const prompt = new Prompt({
        userId,
        projectId,
        name: 'Test Prompt',
      });

      const savedPrompt = await prompt.save();
      expect(savedPrompt.isActive).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const prompt = new Prompt({
        userId,
        projectId,
        name: 'Test Prompt',
      });

      const savedPrompt = await prompt.save();

      expect(savedPrompt.createdAt).toBeDefined();
      expect(savedPrompt.updatedAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have indexes for efficient queries', async () => {
      const indexes = await Prompt.collection.getIndexes();
      
      // Check for compound indexes
      expect(indexes).toHaveProperty('userId_1_projectId_1_isActive_1');
      expect(indexes).toHaveProperty('userId_1_isActive_1');
    });
  });
});

