import config from '../config';
import { cacheClient } from '../redis';

/**
 * Higher-order function to wrap a function with caching logic.
 * @param key The Redis key to use for caching.
 * @param ttl Time-to-live in seconds.
 * @param fn The function to execute if cache misses.
 */
export const withCache = async <T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> => {
  if (!config.redis_enabled) {
    return await fn();
  }

  try {
    const cachedData = await cacheClient.get(key);
    if (cachedData) {
      console.log(`✅ [Redis Cache] HIT - Key: ${key}`);
      return JSON.parse(cachedData);
    }

    console.log(`❌ [Redis Cache] MISS - Key: ${key}. Fetching from DB...`);
    const result = await fn();
    if (result !== undefined && result !== null) {
      await cacheClient.set(key, JSON.stringify(result), { EX: ttl });
      console.log(`💾 [Redis Cache] SAVED - Key: ${key} (TTL: ${ttl}s)`);
    }
    return result;
  } catch (error) {
    console.warn(`Cache error for key ${key}:`, error);
    return await fn();
  }
};

/**
 * Invalidate a specific cache key or multiple keys.
 * @param keys Key or array of keys to invalidate.
 */
export const invalidateCache = async (keys: string | string[]) => {
  if (!config.redis_enabled) return;

  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length > 0) {
      await cacheClient.del(keysArray);
    }
  } catch (error) {
    console.warn(`Invalidate cache error:`, error);
  }
};

/**
 * Invalidate cache keys matching a pattern.
 * Note: Use with caution as KEYS/SCAN can be expensive on large datasets.
 * @param pattern The pattern to match (e.g., 'package:*')
 */
export const invalidateCacheByPattern = async (pattern: string) => {
  if (!config.redis_enabled) return;

  try {
    // Using SCAN instead of KEYS for better performance and to avoid blocking
    let cursor = '0';
    do {
      const reply = await cacheClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = reply.cursor.toString();
      if (reply.keys.length > 0) {
        await cacheClient.del(reply.keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.warn(`Invalidate pattern cache error:`, error);
  }
};
