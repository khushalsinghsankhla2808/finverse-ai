import Redis from 'ioredis';
import env from './env';

let redisInstance: Redis | null = null;
let useMemoryFallback = false;

try {
  redisInstance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 1) {
        useMemoryFallback = true;
        return null; // Stop retrying
      }
      return 1000;
    },
  });

  redisInstance.on('error', (err) => {
    // Suppress console crash on connection failure
    useMemoryFallback = true;
  });
  
  redisInstance.on('connect', () => {
    useMemoryFallback = false;
    console.log('📡 Redis Client Connected Successfully');
  });
} catch (error) {
  useMemoryFallback = true;
  console.warn('⚠️ Redis Initialization Failed. Falling back to in-memory caching.');
}

// In-memory cache fallback store
const memoryCache = new Map<string, { value: string; expiry: number | null }>();

export const redis = {
  async get(key: string): Promise<string | null> {
    if (redisInstance && !useMemoryFallback) {
      try {
        return await redisInstance.get(key);
      } catch (err) {
        useMemoryFallback = true;
      }
    }
    
    // Memory fallback
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, option?: 'EX', seconds?: number): Promise<'OK' | null> {
    if (redisInstance && !useMemoryFallback) {
      try {
        if (option === 'EX' && seconds) {
          return await redisInstance.set(key, value, 'EX', seconds) as 'OK';
        }
        return await redisInstance.set(key, value) as 'OK';
      } catch (err) {
        useMemoryFallback = true;
      }
    }

    // Memory fallback
    const expiry = option === 'EX' && seconds ? Date.now() + seconds * 1000 : null;
    memoryCache.set(key, { value, expiry });
    return 'OK';
  },

  async del(key: string): Promise<number> {
    if (redisInstance && !useMemoryFallback) {
      try {
        return await redisInstance.del(key);
      } catch (err) {
        useMemoryFallback = true;
      }
    }

    // Memory fallback
    const existed = memoryCache.has(key);
    memoryCache.delete(key);
    return existed ? 1 : 0;
  },

  async keys(pattern: string): Promise<string[]> {
    if (redisInstance && !useMemoryFallback) {
      try {
        return await redisInstance.keys(pattern);
      } catch (err) {
        useMemoryFallback = true;
      }
    }

    // Basic pattern conversion (* to regex)
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    
    for (const [key, item] of memoryCache.entries()) {
      if (item.expiry && item.expiry < Date.now()) {
        memoryCache.delete(key);
        continue;
      }
      if (regexPattern.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }
};

export default redis;
