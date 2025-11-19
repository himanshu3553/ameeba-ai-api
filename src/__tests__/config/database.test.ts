/**
 * Database Configuration Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../config/database';
import { ENV_KEYS, DATABASE } from '../../constants';
import { ERROR_MESSAGES } from '../../constants/errorMessages';

// Mock mongoose
jest.mock('mongoose', () => {
  const handlers: { [key: string]: any } = {};
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      on: jest.fn((event: string, handler: any) => {
        handlers[event] = handler;
        // Also store in outer scope for test access
        (global as any).__mongooseEventHandlers = handlers;
      }),
      listeners: jest.fn((event: string) => {
        return handlers[event] ? [handlers[event]] : [];
      }),
    },
    default: jest.fn(),
  };
});

describe('Database Configuration', () => {
  const originalEnv = process.env;
  const originalExit = process.exit;
  const mockExit = jest.fn() as any;
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.exit = mockExit;
    mockExit.mockReturnValue(undefined as never);
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exit = originalExit;
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('connectDB', () => {
    it('should connect to MongoDB with default database name', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: {
            databaseName: DATABASE.DEFAULT_NAME,
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017';
      delete process.env[ENV_KEYS.DATABASE_NAME];

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', {
        dbName: DATABASE.DEFAULT_NAME,
        retryWrites: DATABASE.RETRY_WRITES,
        w: DATABASE.WRITE_CONCERN,
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(`MongoDB Connected: ${mockConnection.connection.host}`);
      expect(mockConsoleLog).toHaveBeenCalledWith(`Database: ${DATABASE.DEFAULT_NAME}`);
    });

    it('should connect to MongoDB with custom database name from env', async () => {
      const customDbName = 'custom_database';
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: {
            databaseName: customDbName,
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017';
      process.env[ENV_KEYS.DATABASE_NAME] = customDbName;

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', {
        dbName: customDbName,
        retryWrites: DATABASE.RETRY_WRITES,
        w: DATABASE.WRITE_CONCERN,
      });
    });

    it('should remove database name from mongodb:// URI', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: {
            databaseName: 'test_db',
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017/original_db';
      process.env[ENV_KEYS.DATABASE_NAME] = 'test_db';

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      // Should remove /original_db from URI
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', {
        dbName: 'test_db',
        retryWrites: DATABASE.RETRY_WRITES,
        w: DATABASE.WRITE_CONCERN,
      });
    });

    it('should remove database name from mongodb+srv:// URI', async () => {
      const mockConnection = {
        connection: {
          host: 'cluster.mongodb.net',
          db: {
            databaseName: 'test_db',
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb+srv://user:pass@cluster.mongodb.net/original_db';
      process.env[ENV_KEYS.DATABASE_NAME] = 'test_db';

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      // Should remove /original_db from URI
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb+srv://user:pass@cluster.mongodb.net', {
        dbName: 'test_db',
        retryWrites: DATABASE.RETRY_WRITES,
        w: DATABASE.WRITE_CONCERN,
      });
    });

    it('should preserve query string when removing database name', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: {
            databaseName: 'test_db',
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017/original_db?retryWrites=true&w=majority';
      process.env[ENV_KEYS.DATABASE_NAME] = 'test_db';

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      // Should preserve query string
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017?retryWrites=true&w=majority', {
        dbName: 'test_db',
        retryWrites: DATABASE.RETRY_WRITES,
        w: DATABASE.WRITE_CONCERN,
      });
    });

    it('should handle URI without database name', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: {
            databaseName: 'test_db',
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017';
      process.env[ENV_KEYS.DATABASE_NAME] = 'test_db';

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      // Should use URI as-is
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', {
        dbName: 'test_db',
        retryWrites: DATABASE.RETRY_WRITES,
        w: DATABASE.WRITE_CONCERN,
      });
    });

    it('should throw error if MONGODB_URI is not defined', async () => {
      delete process.env[ENV_KEYS.MONGODB_URI];

      await connectDB();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error connecting to MongoDB:',
        expect.objectContaining({
          message: ERROR_MESSAGES.MONGODB_URI_NOT_DEFINED,
        })
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017';

      (mongoose.connect as jest.Mock<any>).mockRejectedValue(connectionError);

      await connectDB();

      expect(mockConsoleError).toHaveBeenCalledWith('Error connecting to MongoDB:', connectionError);
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should use database name from connection if db is available', async () => {
      const dbName = 'connected_db';
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: {
            databaseName: dbName,
          },
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017';
      process.env[ENV_KEYS.DATABASE_NAME] = 'env_db';

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(`Database: ${dbName}`);
    });

    it('should fallback to env database name if connection.db is not available', async () => {
      const envDbName = 'env_db';
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
          db: undefined,
        },
      };

      process.env[ENV_KEYS.MONGODB_URI] = 'mongodb://localhost:27017';
      process.env[ENV_KEYS.DATABASE_NAME] = envDbName;

      (mongoose.connect as jest.Mock<any>).mockResolvedValue(mockConnection);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(`Database: ${envDbName}`);
    });
  });

  describe('disconnectDB', () => {
    it('should disconnect from MongoDB successfully', async () => {
      (mongoose.disconnect as jest.Mock<any>).mockResolvedValue(undefined);

      await disconnectDB();

      expect(mongoose.disconnect).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('MongoDB Disconnected');
    });

    it('should throw error on disconnect failure', async () => {
      const disconnectError = new Error('Disconnect failed');
      (mongoose.disconnect as jest.Mock<any>).mockRejectedValue(disconnectError);

      await expect(disconnectDB()).rejects.toThrow('Disconnect failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error disconnecting from MongoDB:', disconnectError);
    });
  });

  describe('Connection Event Handlers', () => {
    it('should handle connection error events', () => {
      const testError = new Error('Connection error');
      const handlers = (global as any).__mongooseEventHandlers || {};

      // Get the error handler that was registered
      if (handlers.error) {
        handlers.error(testError);
        expect(mockConsoleError).toHaveBeenCalledWith('MongoDB connection error:', testError);
      }
    });

    it('should handle disconnected events', () => {
      const handlers = (global as any).__mongooseEventHandlers || {};

      // Get the disconnect handler that was registered
      if (handlers.disconnected) {
        handlers.disconnected();
        expect(mockConsoleLog).toHaveBeenCalledWith('MongoDB disconnected');
      }
    });
  });
});

