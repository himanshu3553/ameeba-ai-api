/**
 * Test Setup
 * Global test configuration and utilities
 */

import { beforeAll, afterEach, afterAll } from '@jest/globals';
import mongoose from 'mongoose';

// Use dynamic import for mongodb-memory-server to handle optional dependency
let mongoServer: any;

/**
 * Setup before all tests
 */
beforeAll(async () => {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (error) {
    // Fallback: Use a test database URI if mongodb-memory-server is not available
    const testUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(testUri);
  }
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

/**
 * Teardown after all tests
 */
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer && typeof mongoServer.stop === 'function') {
    await mongoServer.stop();
  }
});

