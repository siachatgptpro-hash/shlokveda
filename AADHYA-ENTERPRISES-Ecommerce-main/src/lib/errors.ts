// ==============================================================================
// UNIFIED ERROR TAXONOMY — SHOLKVEDA
// ==============================================================================

import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 422, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required. Please log in.') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied. You do not have the required permissions.') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} was not found.`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class StockUnavailableError extends AppError {
  constructor(sku: string, requested: number, available: number) {
    super(
      'STOCK_UNAVAILABLE',
      `Insufficient stock for SKU ${sku}. Requested: ${requested}, Available: ${available}`,
      409,
      { sku, requested, available }
    );
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super('PAYMENT_ERROR', message, 400, details);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check the submitted details.',
          details: error.flatten(),
        },
      },
    };
  }

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
  console.error('[Unhandled API Error]:', error);

  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred. Please try again.' : message,
      },
    },
  };
}
