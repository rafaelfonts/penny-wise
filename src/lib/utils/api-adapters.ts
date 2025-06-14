/**
 * API Type Adapters
 * Converts legacy API response types to new standardized types
 */

import { StandardApiResponse } from '@/lib/types/api-response';

// Legacy ApiResponse interface (for compatibility)
interface LegacyApiResponse<T = unknown> {
  data: T | null;
  error?: string;
  success: boolean;
  source?: string;
  timestamp: string;
  cached?: boolean;
}

/**
 * Adapter to convert legacy API responses to standard format
 */
export function adaptLegacyResponse<T>(
  legacyResponse: LegacyApiResponse<T>
): StandardApiResponse<T> {
  return {
    success: legacyResponse.success,
    data: legacyResponse.data || undefined,
    error: legacyResponse.error,
    timestamp: legacyResponse.timestamp,
    source: legacyResponse.source,
    cached: legacyResponse.cached,
  };
}

/**
 * Adapter to convert promise of legacy response to standard format
 */
export async function adaptLegacyPromise<T>(
  legacyPromise: Promise<LegacyApiResponse<T>>
): Promise<StandardApiResponse<T>> {
  try {
    const response = await legacyPromise;
    return adaptLegacyResponse(response);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }
}

/**
 * Safe data extractor that handles both legacy and standard responses
 */
export function extractData<T>(
  response: StandardApiResponse<T> | LegacyApiResponse<T>
): T | null {
  if ('data' in response) {
    return response.data || null;
  }
  return null;
}

/**
 * Safe error extractor
 */
export function extractError<T>(
  response: StandardApiResponse<T> | LegacyApiResponse<T>
): string | null {
  return response.error || null;
}

/**
 * Check if response indicates success
 */
export function isSuccessful<T>(
  response: StandardApiResponse<T> | LegacyApiResponse<T>
): boolean {
  return response.success && !!extractData(response);
}

/**
 * Batch adapter for multiple legacy responses
 */
export function adaptLegacyBatch<T>(
  legacyResponses: LegacyApiResponse<T>[]
): StandardApiResponse<T[]> {
  const successfulData: T[] = [];
  const errors: string[] = [];

  legacyResponses.forEach((response, index) => {
    if (response.success && response.data) {
      successfulData.push(response.data);
    } else if (response.error) {
      errors.push(`Item ${index}: ${response.error}`);
    }
  });

  return {
    success: successfulData.length > 0,
    data: successfulData.length > 0 ? successfulData : undefined,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    timestamp: new Date().toISOString(),
    cached: false,
    metadata: {
      totalProcessed: legacyResponses.length,
      successCount: successfulData.length,
      errorCount: errors.length,
    },
  };
}

/**
 * Convert any value to StandardApiResponse format
 */
export function toStandardResponse<T>(
  data: T,
  success: boolean = true,
  error?: string,
  source?: string
): StandardApiResponse<T> {
  return {
    success,
    data: success ? data : undefined,
    error: !success ? error || 'Operation failed' : undefined,
    timestamp: new Date().toISOString(),
    source,
    cached: false,
  };
}

/**
 * Wrap a function to automatically convert its return value to StandardApiResponse
 */
export function wrapWithStandardResponse<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  source?: string
): (...args: TArgs) => Promise<StandardApiResponse<TReturn>> {
  return async (...args: TArgs): Promise<StandardApiResponse<TReturn>> => {
    try {
      const result = await fn(...args);
      return toStandardResponse(result, true, undefined, source);
    } catch (error) {
      return toStandardResponse(
        undefined as TReturn,
        false,
        error instanceof Error ? error.message : 'Unknown error',
        source
      );
    }
  };
}

/**
 * Convert external API response format to our standard
 */
export function adaptExternalApiResponse<T>(
  externalData: unknown,
  successCheck: (data: unknown) => boolean = data => !!data,
  dataExtractor: (data: unknown) => T = data => data as T,
  errorExtractor: (data: unknown) => string = () => 'External API error'
): StandardApiResponse<T> {
  try {
    if (successCheck(externalData)) {
      return {
        success: true,
        data: dataExtractor(externalData),
        timestamp: new Date().toISOString(),
        cached: false,
      };
    } else {
      return {
        success: false,
        error: errorExtractor(externalData),
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process external API response',
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }
}
