/**
 * Prompt Routes Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import promptRoutes from '../../routes/promptRoutes';
import * as promptController from '../../controllers/promptController';
import { authenticate } from '../../middleware/auth';
import { validateProjectId, validatePromptId } from '../../utils/validation';
import { HTTP_STATUS } from '../../constants';
import { AuthenticatedRequest } from '../../types';

// Mock dependencies
jest.mock('../../controllers/promptController');
jest.mock('../../middleware/auth');
jest.mock('../../utils/validation');

describe('Prompt Routes', () => {
  let app: Application;
  const userId = new mongoose.Types.ObjectId().toString();
  const projectId = new mongoose.Types.ObjectId().toString();
  const promptId = new mongoose.Types.ObjectId().toString();
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', promptRoutes);

    // Mock authenticate middleware to pass through
    (authenticate as jest.Mock<any>).mockImplementation(
      (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
        req.user = {
          userId,
          email: 'test@example.com',
        };
        next();
      }
    );

    // Mock validation middlewares to pass through
    (validateProjectId as jest.Mock<any>).mockImplementation(
      (_req: Request, _res: Response, next: NextFunction) => {
        next();
      }
    );

    (validatePromptId as jest.Mock<any>).mockImplementation(
      (_req: Request, _res: Response, next: NextFunction) => {
        next();
      }
    );
  });

  describe('POST /api/projects/:projectId/prompt/create', () => {
    it('should call createPrompt controller', async () => {
      const promptData = {
        name: 'Test Prompt',
        isActive: true,
      };

      (promptController.createPrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.CREATED).json({
            success: true,
            data: {
              _id: new mongoose.Types.ObjectId(),
              userId,
              projectId,
              ...promptData,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .post(`/api/projects/${projectId}/prompt/create`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(promptData)
        .expect(HTTP_STATUS.CREATED);

      expect(authenticate).toHaveBeenCalled();
      expect(validateProjectId).toHaveBeenCalled();
      expect(promptController.createPrompt).toHaveBeenCalled();
    });

    it('should validate projectId format', async () => {
      (validateProjectId as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          const error = new Error('Invalid Project ID format');
          (error as any).statusCode = HTTP_STATUS.BAD_REQUEST;
          next(error);
        }
      );

      await request(app)
        .post('/api/projects/invalid-id/prompt/create')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'Test Prompt' })
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('GET /api/projects/:projectId/prompts', () => {
    it('should call getPromptsByProject controller', async () => {
      (promptController.getPromptsByProject as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      );

      await request(app)
        .get(`/api/projects/${projectId}/prompts`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validateProjectId).toHaveBeenCalled();
      expect(promptController.getPromptsByProject).toHaveBeenCalled();
    });
  });

  describe('GET /api/prompt/:id', () => {
    it('should call getPromptById controller', async () => {
      (promptController.getPromptById as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              _id: promptId,
              userId,
              projectId,
              name: 'Test Prompt',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .get(`/api/prompt/${promptId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptId).toHaveBeenCalled();
      expect(promptController.getPromptById).toHaveBeenCalled();
    });

    it('should validate promptId format', async () => {
      (validatePromptId as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          const error = new Error('Invalid Prompt ID format');
          (error as any).statusCode = HTTP_STATUS.BAD_REQUEST;
          next(error);
        }
      );

      await request(app)
        .get('/api/prompt/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('PUT /api/prompt/:id', () => {
    it('should call updatePrompt controller', async () => {
      const updateData = {
        name: 'Updated Prompt',
      };

      (promptController.updatePrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              _id: promptId,
              userId,
              projectId,
              ...updateData,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .put(`/api/prompt/${promptId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptId).toHaveBeenCalled();
      expect(promptController.updatePrompt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/prompt/:id', () => {
    it('should call deletePrompt controller', async () => {
      (promptController.deletePrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Prompt deleted successfully',
            data: {
              _id: promptId,
              userId,
              projectId,
              name: 'Test Prompt',
              isActive: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .delete(`/api/prompt/${promptId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptId).toHaveBeenCalled();
      expect(promptController.deletePrompt).toHaveBeenCalled();
    });
  });

  describe('Route Middleware', () => {
    it('should apply authenticate middleware to all routes', async () => {
      (promptController.getPromptsByProject as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, count: 0, data: [] });
        }
      );

      await request(app)
        .get(`/api/projects/${projectId}/prompts`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(authenticate).toHaveBeenCalled();
    });

    it('should apply validateProjectId to routes with :projectId param', async () => {
      (promptController.getPromptsByProject as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, count: 0, data: [] });
        }
      );

      await request(app)
        .get(`/api/projects/${projectId}/prompts`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(validateProjectId).toHaveBeenCalled();
    });

    it('should apply validatePromptId to routes with :id param', async () => {
      (promptController.getPromptById as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, data: {} });
        }
      );

      await request(app)
        .get(`/api/prompt/${promptId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(validatePromptId).toHaveBeenCalled();
    });
  });
});

