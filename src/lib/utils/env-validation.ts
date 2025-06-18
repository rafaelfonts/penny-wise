import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Next.js Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // API Keys (optional in development, required in production)
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  OPLAB_ACCESS_TOKEN: z.string().optional(),

  // Redis Configuration (optional)
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // API Base URLs
  NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_YAHOO_FINANCE_BASE_URL: z.string().url().optional(),
  OPLAB_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_DEEPSEEK_BASE_URL: z.string().url().optional(),
});

// Production-specific validation
const productionEnvSchema = envSchema.extend({
  ALPHA_VANTAGE_API_KEY: z.string().min(1, 'Alpha Vantage API key is required in production'),
  DEEPSEEK_API_KEY: z.string().min(1, 'DeepSeek API key is required in production'),
  OPLAB_ACCESS_TOKEN: z.string().min(1, 'OpLab access token is required in production'),
});

// Validate environment variables
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const schema = isProduction ? productionEnvSchema : envSchema;

  try {
    const env = schema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }
    throw error;
  }
}

// Get validated environment variables
export const env = validateEnv();

// Helper functions for specific API configurations
export const apiConfig = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  alphaVantage: {
    apiKey: env.ALPHA_VANTAGE_API_KEY,
    baseUrl: env.NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query',
  },
  deepSeek: {
    apiKey: env.DEEPSEEK_API_KEY,
    baseUrl: env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  },
  oplab: {
    accessToken: env.OPLAB_ACCESS_TOKEN,
    baseUrl: env.OPLAB_BASE_URL || 'https://api.oplab.com.br/v3',
  },
  redis: {
    url: env.REDIS_URL,
    upstashUrl: env.UPSTASH_REDIS_REST_URL,
    upstashToken: env.UPSTASH_REDIS_REST_TOKEN,
  },
  site: {
    url: env.NEXT_PUBLIC_SITE_URL,
  },
};

// Runtime checks for API availability
export function checkApiAvailability() {
  const issues: string[] = [];
  
  if (!apiConfig.alphaVantage.apiKey) {
    issues.push('Alpha Vantage API key not configured - market data features may be limited');
  }
  
  if (!apiConfig.deepSeek.apiKey) {
    issues.push('DeepSeek AI API key not configured - AI chat features disabled');
  }
  
  if (!apiConfig.oplab.accessToken) {
    issues.push('OpLab API token not configured - Brazilian market data unavailable');
  }
  
  if (!apiConfig.redis.url && !apiConfig.redis.upstashUrl) {
    issues.push('Redis not configured - caching disabled');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues,
    isFullyConfigured: issues.length === 0,
  };
}

export default env; 