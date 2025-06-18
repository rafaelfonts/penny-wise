// ==========================================
// API VALIDATION EXTENSIONS
// Additional validation functions for comprehensive testing
// ==========================================

// Import existing sanitizers
import { sanitizers } from './api-validation';

// ==========================================
// EXTENDED VALIDATION FUNCTIONS
// ==========================================

export function validateMarketDataRequest(request: any): boolean {
  if (!request || typeof request !== 'object') return false;
  
  const required = ['symbol', 'timeframe'];
  return required.every(field => 
    request[field] && typeof request[field] === 'string'
  );
}

export function sanitizeInput(input: string): string {
  return sanitizers.html(sanitizers.sql(input));
}

export function validateApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // Common API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9]{32,}$/,           // OpenAI style
    /^pk_test_[a-zA-Z0-9]{24,}$/,      // Stripe test
    /^api_key_[a-zA-Z0-9]{32,}$/,      // Generic API key
    /^[a-zA-Z0-9]{16,}$/               // Generic alphanumeric
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

export function validateNumericInput(
  input: any, 
  options: { min?: number; max?: number } = {}
): boolean {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (typeof num !== 'number' || isNaN(num)) return false;
  
  if (options.min !== undefined && num < options.min) return false;
  if (options.max !== undefined && num > options.max) return false;
  
  return true;
}

export function validatePaginationParams(params: { page: number; limit: number }): boolean {
  return params.page >= 1 && 
         params.limit >= 1 && 
         params.limit <= 1000;
}

export function validateSortParams(params: { field: string; direction: 'asc' | 'desc' }): boolean {
  const validFields = ['created_at', 'updated_at', 'name', 'symbol', 'price'];
  return validFields.includes(params.field) && 
         ['asc', 'desc'].includes(params.direction);
}

export function validateFilterParams(params: Record<string, any>): boolean {
  const allowedFilters = ['status', 'type', 'symbol', 'date_from', 'date_to'];
  return Object.keys(params).every(key => allowedFilters.includes(key));
}

// Rate limiting simulation
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimitCheck(
  clientId: string, 
  operation: string
): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  const key = `${clientId}:${operation}`;
  const limit = 100; // requests per minute
  const window = 60 * 1000; // 1 minute in ms
  const now = Date.now();
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (current.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: current.resetTime 
    };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remaining: limit - current.count 
  };
}

export function validateRequestHeaders(headers: Record<string, string>): boolean {
  const required = ['content-type', 'authorization'];
  return required.every(header => headers[header]);
}

export function validateJsonSchema(data: any, schema: any): boolean {
  try {
    // Basic schema validation
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null) return false;
      
      for (const [key, fieldSchema] of Object.entries(schema.properties || {})) {
        const fieldValue = data[key];
        const field = fieldSchema as any;
        
        if (field.required && fieldValue === undefined) return false;
        
        if (fieldValue !== undefined) {
          if (field.type === 'string' && typeof fieldValue !== 'string') return false;
          if (field.type === 'number' && typeof fieldValue !== 'number') return false;
          if (field.type === 'boolean' && typeof fieldValue !== 'boolean') return false;
        }
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

export function validateFileUpload(file: { 
  name: string; 
  size: number; 
  type: string 
}): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  return file.size <= maxSize && 
         allowedTypes.includes(file.type) &&
         file.name.length > 0;
}

export function validateWebhookPayload(payload: {
  event: string;
  timestamp: number;
  data: any;
}): boolean {
  return typeof payload.event === 'string' &&
         typeof payload.timestamp === 'number' &&
         payload.data !== undefined &&
         payload.timestamp > 0;
} 