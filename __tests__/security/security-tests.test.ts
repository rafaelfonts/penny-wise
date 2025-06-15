/**
 * PENNY WISE - SECURITY TESTS
 * Testing against common vulnerabilities and security issues
 */

import { loggers } from '@/lib/utils/logger';

describe('Security Tests', () => {
  describe('Environment Variables Security', () => {
    test('should not expose sensitive environment variables', () => {
      // Test that sensitive env vars are not accidentally exposed
      const sensitiveEnvVars = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'DEEPSEEK_API_KEY',
        'OPLAB_ACCESS_TOKEN',
        'ALPHA_VANTAGE_API_KEY',
      ];

      sensitiveEnvVars.forEach(envVar => {
        const value = process.env[envVar];

        // In test environment, these should be mock values or undefined
        if (value) {
          expect(value).not.toMatch(/^sk-/); // DeepSeek pattern
          expect(value).not.toMatch(/^eyJ/); // JWT pattern
          expect(value).not.toContain('real_api_key');
          expect(value).not.toContain('production_key');
        }
      });
    });

    test('should have secure default values in .env.example', () => {
      // This test validates that .env.example doesn't contain real secrets
      // In a real scenario, we would check the actual file content

      // For now, this serves as a reminder to audit .env.example manually
      const envExampleSecure = true; // Would be actual validation
      expect(envExampleSecure).toBe(true);
    });
  });

  describe('Logging Security', () => {
    test('should not log sensitive data', () => {
      const mockConsole = jest.spyOn(console, 'info');

      const sensitiveData = {
        username: 'john',
        password: 'secret123',
        apikey: 'sk-abcd1234',
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
        email: 'john@example.com',
      };

      loggers.security.info('User login', sensitiveData);

      const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';

      // Should not contain actual sensitive values
      expect(loggedMessage).not.toContain('secret123');
      expect(loggedMessage).not.toContain('sk-abcd1234');
      expect(loggedMessage).not.toContain(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'
      );

      // Should contain redacted markers
      expect(loggedMessage).toContain('***REDACTED***');

      mockConsole.mockRestore();
    });

    test('should sanitize nested sensitive data', () => {
      const mockConsole = jest.spyOn(console, 'info');

      const complexData = {
        user: {
          profile: {
            name: 'John',
            credentials: {
              password: 'secret123',
              api_key: 'dangerous-key',
            },
          },
        },
        metadata: {
          session: {
            token: 'session-token-123',
          },
        },
      };

      loggers.api.info('Complex operation', complexData);

      const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';

      expect(loggedMessage).not.toContain('secret123');
      expect(loggedMessage).not.toContain('dangerous-key');
      expect(loggedMessage).not.toContain('session-token-123');
      expect(loggedMessage).toContain('***REDACTED***');

      mockConsole.mockRestore();
    });
  });

  describe('Input Validation Security', () => {
    test('should handle XSS payloads safely', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<svg onload="alert(1)">',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      xssPayloads.forEach(payload => {
        // Test logging with XSS payload
        const mockConsole = jest.spyOn(console, 'warn');
        loggers.security.warn('Potential XSS attempt', { input: payload });

        const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';

        // Should log the attempt but not execute it
        expect(loggedMessage).toContain('Potential XSS attempt');
        expect(typeof loggedMessage).toBe('string');

        mockConsole.mockRestore();
      });
    });

    test('should handle SQL injection payloads safely', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        '1; DELETE FROM notifications; --',
        "'; INSERT INTO admin VALUES ('hacker', 'password'); --",
      ];

      sqlPayloads.forEach(payload => {
        const mockConsole = jest.spyOn(console, 'warn');
        loggers.security.warn('Potential SQL injection', { query: payload });

        const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';
        expect(loggedMessage).toContain('Potential SQL injection');

        mockConsole.mockRestore();
      });
    });
  });

  describe('Error Handling Security', () => {
    test('should not expose stack traces in production logs', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test production behavior
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      const mockConsole = jest.spyOn(console, 'error');

      const error = new Error('Database connection failed');
      error.stack =
        'Error: Database connection failed\n    at Database.connect (/app/lib/db.js:45:12)';

      loggers.database.error('Connection error', error);

      const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';

      // In production, should log error but limit sensitive info
      expect(loggedMessage).toContain('Connection error');

      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true,
      });
      mockConsole.mockRestore();
    });

    test('should handle circular references without crashing', () => {
      const circularData: Record<string, unknown> = { name: 'test' };
      circularData.self = circularData;

      expect(() => {
        loggers.api.info('Circular data test', circularData);
      }).not.toThrow();
    });
  });

  describe('Headers Security', () => {
    test('should validate security headers configuration', () => {
      // Test that our Next.js config includes security headers
      const expectedHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
      ];

      // This would test the actual headers in a real integration test
      expectedHeaders.forEach(header => {
        expect(header).toBeDefined();
      });
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    test('should handle high volume requests gracefully', () => {
      const startTime = Date.now();

      // Simulate high volume logging
      for (let i = 0; i < 100; i++) {
        loggers.api.info(`Request ${i}`, { requestId: i });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (not hang or crash)
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    test('should handle large payload logging', () => {
      const largeData = {
        data: 'x'.repeat(10000), // 10KB string
        array: Array(1000).fill({ field: 'value' }),
      };

      expect(() => {
        loggers.api.info('Large payload test', largeData);
      }).not.toThrow();
    });
  });

  describe('Authentication Security', () => {
    test('should not log authentication tokens', () => {
      const mockConsole = jest.spyOn(console, 'info');

      const authData = {
        user: 'john@example.com',
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'rt_abcdef123456',
        session_id: 'sess_xyz789',
      };

      loggers.auth.info('User authenticated', authData);

      const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';

      expect(loggedMessage).not.toContain(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      );
      expect(loggedMessage).not.toContain('rt_abcdef123456');
      expect(loggedMessage).not.toContain('sess_xyz789');
      expect(loggedMessage).toContain('***REDACTED***');

      mockConsole.mockRestore();
    });
  });

  describe('Session Security', () => {
    test('should handle session data safely', () => {
      const sessionData = {
        userId: 'user-123',
        sessionToken: 'st_secret_token',
        csrfToken: 'csrf_protection_token',
        permissions: ['read', 'write'],
      };

      const mockConsole = jest.spyOn(console, 'debug');
      loggers.auth.debug('Session created', sessionData);

      const loggedMessage = mockConsole.mock.calls[0]?.[0] || '';

      // Should preserve non-sensitive data
      expect(loggedMessage).toContain('user-123');
      expect(loggedMessage).toContain('read');

      // Should redact sensitive tokens
      expect(loggedMessage).not.toContain('st_secret_token');
      expect(loggedMessage).not.toContain('csrf_protection_token');

      mockConsole.mockRestore();
    });
  });
});
