/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

import { ApiError, StandardApiResponse } from '@/lib/types/api-response';

export class ErrorHandler {
  private static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}${errorMessage}`, {
        error,
        stack: errorStack
      });
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
      if (error.message.includes('network') || error.message.includes('fetch')) {
        type = 'network';
      } else if (error.message.includes('timeout')) {
        type = 'timeout';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        type = 'auth';
        retryable = false;
      } else if (error.message.includes('validation') || error.message.includes('400')) {
        type = 'validation';
        retryable = false;
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        type = 'rate_limit';
      } else if (error.message.includes('500') || error.message.includes('server')) {
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
      service
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
        service: serviceName
      }
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
            service: serviceName
          }
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
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
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
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      try {
        const result = await method.apply(this, args);
        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
          source
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