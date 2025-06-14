/**
 * Standard API Response Types
 * Centralizes all API response structures for consistency
 */

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source?: string;
  cached?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  type: 'network' | 'server' | 'auth' | 'validation' | 'rate_limit' | 'timeout' | 'unknown';
  message: string;
  code?: string | number;
  details?: string;
  retryable: boolean;
  timestamp: string;
  service?: string;
}

export interface PaginatedResponse<T> extends StandardApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface CacheableResponse<T> extends StandardApiResponse<T> {
  cacheKey: string;
  ttl: number;
  lastModified?: string;
  etag?: string;
}

export interface BatchResponse<T> extends StandardApiResponse<T[]> {
  batchSize: number;
  successCount: number;
  errorCount: number;
  errors?: ApiError[];
  partialSuccess?: boolean;
}

export interface HealthCheckResponse extends StandardApiResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
  responseTime: number;
  uptime: number;
}> {
  environment: string;
  version: string;
}

// Utility types for better type inference
export type ApiPromise<T> = Promise<StandardApiResponse<T>>;
export type BatchApiPromise<T> = Promise<BatchResponse<T>>;

// Type guards
export function isSuccessResponse<T>(response:StandardApiResponse<T>): response is StandardApiResponse<NonNullable<T>> {
  return response.success && response.data !== undefined && response.data !== null;
}

export function isErrorResponse<T>(response: StandardApiResponse<T>): response is StandardApiResponse<T> & { error: string } {
  return !response.success && !!response.error;
}

export function isCachedResponse<T>(response: StandardApiResponse<T>): response is StandardApiResponse<T> & { cached: true } {
  return response.cached === true;
}

// Response builders
export function createSuccessResponse<T>(
  data: T,
  source?: string,
  metadata?: Record<string, unknown>
): StandardApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    source,
    cached: false,
    metadata
  };
}

export function createErrorResponse<T = never>(
  error: string,
  source?: string,
  code?: string | number
): StandardApiResponse<T> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    source,
    cached: false,
    metadata: code ? { errorCode: code } : undefined
  };
}

export function createCachedResponse<T>(
  data: T,
  cacheKey: string,
  source?: string
): CacheableResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    source,
    cached: true,
    cacheKey,
    ttl: 300000 // 5 minutes default
  };
}