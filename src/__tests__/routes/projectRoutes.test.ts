/**
 * Project Routes Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import projectRoutes from '../../routes/projectRoutes';
import * as projectController from '../../controllers/projectController';
import { authenticate } from '../../middleware/auth';
import { validateProjectId } from '../../utils/validation';
import { HTTP_STATUS } from '../../constants';
import { AuthenticatedRequest } from '../../types';

// Mock dependencies
jest.mock('../../controllers/projectController');
jest.mock('../../middleware/auth');
jest.mock('../../utils/validation');

describe('Project Routes', () => {
  let app: Application;
  const userId = new mongoose.Types.ObjectId().toString();
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/project', projectRoutes);

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

    // Mock validateProjectId to pass through
    (validateProjectId as jest.Mock<any>).mockImplementation(
      (_req: Request, _res: Response, next: NextFunction) => {
        next();
      }
    );
  });

  describe('GET /api/project/getProjects', () => {
    it('should call getProjects controller', async () => {
      (projectController.getProjects as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      );

      await request(app)
        .get('/api/project/getProjects')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(authenticate).toHaveBeenCalled();
      expect(projectController.getProjects).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      (authenticate as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          const error = new Error('Unauthorized');
          (error as any).statusCode = HTTP_STATUS.UNAUTHORIZED;
          next(error);
        }
      );

      await request(app)
        .get('/api/project/getProjects')
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('POST /api/project/create', () => {
    it('should call createProject controller', async () => {
      const projectData = {
        name: 'Test Project',
        isActive: true,
      };

      (projectController.createProject as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.CREATED).json({
            success: true,
            data: {
              _id: new mongoose.Types.ObjectId(),
              ...projectData,
              userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .post('/api/project/create')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(projectData)
        .expect(HTTP_STATUS.CREATED);

      expect(authenticate).toHaveBeenCalled();
      expect(projectController.createProject).toHaveBeenCalled();
    });
  });

  describe('GET /api/project/:id', () => {
    it('should call getProjectById controller with validated ID', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();

      (projectController.getProjectById as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              _id: projectId,
              userId,
              name: 'Test Project',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .get(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validateProjectId).toHaveBeenCalled();
      expect(projectController.getProjectById).toHaveBeenCalled();
    });

    it('should validate ObjectId format', async () => {
      (validateProjectId as jest.Mock<any>).mockImplementation(
        (_req: Request, _res: Response, next: NextFunction) => {
          const error = new Error('Invalid Project ID format');
          (error as any).statusCode = HTTP_STATUS.BAD_REQUEST;
          next(error);
        }
      );

      await request(app)
        .get('/api/project/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('PUT /api/project/:id', () => {
    it('should call updateProject controller', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        name: 'Updated Project',
      };

      (projectController.updateProject as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              _id: projectId,
              userId,
              ...updateData,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .put(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(HTTP_STATUS.OK);

      expect(validateProjectId).toHaveBeenCalled();
      expect(projectController.updateProject).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/project/:id', () => {
    it('should call deleteProject controller', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();

      (projectController.deleteProject as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Project deleted successfully',
            data: {
              _id: projectId,
              userId,
              name: 'Test Project',
              isActive: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      );

      await request(app)
        .delete(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(HTTP_STATUS.OK);

      expect(validateProjectId).toHaveBeenCalled();
      expect(projectController.deleteProject).toHaveBeenCalled();
    });
  });

  describe('Route Middleware', () => {
    it('should apply authenticate middleware to all routes', async () => {
      await request(app)
        .get('/api/project/getProjects')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(authenticate).toHaveBeenCalled();
    });

    it('should apply validateProjectId to routes with :id param', async () => {
      const projectId = new mongoose.Types.ObjectId().toString();

      (projectController.getProjectById as jest.Mock<any>).mockImplementation(
        async (_req: Request, res: Response) => {
          res.status(HTTP_STATUS.OK).json({ success: true, data: {} });
        }
      );

      await request(app)
        .get(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(validateProjectId).toHaveBeenCalled();
    });
  });
});

