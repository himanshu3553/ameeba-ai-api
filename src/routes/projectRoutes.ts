import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { validateProjectId } from '../utils/validation';

const router = Router();

// All routes require valid ObjectId format
router.param('id', validateProjectId);

// POST /api/projects/create - Create a new project
router.post('/create', createProject);

// GET /api/projects - Get all projects
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;

