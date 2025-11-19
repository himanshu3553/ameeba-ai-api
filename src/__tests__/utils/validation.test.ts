/**
 * Validation Utilities Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  validateObjectId,
  validateRequest,
  validateProjectId,
  validatePromptId,
  validatePromptVersionId,
  validateProjectExists,
} from '../../utils/validation';
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import Project from '../../models/Project';

// Mock Project model
jest.mock('../../models/Project');

describe('Validation Utilities', () => {
  describe('validateObjectId', () => {
    it('should pass for valid ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(() => validateObjectId(validId)).not.toThrow();
    });

    it('should throw error for invalid ObjectId', () => {
      const invalidId = 'invalid-id';
      expect(() => validateObjectId(invalidId)).toThrow();
      expect(() => validateObjectId(invalidId)).toThrow(ERROR_MESSAGES.INVALID_ID_FORMAT);
    });

    it('should throw error with custom field name', () => {
      const invalidId = 'invalid-id';
      expect(() => validateObjectId(invalidId, 'Project ID')).toThrow('Invalid Project ID format');
    });
  });

  describe('validateRequest', () => {
    describe('name validation', () => {
      it('should pass for valid name', () => {
        expect(() => validateRequest({ name: 'Valid Name' })).not.toThrow();
      });

      it('should throw error for empty name', () => {
        expect(() => validateRequest({ name: '' })).toThrow(ERROR_MESSAGES.NAME_REQUIRED);
      });

      it('should throw error for whitespace-only name', () => {
        expect(() => validateRequest({ name: '   ' })).toThrow(ERROR_MESSAGES.NAME_REQUIRED);
      });

      it('should throw error for name exceeding max length', () => {
        const longName = 'a'.repeat(201);
        expect(() => validateRequest({ name: longName })).toThrow(ERROR_MESSAGES.NAME_TOO_LONG);
      });

      it('should pass for name at max length', () => {
        const maxLengthName = 'a'.repeat(200);
        expect(() => validateRequest({ name: maxLengthName })).not.toThrow();
      });
    });

    describe('promptText validation', () => {
      it('should pass for valid prompt text', () => {
        expect(() => validateRequest({ promptText: 'Valid prompt text' })).not.toThrow();
      });

      it('should throw error for empty prompt text', () => {
        expect(() => validateRequest({ promptText: '' })).toThrow(ERROR_MESSAGES.PROMPT_TEXT_REQUIRED);
      });

      it('should throw error for whitespace-only prompt text', () => {
        expect(() => validateRequest({ promptText: '   ' })).toThrow(ERROR_MESSAGES.PROMPT_TEXT_REQUIRED);
      });
    });

    describe('isActive validation', () => {
      it('should pass for boolean true', () => {
        expect(() => validateRequest({ isActive: true })).not.toThrow();
      });

      it('should pass for boolean false', () => {
        expect(() => validateRequest({ isActive: false })).not.toThrow();
      });

      it('should throw error for non-boolean value', () => {
        expect(() => validateRequest({ isActive: 'true' as any })).toThrow(
          ERROR_MESSAGES.IS_ACTIVE_MUST_BE_BOOLEAN
        );
      });
    });

    describe('activePrompt validation', () => {
      it('should pass for boolean true', () => {
        expect(() => validateRequest({ activePrompt: true })).not.toThrow();
      });

      it('should pass for boolean false', () => {
        expect(() => validateRequest({ activePrompt: false })).not.toThrow();
      });

      it('should throw error for non-boolean value', () => {
        expect(() => validateRequest({ activePrompt: 'true' as any })).toThrow(
          ERROR_MESSAGES.ACTIVE_PROMPT_MUST_BE_BOOLEAN
        );
      });
    });

    describe('email validation', () => {
      it('should pass for valid email', () => {
        expect(() => validateRequest({ email: 'test@example.com' })).not.toThrow();
      });

      it('should throw error for empty email', () => {
        expect(() => validateRequest({ email: '' })).toThrow(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should throw error for invalid email format', () => {
        expect(() => validateRequest({ email: 'invalid-email' })).toThrow(ERROR_MESSAGES.EMAIL_INVALID);
      });

      it('should throw error for email without @', () => {
        expect(() => validateRequest({ email: 'invalidemail.com' })).toThrow(ERROR_MESSAGES.EMAIL_INVALID);
      });
    });

    describe('password validation', () => {
      it('should pass for valid password', () => {
        expect(() => validateRequest({ password: 'password123' })).not.toThrow();
      });

      it('should throw error for non-string password', () => {
        expect(() => validateRequest({ password: 123 as any })).toThrow(ERROR_MESSAGES.PASSWORD_REQUIRED);
      });

      it('should throw error for password below minimum length', () => {
        const shortPassword = '12345'; // Less than default 6
        expect(() => validateRequest({ password: shortPassword })).toThrow();
      });

      it('should pass for password at minimum length', () => {
        const minPassword = '123456'; // Default minimum 6
        expect(() => validateRequest({ password: minPassword })).not.toThrow();
      });
    });

    describe('multiple field validation', () => {
      it('should validate all provided fields', () => {
        expect(() =>
          validateRequest({
            name: 'Test Name',
            email: 'test@example.com',
            password: 'password123',
            isActive: true,
          })
        ).not.toThrow();
      });

      it('should throw error if any field is invalid', () => {
        expect(() =>
          validateRequest({
            name: 'Test Name',
            email: 'invalid-email',
            password: 'password123',
          })
        ).toThrow(ERROR_MESSAGES.EMAIL_INVALID);
      });
    });
  });

  describe('validateProjectId', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = { params: {} };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it('should validate projectId and call next', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { projectId: validId };

      validateProjectId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error for invalid projectId', () => {
      mockRequest.params = { projectId: 'invalid-id' };

      expect(() => {
        validateProjectId(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid Project ID format');
    });

    it('should call next if projectId is not present', () => {
      mockRequest.params = {};

      validateProjectId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validatePromptId', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = { params: {} };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it('should validate promptId from params.promptId', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { promptId: validId };

      validatePromptId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate promptId from params.id', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { id: validId };

      validatePromptId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error for invalid promptId', () => {
      mockRequest.params = { promptId: 'invalid-id' };

      expect(() => {
        validatePromptId(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid Prompt ID format');
    });

    it('should call next if promptId is not present', () => {
      mockRequest.params = {};

      validatePromptId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validatePromptVersionId', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = { params: {} };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it('should validate prompt version id and call next', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { id: validId };

      validatePromptVersionId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error for invalid prompt version id', () => {
      mockRequest.params = { id: 'invalid-id' };

      expect(() => {
        validatePromptVersionId(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Invalid Prompt Version ID format');
    });

    it('should call next if id is not present', () => {
      mockRequest.params = {};

      validatePromptVersionId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateProjectExists', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pass when project exists and is active', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const mockProject = {
        _id: projectId,
        isActive: true,
        userId: new mongoose.Types.ObjectId().toString(),
      };

      (Project.findOne as jest.Mock<any>).mockResolvedValue(mockProject);

      await expect(validateProjectExists(projectId)).resolves.not.toThrow();
      expect(Project.findOne).toHaveBeenCalledWith({ _id: projectId });
    });

    it('should pass when project exists, is active, and belongs to user', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const mockProject = {
        _id: projectId,
        isActive: true,
        userId,
      };

      (Project.findOne as jest.Mock<any>).mockResolvedValue(mockProject);

      await expect(validateProjectExists(projectId, userId)).resolves.not.toThrow();
      expect(Project.findOne).toHaveBeenCalledWith({ _id: projectId, userId });
    });

    it('should throw error when project is not found', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();

      (Project.findOne as jest.Mock<any>).mockResolvedValue(null);

      await expect(validateProjectExists(projectId)).rejects.toThrow(ERROR_MESSAGES.PROJECT_NOT_FOUND);
    });

    it('should throw error when project is inactive', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const mockProject = {
        _id: projectId,
        isActive: false,
      };

      (Project.findOne as jest.Mock<any>).mockResolvedValue(mockProject);

      await expect(validateProjectExists(projectId)).rejects.toThrow(ERROR_MESSAGES.PROJECT_DELETED);
    });

    it('should throw error for invalid projectId format', async () => {
      const invalidId = 'invalid-id';

      await expect(validateProjectExists(invalidId)).rejects.toThrow('Invalid Project ID format');
    });
  });
});

