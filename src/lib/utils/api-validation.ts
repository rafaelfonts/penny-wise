// ==========================================
// API VALIDATION SYSTEM
// Schema validation using Zod for all API endpoints
// ==========================================

import { z } from 'zod';

// ==========================================
// BASE SCHEMAS
// ==========================================

export const baseSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid stock symbol'),
  timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyString: z.string().min(1, 'Cannot be empty'),
};

// ==========================================
// CHAT API SCHEMAS
// ==========================================

export const chatSchemas = {
  sendMessage: z.object({
    message: z
      .string()
      .min(1, 'Message cannot be empty')
      .max(2000, 'Message too long (max 2000 characters)'),
    userId: baseSchemas.uuid.optional(),
    sessionId: z
      .string()
      .min(1, 'Session ID required')
      .max(100, 'Session ID too long'),
    context: z
      .object({
        symbol: baseSchemas.symbol.optional(),
        timeframe: baseSchemas.timeframe.optional(),
        analysisType: z
          .enum(['technical', 'fundamental', 'news', 'general'])
          .optional(),
      })
      .optional(),
    streaming: z.boolean().default(false),
  }),

  streamResponse: z.object({
    sessionId: baseSchemas.nonEmptyString,
    messageId: baseSchemas.uuid.optional(),
  }),
};

// ==========================================
// MARKET DATA SCHEMAS
// ==========================================

