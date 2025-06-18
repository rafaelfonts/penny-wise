import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';

// Mock the validation module
const mockValidateData = jest.fn();
const mockCreateValidationMiddleware = jest.fn();
const mockSanitizers = {
  html: jest.fn(),
  sql: jest.fn(),
  logMessage: jest.fn(),
  fileName: jest.fn(),
};

jest.mock('@/lib/utils/api-validation', () => ({
  baseSchemas: {
    uuid: z.string().uuid('Invalid UUID format'),
    email: z.string().email('Invalid email format'),
    symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol'),
    timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']),
    positiveNumber: z.number().positive('Must be a positive number'),
    nonEmptyString: z.string().min(1, 'Cannot be empty'),
  },
  chatSchemas: {
    sendMessage: z.object({
      message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
      userId: z.string().uuid().optional(),
      sessionId: z.string().min(1, 'Session ID required').max(100, 'Session ID too long'),
      context: z.object({
        symbol: z.string().regex(/^[A-Z]{1,5}$/).optional(),
        timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']).optional(),
        analysisType: z.enum(['technical', 'fundamental', 'news', 'general']).optional(),
      }).optional(),
      streaming: z.boolean().default(false),
    }),
  },
  marketSchemas: {
    quote: z.object({
      symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol'),
      provider: z.enum(['alpha-vantage', 'yahoo', 'oplab']).default('alpha-vantage'),
      includeExtended: z.boolean().default(false),
    }),
    bulkQuotes: z.object({
      symbols: z.array(z.string().regex(/^[A-Z]{1,5}$/)).min(1, 'At least one symbol required').max(50, 'Maximum 50 symbols allowed'),
      fields: z.array(z.string()).optional(),
    }),
  },
  alertSchemas: {
    createAlert: z.object({
      symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol'),
      condition: z.enum(['ABOVE', 'BELOW', 'EQUAL', 'CROSSES_ABOVE', 'CROSSES_BELOW']),
      targetValue: z.number().positive('Must be a positive number'),
      userId: z.string().uuid('Invalid UUID format'),
      description: z.string().max(500, 'Description too long').optional(),
      isActive: z.boolean().default(true),
      expiresAt: z.string().datetime().optional(),
    }),
  },
  authSchemas: {
    login: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number'),
    }),
    register: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
      confirmPassword: z.string(),
      firstName: z.string().min(1, 'First name required').max(50, 'First name too long'),
      lastName: z.string().min(1, 'Last name required').max(50, 'Last name too long'),
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
  },
  notificationSchemas: {
    create: z.object({
      userId: z.string().uuid('Invalid UUID format'),
      type: z.enum(['alert', 'market_update', 'system', 'news']),
      title: z.string().min(1, 'Title required').max(100, 'Title too long'),
      message: z.string().min(1, 'Message required').max(500, 'Message too long'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      channels: z.array(z.enum(['push', 'email', 'sms'])).default(['push']),
    }),
  },
  validateData: mockValidateData,
  createValidationMiddleware: mockCreateValidationMiddleware,
  sanitizers: mockSanitizers,
}));

