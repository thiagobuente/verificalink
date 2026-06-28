import { Request, Response, NextFunction } from 'express';

/**
 * API Optimizations Module
 * Implementa melhorias de performance, segurança e escalabilidade
 */

// ============================================================================
// 1. RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  windowMs: number;      // Janela de tempo em ms
  maxRequests: number;   // Máximo de requisições por janela
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      ...config,
      windowMs: config.windowMs ?? 60000,
      maxRequests: config.maxRequests ?? 100,
      keyGenerator: config.keyGenerator ?? ((req) => req.ip || 'unknown'),
    };

    // Limpar store a cada 10 minutos
    setInterval(() => this.cleanup(), 600000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.config.keyGenerator!(req);
      const now = Date.now();

      if (!this.store[key]) {
        this.store[key] = { count: 0, resetTime: now + this.config.windowMs };
      }

      const record = this.store[key];

      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + this.config.windowMs;
      }

      record.count++;

      res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', record.resetTime);

      if (record.count > this.config.maxRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      }

      next();
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }
}

// ============================================================================
// 2. CACHING ESTRATÉGICO
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

export class Cache<T = any> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutos por padrão
    this.defaultTTL = defaultTTL;
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.store.set(key, {
      data: value,
      expiresAt: Date.now() + ttl,
      hits: 0,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getStats() {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.store.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return {
      entries: totalEntries,
      totalHits,
      hitRate: totalEntries > 0 ? (totalHits / totalEntries).toFixed(2) : '0',
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================================================
// 3. COMPRESSÃO & OTIMIZAÇÃO DE RESPOSTA
// ============================================================================

export function compressionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Armazenar método original send
    const originalSend = res.send;

    res.send = function(data: any) {
      // Adicionar headers de cache
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Vary', 'Accept-Encoding');

      // Minificar JSON se for resposta JSON
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }

      // Retornar resposta original
      return originalSend.call(this, data);
    };

    next();
  };
}

// ============================================================================
// 4. CORS POLICY REFINADA
// ============================================================================

interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export function corsMiddleware(config: CORSConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin || '';

    if (config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      res.setHeader('Access-Control-Allow-Credentials', config.credentials.toString());
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };
}

// ============================================================================
// 5. REQUEST BATCHING
// ============================================================================

export interface BatchRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
}

export interface BatchResponse {
  id: string;
  status: number;
  data: any;
  error?: string;
}

export class BatchProcessor {
  async processBatch(requests: BatchRequest[]): Promise<BatchResponse[]> {
    const results: BatchResponse[] = [];

    // Processar requisições em paralelo (máximo 10 simultâneas)
    const chunks = this.chunkArray(requests, 10);

    for (const chunk of chunks) {
      const promises = chunk.map(req => this.processRequest(req));
      const responses = await Promise.all(promises);
      results.push(...responses);
    }

    return results;
  }

  private async processRequest(request: BatchRequest): Promise<BatchResponse> {
    try {
      // Simular processamento de requisição
      // Em produção, isso chamaria os handlers reais
      return {
        id: request.id,
        status: 200,
        data: { processed: true, method: request.method },
      };
    } catch (error) {
      return {
        id: request.id,
        status: 500,
        data: null,
        error: String(error),
      };
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// ============================================================================
// 6. API KEY MANAGEMENT
// ============================================================================

export interface APIKey {
  key: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: number;
  lastUsed?: number;
  rateLimit: number;
  isActive: boolean;
}

export class APIKeyManager {
  private keys: Map<string, APIKey> = new Map();

  generateKey(name: string, tier: 'free' | 'pro' | 'enterprise' = 'free'): APIKey {
    const key = `sk_${tier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rateLimits = {
      free: 100,
      pro: 1000,
      enterprise: 10000,
    };

    const apiKey: APIKey = {
      key,
      name,
      tier,
      createdAt: Date.now(),
      rateLimit: rateLimits[tier],
      isActive: true,
    };

    this.keys.set(key, apiKey);
    return apiKey;
  }

  validateKey(key: string): APIKey | null {
    const apiKey = this.keys.get(key);
    if (!apiKey || !apiKey.isActive) return null;

    apiKey.lastUsed = Date.now();
    return apiKey;
  }

  revokeKey(key: string): boolean {
    const apiKey = this.keys.get(key);
    if (!apiKey) return false;

    apiKey.isActive = false;
    return true;
  }

  rotateKey(oldKey: string, name: string): APIKey | null {
    const apiKey = this.keys.get(oldKey);
    if (!apiKey) return null;

    this.revokeKey(oldKey);
    return this.generateKey(name, apiKey.tier);
  }

  listKeys(): APIKey[] {
    return Array.from(this.keys.values());
  }
}

// ============================================================================
// 7. RESPONSE PAGINATION
// ============================================================================

export interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export function paginate<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResponse<T> {
  const { page = 1, limit = 20 } = options;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total: items.length,
      hasMore: end < items.length,
      nextCursor: end < items.length ? Buffer.from(`${page + 1}`).toString('base64') : undefined,
    },
  };
}

// ============================================================================
// 8. ERROR HANDLING
// ============================================================================

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function errorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  };
}
