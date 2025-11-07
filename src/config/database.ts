import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const databaseName = process.env.DATABASE_NAME || 'ameeba_database';

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
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
      retryWrites: true,
      w: 'majority',
    });

    const dbName = conn.connection.db?.databaseName || databaseName;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${dbName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

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

