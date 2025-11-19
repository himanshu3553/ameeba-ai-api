/**
 * Project Controller Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as projectController from '../../controllers/projectController';
import * as projectService from '../../services/projectService';
import { validateRequest } from '../../utils/validation';
import { AuthenticatedRequest } from '../../types';
import { HTTP_STATUS } from '../../constants';
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import { ApiError } from '../../middleware/errorHandler';

// Mock the service and validation
jest.mock('../../services/projectService');
jest.mock('../../utils/validation');

describe('Project Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const userId = new mongoose.Types.ObjectId().toString();

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

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        name: 'Test Project',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (projectService.createProject as jest.Mock<any>).mockResolvedValue(projectData);
      mockRequest.body = { name: 'Test Project', isActive: true };

      await projectController.createProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ name: 'Test Project', isActive: true });
      expect(projectService.createProject).toHaveBeenCalledWith(userId, {
        name: 'Test Project',
        isActive: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { name: 'Test Project', isActive: true };

      await projectController.createProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(projectService.createProject).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError: ApiError = new Error(ERROR_MESSAGES.NAME_REQUIRED);
      validationError.statusCode = HTTP_STATUS.BAD_REQUEST;

      (validateRequest as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      mockRequest.body = { name: '', isActive: true };

      await projectController.createProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(projectService.createProject).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (projectService.createProject as jest.Mock<any>).mockRejectedValue(serviceError);
      mockRequest.body = { name: 'Test Project', isActive: true };

      await projectController.createProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getProjects', () => {
    it('should get all projects for user', async () => {
      const projects = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          name: 'Project 1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (projectService.getProjects as jest.Mock<any>).mockResolvedValue(projects);

      await projectController.getProjects(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(projectService.getProjects).toHaveBeenCalledWith(userId, false);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include inactive projects when requested', async () => {
      mockRequest.query = { includeInactive: 'true' };
      (projectService.getProjects as jest.Mock<any>).mockResolvedValue([]);

      await projectController.getProjects(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(projectService.getProjects).toHaveBeenCalledWith(userId, true);
    });

    it('should not include inactive when includeInactive is false', async () => {
      mockRequest.query = { includeInactive: 'false' };
      (projectService.getProjects as jest.Mock<any>).mockResolvedValue([]);

      await projectController.getProjects(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(projectService.getProjects).toHaveBeenCalledWith(userId, false);
    });

    it('should throw error when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await projectController.getProjects(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(projectService.getProjects).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError: ApiError = new Error('Service error');
      serviceError.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      (projectService.getProjects as jest.Mock<any>).mockRejectedValue(serviceError);

      await projectController.getProjects(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getProjectById', () => {
    it('should get project by ID', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const project = {
        _id: new mongoose.Types.ObjectId(projectId),
        userId,
        name: 'Test Project',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: projectId };
      (projectService.getProjectById as jest.Mock<any>).mockResolvedValue(project);

      await projectController.getProjectById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(projectService.getProjectById).toHaveBeenCalledWith(projectId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: projectId };

      await projectController.getProjectById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(projectService.getProjectById).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { id: projectId };
      (projectService.getProjectById as jest.Mock<any>).mockRejectedValue(serviceError);

      await projectController.getProjectById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updateProject', () => {
    it('should update project', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const updatedProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        userId,
        name: 'Updated Name',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: projectId };
      mockRequest.body = { name: 'Updated Name' };
      (projectService.updateProject as jest.Mock<any>).mockResolvedValue(updatedProject);

      await projectController.updateProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(projectService.updateProject).toHaveBeenCalledWith(
        projectId,
        userId,
        { name: 'Updated Name' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update project isActive status', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const updatedProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        userId,
        name: 'Test Project',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (validateRequest as jest.Mock).mockImplementation(() => {});
      mockRequest.params = { id: projectId };
      mockRequest.body = { isActive: false };
      (projectService.updateProject as jest.Mock<any>).mockResolvedValue(updatedProject);

      await projectController.updateProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalledWith({ isActive: false });
      expect(projectService.updateProject).toHaveBeenCalledWith(
        projectId,
        userId,
        { isActive: false }
      );
    });

    it('should throw error when user is not authenticated', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: projectId };
      mockRequest.body = { name: 'Updated Name' };

      await projectController.updateProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(projectService.updateProject).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const validationError: ApiError = new Error(ERROR_MESSAGES.NAME_TOO_LONG);
      validationError.statusCode = HTTP_STATUS.BAD_REQUEST;

      (validateRequest as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      mockRequest.params = { id: projectId };
      mockRequest.body = { name: 'A'.repeat(300) };

      await projectController.updateProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(validateRequest).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(projectService.updateProject).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      (validateRequest as jest.Mock).mockImplementation(() => {});
      (projectService.updateProject as jest.Mock<any>).mockRejectedValue(serviceError);
      mockRequest.params = { id: projectId };
      mockRequest.body = { name: 'Updated Name' };

      await projectController.updateProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const deletedProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        userId,
        name: 'Test Project',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: projectId };
      (projectService.deleteProject as jest.Mock<any>).mockResolvedValue(deletedProject);

      await projectController.deleteProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(projectService.deleteProject).toHaveBeenCalledWith(projectId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      mockRequest.user = undefined;
      mockRequest.params = { id: projectId };

      await projectController.deleteProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(projectService.deleteProject).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const serviceError: ApiError = new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      serviceError.statusCode = HTTP_STATUS.NOT_FOUND;

      mockRequest.params = { id: projectId };
      (projectService.deleteProject as jest.Mock<any>).mockRejectedValue(serviceError);

      await projectController.deleteProject(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});

