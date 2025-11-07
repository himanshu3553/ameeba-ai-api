import { Router } from 'express';
import {
  createPrompt,
  getPromptsByProject,
  getPromptById,
  updatePrompt,
  deletePrompt,
} from '../controllers/promptController';
import { validateProjectId, validatePromptId } from '../utils/validation';

const router = Router();

// All routes require valid ObjectId format
router.param('projectId', validateProjectId);
router.param('id', validatePromptId);

// Routes for prompts under a project
// POST /api/projects/:projectId/prompt/create - Create a new prompt
router.post('/projects/:projectId/prompt/create', createPrompt);

// GET /api/projects/:projectId/prompts - Get all prompts for a project
router.get('/projects/:projectId/prompts', getPromptsByProject);

// Routes for individual prompts
// GET /api/prompt/:id - Get a prompt by ID
router.get('/prompt/:id', getPromptById);

// PUT /api/prompt/:id - Update a prompt by ID
router.put('/prompt/:id', updatePrompt);

// DELETE /api/prompt/:id - Soft delete a prompt by ID
router.delete('/prompt/:id', deletePrompt);

export default router;

