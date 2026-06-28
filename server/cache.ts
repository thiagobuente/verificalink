import Redis from 'ioredis';

// Inicializar Redis com fallback para memória
let redis: Redis | null = null;
const memoryCache = new Map<string, { data: any; expiry: number }>();

export async function initializeCache() {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: false,
      enableOfflineQueue: false,
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
      console.warn('Falling back to memory cache');
      redis = null;
    });

    // Test connection
    await redis.ping();
    console.log('✅ Redis cache initialized');
  } catch (error) {
    console.warn('Redis not available, using memory cache:', error instanceof Error ? error.message : 'Unknown error');
    redis = null;
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
    } else {
      const cached = memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
      }
      memoryCache.delete(key);
    }
  } catch (error) {
    console.warn('Cache get error:', error);
  }
  return null;
}

export async function setCache<T>(key: string, data: T, ttlSeconds: number = 3600): Promise<void> {
  try {
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } else {
      memoryCache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000,
      });
    }
  } catch (error) {
    console.warn('Cache set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.warn('Cache delete error:', error);
  }
}

export async function clearCache(pattern: string = '*'): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      if (pattern === '*') {
        memoryCache.clear();
      } else {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            memoryCache.delete(key);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  size: number;
  keys: string[];
}> {
  try {
    if (redis) {
      const info = await redis.info('memory');
      const keys = await redis.keys('*');
      return {
        type: 'redis',
        size: keys.length,
        keys: keys.slice(0, 100), // Limit to 100 for performance
      };
    } else {
      return {
        type: 'memory',
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys()).slice(0, 100),
      };
    }
  } catch (error) {
    console.warn('Cache stats error:', error);
    return {
      type: 'memory',
      size: 0,
      keys: [],
    };
  }
}

// Cache key generators
export const cacheKeys = {
  dns: (domain: string, selectors: string[]) => `dns:${domain}:${selectors.join(',')}`,
  reputation: (domain: string) => `reputation:${domain}`,
  analysis: (email: string) => `analysis:${email}`,
  virustotal: (domain: string) => `vt:${domain}`,
  comparison: (domains: string[]) => `compare:${domains.sort().join(',')}`,
};

// TTL configurations (in seconds)
export const cacheTTL = {
  dns: 86400, // 24 hours
  reputation: 3600, // 1 hour
  analysis: 604800, // 7 days
  virustotal: 3600, // 1 hour
  comparison: 86400, // 24 hours
};
