/**
 * Professional Logging System - PennyWise
 * Edge Runtime Compatible Logger
 */

// Log levels
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const logLevels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Environment-based log level
const getLogLevel = (): LogLevel => {
  if (process.env.NODE_ENV === 'production') return 'info';
  if (process.env.NODE_ENV === 'test') {
    // Allow all logs in test environment for testing
    return (process.env.TEST_LOG_LEVEL as LogLevel) || 'debug';
  }
  return 'debug';
};

// Sanitize sensitive data from logs
const sanitizeLogData = (data: unknown, visited = new WeakSet()): unknown => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Handle circular references
  if (visited.has(data as object)) {
    return '[Circular Reference]';
  }
  visited.add(data as object);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, visited));
  }

  const sensitiveFields = [
    'password',
    'token',
    'key',
    'secret',
    'apikey',
    'authorization',
    'auth',
    'credential',
    'jwt',
    'session',
    'cookie',
  ];

  const sanitized = { ...(data as Record<string, unknown>) };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key], visited);
    }
  });

  return sanitized;
};

// Format log message
const formatLogMessage = (
  level: LogLevel,
  service: string,
  message: string,
  meta?: unknown
): string => {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  const serviceTag = service ? `[${service}]` : '';
  const metaString = meta ? ` ${JSON.stringify(sanitizeLogData(meta))}` : '';

  return `${timestamp} ${levelUpper} ${serviceTag} ${message}${metaString}`;
};

// Check if log level should be output
const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getLogLevel();
  return logLevels[level] <= logLevels[currentLevel];
};

// Enhanced logger with service context
class ServiceLogger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, meta?: unknown) {
    if (!shouldLog(level)) return;

    const formattedMessage = formatLogMessage(
      level,
      this.service,
      message,
      meta
    );

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
    }

    // In production, could add external logging service integration here
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.storeErrorForAnalysis(formattedMessage, meta);
    }
  }

  private storeErrorForAnalysis(message: string, meta?: unknown) {
    try {
      // Store in localStorage for client-side analysis
      if (typeof window !== 'undefined') {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        errors.push({
          timestamp: new Date().toISOString(),
          service: this.service,
          message,
          meta: sanitizeLogData(meta),
        });

        // Keep only last 100 errors
        if (errors.length > 100) {
          errors.splice(0, errors.length - 100);
        }

        localStorage.setItem('app_errors', JSON.stringify(errors));
      }
    } catch {
      // Fail silently if localStorage is not available
    }
  }

  error(message: string, error?: Error | unknown) {
    if (error instanceof Error) {
      this.log('error', message, {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      this.log('error', message, error);
    }
  }

  warn(message: string, meta?: unknown) {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: unknown) {
    this.log('info', message, meta);
  }

  debug(message: string, meta?: unknown) {
    this.log('debug', message, meta);
  }

  // Specialized methods for common use cases
  apiRequest(method: string, url: string, status?: number, duration?: number) {
    this.info(`API ${method} ${url}`, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  apiError(method: string, url: string, error: Error, status?: number) {
    this.error(`API ${method} ${url} failed`, {
      method,
      url,
      status,
      error: error.message,
    });
  }

  databaseQuery(operation: string, table: string, duration?: number) {
    this.debug(`DB ${operation} on ${table}`, {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  cacheOperation(operation: string, key: string, hit: boolean = false) {
    this.debug(`Cache ${operation} for ${key}`, {
      operation,
      key,
      hit,
    });
  }

  userAction(userId: string, action: string, resource?: string) {
    this.info(`User action: ${action}`, {
      userId: userId.slice(-6), // Only last 6 chars for privacy
      action,
      resource,
    });
  }
}

// Factory function to create service loggers
export const createLogger = (service: string): ServiceLogger => {
  return new ServiceLogger(service);
};

// Default logger
export const log = createLogger('app');

// Service-specific loggers
export const loggers = {
  auth: createLogger('auth'),
  api: createLogger('api'),
  database: createLogger('database'),
  cache: createLogger('cache'),
  chat: createLogger('chat'),
  market: createLogger('market'),
  oplab: createLogger('oplab'),
  deepseek: createLogger('deepseek'),
  alerts: createLogger('alerts'),
  notifications: createLogger('notifications'),
  middleware: createLogger('middleware'),
  performance: createLogger('performance'),
  security: createLogger('security'),
};

// Utility functions
export const getStoredErrors = (): Record<string, unknown>[] => {
  try {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    }
  } catch {
    // Ignore errors
  }
  return [];
};

export const clearStoredErrors = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_errors');
    }
  } catch {
    // Ignore errors
  }
};

// Development utility to replace console methods (optional)
export const replaceConsoleLog = () => {
  if (process.env.NODE_ENV === 'production') {
    const originalConsole = { ...console };

    console.log = (...args) => log.info(args.join(' '));
    console.error = (...args) => log.error(args.join(' '));
    console.warn = (...args) => log.warn(args.join(' '));
    console.debug = (...args) => log.debug(args.join(' '));

    // Keep reference to original for debugging
    (globalThis as Record<string, unknown>).__originalConsole = originalConsole;
  }
};

export default log;
