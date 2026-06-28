/**
 * VirusTotal Integrated Service
 * Wraps VirusTotal API with cache, retry, rate limiting, and monitoring
 */

import { queryVirusTotal, analyzeVirusTotalResult, VirusTotalResult } from './virusTotalService';
import { getCached, setCached } from './apiCache';
import { checkRateLimit } from './rateLimiter';
import { retryWithBackoff, retryTracker } from './apiRetry';
import { logAPICall } from './apiMonitoring';

/**
 * Query VirusTotal with all integrations
 */
export async function queryVirusTotalIntegrated(
  fileHash: string,
  userId?: string
): Promise<{
  success: boolean;
  data?: VirusTotalResult;
  error?: string;
  cached: boolean;
  attempts: number;
  responseTime: number;
}> {
  const startTime = Date.now();
  let attempts = 0;

  try {
    // Check rate limit
    const rateLimitCheck = await checkRateLimit('virustotal', userId || 'global');
    if (!rateLimitCheck.allowed) {
      const error = `Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter}s`;
      await logAPICall({
        service: 'virustotal',
        endpoint: `/files/${fileHash}`,
        method: 'GET',
        statusCode: 429,
        responseTime: Date.now() - startTime,
        requestSize: 0,
        responseSize: 0,
        error,
        success: false,
        timestamp: new Date(),
        userId,
      });

      return {
        success: false,
        error,
        cached: false,
        attempts: 0,
        responseTime: Date.now() - startTime,
      };
    }

    // Check cache
    const cacheKey = `vt:${fileHash}`;
    const cachedResult = await getCached(cacheKey, 'virustotal');
    if (cachedResult) {
      await logAPICall({
        service: 'virustotal',
        endpoint: `/files/${fileHash}`,
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        requestSize: 0,
        responseSize: JSON.stringify(cachedResult).length,
        success: true,
        timestamp: new Date(),
        userId,
      });

      return {
        success: true,
        data: cachedResult as VirusTotalResult,
        cached: true,
        attempts: 0,
        responseTime: Date.now() - startTime,
      };
    }

    // Query with retry
    let result: VirusTotalResult | null = null;
    await retryWithBackoff(
      async () => {
        attempts++;
        result = await queryVirusTotal(fileHash);
        return result;
      },
      `VirusTotal[${fileHash}]`,
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      }
    );

    if (!result) {
      throw new Error('No result from VirusTotal');
    }

    // Cache the result
    await setCached(cacheKey, 'virustotal', result);

    // Log success
    await logAPICall({
      service: 'virustotal',
      endpoint: `/files/${fileHash}`,
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      requestSize: 0,
      responseSize: JSON.stringify(result).length,
      success: true,
      timestamp: new Date(),
      userId,
    });

    retryTracker.recordAttempt(true, attempts);

    return {
      success: true,
      data: result,
      cached: false,
      attempts,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAPICall({
      service: 'virustotal',
      endpoint: `/files/${fileHash}`,
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      requestSize: 0,
      responseSize: 0,
      error: errorMessage,
      success: false,
      timestamp: new Date(),
      userId,
    });

    retryTracker.recordAttempt(false, attempts);

    return {
      success: false,
      error: errorMessage,
      cached: false,
      attempts,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Batch query VirusTotal for multiple hashes
 */
export async function batchQueryVirusTotal(
  hashes: string[],
  userId?: string
): Promise<
  Array<{
    hash: string;
    success: boolean;
    data?: VirusTotalResult;
    error?: string;
    cached: boolean;
    responseTime: number;
  }>
> {
  const results = [];

  for (const hash of hashes) {
    const result = await queryVirusTotalIntegrated(hash, userId);
    results.push({
      hash,
      success: result.success,
      data: result.data,
      error: result.error,
      cached: result.cached,
      responseTime: result.responseTime,
    });

    // Add small delay between requests to avoid rate limiting
    if (hashes.indexOf(hash) < hashes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Get retry statistics
 */
export function getRetryStats() {
  return retryTracker.getStats();
}
