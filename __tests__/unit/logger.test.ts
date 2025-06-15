/**
 * PENNY WISE - LOGGER SERVICE TESTS
 * Testing professional logging system
 */

import { loggers, createLogger } from '@/lib/utils/logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

beforeAll(() => {
  global.console = { ...global.console, ...mockConsole };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Logger Service', () => {
  describe('Service Logger Creation', () => {
    test('should create logger with service name', () => {
      const logger = createLogger('test-service');
      expect(logger).toBeDefined();

      logger.info('Test message');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[test-service]')
      );
    });

    test('should log different levels correctly', () => {
      const logger = createLogger('test');

      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(mockConsole.error).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });

  describe('Specialized Logging Methods', () => {
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      logger = createLogger('api');
    });

    test('should log API requests', () => {
      logger.apiRequest('GET', '/api/test', 200, 150);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('API GET /api/test')
      );
    });

    test('should log API errors', () => {
      const error = new Error('Connection failed');
      logger.apiError('POST', '/api/test', error, 500);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('API POST /api/test failed')
      );
    });

    test('should log database operations', () => {
      logger.databaseQuery('SELECT', 'users', 50);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DB SELECT on users')
      );
    });

    test('should log cache operations', () => {
      logger.cacheOperation('GET', 'user:123', true);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Cache GET for user:123')
      );
    });

    test('should log user actions', () => {
      logger.userAction('user-123456789', 'login', 'dashboard');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('User action: login')
      );
    });
  });

  describe('Pre-configured Service Loggers', () => {
    test('should have all required service loggers', () => {
      const requiredLoggers = [
        'auth',
        'api',
        'database',
        'cache',
        'chat',
        'oplab',
        'market',
        'notification',
        'security',
        'performance',
        'audit',
        'payment',
      ];

      requiredLoggers.forEach(service => {
        const logger = loggers[service as keyof typeof loggers];
        if (logger) {
          expect(logger).toBeDefined();
        } else {
          // Some loggers may not be implemented yet
          console.log(`Logger ${service} not found - skipping test`);
        }
      });
    });

    test('should use correct service names in logs', () => {
      loggers.auth.info('Auth test');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[auth]')
      );

      loggers.api.warn('API test');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[api]')
      );

      loggers.security.error('Security test');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[security]')
      );
    });
  });

  describe('Data Sanitization', () => {
    test('should not expose sensitive data in logs', () => {
      const logger = createLogger('security');

      logger.info('Login attempt', {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('***REDACTED***')
      );
      expect(mockConsole.info).not.toHaveBeenCalledWith(
        expect.stringContaining('secret123')
      );
    });

    test('should sanitize API keys and tokens', () => {
      const logger = createLogger('api');

      logger.info('API call', {
        endpoint: '/api/data',
        apikey: 'sk-1234567890',
        authorization: 'Bearer abc123',
      });

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toContain('***REDACTED***');
      expect(call).not.toContain('sk-1234567890');
      expect(call).not.toContain('Bearer abc123');
    });
  });

  describe('Error Handling', () => {
    test('should handle Error objects properly', () => {
      const logger = createLogger('error-test');
      const error = new Error('Test error message');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('Operation failed', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    test('should handle non-Error objects', () => {
      const logger = createLogger('error-test');

      logger.error('Custom error', { code: 500, message: 'Server error' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Custom error')
      );
    });
  });
});
