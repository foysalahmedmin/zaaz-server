import { LRUCache } from 'lru-cache';
import config from '../../config';
import { cacheClient } from '../../redis';
import {
  creditsCacheHits,
  creditsCacheMisses,
} from './credits-process.metrics';

/**
 * Multi-Level Cache for Credits Processing
 * L1: In-memory LRU cache (fastest, single instance)
 * L2: Redis cache (shared across instances, when available)
 */
class CreditsProcessCache {
  // L1: In-memory cache (fastest, 1000 items)
  private l1Cache = new LRUCache<string, any>({ max: 1000, ttl: 60000 });

  // L2: Redis cache (shared, 10000 items) - optional
  private l2CacheKey = 'credits_cache';

  /**
   * Get value from cache (L1 first, then L2)
   */
  async get(key: string): Promise<any> {
    // Try L1 first (always available)
    let value = this.l1Cache.get(key);
    if (value) {
      console.log(`[Cache] L1 HIT: ${key}`);
      creditsCacheHits.inc({ cache_type: 'l1' });
      return value;
    }

    // Try L2 (Redis) if enabled
    if (config.redis_enabled && cacheClient) {
      try {
        const redisValue = await cacheClient.hGet(this.l2CacheKey, key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          // Warm L1 cache
          this.l1Cache.set(key, parsed);
          console.log(`[Cache] L2 HIT: ${key}`);
          creditsCacheHits.inc({ cache_type: 'l2' });
          return parsed;
        }
      } catch (error) {
        console.warn('[Cache] Redis read failed, using L1 only:', error);
      }
    }

    console.log(`[Cache] MISS: ${key}`);
    creditsCacheMisses.inc({ cache_type: 'all' });
    return null;
  }

  /**
   * Set value in cache (both L1 and L2)
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Always set L1 (in-memory)
    this.l1Cache.set(key, value);

    // Set L2 (Redis) if enabled
    if (config.redis_enabled && cacheClient) {
      try {
        await cacheClient.hSet(this.l2CacheKey, key, JSON.stringify(value));
        await cacheClient.expire(this.l2CacheKey, ttl);
        console.log(`[Cache] SET (L1+L2): ${key}`);
      } catch (error) {
        console.warn(
          '[Cache] Redis write failed, L1 cache still active:',
          error,
        );
      }
    } else {
      console.log(`[Cache] SET (L1 only): ${key}`);
    }
  }

  /**
   * Delete value from cache (both L1 and L2)
   */
  async delete(key: string): Promise<void> {
    this.l1Cache.delete(key);

    if (config.redis_enabled && cacheClient) {
      try {
        await cacheClient.hDel(this.l2CacheKey, key);
        console.log(`[Cache] DELETE (L1+L2): ${key}`);
      } catch (error) {
        console.warn('[Cache] Redis delete failed:', error);
      }
    } else {
      console.log(`[Cache] DELETE (L1 only): ${key}`);
    }
  }

  /**
   * Clear all cache (both L1 and L2)
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();

    if (config.redis_enabled && cacheClient) {
      try {
        await cacheClient.del(this.l2CacheKey);
        console.log('[Cache] CLEAR (L1+L2)');
      } catch (error) {
        console.warn('[Cache] Redis clear failed:', error);
      }
    } else {
      console.log('[Cache] CLEAR (L1 only)');
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      l1Size: this.l1Cache.size,
      l1Max: this.l1Cache.max,
      redisEnabled: config.redis_enabled && !!cacheClient,
    };
  }
}

export const creditsCache = new CreditsProcessCache();
