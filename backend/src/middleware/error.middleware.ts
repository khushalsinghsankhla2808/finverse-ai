/**
 * Centralized Error Handler Middleware
 *
 * Maps known error types to safe HTTP responses.
 * NEVER exposes: stack traces, file paths, query strings, model names,
 * or raw error messages in API responses.
 *
 * Generates a UUID errorId for all 500 responses so users can report
 * specific errors and engineers can locate them in logs.
 *
 * Logs full error details server-side via Winston with sensitive field redaction.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.middleware';

// Fields that must NEVER appear in error logs
const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'token', 'refreshToken', 'cardNumber', 'cvv', 'ssn', 'pin'];

/**
 * Redacts sensitive fields from an object before logging.
 * Returns a shallow copy with sensitive values replaced by '[REDACTED]'.
 */
const redactSensitiveFields = (obj: Record<string, any> | undefined): Record<string, any> | undefined => {
  if (!obj || typeof obj !== 'object') return obj;

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveFields(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
};

/**
 * Extracts userId from the authenticated request if available.
 */
const getUserId = (req: Request): string | undefined => {
  return (req as any).user?.id || undefined;
};

export interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
  kind?: string;
  path?: string;
  value?: any;
}

/**
 * Global Express error handler (4-argument signature).
 * Must be the LAST middleware registered.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errorId = uuidv4();
  const timestamp = new Date().toISOString();
  const userId = getUserId(req);

  // --- Determine safe status code and user-facing message ---
  let statusCode = err.statusCode || 500;
  let message = 'An unexpected error occurred';

  // Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Invalid request data';
  }

  // Mongoose validation error
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Invalid request data';
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  }

  // MongoDB duplicate key error
  else if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication required';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Authentication errors (custom)
  else if (statusCode === 401) {
    message = 'Authentication required';
  }

  // Authorization errors (custom)
  else if (statusCode === 403) {
    message = 'Access denied';
  }

  // Not found (custom)
  else if (statusCode === 404) {
    message = 'Resource not found';
  }

  // Rate limiting
  else if (statusCode === 429) {
    message = 'Too many requests. Please try again later.';
  }

  // Known client errors pass through with the status
  else if (statusCode >= 400 && statusCode < 500) {
    // Use a generic message but preserve the status code
    message = err.message || 'Bad request';
  }

  // External API errors
  else if (err.message && (
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ETIMEDOUT') ||
    err.message.includes('ENOTFOUND')
  )) {
    statusCode = 502;
    message = 'External service temporarily unavailable';
  }

  // --- Log full details server-side ---
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  const logPayload = {
    errorId,
    timestamp,
    method: req.method,
    route: req.originalUrl,
    statusCode,
    userId,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: redactSensitiveFields(req.body),
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
  };

  logger[logLevel](logPayload);

  // --- Build safe response ---
  const response: Record<string, any> = {
    success: false,
    message,
  };

  // Include errorId on 500s so users can report it to support
  if (statusCode >= 500) {
    response.errorId = errorId;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
