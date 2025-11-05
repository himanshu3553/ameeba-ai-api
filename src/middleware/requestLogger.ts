import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Extend Response interface to store response body
interface CustomResponse extends Response {
  responseBody?: any;
}

/**
 * Request logging middleware
 * Logs request details, response details, and time taken for each API call
 */
export const requestLogger = (
  req: Request,
  res: CustomResponse,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log request details
  const requestLog = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      'accept': req.get('accept'),
      'authorization': req.get('authorization') ? '[REDACTED]' : undefined,
    },
    body: sanitizeRequestBody(req.body),
    ip: req.ip || req.socket.remoteAddress,
    timestamp: new Date().toISOString(),
  };

  logger.info('Incoming request', requestLog);

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to capture response body
  res.json = function (body: any): Response {
    res.responseBody = body;
    return originalJson(body);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: `${duration}ms`,
      responseTimeMs: duration,
      responseBody: sanitizeResponseBody(res.responseBody),
      timestamp: new Date().toISOString(),
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseLog);
    } else {
      logger.info('Request completed successfully', responseLog);
    }
  });

  next();
};

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize response body to remove sensitive information
 */
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...body };

  // Handle nested objects
  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const result: any = {};
    for (const key in obj) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitizeObject(obj[key]);
      }
    }
    return result;
  };

  return sanitizeObject(sanitized);
}

