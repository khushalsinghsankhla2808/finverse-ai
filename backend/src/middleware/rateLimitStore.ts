/**
 * Custom express-rate-limit Store
 *
 * Uses the app's existing Redis wrapper (src/config/redis.ts) which already
 * includes transparent in-memory fallback when Redis is unavailable.
 * This avoids adding `rate-limit-redis` as a separate dependency.
 */

import type { Store, Options, IncrementResponse } from 'express-rate-limit';
import redis from '../config/redis';

const KEY_PREFIX = 'rl:store:';

export class RedisStore implements Store {
  /** Window duration in milliseconds */
  private windowMs!: number;

  /**
   * Called by express-rate-limit during initialization.
   * Receives the resolved options so we can read windowMs.
   */
  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  /**
   * Increment the hit count for a given key.
   * Returns the current total hits and when the counter resets.
   */
  async increment(key: string): Promise<IncrementResponse> {
    const storeKey = `${KEY_PREFIX}${key}`;
    const ttlSeconds = Math.ceil(this.windowMs / 1000);

    const existing = await redis.get(storeKey);

    if (existing) {
      const data = JSON.parse(existing) as { totalHits: number; resetTime: number };
      data.totalHits += 1;

      // Preserve the original TTL by computing remaining seconds
      const remainingMs = data.resetTime - Date.now();
      const remainingSeconds = Math.max(Math.ceil(remainingMs / 1000), 1);
      await redis.set(storeKey, JSON.stringify(data), 'EX', remainingSeconds);

      return {
        totalHits: data.totalHits,
        resetTime: new Date(data.resetTime),
      };
    }

    // First hit — initialize counter
    const resetTime = Date.now() + this.windowMs;
    const data = { totalHits: 1, resetTime };
    await redis.set(storeKey, JSON.stringify(data), 'EX', ttlSeconds);

    return {
      totalHits: 1,
      resetTime: new Date(resetTime),
    };
  }

  /**
   * Decrement the hit count for a given key (called on successful requests
   * when skipSuccessfulRequests is enabled).
   */
  async decrement(key: string): Promise<void> {
    const storeKey = `${KEY_PREFIX}${key}`;
    const existing = await redis.get(storeKey);

    if (existing) {
      const data = JSON.parse(existing) as { totalHits: number; resetTime: number };
      data.totalHits = Math.max(0, data.totalHits - 1);

      const remainingMs = data.resetTime - Date.now();
      const remainingSeconds = Math.max(Math.ceil(remainingMs / 1000), 1);
      await redis.set(storeKey, JSON.stringify(data), 'EX', remainingSeconds);
    }
  }

  /**
   * Reset the hit count for a given key.
   */
  async resetKey(key: string): Promise<void> {
    const storeKey = `${KEY_PREFIX}${key}`;
    await redis.del(storeKey);
  }
}

export default RedisStore;
