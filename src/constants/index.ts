/**
 * Application-wide constants
 * Centralized location for all magic strings, numbers, and configuration values
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Validation Constraints
export const VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 200,
  PASSWORD_MIN_LENGTH: parseInt(process.env.MIN_PASSWORD_LENGTH || '6', 10),
  EMAIL_REGEX: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
} as const;

// Default Values
export const DEFAULTS = {
  IS_ACTIVE: true,
  ACTIVE_PROMPT: false,
  PORT: 3000,
  JWT_EXPIRES_IN: '30d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
} as const;

// Environment Variables Keys
export const ENV_KEYS = {
  PORT: 'PORT',
  MONGODB_URI: 'MONGODB_URI',
  DATABASE_NAME: 'DATABASE_NAME',
  NODE_ENV: 'NODE_ENV',
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
  MIN_PASSWORD_LENGTH: 'MIN_PASSWORD_LENGTH',
  BCRYPT_SALT_ROUNDS: 'BCRYPT_SALT_ROUNDS',
} as const;

// Database Configuration
export const DATABASE = {
  DEFAULT_NAME: 'ameeba_database',
  RETRY_WRITES: true,
  WRITE_CONCERN: 'majority',
} as const;

// API Response Messages
export const API_MESSAGES = {
  SERVER_RUNNING: 'Server is properly deployed and running',
  API_RUNNING: 'API is running',
  OPERATIONAL: 'operational',
} as const;

// Version Information
export const VERSION = {
  API: '1.0.0',
} as const;

