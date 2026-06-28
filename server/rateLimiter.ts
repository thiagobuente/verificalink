import Queue, { type Job } from 'bull';
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number; // Time window in ms
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
}

interface QueuedAnalysis {
  id: string;
  type: 'dns' | 'reputation' | 'comparison';
  data: any;
  priority: number; // 1-10, higher = more important
  timestamp: number;
  userId?: string;
  retries: number;
}

class RateLimiter {
  private redis: Redis | null = null;
  private queue: any | null = null;
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  async initialize() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      // Initialize queue
      this.queue = new Queue('analysis', {
        redis: this.redis as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
        },
      });

      // Setup queue processor
      this.queue.process(async (job: any) => {
        return await this.processJob(job);
      });

      this.queue.on('failed', (job: any, err: Error) => {
        console.error(`Job ${job?.id ?? 'unknown'} failed:`, err.message);
      });

      console.log('✅ Rate limiter initialized with Bull queue');
    } catch (error) {
      console.warn('Rate limiter Redis not available:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async checkRateLimit(key: string, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();

    if (this.redis) {
      const redisKey = `ratelimit:${key}`;
      const current = await this.redis.incr(redisKey);

      if (current === 1) {
        await this.redis.pexpire(redisKey, config.windowMs);
      }

      const ttl = await this.redis.pttl(redisKey);
      const resetTime = now + ttl;

      return {
        allowed: current <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - current),
        resetTime,
      };
    } else {
      // Memory-based fallback
      let record = this.requestCounts.get(key);

      if (!record || record.resetTime < now) {
        record = { count: 0, resetTime: now + config.windowMs };
        this.requestCounts.set(key, record);
      }

      record.count++;

      return {
        allowed: record.count <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - record.count),
        resetTime: record.resetTime,
      };
    }
  }

  async queueAnalysis(analysis: Omit<QueuedAnalysis, 'id' | 'timestamp' | 'retries'>) {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.add(
      {
        ...analysis,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        retries: 0,
      },
      {
        priority: analysis.priority,
        delay: analysis.priority < 5 ? 0 : 1000, // Delay low-priority jobs
      }
    );

    return job;
  }

  private async processJob(job: any): Promise<any> {
    const analysis = job.data as QueuedAnalysis;
    console.log(`Processing job ${analysis.id} (${analysis.type})`);

    // Simulate processing - replace with actual analysis logic
    return {
      success: true,
      jobId: analysis.id,
      type: analysis.type,
      processedAt: new Date().toISOString(),
    };
  }

  async getQueueStats() {
    if (!this.queue) {
      return { active: 0, waiting: 0, completed: 0, failed: 0 };
    }

    const counts = await this.queue.getJobCounts();
    return counts;
  }

  async clearQueue() {
    if (this.queue) {
      await this.queue.clean(0, 'completed');
      await this.queue.clean(0, 'failed');
    }
  }
}

export const rateLimiter = new RateLimiter();

// Middleware for Express
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (req: any, res: any, next: any) => {
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip;
    const limit = await rateLimiter.checkRateLimit(key, config);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', limit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());

    if (!limit.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        resetTime: new Date(limit.resetTime).toISOString(),
      });
    }

    next();
  };
}

// Rate limit configurations
export const rateLimitConfigs = {
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  analysis: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
};


export async function checkRateLimit(serviceName: string, userId: string): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const result = await rateLimiter.checkRateLimit(`${serviceName}:${userId}`, rateLimitConfigs.analysis);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfter: Math.max(0, Math.ceil((result.resetTime - Date.now()) / 1000)),
  };
}
