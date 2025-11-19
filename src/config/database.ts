/**
 * Database Configuration
 * Handles MongoDB connection and disconnection
 */

import mongoose from 'mongoose';
import { ENV_KEYS, DATABASE } from '../constants';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Connect to MongoDB database
 * Removes database name from URI and uses explicit dbName option
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env[ENV_KEYS.MONGODB_URI];
    const databaseName = process.env[ENV_KEYS.DATABASE_NAME] || DATABASE.DEFAULT_NAME;

    if (!mongoURI) {
      throw new Error(ERROR_MESSAGES.MONGODB_URI_NOT_DEFINED);
    }

    // Remove database name from URI if present to avoid conflicts
    // We'll use the dbName option instead to explicitly set the database
    let connectionURI = mongoURI;
    
    // Remove any existing database name from the URI
    // Pattern: mongodb://host/dbname or mongodb+srv://host/dbname?options
    const uriPattern = /^(mongodb(\+srv)?:\/\/[^/]+)\/([^?]+)(\?.*)?$/;
    const match = connectionURI.match(uriPattern);
    
    if (match) {
      // Reconstruct URI without database name
      const baseURI = match[1]; // mongodb://host or mongodb+srv://host
      const queryString = match[4] || ''; // ?options if present
      connectionURI = `${baseURI}${queryString}`;
    }

    // Connect with explicit database name from environment variable
    const conn = await mongoose.connect(connectionURI, {
      dbName: databaseName, // Database name from DATABASE_NAME env variable
      retryWrites: DATABASE.RETRY_WRITES,
      w: DATABASE.WRITE_CONCERN,
    });

    const dbName = conn.connection.db?.databaseName || databaseName;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${dbName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 */
const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

export { connectDB, disconnectDB };

