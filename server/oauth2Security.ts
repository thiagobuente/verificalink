import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * OAuth2 & Security Module
 * Implementa autenticação OAuth2, JWT, e proteção de API
 */

// ============================================================================
// 1. JWT TOKEN MANAGEMENT
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}

export class JWTManager {
  private secret: string;
  private algorithm = 'HS256';

  constructor(secret: string) {
    this.secret = secret;
  }

  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = 3600): string {
    const header = {
      alg: this.algorithm,
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');

      // Verificar assinatura
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

      // Verificar expiração
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  refreshToken(token: string, expiresIn: number = 3600): string | null {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    const { userId, email, tier } = payload;
    return this.generateToken({ userId, email, tier }, expiresIn);
  }
}

// ============================================================================
// 2. OAUTH2 PROVIDER INTEGRATION
// ============================================================================

export interface OAuth2Provider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
}

export interface OAuth2User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

export class OAuth2Manager {
  private providers: Map<string, OAuth2Provider> = new Map();

  registerProvider(provider: OAuth2Provider): void {
    this.providers.set(provider.name, provider);
  }

  getAuthorizationUrl(providerName: string, state: string): string | null {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state,
    });

    return `${provider.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForToken(
    providerName: string,
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number } | null> {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    try {
      // Em produção, fazer requisição HTTP real
      // Aqui apenas simulamos a resposta
      return {
        accessToken: `access_token_${Date.now()}`,
        refreshToken: `refresh_token_${Date.now()}`,
        expiresIn: 3600,
      };
    } catch (error) {
      return null;
    }
  }

  async getUserInfo(
    providerName: string,
    accessToken: string
  ): Promise<OAuth2User | null> {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    try {
      // Em produção, fazer requisição HTTP real
      // Aqui apenas simulamos a resposta
      return {
        id: `user_${Date.now()}`,
        email: 'user@example.com',
        name: 'User Name',
        provider: providerName,
      };
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// 3. IP WHITELIST/BLACKLIST
// ============================================================================

export class IPFilter {
  private whitelist: Set<string> = new Set();
  private blacklist: Set<string> = new Set();

  addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
  }

  removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip);
  }

  addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
  }

  removeFromBlacklist(ip: string): void {
    this.blacklist.delete(ip);
  }

  isAllowed(ip: string): boolean {
    if (this.blacklist.has(ip)) return false;
    if (this.whitelist.size > 0) return this.whitelist.has(ip);
    return true;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      if (!this.isAllowed(ip)) {
        return res.status(403).json({
          error: 'Access Denied',
          message: 'Your IP address is not allowed to access this resource',
        });
      }

      next();
    };
  }
}

// ============================================================================
// 4. AUTHENTICATION MIDDLEWARE
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  apiKey?: string;
}

export function authenticationMiddleware(jwtManager: JWTManager) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const apiKeyHeader = req.headers['x-api-key'] || '';

    // Tentar JWT
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = jwtManager.verifyToken(token);

      if (payload) {
        req.user = payload;
        return next();
      }
    }

    // Tentar API Key
    if (apiKeyHeader) {
      req.apiKey = String(apiKeyHeader);
      return next();
    }

    // Sem autenticação
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authentication credentials',
    });
  };
}

// ============================================================================
// 5. PERMISSION CHECKING
// ============================================================================

export type Permission = 'read' | 'write' | 'delete' | 'admin';

export interface Role {
  name: string;
  permissions: Permission[];
}

export class PermissionManager {
  private roles: Map<string, Role> = new Map();

  defineRole(name: string, permissions: Permission[]): void {
    this.roles.set(name, { name, permissions });
  }

  hasPermission(role: string, permission: Permission): boolean {
    const roleObj = this.roles.get(role);
    if (!roleObj) return false;
    return roleObj.permissions.includes(permission);
  }

  requirePermission(permission: Permission) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Determinar tier como role
      const tier = req.user.tier;
      if (this.hasPermission(tier, permission)) {
        return next();
      }

      res.status(403).json({
        error: 'Forbidden',
        message: `Your tier (${tier}) does not have the required permission: ${permission}`,
      });
    };
  }
}

// ============================================================================
// 6. SECURITY HEADERS
// ============================================================================

export function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    );

    // Strict Transport Security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
  };
}

// ============================================================================
// 7. REQUEST SIGNING & VERIFICATION
// ============================================================================

export class RequestSigner {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(data: any): string {
    const payload = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    return signature;
  }

  verify(data: any, signature: string): boolean {
    const expectedSignature = this.sign(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// ============================================================================
// 8. AUDIT LOGGING
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: number;
  userId?: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  details?: any;
}

export class AuditLogger {
  private logs: AuditLog[] = [];

  log(
    action: string,
    resource: string,
    req: Request,
    status: 'success' | 'failure' = 'success',
    details?: any
  ): void {
    const auditLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: (req as AuthenticatedRequest).user?.userId,
      action,
      resource,
      status,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      details,
    };

    this.logs.push(auditLog);

    // Manter apenas últimos 10000 logs em memória
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }
  }

  getLogs(filter?: { userId?: string; action?: string; status?: string }): AuditLog[] {
    if (!filter) return this.logs;

    return this.logs.filter(log => {
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.action && log.action !== filter.action) return false;
      if (filter.status && log.status !== filter.status) return false;
      return true;
    });
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
