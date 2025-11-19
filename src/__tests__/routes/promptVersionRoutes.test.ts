/**
 * Prompt Version Routes Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import promptVersionRoutes from '../../routes/promptVersionRoutes';
import * as promptVersionController from '../../controllers/promptVersionController';
import { authenticate } from '../../middleware/auth';
import { validatePromptId, validatePromptVersionId } from '../../utils/validation';
import { HTTP_STATUS } from '../../constants';
import { AuthenticatedRequest } from '../../types';

// Mock dependencies
jest.mock('../../controllers/promptVersionController');
jest.mock('../../middleware/auth');
jest.mock('../../utils/validation');

describe('Prompt Version Routes', () => {
  let app: Application;
  const userId = new mongoose.Types.ObjectId().toString();
  const promptId = new mongoose.Types.ObjectId().toString();
  const versionId = new mongoose.Types.ObjectId().toString();
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', promptVersionRoutes);

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
    (validatePromptId as jest.Mock<any>).mockImplementation(
      (_req: Request, _res: Response, next: NextFunction) => {
        next();
      }
    );

    (validatePromptVersionId as jest.Mock<any>).mockImplementation(
      (_req: Request, _res: Response, next: NextFunction) => {
        next();
      }
    );
  });

  describe('POST /api/prompts/:promptId/version/create', () => {
    it('should call createPromptVersion controller', async () => {
      const versionData = {
        promptText: 'Test prompt text',
        activePrompt: false,
        isActive: true,
      };

      (promptVersionController.createPromptVersion as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.CREATED).json({
            success: true,
            data: {
              _id: new mongoose.Types.ObjectId(),
              userId,
              promptId,
              ...versionData,
              version: 'v1',
              versionName: 'Version 1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .post(`/api/prompts/${promptId}/version/create`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(versionData)
        .expect(HTTP_STATUS.CREATED);

      expect(validatePromptId).toHaveBeenCalled();
      expect(authenticate).toHaveBeenCalled();
      expect(promptVersionController.createPromptVersion).toHaveBeenCalled();
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
        .post('/api/prompts/invalid-id/version/create')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ promptText: 'Test text' })
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('GET /api/prompts/:promptId/versions', () => {
    it('should call getPromptVersionsByPrompt controller', async () => {
      (promptVersionController.getPromptVersionsByPrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      );

      await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptId).toHaveBeenCalled();
      expect(promptVersionController.getPromptVersionsByPrompt).toHaveBeenCalled();
    });
  });

  describe('GET /api/prompt-versions/:id', () => {
    it('should call getPromptVersionById controller', async () => {
      (promptVersionController.getPromptVersionById as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              _id: versionId,
              userId,
              promptId,
              promptText: 'Test text',
              version: 'v1',
              versionName: 'Version 1',
              activePrompt: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .get(`/api/prompt-versions/${versionId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptVersionId).toHaveBeenCalled();
      expect(promptVersionController.getPromptVersionById).toHaveBeenCalled();
    });

    it('should validate versionId format', async () => {
      (validatePromptVersionId as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          const error = new Error('Invalid Prompt Version ID format');
          (error as any).statusCode = HTTP_STATUS.BAD_REQUEST;
          next(error);
        }
      );

      await request(app)
        .get('/api/prompt-versions/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('PUT /api/prompt-versions/:id', () => {
    it('should call updatePromptVersion controller', async () => {
      const updateData = {
        promptText: 'Updated text',
      };

      (promptVersionController.updatePromptVersion as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              _id: versionId,
              userId,
              promptId,
              ...updateData,
              version: 'v1',
              versionName: 'Version 1',
              activePrompt: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .put(`/api/prompt-versions/${versionId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptVersionId).toHaveBeenCalled();
      expect(promptVersionController.updatePromptVersion).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/prompt-versions/:id', () => {
    it('should call deletePromptVersion controller', async () => {
      (promptVersionController.deletePromptVersion as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Prompt version deleted successfully',
            data: {
              _id: versionId,
              userId,
              promptId,
              promptText: 'Test text',
              version: 'v1',
              versionName: 'Version 1',
              activePrompt: false,
              isActive: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .delete(`/api/prompt-versions/${versionId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validatePromptVersionId).toHaveBeenCalled();
      expect(promptVersionController.deletePromptVersion).toHaveBeenCalled();
    });
  });

  describe('Route Middleware', () => {
    it('should apply authenticate middleware to all routes', async () => {
      (promptVersionController.getPromptVersionsByPrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, count: 0, data: [] });
        }
      );

      await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(authenticate).toHaveBeenCalled();
    });

    it('should apply validatePromptId to routes with :promptId param', async () => {
      (promptVersionController.getPromptVersionsByPrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, count: 0, data: [] });
        }
      );

      await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(validatePromptId).toHaveBeenCalled();
    });

    it('should apply validatePromptVersionId to routes with :id param', async () => {
      (promptVersionController.getPromptVersionById as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, data: {} });
        }
      );

      await request(app)
        .get(`/api/prompt-versions/${versionId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(validatePromptVersionId).toHaveBeenCalled();
    });

    it('should apply both validation and authentication middleware', async () => {
      let validateCalled = false;
      let authenticateCalled = false;

      (validatePromptId as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          validateCalled = true;
          next();
        }
      );

      (authenticate as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          authenticateCalled = true;
          next();
        }
      );

      (promptVersionController.getPromptVersionsByPrompt as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, count: 0, data: [] });
        }
      );

      await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${mockToken}`);

      // Both middleware should be called
      expect(validateCalled).toBe(true);
      expect(authenticateCalled).toBe(true);
    });
  });
});

