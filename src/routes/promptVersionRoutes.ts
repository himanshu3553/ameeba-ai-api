import { Router } from 'express';
import {
  createPromptVersion,
  getPromptVersionsByPrompt,
  getActivePromptVersion,
  getPromptVersionById,
  updatePromptVersion,
  deletePromptVersion,
} from '../controllers/promptVersionController';
import { validatePromptId, validatePromptVersionId } from '../utils/validation';

const router = Router();

// All routes require valid ObjectId format
router.param('promptId', validatePromptId);
router.param('id', validatePromptVersionId);

// Routes for prompt versions under a prompt
// POST /api/prompts/:promptId/version/create - Create a new prompt version
router.post('/prompts/:promptId/version/create', createPromptVersion);

// GET /api/prompts/:promptId/active - Get active version for a prompt (isActive: true and activePrompt: true)
router.get('/prompts/:promptId/active', getActivePromptVersion);

// GET /api/prompts/:promptId/versions - Get all versions for a prompt
router.get('/prompts/:promptId/versions', getPromptVersionsByPrompt);

// Routes for individual prompt versions
// GET /api/prompt-versions/:id - Get a prompt version by ID
router.get('/prompt-versions/:id', getPromptVersionById);

// PUT /api/prompt-versions/:id - Update a prompt version by ID
router.put('/prompt-versions/:id', updatePromptVersion);

// DELETE /api/prompt-versions/:id - Soft delete a prompt version by ID
router.delete('/prompt-versions/:id', deletePromptVersion);

export default router;

