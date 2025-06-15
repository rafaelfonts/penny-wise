// ==========================================
// RATE LIMITING SYSTEM
// Advanced rate limiting with multiple strategies
// ==========================================

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStore {
  identifier: string;
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitStore>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 60 * 1000, // 1 minute default
      max: 100, // 100 requests per window
      keyGenerator: id => id,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();

    let entry = this.store.get(key);

    // Create new entry or reset if window expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        identifier: key,
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.store.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= this.config.max) {
      return {
        success: false,
        limit: this.config.max,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: entry.resetTime - now,
      };
    }

    // Increment counter
    entry.count++;

    return {
      success: true,
      limit: this.config.max,
      remaining: this.config.max - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    this.store.delete(key);
  }

  getStatus(identifier: string): RateLimitStore | null {
    const key = this.config.keyGenerator!(identifier);
    return this.store.get(key) || null;
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
});

export const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
});

export const marketDataRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 market data requests per minute
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
});

// Utility functions
export async function rateLimit(
  request: Request,
  limiter: RateLimiter = apiRateLimiter
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request);
  return await limiter.check(identifier);
}

export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for reverse proxy setups)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to connection info (may not be available in all environments)
  return 'unknown';
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  });

  if (result.retryAfter) {
    headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
  }

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${Math.ceil((result.retryAfter || 0) / 1000)} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers,
    }
  );
}

// Advanced rate limiting with different strategies
export class AdvancedRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();

  constructor() {
    // Initialize different limiters for different endpoints
    this.limiters.set('api', apiRateLimiter);
    this.limiters.set('chat', chatRateLimiter);
    this.limiters.set('market', marketDataRateLimiter);
    this.limiters.set('auth', authRateLimiter);
  }

  async checkLimits(
    request: Request,
    endpoint: string
  ): Promise<RateLimitResult> {
    const limiter = this.limiters.get(endpoint) || apiRateLimiter;
    return await rateLimit(request, limiter);
  }

  addCustomLimiter(name: string, config: RateLimitConfig): void {
    this.limiters.set(name, new RateLimiter(config));
  }

  getMetrics(): Record<string, { active: boolean }> {
    const metrics: Record<string, { active: boolean }> = {};

    for (const [name] of this.limiters.entries()) {
      // Note: This would require access to internal store
      // In a real implementation, you'd add a getMetrics method to RateLimiter
      metrics[name] = {
        active: true,
        // Add more metrics as needed
      };
    }

    return metrics;
  }
}

export const rateLimitManager = new AdvancedRateLimiter();

// Middleware helper
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiterType: string = 'api'
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResult = await rateLimitManager.checkLimits(
      request,
      limiterType
    );

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      'X-RateLimit-Reset',
      new Date(rateLimitResult.resetTime).toISOString()
    );

    return response;
  };
}

// Export for testing
export { RateLimiter };
