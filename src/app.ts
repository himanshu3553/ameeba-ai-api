/**
 * Application Entry Point
 * Sets up Express server, routes, middleware, and database connection
 */

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import promptRoutes from './routes/promptRoutes';
import promptVersionRoutes from './routes/promptVersionRoutes';
import { getActivePromptVersion } from './controllers/promptVersionController';
import { validatePromptId } from './utils/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { HTTP_STATUS, ENV_KEYS, DEFAULTS, API_MESSAGES, VERSION } from './constants';
import { ERROR_MESSAGES } from './constants/errorMessages';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env[ENV_KEYS.PORT] || String(DEFAULTS.PORT), 10);
const NODE_ENV = process.env[ENV_KEYS.NODE_ENV] || 'development';

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================
// Authentication routes
app.use('/api/auth', authRoutes);

// Public route (no authentication required) - MUST be before other /api routes
app.get('/api/prompts/:promptId/active', validatePromptId, getActivePromptVersion);

// Protected routes
app.use('/api/project', projectRoutes);
app.use('/api', promptRoutes);
app.use('/api', promptVersionRoutes);

// ==================== Health & Status Endpoints ====================
/**
 * Root endpoint - Server status
 * GET /
 */
app.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: API_MESSAGES.SERVER_RUNNING,
    status: API_MESSAGES.OPERATIONAL,
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: VERSION.API,
  });
});

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: API_MESSAGES.API_RUNNING,
    timestamp: new Date().toISOString(),
  });
});

// ==================== Error Handling ====================
// 404 handler must be before error handler
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== Server Initialization ====================
/**
 * Start the Express server and connect to database
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(ERROR_MESSAGES.PORT_ALREADY_IN_USE(PORT));
        console.error(ERROR_MESSAGES.STOP_PROCESS_OR_CHANGE_PORT(PORT));
      } else {
        console.error(ERROR_MESSAGES.SERVER_ERROR, error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.FAILED_TO_START_SERVER, error);
    process.exit(1);
  }
};

// ==================== Graceful Shutdown ====================
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

