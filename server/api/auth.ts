/**
 * API Authentication & Rate Limiting
 * Gerencia chaves de API e proteção contra abuso
 */

import { z } from 'zod';

// Tipos de plano
export type PlanType = 'free' | 'pro' | 'enterprise';

// Limites por plano
export const RATE_LIMITS: Record<PlanType, { requestsPerDay: number; requestsPerMinute: number }> = {
  free: { requestsPerDay: 100, requestsPerMinute: 5 },
  pro: { requestsPerDay: 10000, requestsPerMinute: 100 },
  enterprise: { requestsPerDay: -1, requestsPerMinute: -1 }, // Unlimited
};

// Schema de chave de API
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(32),
  name: z.string(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  userId: z.string(),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
  isActive: z.boolean(),
  requestCount: z.number().default(0),
  lastUsedAt: z.date().nullable(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// Schema de uso de API
export const ApiUsageSchema = z.object({
  id: z.string().uuid(),
  apiKeyId: z.string(),
  endpoint: z.string(),
  method: z.string(),
  statusCode: z.number(),
  responseTime: z.number(),
  timestamp: z.date(),
  ipAddress: z.string(),
});

export type ApiUsage = z.infer<typeof ApiUsageSchema>;

/**
 * Gerar nova chave de API
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'vl_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Hash de chave de API (para armazenamento seguro)
 */
export async function hashApiKey(key: string): Promise<string> {
  // Usar crypto nativo do Node.js
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validar chave de API
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  // TODO: Implementar busca em banco de dados
  // Por enquanto, retornar null (implementar com banco de dados real)
  return null;
}

/**
 * Verificar rate limit
 */
export async function checkRateLimit(
  apiKeyId: string,
  plan: PlanType,
  ipAddress: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  const limits = RATE_LIMITS[plan];

  // TODO: Implementar verificação real de rate limit com Redis ou banco de dados
  // Por enquanto, sempre permitir

  return {
    allowed: true,
    remaining: limits.requestsPerDay,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

/**
 * Registrar uso de API
 */
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  ipAddress: string
): Promise<void> {
  // TODO: Implementar logging real em banco de dados
  console.log(`[API] ${method} ${endpoint} - Status: ${statusCode} - Time: ${responseTime}ms`);
}

/**
 * Middleware de autenticação de API
 */
export async function authenticateApiKey(
  authHeader: string | undefined
): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { valid: false, error: 'Invalid Authorization header format' };
  }

  const key = parts[1];
  const apiKey = await validateApiKey(key);

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  return { valid: true, apiKey };
}
