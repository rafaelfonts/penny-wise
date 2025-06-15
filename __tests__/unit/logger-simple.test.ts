/**
 * PENNY WISE - SIMPLE LOGGER TEST
 * Basic validation that logging system works
 */

import { loggers, createLogger } from '@/lib/utils/logger';

describe('Logger Basic Functionality', () => {
  let mockConsole: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    info: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    mockConsole = {
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };
  });

  afterEach(() => {
    Object.values(mockConsole).forEach(mock => mock.mockRestore());
  });

  test('should create logger instance', () => {
    const logger = createLogger('test');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should log error messages (always visible)', () => {
    const logger = createLogger('test');
    logger.error('Test error message');

    expect(mockConsole.error).toHaveBeenCalledTimes(1);
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('ERROR')
    );
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('[test]')
    );
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Test error message')
    );
  });

  test('should log warning messages (visible in test)', () => {
    const logger = createLogger('test');
    logger.warn('Test warning message');

    expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARN')
    );
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('[test]')
    );
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('Test warning message')
    );
  });

  test('should have pre-configured loggers', () => {
    expect(loggers.auth).toBeDefined();
    expect(loggers.api).toBeDefined();
    expect(loggers.security).toBeDefined();
    expect(loggers.database).toBeDefined();
  });

  test('should sanitize sensitive data in error logs', () => {
    const logger = createLogger('security');

    logger.error('Authentication failed', {
      username: 'john',
      password: 'secret123',
      apikey: 'sk-dangerous',
    });

    expect(mockConsole.error).toHaveBeenCalledTimes(1);
    const loggedMessage = mockConsole.error.mock.calls[0][0];

    // Should not contain actual sensitive values
    expect(loggedMessage).not.toContain('secret123');
    expect(loggedMessage).not.toContain('sk-dangerous');

    // Should contain redacted markers
    expect(loggedMessage).toContain('***REDACTED***');

    // Should preserve non-sensitive data
    expect(loggedMessage).toContain('john');
  });

  test('should handle Error objects properly', () => {
    const logger = createLogger('test');
    const error = new Error('Test error');

    logger.error('Operation failed', error);

    expect(mockConsole.error).toHaveBeenCalledTimes(1);
    const loggedMessage = mockConsole.error.mock.calls[0][0];

    expect(loggedMessage).toContain('Operation failed');
    expect(loggedMessage).toContain('Test error');
  });

  test('should handle specialized logging methods', () => {
    const logger = createLogger('api');

    // Test API error (should always log)
    const apiError = new Error('Connection failed');
    logger.apiError('POST', '/api/test', apiError, 500);

    expect(mockConsole.error).toHaveBeenCalledTimes(1);
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('API POST /api/test failed')
    );
  });

  test('should not crash with circular references', () => {
    const logger = createLogger('test');
    const circularData: Record<string, unknown> = { name: 'test' };
    circularData.self = circularData;

    expect(() => {
      logger.error('Circular data test', circularData);
    }).not.toThrow();

    expect(mockConsole.error).toHaveBeenCalledTimes(1);
  });
});