export const marketSchemas = {
  quote: z.object({
    symbol: baseSchemas.symbol,
    provider: z
      .enum(['alpha-vantage', 'yahoo', 'oplab'])
      .default('alpha-vantage'),
    includeExtended: z.boolean().default(false),
  }),

  historicalData: z.object({
    symbol: baseSchemas.symbol,
    timeframe: baseSchemas.timeframe,
    limit: z.number().int().min(1).max(1000).default(100),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  analysis: z.object({
    symbol: baseSchemas.symbol,
    analysisType: z.enum(['technical', 'fundamental', 'sentiment']),
    indicators: z.array(z.string()).optional(),
    period: z.number().int().min(1).max(200).default(14),
  }),

  bulkQuotes: z.object({
    symbols: z
      .array(baseSchemas.symbol)
      .min(1, 'At least one symbol required')
      .max(50, 'Maximum 50 symbols allowed'),
    fields: z.array(z.string()).optional(),
  }),
};

// ==========================================
// ALERTS SCHEMAS
// ==========================================

export const alertSchemas = {
  createAlert: z.object({
    symbol: baseSchemas.symbol,
    condition: z.enum([
      'ABOVE',
      'BELOW',
      'EQUAL',
      'CROSSES_ABOVE',
      'CROSSES_BELOW',
    ]),
    targetValue: baseSchemas.positiveNumber,
    userId: baseSchemas.uuid,
    description: z.string().max(500, 'Description too long').optional(),
    isActive: z.boolean().default(true),
    expiresAt: z.string().datetime().optional(),
  }),

  updateAlert: z.object({
    id: baseSchemas.uuid,
    targetValue: baseSchemas.positiveNumber.optional(),
    condition: z
      .enum(['ABOVE', 'BELOW', 'EQUAL', 'CROSSES_ABOVE', 'CROSSES_BELOW'])
      .optional(),
    isActive: z.boolean().optional(),
    description: z.string().max(500, 'Description too long').optional(),
  }),

  deleteAlert: z.object({
    id: baseSchemas.uuid,
    userId: baseSchemas.uuid,
  }),

  getUserAlerts: z.object({
    userId: baseSchemas.uuid,
    isActive: z.boolean().optional(),
    symbol: baseSchemas.symbol.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
};

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const authSchemas = {
  login: z.object({
    email: baseSchemas.email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number'),
  }),

  register: z
    .object({
      email: baseSchemas.email,
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
      confirmPassword: z.string(),
      firstName: z
        .string()
        .min(1, 'First name required')
        .max(50, 'First name too long'),
      lastName: z
        .string()
        .min(1, 'Last name required')
        .max(50, 'Last name too long'),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),

  changePassword: z
    .object({
      currentPassword: z.string().min(1, 'Current password required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
      confirmPassword: z.string(),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
};

// ==========================================
// NOTIFICATIONS SCHEMAS
// ==========================================

export const notificationSchemas = {
  create: z.object({
    userId: baseSchemas.uuid,
    type: z.enum(['alert', 'market_update', 'system', 'news']),
    title: z.string().min(1, 'Title required').max(100, 'Title too long'),
    message: z.string().min(1, 'Message required').max(500, 'Message too long'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    channels: z.array(z.enum(['push', 'email', 'sms'])).default(['push']),
  }),

  markRead: z.object({
    id: baseSchemas.uuid,
    userId: baseSchemas.uuid,
  }),

  updatePreferences: z.object({
    userId: baseSchemas.uuid,
    preferences: z.object({
      alerts: z.boolean().default(true),
      marketUpdates: z.boolean().default(true),
      systemNotifications: z.boolean().default(true),
      newsUpdates: z.boolean().default(false),
      emailNotifications: z.boolean().default(false),
      pushNotifications: z.boolean().default(true),
    }),
  }),
};

// ==========================================
// PORTFOLIO SCHEMAS
// ==========================================

export const portfolioSchemas = {
  addPosition: z.object({
    userId: baseSchemas.uuid,
    symbol: baseSchemas.symbol,
    quantity: baseSchemas.positiveNumber,
    avgPrice: baseSchemas.positiveNumber,
    type: z.enum(['long', 'short']).default('long'),
  }),

  updatePosition: z.object({
    id: baseSchemas.uuid,
    quantity: baseSchemas.positiveNumber.optional(),
    avgPrice: baseSchemas.positiveNumber.optional(),
  }),

  deletePosition: z.object({
    id: baseSchemas.uuid,
    userId: baseSchemas.uuid,
  }),
};

// ==========================================
// VALIDATION UTILITIES
// ==========================================

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: string[];
    };

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<ValidationResult<T> | Response> => {
    try {
      const body = await request.json();
      const validation = validateData(schema, body);

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
}

// ==========================================
// SANITIZATION UTILITIES
// ==========================================

export const sanitizers = {
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  sql: (input: string): string => {
    return input
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  },

  logMessage: (message: string): string => {
    // Remove potentially sensitive information from logs
    return message
      .replace(
        /password\s*[:=]\s*["']?[^"'\s]+["']?/gi,
        'password: ***REDACTED***'
      )
      .replace(/token\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'token: ***REDACTED***')
      .replace(/key\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'key: ***REDACTED***')
      .replace(
        /secret\s*[:=]\s*["']?[^"'\s]+["']?/gi,
        'secret: ***REDACTED***'
      );
  },

  fileName: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .slice(0, 255);
  },
};

// ==========================================
// ADDITIONAL VALIDATION FUNCTIONS (for comprehensive tests)
// ==========================================

export function validateMarketDataRequest(request: any): boolean {
  if (!request || typeof request !== 'object') return false;
  
  const required = ['symbol', 'timeframe'];
  return required.every(field => 
    request[field] && typeof request[field] === 'string'
  );
}

/**
 * Sanitize input to prevent XSS and SQL injection
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/DROP\s+TABLE/gi, '')
    .replace(/SELECT\s+\*/gi, '')
    .replace(/DELETE\s+FROM/gi, '')
    .replace(/INSERT\s+INTO/gi, '')
    .replace(/UPDATE\s+SET/gi, '')
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/alert\(/gi, '');
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // Check various API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9]{32,}$/, // OpenAI style
    /^pk_test_[a-zA-Z0-9]{16,}$/, // Stripe test keys
    /^pk_live_[a-zA-Z0-9]{16,}$/, // Stripe live keys
    /^api_key_[a-zA-Z0-9]{32,}$/, // Generic API keys
  ];
  
  return patterns.some(pattern => pattern.test(key));
}

export function validateDateRange(start: string, end: string): boolean {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return startDate <= endDate && 
           !isNaN(startDate.getTime()) && 
           !isNaN(endDate.getTime());
  } catch {
    return false;
  }
}

/**
 * Validate numeric input
 */
export function validateNumericInput(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

export function validatePaginationParams(params: { page: number; limit: number }): boolean {
  return params.page >= 1 && 
         params.limit >= 1 && 
         params.limit <= 1000;
}

/**
 * Validate sort parameters
 */
export function validateSortParams(sort: { field: string; direction: 'asc' | 'desc' }): boolean {
  if (!sort || typeof sort !== 'object') return false;
  
  const validFields = ['name', 'date', 'price', 'change', 'volume', 'created_at', 'updated_at'];
  const validDirections = ['asc', 'desc'];
  
  return validFields.includes(sort.field) && validDirections.includes(sort.direction);
}

/**
 * Validate filter parameters
 */
export function validateFilterParams(filter: { field: string; operator: string; value: string }): boolean {
  if (!filter || typeof filter !== 'object') return false;
  
  const validFields = ['name', 'type', 'status', 'category', 'price', 'date'];
  const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'in'];
  
  return validFields.includes(filter.field) && 
         validOperators.includes(filter.operator) &&
         filter.value !== undefined;
}

/**
 * Rate limiting check
 */
export function checkRateLimit(userId: string, limit: number = 100): { allowed: boolean; remaining: number; resetTime?: number; limit?: number } {
  // Simple in-memory rate limiting (in production, use Redis)
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  // Get or create user rate limit data
  const key = `rate_limit_${userId}`;
  const rateLimitData = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  
  // Reset if window has expired
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + windowMs;
  }
  
  const allowed = rateLimitData.count < limit;
  
  if (allowed) {
    rateLimitData.count++;
  }
  
  rateLimitStore.set(key, rateLimitData);
  
  return {
    allowed,
    remaining: Math.max(0, limit - rateLimitData.count),
    resetTime: rateLimitData.resetTime,
    limit
  };
}

// Simple in-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Validate request headers
 */
export function validateRequestHeaders(headers: Record<string, string>): boolean {
  if (!headers || typeof headers !== 'object') return false;
  
  const requiredHeaders = ['content-type', 'authorization'];
  return requiredHeaders.every(header => 
    headers[header] || headers[header.toLowerCase()]
  );
}

/**
 * Validate JSON schema
 */
export function validateJsonSchema(data: unknown, schema: { required: string[]; properties: Record<string, { type: string }> }): boolean {
  if (!data || typeof data !== 'object' || !schema) return false;
  
  const obj = data as Record<string, unknown>;
  
  // Check required fields
  for (const field of schema.required) {
    if (!(field in obj)) return false;
  }
  
  // Check field types
  for (const [field, fieldSchema] of Object.entries(schema.properties)) {
    if (field in obj) {
      const value = obj[field];
      const expectedType = fieldSchema.type;
      
      if (expectedType === 'string' && typeof value !== 'string') return false;
      if (expectedType === 'number' && typeof value !== 'number') return false;
      if (expectedType === 'boolean' && typeof value !== 'boolean') return false;
      if (expectedType === 'array' && !Array.isArray(value)) return false;
    }
  }
  
  return true;
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: { name: string; size: number; type: string }): boolean {
  if (!file || typeof file !== 'object') return false;
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'];
  
  return file.size <= maxSize && allowedTypes.includes(file.type);
}

/**
 * Validate webhook payload
 */
export function validateWebhookPayload(payload: { event: string; data: object; timestamp: number }): boolean {
  if (!payload || typeof payload !== 'object') return false;
  
  const validEvents = ['user.created', 'user.updated', 'order.created', 'payment.completed'];
  
  return validEvents.includes(payload.event) &&
         typeof payload.data === 'object' &&
         typeof payload.timestamp === 'number' &&
         payload.timestamp > 0;
}

// ==========================================
// EXPORT ALL SCHEMAS
// ==========================================

export const schemas = {
  base: baseSchemas,
  chat: chatSchemas,
  market: marketSchemas,
  alerts: alertSchemas,
  auth: authSchemas,
  notifications: notificationSchemas,
  portfolio: portfolioSchemas,
};

export default schemas;
