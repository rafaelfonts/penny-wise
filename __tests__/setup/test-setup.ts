/**
 * PENNY WISE - TEST SETUP
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })),
  }),
}));

// Mock environment variables
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
process.env.TEST_LOG_LEVEL = 'debug'; // Enable all logs in tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Web APIs for Next.js API routes
Object.defineProperty(global, 'Request', {
  value: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(Object.entries(options?.headers || {})),
    body: options?.body,
    json: async () => (options?.body ? JSON.parse(options.body) : {}),
    text: async () => options?.body || '',
  })),
  writable: true,
});

Object.defineProperty(global, 'Response', {
  value: jest.fn().mockImplementation((body, options) => ({
    ok: (options?.status || 200) < 400,
    status: options?.status || 200,
    statusText: options?.statusText || 'OK',
    headers: new Map(Object.entries(options?.headers || {})),
    json: async () => (body ? JSON.parse(body) : {}),
    text: async () => body || '',
  })),
  writable: true,
});

// Test utilities
export const mockFetch = (data: unknown, ok = true) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
  });
};

export const mockFetchError = (error: string) => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error));
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

const testSetup = {};
export default testSetup;
