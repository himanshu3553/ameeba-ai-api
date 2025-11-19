/**
 * Centralized error messages
 * All error messages used throughout the application
 */

export const ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_REQUIRED: 'Authentication required. Please provide a valid token.',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  ACCOUNT_DEACTIVATED: 'Account has been deactivated',
  TOKEN_EXPIRED: 'Token has expired. Please login again.',
  INVALID_TOKEN: 'Invalid token. Please login again.',
  TOKEN_VERIFICATION_FAILED: 'Token verification failed',
  UNABLE_TO_CREATE_ACCOUNT: 'Unable to create account. Please try again.',

  // Configuration Errors
  JWT_SECRET_NOT_CONFIGURED: 'JWT secret is not configured',
  MONGODB_URI_NOT_DEFINED: 'MONGODB_URI is not defined in environment variables',

  // Validation Errors
  INVALID_ID_FORMAT: 'Invalid ID format',
  INVALID_PROJECT_ID_FORMAT: 'Invalid Project ID format',
  INVALID_PROMPT_ID_FORMAT: 'Invalid Prompt ID format',
  INVALID_PROMPT_VERSION_ID_FORMAT: 'Invalid Prompt Version ID format',
  NAME_REQUIRED: 'Name is required and must be a non-empty string',
  NAME_TOO_LONG: 'Name must not exceed 200 characters',
  PROMPT_TEXT_REQUIRED: 'Prompt text is required and must be a non-empty string',
  EMAIL_REQUIRED: 'Email is required and must be a non-empty string',
  EMAIL_INVALID: 'Please provide a valid email address',
  PASSWORD_REQUIRED: 'Password must be a string',
  PASSWORD_TOO_SHORT: (minLength: number) => `Password must be at least ${minLength} characters`,
  IS_ACTIVE_MUST_BE_BOOLEAN: 'isActive must be a boolean',
  ACTIVE_PROMPT_MUST_BE_BOOLEAN: 'activePrompt must be a boolean',
  NO_VALID_FIELDS_TO_UPDATE: 'No valid fields to update',

  // Not Found Errors
  USER_NOT_FOUND: 'User not found',
  PROJECT_NOT_FOUND: 'Project not found',
  PROMPT_NOT_FOUND: 'Prompt not found',
  PROMPT_VERSION_NOT_FOUND: 'Prompt version not found',
  NO_ACTIVE_VERSION_FOUND: 'No active version found for this prompt',
  ROUTE_NOT_FOUND: (url: string) => `Route ${url} not found`,

  // Business Logic Errors
  PROJECT_DELETED: 'Project has been deleted',
  PROMPT_DELETED: 'Prompt has been deleted',
  PROMPT_VERSION_DELETED: 'Prompt version has been deleted',

  // MongoDB Errors
  DUPLICATE_KEY: (field: string) => `${field} already exists with this value`,

  // Server Errors
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  SERVER_ERROR: 'Server error',
  FAILED_TO_START_SERVER: 'Failed to start server',
  PORT_ALREADY_IN_USE: (port: number) => `Port ${port} is already in use. Please either:`,
  STOP_PROCESS_OR_CHANGE_PORT: (port: number) => `  1. Stop the process using port ${port}\n  2. Set a different PORT in your .env file\n\nTo find and kill the process: lsof -ti:${port} | xargs kill -9`,
} as const;

