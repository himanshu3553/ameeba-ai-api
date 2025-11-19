/**
 * Prompt Controller Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as promptController from '../../controllers/promptController';
import * as promptService from '../../services/promptService';
import { validateRequest } from '../../utils/validation';
import { AuthenticatedRequest } from '../../types';
import { HTTP_STATUS } from '../../constants';
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import { ApiError } from '../../middleware/errorHandler';

// Mock the service and validation
jest.mock('../../services/promptService');
jest.mock('../../utils/validation');

describe('Prompt Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const userId = new mongoose.Types.ObjectId().toString();
  const projectId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: {
        userId,
        email: 'test@example.com',
      },
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('createPrompt', () => {
    it('should create a prompt successfully', async () => {
      const promptData = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptService.createPrompt as jest.Mock<any>).mockResolvedValue(promptData);
      mockRequest.params = { projectId };
      mockRequest.body = { name: 'Test Prompt', isActive: true };

      await promptController.createPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ name: 'Test Prompt', isActive: true });
      expect(promptService.createPrompt).toHaveBeenCalledWith(userId, projectId, {
        name: 'Test Prompt',
        isActive: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { projectId };
      mockRequest.body = { name: 'Test Prompt', isActive: true };

      await promptController.createPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptService.createPrompt).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError: ApiError = new Error(ERROR_MESSAGES.NAME_REQUIRED);
      validationError.statusCode = HTTP_STATUS.BAD_REQUEST;

      (validateRequest as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      mockRequest.params = { projectId };
      mockRequest.body = { name: '', isActive: true };

      await promptController.createPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(promptService.createPrompt).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptService.createPrompt as jest.Mock<any>).mockRejectedValue(serviceError);
      mockRequest.params = { projectId };
      mockRequest.body = { name: 'Test Prompt', isActive: true };

      await promptController.createPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it('should create prompt with isActive false', async () => {
      const promptData = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        projectId,
        name: 'Inactive Prompt',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptService.createPrompt as jest.Mock<any>).mockResolvedValue(promptData);
      mockRequest.params = { projectId };
      mockRequest.body = { name: 'Inactive Prompt', isActive: false };

      await promptController.createPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptService.createPrompt).toHaveBeenCalledWith(userId, projectId, {
        name: 'Inactive Prompt',
        isActive: false,
      });
    });
  });

  describe('getPromptsByProject', () => {
    it('should get all prompts for a project', async () => {
      const prompts = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          projectId,
          name: 'Prompt 1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest.params = { projectId };
      (promptService.getPromptsByProject as jest.Mock<any>).mockResolvedValue(prompts);

      await promptController.getPromptsByProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptService.getPromptsByProject).toHaveBeenCalledWith(userId, projectId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when no prompts exist', async () => {
      const prompts: any[] = [];

      mockRequest.params = { projectId };
      (promptService.getPromptsByProject as jest.Mock<any>).mockResolvedValue(prompts);

      await promptController.getPromptsByProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptService.getPromptsByProject).toHaveBeenCalledWith(userId, projectId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('should throw error when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { projectId };

      await promptController.getPromptsByProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptService.getPromptsByProject).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { projectId };
      (promptService.getPromptsByProject as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptController.getPromptsByProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getPromptById', () => {
    it('should get prompt by ID', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const prompt = {
        _id: new mongoose.Types.ObjectId(promptId),
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: promptId };
      (promptService.getPromptById as jest.Mock<any>).mockResolvedValue(prompt);

      await promptController.getPromptById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptService.getPromptById).toHaveBeenCalledWith(promptId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: promptId };

      await promptController.getPromptById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptService.getPromptById).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { id: promptId };
      (promptService.getPromptById as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptController.getPromptById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updatePrompt', () => {
    it('should update prompt name', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const updatedPrompt = {
        _id: new mongoose.Types.ObjectId(promptId),
        userId,
        projectId,
        name: 'Updated Name',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: promptId };
      mockRequest.body = { name: 'Updated Name' };
      (promptService.updatePrompt as jest.Mock<any>).mockResolvedValue(updatedPrompt);

      await promptController.updatePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(promptService.updatePrompt).toHaveBeenCalledWith(
        promptId,
        userId,
        { name: 'Updated Name' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update prompt isActive status', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const updatedPrompt = {
        _id: new mongoose.Types.ObjectId(promptId),
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: promptId };
      mockRequest.body = { isActive: false };
      (promptService.updatePrompt as jest.Mock<any>).mockResolvedValue(updatedPrompt);

      await promptController.updatePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ isActive: false });
      expect(promptService.updatePrompt).toHaveBeenCalledWith(
        promptId,
        userId,
        { isActive: false }
      );
    });

    it('should update both name and isActive', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const updatedPrompt = {
        _id: new mongoose.Types.ObjectId(promptId),
        userId,
        projectId,
        name: 'Updated Name',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: promptId };
      mockRequest.body = { name: 'Updated Name', isActive: false };
      (promptService.updatePrompt as jest.Mock<any>).mockResolvedValue(updatedPrompt);

      await promptController.updatePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ name: 'Updated Name', isActive: false });
      expect(promptService.updatePrompt).toHaveBeenCalledWith(
        promptId,
        userId,
        { name: 'Updated Name', isActive: false }
      );
    });

    it('should throw error when user is not authenticated', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: promptId };
      mockRequest.body = { name: 'Updated Name' };

      await promptController.updatePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptService.updatePrompt).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const validationError: ApiError = new Error(ERROR_MESSAGES.NAME_TOO_LONG);
      validationError.statusCode = HTTP_STATUS.BAD_REQUEST;

      (validateRequest as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      mockRequest.params = { id: promptId };
      mockRequest.body = { name: 'A'.repeat(300) };

      await promptController.updatePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(promptService.updatePrompt).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptService.updatePrompt as jest.Mock<any>).mockRejectedValue(serviceError);
      mockRequest.params = { id: promptId };
      mockRequest.body = { name: 'Updated Name' };

      await promptController.updatePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const deletedPrompt = {
        _id: new mongoose.Types.ObjectId(promptId),
        userId,
        projectId,
        name: 'Test Prompt',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: promptId };
      (promptService.deletePrompt as jest.Mock<any>).mockResolvedValue(deletedPrompt);

      await promptController.deletePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptService.deletePrompt).toHaveBeenCalledWith(promptId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: promptId };

      await promptController.deletePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptService.deletePrompt).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const promptId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { id: promptId };
      (promptService.deletePrompt as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptController.deletePrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});

