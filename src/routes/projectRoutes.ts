import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { validateProjectId } from '../utils/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All routes require valid ObjectId format
router.param('id', validateProjectId);

// GET /api/project/getProjects - Get all projects
router.get('/getProjects', getProjects);

// POST /api/project/create - Create a new project
router.post('/create', createProject);

// GET /api/project/:id - Get a project by ID
router.get('/:id', getProjectById);

// PUT /api/project/:id - Update a project by ID
router.put('/:id', updateProject);

// DELETE /api/project/:id - Soft delete a project by ID
router.delete('/:id', deleteProject);

export default router;

