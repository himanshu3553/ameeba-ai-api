import { Router } from 'express';
import { signup, login, getUserDetails } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/signup - Create a new user account
router.post('/signup', signup);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/getUserDetails - Get current authenticated user details
router.get('/getUserDetails', authenticate, getUserDetails);

export default router;

