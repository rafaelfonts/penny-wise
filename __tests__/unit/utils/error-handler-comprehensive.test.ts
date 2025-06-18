import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  StandardError,
  ErrorContext,
  handleErrors,
  logError
} from '../../../src/lib/utils/error-handler';

// Mock console methods
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

describe('Error Handler Comprehensive Tests', () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('ErrorHandler.createApiError', () => {
    test('should create API error from Error object', () => {
      const error = new Error('Network connection failed');
      const apiError = ErrorHandler.createApiError(error, 'market-service');

      expect(apiError.type).toBe('network');
      expect(apiError.message).toBe('Network connection failed');
      expect(apiError.service).toBe('market-service');
      expect(apiError.retryable).toBe(true);
      expect(apiError.timestamp).toBeDefined();
    });

    test('should categorize timeout errors correctly', () => {
      const error = new Error('Request timeout after 5000ms');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('timeout');
      expect(apiError.retryable).toBe(true);
    });

    test('should categorize auth errors correctly', () => {
      const error = new Error('401 Unauthorized access');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('auth');
      expect(apiError.retryable).toBe(false);
    });

    test('should categorize validation errors correctly', () => {
      const error = new Error('400 Bad Request - validation failed');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('validation');
      expect(apiError.retryable).toBe(false);
    });

    test('should categorize rate limit errors correctly', () => {
      const error = new Error('429 Too Many Requests - rate limit exceeded');
      const apiError = ErrorHandler.createApiError(error);

      expect(apiError.type).toBe('rate_limit');
      expect(apiError.retryable).toBe(true);
    });

    test('should categorize server errors correctly', () => {
      const error = new Error('500 Internal Server Error');
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
      const error = new Error('401 Unauthorized');
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
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another failure'))
        .mockResolvedValue({ data: 'success after retries' });

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        3,
        100
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ data: 'success after retries' });
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should return error response after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        2,
        50
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should handle non-retryable errors without retrying', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('401 Unauthorized'));

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        3,
        100
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('401 Unauthorized');
      expect(operation).toHaveBeenCalledTimes(1); // No retries for auth errors
    });

    test('should include retry metadata in response', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Server error'));

      const response = await ErrorHandler.handleAsyncOperation(
        operation,
        'test-service',
        'test-source',
        2
      );

      expect(response.metadata?.retryAttempts).toBe(2);
      expect(response.metadata?.finalAttempt).toBe(true);
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

    test('should identify non-retryable errors', () => {
      const nonRetryableError = {
        type: 'auth' as const,
        message: 'Unauthorized',
        retryable: false,
        timestamp: new Date().toISOString()
      };

      expect(ErrorHandler.isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('ErrorHandler.shouldRetryAfter', () => {
    test('should return default retry delay for retryable errors', () => {
      const error = {
        type: 'network' as const,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBeGreaterThan(0);
    });

    test('should return 0 for non-retryable errors', () => {
      const error = {
        type: 'auth' as const,
        message: 'Unauthorized',
        retryable: false,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(0);
    });

    test('should respect custom retryAfter value', () => {
      const error = {
        type: 'rate_limit' as const,
        message: 'Rate limited',
        retryable: true,
        retryAfter: 60,
        timestamp: new Date().toISOString()
      };

      const retryAfter = ErrorHandler.shouldRetryAfter(error);
      expect(retryAfter).toBe(60);
    });
  });

  describe('handleErrors decorator', () => {
    test('should wrap function with error handling', () => {
      const mockFunction = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const wrappedFunction = handleErrors('test-service', 'test-source')(mockFunction);
      const result = wrappedFunction();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(result.source).toBe('test-source');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('should pass through successful results', () => {
      const mockFunction = jest.fn().mockReturnValue({ data: 'success' });

      const wrappedFunction = handleErrors('test-service')(mockFunction);
      const result = wrappedFunction();

      expect(result).toEqual({ data: 'success' });
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('logError utility', () => {
    test('should log errors with context', () => {
      const error = new Error('Test error');
      logError(error, 'test-context');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[test-context] Test error')
      );
    });

    test('should log errors without context', () => {
      const error = new Error('Test error');
      logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    test('should handle string errors', () => {
      logError('String error message', 'context');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[context] String error message')
      );
    });

    test('should handle non-Error objects', () => {
      const errorObject = { message: 'Custom error' };
      logError(errorObject, 'context');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[context] [object Object]')
      );
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

  describe('Error Context and Metadata', () => {
    test('should handle error context properly', () => {
      const context: ErrorContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        requestId: 'req-789',
        component: 'ChatInterface',
        action: 'sendMessage',
        additionalData: { symbol: 'AAPL', timeframe: '1d' }
      };

      // Test that context structure is valid
      expect(context.userId).toBe('user-123');
      expect(context.sessionId).toBe('session-456');
      expect(context.requestId).toBe('req-789');
      expect(context.component).toBe('ChatInterface');
      expect(context.action).toBe('sendMessage');
      expect(context.additionalData?.symbol).toBe('AAPL');
    });

    test('should create standard error with all properties', () => {
      const standardError: StandardError = {
        type: ErrorType.MARKET_API_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Market API failed to respond',
        userMessage: 'Unable to fetch market data. Please try again.',
        code: 'MARKET_001',
        timestamp: Date.now(),
        retryable: true,
        retryAfter: 30,
        context: {
          userId: 'user-123',
          component: 'MarketWidget'
        }
      };

      expect(standardError.type).toBe(ErrorType.MARKET_API_ERROR);
      expect(standardError.severity).toBe(ErrorSeverity.HIGH);
      expect(standardError.retryable).toBe(true);
      expect(standardError.retryAfter).toBe(30);
      expect(standardError.context?.userId).toBe('user-123');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex error scenarios', async () => {
      // Simulate a complex service operation that might fail
      const complexOperation = jest.fn()
        .mockRejectedValueOnce(new Error('429 Rate limit exceeded'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue({ quotes: [{ symbol: 'AAPL', price: 150 }] });

      const response = await ErrorHandler.handleAsyncOperation(
        complexOperation,
        'market-service',
        'alpha-vantage',
        3,
        100
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ quotes: [{ symbol: 'AAPL', price: 150 }] });
      expect(response.source).toBe('alpha-vantage');
      expect(complexOperation).toHaveBeenCalledTimes(3);
    });

    test('should handle mixed error types in sequence', () => {
      const errors = [
        new Error('Network connection failed'),
        new Error('401 Unauthorized'),
        new Error('500 Internal Server Error'),
        new Error('429 Too Many Requests'),
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
  });
}); 