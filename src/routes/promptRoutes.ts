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
// POST /api/projects/:projectId/prompts - Create a new prompt
router.post('/projects/:projectId/prompts', createPrompt);

// GET /api/projects/:projectId/prompts - Get all prompts for a project
router.get('/projects/:projectId/prompts', getPromptsByProject);

// Routes for individual prompts
// GET /api/prompts/:id - Get a prompt by ID
router.get('/prompts/:id', getPromptById);

// PUT /api/prompts/:id - Update a prompt by ID
router.put('/prompts/:id', updatePrompt);

// DELETE /api/prompts/:id - Soft delete a prompt by ID
router.delete('/prompts/:id', deletePrompt);

export default router;

