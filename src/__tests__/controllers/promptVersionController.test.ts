/**
 * Prompt Version Controller Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as promptVersionController from '../../controllers/promptVersionController';
import * as promptVersionService from '../../services/promptVersionService';
import { validateRequest } from '../../utils/validation';
import { AuthenticatedRequest } from '../../types';
import { HTTP_STATUS } from '../../constants';
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import { ApiError } from '../../middleware/errorHandler';

// Mock the service and validation
jest.mock('../../services/promptVersionService');
jest.mock('../../utils/validation');

describe('Prompt Version Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const userId = new mongoose.Types.ObjectId().toString();
  const promptId = new mongoose.Types.ObjectId().toString();

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

  describe('createPromptVersion', () => {
    it('should create a prompt version successfully', async () => {
      const versionData = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        promptId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptVersionService.createPromptVersion as jest.Mock<any>).mockResolvedValue(versionData);
      mockRequest.params = { promptId };
      mockRequest.body = { promptText: 'Test text', activePrompt: false, isActive: true };

      await promptVersionController.createPromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ promptText: 'Test text', activePrompt: false, isActive: true });
      expect(promptVersionService.createPromptVersion).toHaveBeenCalledWith(
        userId,
        promptId,
        { promptText: 'Test text', activePrompt: false, isActive: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { promptId };
      mockRequest.body = { promptText: 'Test text', activePrompt: false };

      await promptVersionController.createPromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptVersionService.createPromptVersion).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError: ApiError = new Error(ERROR_MESSAGES.PROMPT_TEXT_REQUIRED);
      validationError.statusCode = HTTP_STATUS.BAD_REQUEST;

      (validateRequest as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      mockRequest.params = { promptId };
      mockRequest.body = { promptText: '', activePrompt: false };

      await promptVersionController.createPromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(promptVersionService.createPromptVersion).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptVersionService.createPromptVersion as jest.Mock<any>).mockRejectedValue(serviceError);
      mockRequest.params = { promptId };
      mockRequest.body = { promptText: 'Test text', activePrompt: false };

      await promptVersionController.createPromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getPromptVersionsByPrompt', () => {
    it('should get all prompt versions for a prompt', async () => {
      const versions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          promptId,
          promptText: 'Version 1',
          version: 'v1',
          versionName: 'Version 1',
          activePrompt: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest.params = { promptId };
      (promptVersionService.getPromptVersionsByPrompt as jest.Mock<any>).mockResolvedValue(versions);

      await promptVersionController.getPromptVersionsByPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptVersionService.getPromptVersionsByPrompt).toHaveBeenCalledWith(
        userId,
        promptId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when no versions exist', async () => {
      const versions: any[] = [];

      mockRequest.params = { promptId };
      (promptVersionService.getPromptVersionsByPrompt as jest.Mock<any>).mockResolvedValue(versions);

      await promptVersionController.getPromptVersionsByPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptVersionService.getPromptVersionsByPrompt).toHaveBeenCalledWith(userId, promptId);
    });

    it('should throw error when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { promptId };

      await promptVersionController.getPromptVersionsByPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptVersionService.getPromptVersionsByPrompt).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { promptId };
      (promptVersionService.getPromptVersionsByPrompt as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptVersionController.getPromptVersionsByPrompt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getActivePromptVersion', () => {
    it('should get active prompt version (public endpoint)', async () => {
      const version = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        promptId,
        promptText: 'Active version',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { promptId };
      mockRequest.user = undefined; // Public endpoint
      (promptVersionService.getActivePromptVersion as jest.Mock<any>).mockResolvedValue(version);

      await promptVersionController.getActivePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptVersionService.getActivePromptVersion).toHaveBeenCalledWith(promptId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error(ERROR_MESSAGES.NO_ACTIVE_VERSION_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { promptId };
      (promptVersionService.getActivePromptVersion as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptVersionController.getActivePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getPromptVersionById', () => {
    it('should get prompt version by ID', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const version = {
        _id: new mongoose.Types.ObjectId(versionId),
        userId,
        promptId,
        promptText: 'Test version',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: versionId };
      (promptVersionService.getPromptVersionById as jest.Mock<any>).mockResolvedValue(version);

      await promptVersionController.getPromptVersionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptVersionService.getPromptVersionById).toHaveBeenCalledWith(versionId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: versionId };

      await promptVersionController.getPromptVersionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptVersionService.getPromptVersionById).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { id: versionId };
      (promptVersionService.getPromptVersionById as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptVersionController.getPromptVersionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updatePromptVersion', () => {
    it('should update prompt version', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const updatedVersion = {
        _id: new mongoose.Types.ObjectId(versionId),
        userId,
        promptId,
        promptText: 'Updated text',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: versionId };
      mockRequest.body = { promptText: 'Updated text' };
      (promptVersionService.updatePromptVersion as jest.Mock<any>).mockResolvedValue(updatedVersion);

      await promptVersionController.updatePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ promptText: 'Updated text' });
      expect(promptVersionService.updatePromptVersion).toHaveBeenCalledWith(
        versionId,
        userId,
        { promptText: 'Updated text' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update activePrompt and isActive', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const updatedVersion = {
        _id: new mongoose.Types.ObjectId(versionId),
        userId,
        promptId,
        promptText: 'Test text',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: false,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: versionId };
      mockRequest.body = { activePrompt: false, isActive: false };
      (promptVersionService.updatePromptVersion as jest.Mock<any>).mockResolvedValue(updatedVersion);

      await promptVersionController.updatePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ activePrompt: false, isActive: false });
      expect(promptVersionService.updatePromptVersion).toHaveBeenCalledWith(
        versionId,
        userId,
        { activePrompt: false, isActive: false }
      );
    });

    it('should throw error when user is not authenticated', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: versionId };
      mockRequest.body = { promptText: 'Updated text' };

      await promptVersionController.updatePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptVersionService.updatePromptVersion).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const validationError: ApiError = new Error(ERROR_MESSAGES.PROMPT_TEXT_REQUIRED);
      validationError.statusCode = HTTP_STATUS.BAD_REQUEST;

      (validateRequest as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      mockRequest.params = { id: versionId };
      mockRequest.body = { promptText: '' };

      await promptVersionController.updatePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(promptVersionService.updatePromptVersion).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (promptVersionService.updatePromptVersion as jest.Mock<any>).mockRejectedValue(serviceError);
      mockRequest.params = { id: versionId };
      mockRequest.body = { promptText: 'Updated text' };

      await promptVersionController.updatePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('deletePromptVersion', () => {
    it('should delete prompt version', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const deletedVersion = {
        _id: new mongoose.Types.ObjectId(versionId),
        userId,
        promptId,
        promptText: 'Test version',
        version: 'v1',
        versionName: 'Version 1',
        activePrompt: false,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: versionId };
      (promptVersionService.deletePromptVersion as jest.Mock<any>).mockResolvedValue(deletedVersion);

      await promptVersionController.deletePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(promptVersionService.deletePromptVersion).toHaveBeenCalledWith(versionId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: versionId };

      await promptVersionController.deletePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(promptVersionService.deletePromptVersion).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const versionId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROMPT_VERSION_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { id: versionId };
      (promptVersionService.deletePromptVersion as jest.Mock<any>).mockRejectedValue(serviceError);

      await promptVersionController.deletePromptVersion(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});

