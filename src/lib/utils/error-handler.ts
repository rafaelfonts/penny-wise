/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

import { ApiError, StandardApiResponse } from '@/lib/types/api-response';

export enum ErrorType {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',

  // API errors
  API_NETWORK_ERROR = 'API_NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_INVALID_RESPONSE = 'API_INVALID_RESPONSE',
  API_SERVER_ERROR = 'API_SERVER_ERROR',

  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR = 'DB_CONSTRAINT_ERROR',

  // Cache errors
  CACHE_CONNECTION_ERROR = 'CACHE_CONNECTION_ERROR',
  CACHE_OPERATION_ERROR = 'CACHE_OPERATION_ERROR',

  // Chat errors
  CHAT_INVALID_MESSAGE = 'CHAT_INVALID_MESSAGE',
  CHAT_PROCESSING_ERROR = 'CHAT_PROCESSING_ERROR',
  CHAT_STREAM_ERROR = 'CHAT_STREAM_ERROR',

  // Market data errors
  MARKET_INVALID_SYMBOL = 'MARKET_INVALID_SYMBOL',
  MARKET_DATA_UNAVAILABLE = 'MARKET_DATA_UNAVAILABLE',
  MARKET_API_ERROR = 'MARKET_API_ERROR',

  // File errors
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_ERROR = 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR = 'FILE_TYPE_ERROR',

  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
}

export interface StandardError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code: string;
  timestamp: number;
  context?: ErrorContext;
  originalError?: Error;
  stack?: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export class ErrorHandler {
  private static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[${timestamp}] ${context ? `[${context}] ` : ''}${errorMessage}`,
        {
          error,
          stack: errorStack,
        }
      );
    } else {
      // In production, log to monitoring service
      console.error(`[${context || 'Unknown'}] ${errorMessage}`);
    }
  }

  static createApiError(
    error: unknown,
    service?: string,
    retryable: boolean = true
  ): ApiError {
    let type: ApiError['type'] = 'unknown';
    let message = 'Unknown error occurred';
    let code: string | number | undefined;

    if (error instanceof Error) {
      message = error.message;

      // Categorize error based on message content
      if (
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        type = 'network';
      } else if (error.message.includes('timeout')) {
        type = 'timeout';
      } else if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        type = 'auth';
        retryable = false;
      } else if (
        error.message.includes('validation') ||
        error.message.includes('400')
      ) {
        type = 'validation';
        retryable = false;
      } else if (
        error.message.includes('429') ||
        error.message.includes('rate limit')
      ) {
        type = 'rate_limit';
      } else if (
        error.message.includes('500') ||
        error.message.includes('server')
      ) {
        type = 'server';
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    return {
      type,
      message,
      code,
      retryable,
      timestamp: new Date().toISOString(),
      service,
    };
  }

  static handleServiceError<T = unknown>(
    error: unknown,
    serviceName: string,
    source?: string
  ): StandardApiResponse<T> {
    this.logError(error, serviceName);

    const apiError = this.createApiError(error, serviceName);

    return {
      success: false,
      error: apiError.message,
      timestamp: apiError.timestamp,
      source,
      cached: false,
      metadata: {
        errorType: apiError.type,
        retryable: apiError.retryable,
        service: serviceName,
      },
    };
  }

  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    serviceName: string,
    source?: string,
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ): Promise<StandardApiResponse<T>> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const result = await operation();

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
          source,
          cached: false,
          metadata: {
            attempt,
            service: serviceName,
          },
        };
      } catch (error) {
        lastError = error;

        const apiError = this.createApiError(error, serviceName);

        // Don't retry if error is not retryable or on last attempt
        if (!apiError.retryable || attempt === retryAttempts) {
          break;
        }

        // Wait before retry
        if (attempt < retryAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * attempt)
          );
        }
      }
    }

    return this.handleServiceError<T>(lastError, serviceName, source);
  }

  static isRetryableError(error: ApiError): boolean {
    return error.retryable && !['auth', 'validation'].includes(error.type);
  }

  static shouldRetryAfter(error: ApiError): number {
    switch (error.type) {
      case 'rate_limit':
        return 60000; // 1 minute
      case 'timeout':
        return 5000; // 5 seconds
      case 'network':
        return 10000; // 10 seconds
      case 'server':
        return 30000; // 30 seconds
      default:
        return 1000; // 1 second
    }
  }
}

// Decorator for automatic error handling
export function handleErrors(service: string, source?: string) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        const result = await method.apply(this, args);
        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
          source,
        };
      } catch (error) {
        return ErrorHandler.handleServiceError(error, service, source);
      }
    };
  };
}

// Export utility functions
export const logError = (error: unknown, context?: string) => {
  ErrorHandler['logError'](error, context);
};

export const createApiError = ErrorHandler.createApiError;
export const handleServiceError = ErrorHandler.handleServiceError;
export const handleAsyncOperation = ErrorHandler.handleAsyncOperation;
