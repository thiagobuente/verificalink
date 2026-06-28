import crypto from 'crypto';

interface APIKey {
  id: string;
  key: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  lastUsedAt?: Date;
  active: boolean;
  rateLimit: number; // requests per hour
  requestsUsed: number;
  resetTime: Date;
}

interface APIUser {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  keys: APIKey[];
  createdAt: Date;
  totalRequests: number;
}

class PublicAPIManager {
  private users = new Map<string, APIUser>();
  private keyMap = new Map<string, APIKey>();

  // Rate limits by tier
  private rateLimits = {
    free: 100, // 100 requests/hour
    pro: 1000, // 1000 requests/hour
    enterprise: 10000, // 10000 requests/hour
  };

  createUser(email: string, tier: 'free' | 'pro' | 'enterprise' = 'free'): APIUser {
    const user: APIUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      tier,
      keys: [],
      createdAt: new Date(),
      totalRequests: 0,
    };

    this.users.set(user.id, user);
    return user;
  }

  generateAPIKey(userId: string, name: string): APIKey | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const keyValue = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex');

    const apiKey: APIKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: keyHash,
      name,
      tier: user.tier,
      createdAt: new Date(),
      active: true,
      rateLimit: this.rateLimits[user.tier],
      requestsUsed: 0,
      resetTime: new Date(Date.now() + 3600000), // 1 hour
    };

    user.keys.push(apiKey);
    this.keyMap.set(keyHash, apiKey);

    return { ...apiKey, key: keyValue }; // Return unhashed key only once
  }

  validateAPIKey(keyValue: string): { valid: boolean; key?: APIKey; message: string } {
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex');
    const key = this.keyMap.get(keyHash);

    if (!key) {
      return { valid: false, message: 'Invalid API key' };
    }

    if (!key.active) {
      return { valid: false, message: 'API key is inactive' };
    }

    // Check rate limit
    const now = new Date();
    if (now > key.resetTime) {
      key.requestsUsed = 0;
      key.resetTime = new Date(now.getTime() + 3600000);
    }

    if (key.requestsUsed >= key.rateLimit) {
      return { valid: false, message: 'Rate limit exceeded' };
    }

    return { valid: true, key, message: 'Valid' };
  }

  recordAPIUsage(keyValue: string): boolean {
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex');
    const key = this.keyMap.get(keyHash);

    if (!key) return false;

    key.requestsUsed++;
    key.lastUsedAt = new Date();
    return true;
  }

  getRateLimitStatus(keyValue: string): {
    limit: number;
    used: number;
    remaining: number;
    resetTime: Date;
  } | null {
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex');
    const key = this.keyMap.get(keyHash);

    if (!key) return null;

    return {
      limit: key.rateLimit,
      used: key.requestsUsed,
      remaining: key.rateLimit - key.requestsUsed,
      resetTime: key.resetTime,
    };
  }

  getUser(userId: string): APIUser | null {
    return this.users.get(userId) || null;
  }

  listAPIKeys(userId: string): APIKey[] {
    const user = this.users.get(userId);
    return user ? user.keys : [];
  }

  revokeAPIKey(userId: string, keyId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const keyIndex = user.keys.findIndex(k => k.id === keyId);
    if (keyIndex === -1) return false;

    const key = user.keys[keyIndex];
    key.active = false;
    return true;
  }

  upgradeTier(userId: string, newTier: 'free' | 'pro' | 'enterprise'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.tier = newTier;

    // Update rate limits for all keys
    for (const key of user.keys) {
      key.tier = newTier;
      key.rateLimit = this.rateLimits[newTier];
    }

    return true;
  }

  getUsageStats(userId: string): {
    totalRequests: number;
    keysActive: number;
    tier: string;
    monthlyUsage: number;
  } | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const activeKeys = user.keys.filter(k => k.active).length;

    return {
      totalRequests: user.totalRequests,
      keysActive: activeKeys,
      tier: user.tier,
      monthlyUsage: user.keys.reduce((sum, k) => sum + k.requestsUsed, 0),
    };
  }
}

export const publicAPIManager = new PublicAPIManager();

// Express middleware for API authentication
export function apiKeyMiddleware(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const validation = publicAPIManager.validateAPIKey(apiKey);

  if (!validation.valid) {
    return res.status(401).json({ error: validation.message });
  }

  // Record usage
  publicAPIManager.recordAPIUsage(apiKey);

  // Add rate limit headers
  const rateLimitStatus = publicAPIManager.getRateLimitStatus(apiKey);
  if (rateLimitStatus) {
    res.setHeader('X-RateLimit-Limit', rateLimitStatus.limit);
    res.setHeader('X-RateLimit-Used', rateLimitStatus.used);
    res.setHeader('X-RateLimit-Remaining', rateLimitStatus.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitStatus.resetTime.toISOString());
  }

  req.apiKey = apiKey;
  next();
}

// API Tier pricing
export const tierPricing = {
  free: {
    price: 0,
    requestsPerHour: 100,
    features: ['Basic email analysis', 'DNS checking', 'Limited webhook support'],
  },
  pro: {
    price: 29,
    requestsPerHour: 1000,
    features: ['Advanced analysis', 'Full webhook support', 'Priority support', 'Custom integrations'],
  },
  enterprise: {
    price: 'Custom',
    requestsPerHour: 10000,
    features: ['Unlimited requests', 'Dedicated support', 'Custom SLA', 'On-premise deployment'],
  },
};
