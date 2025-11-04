import { Router } from 'express';
import {
  createPrompt,
  getPromptsByProject,
  getActivePrompt,
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
// More specific routes should be defined first
router.post('/projects/:projectId/prompts', createPrompt);
router.get('/projects/:projectId/prompts/active', getActivePrompt);
router.get('/projects/:projectId/prompts', getPromptsByProject);

// Routes for individual prompts
router.get('/prompts/:id', getPromptById);
router.put('/prompts/:id', updatePrompt);
router.delete('/prompts/:id', deletePrompt);

export default router;