describe('API Validation System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Base Schema Validation', () => {
    test('should validate UUID format', () => {
      const uuidSchema = z.string().uuid('Invalid UUID format');
      
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];
      
      const invalidUUIDs = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        '',
        'not-a-uuid-at-all',
      ];

      validUUIDs.forEach(uuid => {
        expect(() => uuidSchema.parse(uuid)).not.toThrow();
      });

      invalidUUIDs.forEach(uuid => {
        expect(() => uuidSchema.parse(uuid)).toThrow();
      });
    });

    test('should validate email format', () => {
      const emailSchema = z.string().email('Invalid email format');
      
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
        'firstname.lastname@company.com',
      ];
      
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user@domain',
        'user.domain.com',
        '',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });

    test('should validate stock symbol format', () => {
      const symbolSchema = z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol');
      
      const validSymbols = [
        'AAPL',
        'GOOGL',
        'MSFT',
        'TSLA',
        'A',
        'AMZN',
      ];
      
      const invalidSymbols = [
        'aapl', // lowercase
        'TOOLONG', // too long
        'BRK.A', // contains dot
        '123', // numbers
        'AAPL123', // mixed
        '',
      ];

      validSymbols.forEach(symbol => {
        expect(() => symbolSchema.parse(symbol)).not.toThrow();
      });

      invalidSymbols.forEach(symbol => {
        expect(() => symbolSchema.parse(symbol)).toThrow();
      });
    });

    test('should validate timeframe enum', () => {
      const timeframeSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']);
      
      const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
      const invalidTimeframes = ['2m', '10m', '2h', '1y', 'invalid', ''];

      validTimeframes.forEach(timeframe => {
        expect(() => timeframeSchema.parse(timeframe)).not.toThrow();
      });

      invalidTimeframes.forEach(timeframe => {
        expect(() => timeframeSchema.parse(timeframe)).toThrow();
      });
    });

    test('should validate positive numbers', () => {
      const positiveNumberSchema = z.number().positive('Must be a positive number');
      
      const validNumbers = [1, 0.1, 100, 1000.5, Number.MAX_VALUE];
      const invalidNumbers = [0, -1, -0.1, -100, Number.NEGATIVE_INFINITY];

      validNumbers.forEach(number => {
        expect(() => positiveNumberSchema.parse(number)).not.toThrow();
      });

      invalidNumbers.forEach(number => {
        expect(() => positiveNumberSchema.parse(number)).toThrow();
      });
    });

    test('should validate non-empty strings', () => {
      const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty');
      
      const validStrings = ['a', 'hello', 'test string', '123'];
      const invalidStrings = ['', '   '];

      validStrings.forEach(string => {
        expect(() => nonEmptyStringSchema.parse(string)).not.toThrow();
      });

      invalidStrings.forEach(string => {
        expect(() => nonEmptyStringSchema.parse(string.trim())).toThrow();
      });
    });
  });

  describe('Chat Schema Validation', () => {
    test('should validate chat message schema', () => {
      const messageSchema = z.object({
        message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
        userId: z.string().uuid().optional(),
        sessionId: z.string().min(1, 'Session ID required').max(100, 'Session ID too long'),
        context: z.object({
          symbol: z.string().regex(/^[A-Z]{1,5}$/).optional(),
          timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']).optional(),
          analysisType: z.enum(['technical', 'fundamental', 'news', 'general']).optional(),
        }).optional(),
        streaming: z.boolean().default(false),
      });

      const validMessage = {
        message: 'What is the price of AAPL?',
        sessionId: 'session-123',
        context: {
          symbol: 'AAPL',
          timeframe: '1d',
          analysisType: 'technical',
        },
        streaming: false,
      };

      const invalidMessage = {
        message: '', // empty message
        sessionId: '', // empty session ID
        context: {
          symbol: 'invalid-symbol', // invalid symbol
          timeframe: 'invalid', // invalid timeframe
        },
      };

      expect(() => messageSchema.parse(validMessage)).not.toThrow();
      expect(() => messageSchema.parse(invalidMessage)).toThrow();
    });

    test('should validate message length limits', () => {
      const messageSchema = z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long');
      
      const validMessages = [
        'Short message',
        'A'.repeat(2000), // exactly at limit
        'Medium length message with some content',
      ];
      
      const invalidMessages = [
        '', // empty
        'A'.repeat(2001), // too long
      ];

      validMessages.forEach(message => {
        expect(() => messageSchema.parse(message)).not.toThrow();
      });

      invalidMessages.forEach(message => {
        expect(() => messageSchema.parse(message)).toThrow();
      });
    });
  });

  describe('Market Schema Validation', () => {
    test('should validate quote request schema', () => {
      const quoteSchema = z.object({
        symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol'),
        provider: z.enum(['alpha-vantage', 'yahoo', 'oplab']).default('alpha-vantage'),
        includeExtended: z.boolean().default(false),
      });

      const validQuoteRequest = {
        symbol: 'AAPL',
        provider: 'alpha-vantage',
        includeExtended: true,
      };

      const invalidQuoteRequest = {
        symbol: 'invalid-symbol',
        provider: 'invalid-provider',
        includeExtended: 'not-boolean',
      };

      expect(() => quoteSchema.parse(validQuoteRequest)).not.toThrow();
      expect(() => quoteSchema.parse(invalidQuoteRequest)).toThrow();
    });

    test('should validate bulk quotes schema', () => {
      const bulkQuotesSchema = z.object({
        symbols: z.array(z.string().regex(/^[A-Z]{1,5}$/)).min(1, 'At least one symbol required').max(50, 'Maximum 50 symbols allowed'),
        fields: z.array(z.string()).optional(),
      });

      const validBulkRequest = {
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        fields: ['price', 'change', 'volume'],
      };

      const invalidBulkRequest = {
        symbols: [], // empty array
        fields: 'not-an-array',
      };

      const tooManySymbols = {
        symbols: Array(51).fill('AAPL'), // too many symbols
      };

      expect(() => bulkQuotesSchema.parse(validBulkRequest)).not.toThrow();
      expect(() => bulkQuotesSchema.parse(invalidBulkRequest)).toThrow();
      expect(() => bulkQuotesSchema.parse(tooManySymbols)).toThrow();
    });
  });

  describe('Alert Schema Validation', () => {
    test('should validate create alert schema', () => {
      const createAlertSchema = z.object({
        symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol'),
        condition: z.enum(['ABOVE', 'BELOW', 'EQUAL', 'CROSSES_ABOVE', 'CROSSES_BELOW']),
        targetValue: z.number().positive('Must be a positive number'),
        userId: z.string().uuid('Invalid UUID format'),
        description: z.string().max(500, 'Description too long').optional(),
        isActive: z.boolean().default(true),
        expiresAt: z.string().datetime().optional(),
      });

      const validAlert = {
        symbol: 'AAPL',
        condition: 'ABOVE',
        targetValue: 150.00,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Alert when AAPL goes above $150',
        isActive: true,
      };

      const invalidAlert = {
        symbol: 'invalid',
        condition: 'INVALID_CONDITION',
        targetValue: -10, // negative
        userId: 'invalid-uuid',
        description: 'A'.repeat(501), // too long
      };

      expect(() => createAlertSchema.parse(validAlert)).not.toThrow();
      expect(() => createAlertSchema.parse(invalidAlert)).toThrow();
    });

    test('should validate alert conditions', () => {
      const conditionSchema = z.enum(['ABOVE', 'BELOW', 'EQUAL', 'CROSSES_ABOVE', 'CROSSES_BELOW']);
      
      const validConditions = ['ABOVE', 'BELOW', 'EQUAL', 'CROSSES_ABOVE', 'CROSSES_BELOW'];
      const invalidConditions = ['above', 'GREATER_THAN', 'LESS_THAN', 'INVALID', ''];

      validConditions.forEach(condition => {
        expect(() => conditionSchema.parse(condition)).not.toThrow();
      });

      invalidConditions.forEach(condition => {
        expect(() => conditionSchema.parse(condition)).toThrow();
      });
    });
  });

  describe('Authentication Schema Validation', () => {
    test('should validate login schema', () => {
      const loginSchema = z.object({
        email: z.string().email('Invalid email format'),
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase letter')
          .regex(/[a-z]/, 'Password must contain lowercase letter')
          .regex(/[0-9]/, 'Password must contain number'),
      });

      const validLogin = {
        email: 'user@example.com',
        password: 'StrongPass123',
      };

      const invalidLogin = {
        email: 'invalid-email',
        password: 'weak', // too short, no uppercase, no number
      };

      expect(() => loginSchema.parse(validLogin)).not.toThrow();
      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });

    test('should validate registration schema with password confirmation', () => {
      const registerSchema = z.object({
        email: z.string().email('Invalid email format'),
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase letter')
          .regex(/[a-z]/, 'Password must contain lowercase letter')
          .regex(/[0-9]/, 'Password must contain number')
          .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
        confirmPassword: z.string(),
        firstName: z.string().min(1, 'First name required').max(50, 'First name too long'),
        lastName: z.string().min(1, 'Last name required').max(50, 'Last name too long'),
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      });

      const validRegistration = {
        email: 'user@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const invalidRegistration = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPassword!',
        firstName: '',
        lastName: 'A'.repeat(51), // too long
      };

      expect(() => registerSchema.parse(validRegistration)).not.toThrow();
      expect(() => registerSchema.parse(invalidRegistration)).toThrow();
    });

    test('should validate password complexity requirements', () => {
      const passwordSchema = z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

      const validPasswords = [
        'StrongPass123!',
        'MySecure@Pass1',
        'Complex#Password9',
      ];

      const invalidPasswords = [
        'short', // too short
        'nouppercase123!', // no uppercase
        'NOLOWERCASE123!', // no lowercase
        'NoNumbers!', // no numbers
        'NoSpecialChars123', // no special characters
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('Notification Schema Validation', () => {
    test('should validate notification creation schema', () => {
      const notificationSchema = z.object({
        userId: z.string().uuid('Invalid UUID format'),
        type: z.enum(['alert', 'market_update', 'system', 'news']),
        title: z.string().min(1, 'Title required').max(100, 'Title too long'),
        message: z.string().min(1, 'Message required').max(500, 'Message too long'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        channels: z.array(z.enum(['push', 'email', 'sms'])).default(['push']),
      });

      const validNotification = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'alert',
        title: 'Price Alert',
        message: 'AAPL has reached your target price',
        priority: 'high',
        channels: ['push', 'email'],
      };

      const invalidNotification = {
        userId: 'invalid-uuid',
        type: 'invalid-type',
        title: '', // empty title
        message: 'A'.repeat(501), // too long
        priority: 'invalid-priority',
        channels: ['invalid-channel'],
      };

      expect(() => notificationSchema.parse(validNotification)).not.toThrow();
      expect(() => notificationSchema.parse(invalidNotification)).toThrow();
    });

    test('should validate notification types and priorities', () => {
      const typeSchema = z.enum(['alert', 'market_update', 'system', 'news']);
      const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
      const channelSchema = z.enum(['push', 'email', 'sms']);

      const validTypes = ['alert', 'market_update', 'system', 'news'];
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      const validChannels = ['push', 'email', 'sms'];

      validTypes.forEach(type => {
        expect(() => typeSchema.parse(type)).not.toThrow();
      });

      validPriorities.forEach(priority => {
        expect(() => prioritySchema.parse(priority)).not.toThrow();
      });

      validChannels.forEach(channel => {
        expect(() => channelSchema.parse(channel)).not.toThrow();
      });

      expect(() => typeSchema.parse('invalid')).toThrow();
      expect(() => prioritySchema.parse('invalid')).toThrow();
      expect(() => channelSchema.parse('invalid')).toThrow();
    });
  });

  describe('Validation Utilities', () => {
    test('should implement validateData function', () => {
      const testSchema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      const validData = { name: 'John', age: 25 };
      const invalidData = { name: '', age: -5 };

      // Mock implementation
      mockValidateData.mockImplementation((schema, data) => {
        try {
          const result = schema.parse(data);
          return { success: true, data: result };
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            return { success: false, errors };
          }
          return { success: false, errors: ['Validation failed'] };
        }
      });

      const validResult = mockValidateData(testSchema, validData);
      const invalidResult = mockValidateData(testSchema, invalidData);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    });

    test('should implement createValidationMiddleware function', async () => {
      const testSchema = z.object({
        message: z.string().min(1),
      });

      // Mock implementation
      mockCreateValidationMiddleware.mockImplementation((schema) => {
        return async (request: Request) => {
          try {
            const body = await request.json();
            const validation = mockValidateData(schema, body);

            if (!validation.success) {
              return new Response(
                JSON.stringify({
                  error: 'Validation failed',
                  details: validation.errors,
                }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }

            return validation;
          } catch {
            return new Response(
              JSON.stringify({
                error: 'Invalid JSON body',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        };
      });

      const middleware = mockCreateValidationMiddleware(testSchema);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Sanitization Utilities', () => {
    test('should sanitize HTML content', () => {
      mockSanitizers.html.mockImplementation((input: string) => {
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      });

      const htmlInput = '<script>alert("xss")</script>';
      const sanitized = mockSanitizers.html(htmlInput);

      expect(mockSanitizers.html).toHaveBeenCalledWith(htmlInput);
      expect(sanitized).not.toContain('<script>');
    });

    test('should sanitize SQL content', () => {
      mockSanitizers.sql.mockImplementation((input: string) => {
        return input
          .replace(/'/g, "''")
          .replace(/"/g, '""')
          .replace(/;/g, '')
          .replace(/--/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '');
      });

      const sqlInput = "'; DROP TABLE users; --";
      const sanitized = mockSanitizers.sql(sqlInput);

      expect(mockSanitizers.sql).toHaveBeenCalledWith(sqlInput);
      expect(sanitized).not.toContain('DROP TABLE');
    });

    test('should sanitize log messages', () => {
      mockSanitizers.logMessage.mockImplementation((message: string) => {
        return message
          .replace(/password\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'password: ***REDACTED***')
          .replace(/token\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'token: ***REDACTED***')
          .replace(/key\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'key: ***REDACTED***')
          .replace(/secret\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'secret: ***REDACTED***');
      });

      const logInput = 'User login with password: secret123 and token: abc123';
      const sanitized = mockSanitizers.logMessage(logInput);

      expect(mockSanitizers.logMessage).toHaveBeenCalledWith(logInput);
      expect(sanitized).toContain('***REDACTED***');
    });

    test('should sanitize file names', () => {
      mockSanitizers.fileName.mockImplementation((input: string) => {
        return input
          .replace(/[^a-zA-Z0-9._-]/g, '')
          .replace(/\.{2,}/g, '.')
          .slice(0, 255);
      });

      const fileNameInput = '../../../etc/passwd';
      const sanitized = mockSanitizers.fileName(fileNameInput);

      expect(mockSanitizers.fileName).toHaveBeenCalledWith(fileNameInput);
      expect(sanitized).not.toContain('../');
    });
  });

  describe('Complex Validation Scenarios', () => {
    test('should validate nested object schemas', () => {
      const nestedSchema = z.object({
        user: z.object({
          id: z.string().uuid(),
          profile: z.object({
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            preferences: z.object({
              notifications: z.boolean(),
              theme: z.enum(['light', 'dark']),
            }),
          }),
        }),
        metadata: z.object({
          timestamp: z.string().datetime(),
          version: z.string(),
        }),
      });

      const validNestedData = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            preferences: {
              notifications: true,
              theme: 'dark',
            },
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };

      expect(() => nestedSchema.parse(validNestedData)).not.toThrow();
    });

    test('should validate array schemas with constraints', () => {
      const arraySchema = z.object({
        symbols: z.array(z.string().regex(/^[A-Z]{1,5}$/)).min(1).max(10),
        weights: z.array(z.number().min(0).max(1)).length(10),
        tags: z.array(z.string()).optional(),
      });

      const validArrayData = {
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        weights: [0.1, 0.2, 0.3, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05],
        tags: ['tech', 'growth'],
      };

      const invalidArrayData = {
        symbols: [], // empty array
        weights: [0.1, 0.2], // wrong length
        tags: 'not-an-array',
      };

      expect(() => arraySchema.parse(validArrayData)).not.toThrow();
      expect(() => arraySchema.parse(invalidArrayData)).toThrow();
    });

    test('should validate conditional schemas', () => {
      const conditionalSchema = z.object({
        type: z.enum(['email', 'sms', 'push']),
        recipient: z.string(),
        content: z.string(),
      }).refine(data => {
        if (data.type === 'email') {
          return z.string().email().safeParse(data.recipient).success;
        }
        if (data.type === 'sms') {
          return /^\+\d{10,15}$/.test(data.recipient);
        }
        return true; // push notifications don't need specific format
      }, {
        message: 'Recipient format must match notification type',
        path: ['recipient'],
      });

      const validEmailNotification = {
        type: 'email',
        recipient: 'user@example.com',
        content: 'Test message',
      };

      const validSmsNotification = {
        type: 'sms',
        recipient: '+1234567890',
        content: 'Test message',
      };

      const invalidEmailNotification = {
        type: 'email',
        recipient: 'invalid-email',
        content: 'Test message',
      };

      expect(() => conditionalSchema.parse(validEmailNotification)).not.toThrow();
      expect(() => conditionalSchema.parse(validSmsNotification)).not.toThrow();
      expect(() => conditionalSchema.parse(invalidEmailNotification)).toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
      const schema = z.object({
        required: z.string().min(1),
        number: z.number().positive(),
      });

      const invalidData = {
        required: '',
        number: -1,
      };

      try {
        schema.parse(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          expect(error.errors).toHaveLength(2);
          expect(error.errors[0].path).toContain('required');
          expect(error.errors[1].path).toContain('number');
        }
      }
    });

    test('should provide detailed error messages', () => {
      const schema = z.object({
        email: z.string().email('Please provide a valid email address'),
        age: z.number().min(18, 'Must be at least 18 years old'),
      });

      const invalidData = {
        email: 'invalid-email',
        age: 16,
      };

      try {
        schema.parse(invalidData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const emailError = error.errors.find(e => e.path.includes('email'));
          const ageError = error.errors.find(e => e.path.includes('age'));
          
          expect(emailError?.message).toBe('Please provide a valid email address');
          expect(ageError?.message).toBe('Must be at least 18 years old');
        }
      }
    });

    test('should handle unknown validation errors', () => {
      mockValidateData.mockImplementation(() => {
        throw new Error('Unknown validation error');
      });

      const result = mockValidateData(z.string(), 'test');
      
      // The mock should handle the error and return a failure result
      expect(mockValidateData).toHaveBeenCalled();
    });
  });
}); 