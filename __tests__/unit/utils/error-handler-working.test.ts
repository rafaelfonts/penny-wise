import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  logError
} from '../../../src/lib/utils/error-handler';

// Mock console methods
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

describe('Error Handler Working Tests', () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('ErrorHandler.createApiError', () => {
    test('should create API error from Error object', () => {
      const error = new Error('Test error message');
      const apiError = ErrorHandler.createApiError(error, 'test-service');

      expect(apiError.message).toBe('Test error message');
      expect(apiError.service).toBe('test-service');
      expect(apiError.retryable).toBe(true);
      expect(apiError.timestamp).toBeDefined();
      expect(apiError.type).toBe('unknown'); // Default type
    });

    test('should categorize network errors correctly', () => {
      const error = new Error('network connection failed');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('network');
      expect(apiError.retryable).toBe(true);
    });

    test('should categorize fetch errors correctly', () => {
      const error = new Error('fetch request failed');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('network');
      expect(apiError.retryable).toBe(true);
    });

    test('should categorize timeout errors correctly', () => {
      const error = new Error('Request timeout after 5000ms');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('timeout');
      expect(apiError.retryable).toBe(true);
    });

    test('should categorize auth errors correctly', () => {
      const error = new Error('401 unauthorized access');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('auth');
      expect(apiError.retryable).toBe(false);
    });

    test('should categorize validation errors correctly', () => {
      const error = new Error('400 validation failed');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('validation');
      expect(apiError.retryable).toBe(false);
    });

    test('should categorize rate limit errors correctly', () => {
      const error = new Error('429 rate limit exceeded');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('rate_limit');
      expect(apiError.retryable).toBe(true);
    });

    test('should categorize server errors correctly', () => {
      const error = new Error('500 internal server error');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('server');
      expect(apiError.retryable).toBe(true);
    });

    test('should handle string errors', () => {
      const error = 'Something went wrong';
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('unknown');
      expect(apiError.message).toBe('Something went wrong');
      expect(apiError.retryable).toBe(true);
    });

    test('should handle unknown error types', () => {
      const error = { custom: 'error object' };
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('unknown');
      expect(apiError.message).toBe('Unknown error occurred');
      expect(apiError.retryable).toBe(true);
    });

    test('should respect custom retryable parameter', () => {
      const error = new Error('Custom error');
      const apiError = ErrorHandler.createApiError(error, 'service', false);

      expect(apiError.retryable).toBe(false);
    });
  });

  describe('ErrorHandler.handleServiceError', () => {
    test('should handle service errors and return standard response', () => {
      const error = new Error('Service unavailable');
      const response = ErrorHandler.handleServiceError(error, 'chat-service', 'openai');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Service unavailable');
      expect(response.source).toBe('openai');
      expect(response.cached).toBe(false);
      expect(response.metadata?.service).toBe('chat-service');
      expect(response.metadata?.retryable).toBe(true);
      expect(response.timestamp).toBeDefined();
    });

    test('should log errors when handling service errors', () => {
      const error = new Error('Test error');
      ErrorHandler.handleServiceError(error, 'test-service');

      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('should include error metadata in response', () => {
      const error = new Error('401 unauthorized');
      const response = ErrorHandler.handleServiceError(error, 'auth-service');

      expect(response.metadata?.errorType).toBe('auth');
      expect(response.metadata?.retryable).toBe(false);
    });
  });

  describe('ErrorHandler.handleAsyncOperation', () => {
    test('should handle successful async operations', async () => {
      const operation = jest.fn().mockResolvedValue({ data: 'success' });
      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source'
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ data: 'success' });
      expect(response.source).toBe('test-source');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry failed operations', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('network temporary failure'))
        .mockRejectedValueOnce(new Error('network another failure'))
        .mockResolvedValue({ data: 'success after retries' });

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        3,
        10 // Short delay for testing
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ data: 'success after retries' });
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should return error response after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network persistent failure'));

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        2,
        10 // Short delay for testing
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('network persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should handle non-retryable errors without retrying', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('401 unauthorized'));

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        3,
        10
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('401 unauthorized');
      expect(operation).toHaveBeenCalledTimes(1); // No retries for auth errors
    });
  });

  describe('ErrorHandler.isRetryableError', () => {
    test('should identify retryable errors', () => {
      const retryableError = {
        type: 'network' as const,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      expect(ErrorHandler.isRetryableError(retryableError)).toBe(true);
    });

    test('should identify non-retryable errors by type', () => {
      const authError = {
        type: 'auth' as const,
        message: 'Unauthorized',
        retryable: true, // Even if marked retryable, auth errors are not retryable
        timestamp: new Date().toISOString()
      };

      expect(ErrorHandler.isRetryableError(authError)).toBe(false);
    });

    test('should identify non-retryable errors by flag', () => {
      const nonRetryableError = {
        type: 'network' as const,
        message: 'Network error',
        retryable: false,
        timestamp: new Date().toISOString()
      };

      expect(ErrorHandler.isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('ErrorHandler.shouldRetryAfter', () => {
    test('should return correct delay for rate limit errors', () => {
      const error = {
        type: 'rate_limit' as const,
        message: 'Rate limited',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(60000); // 1 minute
    });

    test('should return correct delay for timeout errors', () => {
      const error = {
        type: 'timeout' as const,
        message: 'Timeout',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(5000); // 5 seconds
    });

    test('should return correct delay for network errors', () => {
      const error = {
        type: 'network' as const,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(10000); // 10 seconds
    });

    test('should return correct delay for server errors', () => {
      const error = {
        type: 'server' as const,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(30000); // 30 seconds
    });

    test('should return default delay for unknown errors', () => {
      const error = {
        type: 'unknown' as const,
        message: 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(1000); // 1 second
    });
  });

  describe('logError utility', () => {
    test('should log errors with context', () => {
      const error = new Error('Test error');
      logError(error, 'test-context');

      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('should log errors without context', () => {
      const error = new Error('Test error');
      logError(error);

      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('should handle string errors', () => {
      logError('String error message', 'context');

      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('should handle non-Error objects', () => {
      const errorObject = { message: 'Custom error' };
      logError(errorObject, 'context');

      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Error Types and Enums', () => {
    test('should have all required error types', () => {
      expect(ErrorType.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
      expect(ErrorType.API_NETWORK_ERROR).toBe('API_NETWORK_ERROR');
      expect(ErrorType.DB_CONNECTION_ERROR).toBe('DB_CONNECTION_ERROR');
      expect(ErrorType.MARKET_INVALID_SYMBOL).toBe('MARKET_INVALID_SYMBOL');
      expect(ErrorType.VALIDATION_REQUIRED_FIELD).toBe('VALIDATION_REQUIRED_FIELD');
      expect(ErrorType.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });

    test('should have all severity levels', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex error scenarios', async () => {
      // Simulate a complex service operation that might fail
      const complexOperation = jest.fn()
        .mockRejectedValueOnce(new Error('429 rate limit exceeded'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue({ quotes: [{ symbol: 'AAPL', price: 150 }] });

      const response = await ErrorHandler.handleAsyncOperation(
        complexOperation,
        'market-service',
        'alpha-vantage',
        3,
        10
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ quotes: [{ symbol: 'AAPL', price: 150 }] });
      expect(response.source).toBe('alpha-vantage');
      expect(complexOperation).toHaveBeenCalledTimes(3);
    });

    test('should handle mixed error types in sequence', () => {
      const errors = [
        new Error('network connection failed'),
        new Error('401 unauthorized'),
        new Error('500 internal server error'),
        new Error('429 too many requests'),
        'String error message'
      ];

      const apiErrors = errors.map(error => ErrorHandler.createApiError(error));

      expect(apiErrors[0].type).toBe('network');
      expect(apiErrors[0].retryable).toBe(true);

      expect(apiErrors[1].type).toBe('auth');
      expect(apiErrors[1].retryable).toBe(false);

      expect(apiErrors[2].type).toBe('server');
      expect(apiErrors[2].retryable).toBe(true);

      expect(apiErrors[3].type).toBe('rate_limit');
      expect(apiErrors[3].retryable).toBe(true);

      expect(apiErrors[4].type).toBe('unknown');
      expect(apiErrors[4].retryable).toBe(true);
    });

    test('should handle service error with proper metadata', () => {
      const error = new Error('timeout occurred');
      const response = ErrorHandler.handleServiceError(error, 'market-service', 'yahoo');

      expect(response.success).toBe(false);
      expect(response.error).toBe('timeout occurred');
      expect(response.source).toBe('yahoo');
      expect(response.metadata?.service).toBe('market-service');
      expect(response.metadata?.errorType).toBe('timeout');
      expect(response.metadata?.retryable).toBe(true);
    });
  });
}); 