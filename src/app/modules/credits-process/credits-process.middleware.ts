import { NextFunction, Request, Response } from 'express';
import { LRUCache } from 'lru-cache';
import {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
} from 'rate-limiter-flexible';
import config from '../../config';
import { cacheClient } from '../../redis';

/**
 * Create rate limiter based on Redis availability
 * Falls back to in-memory limiter when Redis is disabled
 */
const createRateLimiter = () => {
  const options = {
    keyPrefix: 'credits_rl',
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
    blockDuration: 60, // Block for 60 seconds if exceeded
  };

  // Use Redis if enabled
  if (config.redis_enabled && cacheClient) {
    return new RateLimiterRedis({
      storeClient: cacheClient as any,
      ...options,
    });
  }

  // Fallback to in-memory (works only for single instance)
  console.warn(
    '[Rate Limiter] Redis disabled, using in-memory rate limiter (not distributed)',
  );
  return new RateLimiterMemory(options);
};

const rateLimiter = createRateLimiter();

/**
 * Rate limiting middleware for credits processing endpoints
 * Prevents abuse by limiting requests per user
 */
export const creditsRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      return next();
    }

    await rateLimiter.consume(userId.toString());
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Rate Limiter] Error:', error);
      return next();
    }

    // Rate limit exceeded
    const rateLimiterRes = error as RateLimiterRes;
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
    });
  }
};

/**
 * In-memory cache for request deduplication when Redis is disabled
 */
const memoryDedupCache = new LRUCache<string, any>({
  max: 10000,
  ttl: 300000, // 5 minutes
});

/**
 * Request deduplication middleware
 * Prevents duplicate processing of the same request (e.g., network retries)
 * Falls back to in-memory cache when Redis is disabled
 */
export const requestDeduplicator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { usage_key } = req.body;
  const userId = (req as any).user?._id?.toString();
  const user_id = userId; // for compatibility with variable naming

  if (!usage_key || !user_id) {
    return next(); // Skip deduplication if missing required IDs
  }

  const dedupKey = `credits_dedup:${user_id}:${usage_key}`;

  let existing: any = null;

  // Try Redis first if enabled
  if (config.redis_enabled && cacheClient) {
    try {
      existing = await cacheClient.get(dedupKey);
      if (existing) {
        console.log(`[Deduplicator] Returning cached response for ${dedupKey}`);
        return res.status(200).json(JSON.parse(existing));
      }

      // Store request marker
      await cacheClient.setEx(
        dedupKey,
        300,
        JSON.stringify({ processing: true }),
      );
    } catch (error) {
      console.warn(
        '[Deduplicator] Redis error, falling back to memory:',
        error,
      );
      // Fall through to memory cache
    }
  }

  // Fallback to in-memory cache
  if (!existing) {
    existing = memoryDedupCache.get(dedupKey);
    if (existing) {
      console.log(
        `[Deduplicator] Returning cached response from memory for ${dedupKey}`,
      );
      return res.status(200).json(existing);
    }
    memoryDedupCache.set(dedupKey, { processing: true });
  }

  // Override res.json to cache response
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    // Only cache successful responses (status < 400)
    if (res.statusCode < 400) {
      if (config.redis_enabled && cacheClient) {
        cacheClient
          .setEx(dedupKey, 300, JSON.stringify(data))
          .catch((err: any) => {
            console.error('[Deduplicator] Redis cache failed:', err);
          });
      }
      memoryDedupCache.set(dedupKey, data);
    } else {
      // Clear the "processing" entry on failure to allow immediate retries
      if (config.redis_enabled && cacheClient) {
        cacheClient.del(dedupKey).catch(() => {});
      }
      memoryDedupCache.delete(dedupKey);
    }
    return originalJson(data);
  };

  next();
};
