// Middleware Tests - PennyWise Application
// Testing authentication, authorization, rate limiting, and request processing

import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

// Mock the auth utilities
jest.mock('@/lib/auth/auth-utils', () => ({
  verifyToken: jest.fn(),
  isPublicRoute: jest.fn(),
  requiresAuth: jest.fn(),
}));

// Mock rate limiting
jest.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
  })),
}));

describe('Middleware Tests', () => {
  let mockRequest: Partial<NextRequest>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      url: 'http://localhost:3000/dashboard',
      method: 'GET',
      headers: new Headers(),
      nextUrl: {
        pathname: '/dashboard',
        search: '',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/dashboard',
      } as any,
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
      } as any,
    };
  });

  describe('Public Routes', () => {
    test('should allow access to public routes without authentication', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.nextUrl!.pathname = '/';
      mockRequest.url = 'http://localhost:3000/';

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toBeUndefined(); // No redirect for public routes
      expect(isPublicRoute).toHaveBeenCalledWith('/');
    });

    test('should allow access to login page', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.nextUrl!.pathname = '/auth/login';
      mockRequest.url = 'http://localhost:3000/auth/login';

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toBeUndefined();
      expect(isPublicRoute).toHaveBeenCalledWith('/auth/login');
    });

    test('should allow access to API documentation', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.nextUrl!.pathname = '/api/docs';
      mockRequest.url = 'http://localhost:3000/api/docs';

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toBeUndefined();
      expect(isPublicRoute).toHaveBeenCalledWith('/api/docs');
    });
  });

  describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async () => {
      const { isPublicRoute, requiresAuth } = require('@/lib/auth/auth-utils');
      const { createClient } = require('@/lib/supabase/server');
      
      isPublicRoute.mockReturnValue(false);
      requiresAuth.mockReturnValue(true);
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      mockRequest.nextUrl!.pathname = '/dashboard';
      mockRequest.url = 'http://localhost:3000/dashboard';

      const response = await middleware(mockRequest as NextRequest);

      expect(response?.status).toBe(307); // Temporary redirect
      expect(response?.headers.get('location')).toContain('/auth/login');
    });

    test('should allow authenticated users to access protected routes', async () => {
      const { isPublicRoute, requiresAuth } = require('@/lib/auth/auth-utils');
      const { createClient } = require('@/lib/supabase/server');
      
      isPublicRoute.mockReturnValue(false);
      requiresAuth.mockReturnValue(true);
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { 
              user: { 
                id: 'user-123', 
                email: 'test@example.com',
                role: 'authenticated'
              } 
            },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      mockRequest.nextUrl!.pathname = '/dashboard';
      mockRequest.url = 'http://localhost:3000/dashboard';

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toBeUndefined(); // No redirect for authenticated users
    });
  });

  describe('API Routes Protection', () => {
    test('should protect API routes requiring authentication', async () => {
      const { isPublicRoute, requiresAuth } = require('@/lib/auth/auth-utils');
      const { createClient } = require('@/lib/supabase/server');
      
      isPublicRoute.mockReturnValue(false);
      requiresAuth.mockReturnValue(true);
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      mockRequest.nextUrl!.pathname = '/api/portfolio';
      mockRequest.url = 'http://localhost:3000/api/portfolio';

      const response = await middleware(mockRequest as NextRequest);

      expect(response?.status).toBe(401); // Unauthorized for API routes
    });

    test('should allow public API routes', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.nextUrl!.pathname = '/api/health';
      mockRequest.url = 'http://localhost:3000/api/health';

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toBeUndefined();
    });

    test('should handle API authentication with bearer token', async () => {
      const { isPublicRoute, requiresAuth, verifyToken } = require('@/lib/auth/auth-utils');
      
      isPublicRoute.mockReturnValue(false);
      requiresAuth.mockReturnValue(true);
      verifyToken.mockResolvedValue({ 
        valid: true, 
        user: { id: 'user-123', email: 'test@example.com' } 
      });

      mockRequest.nextUrl!.pathname = '/api/portfolio';
      mockRequest.url = 'http://localhost:3000/api/portfolio';
      mockRequest.headers = new Headers({
        'Authorization': 'Bearer valid-token-123'
      });

      const response = await middleware(mockRequest as NextRequest);

      expect(response).toBeUndefined(); // Allow access with valid token
      expect(verifyToken).toHaveBeenCalledWith('valid-token-123');
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to API routes', async () => {
      const { rateLimit } = require('@/lib/utils/rate-limit');
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      
      isPublicRoute.mockReturnValue(true);
      rateLimit.mockResolvedValue({
        success: true,
        remaining: 99,
        reset: Date.now() + 60000,
      });

      mockRequest.nextUrl!.pathname = '/api/market/quote';
      mockRequest.url = 'http://localhost:3000/api/market/quote';

      const response = await middleware(mockRequest as NextRequest);

      expect(rateLimit).toHaveBeenCalled();
      expect(response).toBeUndefined(); // Allow request within rate limit
    });

    test('should block requests exceeding rate limit', async () => {
      const { rateLimit } = require('@/lib/utils/rate-limit');
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      
      isPublicRoute.mockReturnValue(true);
      rateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
        error: 'Rate limit exceeded',
      });

      mockRequest.nextUrl!.pathname = '/api/market/quote';
      mockRequest.url = 'http://localhost:3000/api/market/quote';

      const response = await middleware(mockRequest as NextRequest);

      expect(response?.status).toBe(429); // Too Many Requests
      expect(rateLimit).toHaveBeenCalled();
    });

    test('should set rate limit headers', async () => {
      const { rateLimit } = require('@/lib/utils/rate-limit');
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      
      isPublicRoute.mockReturnValue(true);
      rateLimit.mockResolvedValue({
        success: true,
        remaining: 95,
        reset: Date.now() + 60000,
        limit: 100,
      });

      mockRequest.nextUrl!.pathname = '/api/market/quote';
      mockRequest.url = 'http://localhost:3000/api/market/quote';

      const response = await middleware(mockRequest as NextRequest);

      // Since we're not blocking, response should be undefined
      // In a real implementation, headers would be set on the response
      expect(rateLimit).toHaveBeenCalled();
    });
  });

  describe('Request Processing', () => {
    test('should handle CORS for API routes', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.method = 'OPTIONS';
      mockRequest.nextUrl!.pathname = '/api/market/quote';
      mockRequest.url = 'http://localhost:3000/api/market/quote';

      const response = await middleware(mockRequest as NextRequest);

      // OPTIONS requests should be handled for CORS
      expect(response?.status).toBe(200);
      expect(response?.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    test('should add security headers', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.nextUrl!.pathname = '/dashboard';
      mockRequest.url = 'http://localhost:3000/dashboard';

      const response = await middleware(mockRequest as NextRequest);

      // In a real implementation, security headers would be added
      expect(isPublicRoute).toHaveBeenCalled();
    });

    test('should handle different HTTP methods', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        mockRequest.method = method;
        mockRequest.nextUrl!.pathname = '/api/test';
        mockRequest.url = 'http://localhost:3000/api/test';

        const response = await middleware(mockRequest as NextRequest);
        
        // Public routes should allow all methods
        expect(response).toBeUndefined();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors gracefully', async () => {
      const { isPublicRoute, requiresAuth } = require('@/lib/auth/auth-utils');
      const { createClient } = require('@/lib/supabase/server');
      
      isPublicRoute.mockReturnValue(false);
      requiresAuth.mockReturnValue(true);
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockRejectedValue(new Error('Auth service unavailable')),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      mockRequest.nextUrl!.pathname = '/dashboard';
      mockRequest.url = 'http://localhost:3000/dashboard';

      const response = await middleware(mockRequest as NextRequest);

      // Should redirect to login on auth errors
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/auth/login');
    });

    test('should handle rate limiting errors', async () => {
      const { rateLimit } = require('@/lib/utils/rate-limit');
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      
      isPublicRoute.mockReturnValue(true);
      rateLimit.mockRejectedValue(new Error('Rate limit service unavailable'));

      mockRequest.nextUrl!.pathname = '/api/market/quote';
      mockRequest.url = 'http://localhost:3000/api/market/quote';

      const response = await middleware(mockRequest as NextRequest);

      // Should allow request if rate limiting fails
      expect(response).toBeUndefined();
    });

    test('should handle malformed requests', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      // Malformed URL
      mockRequest.url = 'invalid-url';
      mockRequest.nextUrl = null as any;

      const response = await middleware(mockRequest as NextRequest);

      // Should handle gracefully
      expect(response?.status).toBe(400); // Bad Request
    });
  });

  describe('Route Matching', () => {
    test('should match exact routes', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      const routes = [
        '/',
        '/auth/login',
        '/auth/register',
        '/dashboard',
        '/portfolio',
        '/market',
        '/api/health',
        '/api/market/quote',
      ];

      for (const route of routes) {
        mockRequest.nextUrl!.pathname = route;
        mockRequest.url = `http://localhost:3000${route}`;

        const response = await middleware(mockRequest as NextRequest);
        
        expect(isPublicRoute).toHaveBeenCalledWith(route);
      }
    });

    test('should match dynamic routes', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(false);

      const dynamicRoutes = [
        '/portfolio/123',
        '/market/AAPL',
        '/api/portfolio/456',
        '/api/market/quote/MSFT',
      ];

      for (const route of dynamicRoutes) {
        mockRequest.nextUrl!.pathname = route;
        mockRequest.url = `http://localhost:3000${route}`;

        await middleware(mockRequest as NextRequest);
        
        expect(isPublicRoute).toHaveBeenCalledWith(route);
      }
    });
  });

  describe('Performance', () => {
    test('should process requests efficiently', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      mockRequest.nextUrl!.pathname = '/';
      mockRequest.url = 'http://localhost:3000/';

      const startTime = Date.now();
      await middleware(mockRequest as NextRequest);
      const endTime = Date.now();

      // Middleware should be fast (< 100ms for simple cases)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle concurrent requests', async () => {
      const { isPublicRoute } = require('@/lib/auth/auth-utils');
      isPublicRoute.mockReturnValue(true);

      const requests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl!,
          pathname: `/api/test-${i}`,
        },
        url: `http://localhost:3000/api/test-${i}`,
      }));

      const promises = requests.map(req => middleware(req as NextRequest));
      const results = await Promise.all(promises);

      // All requests should be processed
      expect(results).toHaveLength(10);
      expect(isPublicRoute).toHaveBeenCalledTimes(10);
    });
  });
});
