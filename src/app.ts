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

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes); // Authentication routes (signup, login, getUserDetails)

// Public route (no authentication required) - MUST be before other /api routes
app.get('/api/prompts/:promptId/active', validatePromptId, getActivePromptVersion);

app.use('/api/project', projectRoutes); // All project operations
app.use('/api', promptRoutes);
app.use('/api', promptVersionRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is properly deployed and running',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please either:`);
        console.error(`  1. Stop the process using port ${PORT}`);
        console.error(`  2. Set a different PORT in your .env file`);
        console.error(`\nTo find and kill the process: lsof -ti:${PORT} | xargs kill -9`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

export default app;

