/**
 * API Gateway Module
 * Roteador inteligente com suporte a roteamento dinâmico, rate limiting e transformação de requisições
 */

import { Request, Response, NextFunction } from 'express';
import { LoadBalancer, BackendServer, LoadBalancerPool } from './loadBalancer';
import { CircuitBreaker, ResilienceManager } from './circuitBreaker';

// ============================================================================
// 1. ROUTE DEFINITION
// ============================================================================

export interface RouteRule {
  path: string;
  pattern?: RegExp;
  methods: string[];
  backends: BackendServer[];
  loadBalancingAlgorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
  timeout: number;
  retries: number;
  circuitBreaker: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  transformRequest?: (req: Request) => any;
  transformResponse?: (res: any) => any;
  middlewares?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

export interface GatewayConfig {
  port: number;
  timeout: number;
  maxRetries: number;
  enableCircuitBreaker: boolean;
  enableRateLimit: boolean;
  enableLogging: boolean;
}

// ============================================================================
// 2. INTELLIGENT ROUTER
// ============================================================================

export class IntelligentRouter {
  private routes: RouteRule[] = [];
  private loadBalancerPool: LoadBalancerPool;
  private resilienceManager: ResilienceManager;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
    this.loadBalancerPool = new LoadBalancerPool();
    this.resilienceManager = new ResilienceManager();
  }

  registerRoute(route: RouteRule): void {
    this.routes.push(route);

    // Criar load balancer para esta rota
    const lbName = `${this.name}-${route.path}`;
    const lb = this.loadBalancerPool.createLoadBalancer(lbName, {
      algorithm: route.loadBalancingAlgorithm,
    });

    // Adicionar backends ao load balancer
    for (const backend of route.backends) {
      lb.addServer(backend);
    }

    // Registrar circuit breaker se habilitado
    if (route.circuitBreaker) {
      this.resilienceManager.registerCircuitBreaker(lbName, {
        failureThreshold: 5,
        timeout: 60000,
      });
    }
  }

  findRoute(path: string, method: string): RouteRule | null {
    for (const route of this.routes) {
      const pathMatches = route.pattern ? route.pattern.test(path) : route.path === path;
      const methodMatches = route.methods.includes(method.toUpperCase());

      if (pathMatches && methodMatches) {
        return route;
      }
    }

    return null;
  }

  selectBackend(route: RouteRule, clientIp?: string): BackendServer | null {
    const lbName = `${this.name}-${route.path}`;
    const lb = this.loadBalancerPool.getLoadBalancer(lbName);

    if (!lb) {
      return null;
    }

    return lb.getServer(clientIp);
  }

  getRoutes(): RouteRule[] {
    return this.routes;
  }

  getStatus(): {
    name: string;
    totalRoutes: number;
    loadBalancers: any;
  } {
    return {
      name: this.name,
      totalRoutes: this.routes.length,
      loadBalancers: this.loadBalancerPool.getStatus(),
    };
  }
}

// ============================================================================
// 3. REQUEST TRANSFORMER
// ============================================================================

export class RequestTransformer {
  static addHeaders(req: Request, headers: Record<string, string>): Request {
    for (const [key, value] of Object.entries(headers)) {
      req.headers[key.toLowerCase()] = value;
    }
    return req;
  }

  static removeHeaders(req: Request, headersToRemove: string[]): Request {
    for (const header of headersToRemove) {
      delete req.headers[header.toLowerCase()];
    }
    return req;
  }

  static rewritePath(req: Request, oldPath: string, newPath: string): Request {
    if (req.path.startsWith(oldPath)) {
      req.url = req.url.replace(oldPath, newPath);
    }
    return req;
  }

  static addQueryParams(req: Request, params: Record<string, string>): Request {
    const url = new URL(req.url, `http://${req.hostname}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    req.url = url.pathname + url.search;
    return req;
  }
}

// ============================================================================
// 4. RESPONSE TRANSFORMER
// ============================================================================

export class ResponseTransformer {
  static addHeaders(res: any, headers: Record<string, string>): any {
    for (const [key, value] of Object.entries(headers)) {
      res.headers = res.headers || {};
      res.headers[key.toLowerCase()] = value;
    }
    return res;
  }

  static modifyBody(res: any, transformer: (body: any) => any): any {
    if (res.body) {
      res.body = transformer(res.body);
    }
    return res;
  }

  static addMetadata(res: any, metadata: Record<string, any>): any {
    if (typeof res.body === 'object') {
      res.body._metadata = metadata;
    }
    return res;
  }
}

// ============================================================================
// 5. API GATEWAY
// ============================================================================

export class APIGateway {
  private router: IntelligentRouter;
  private config: GatewayConfig;
  private requestLog: Array<{
    timestamp: number;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    backend?: string;
  }> = [];
  private readonly maxLogs = 10000;

  constructor(name: string, config: Partial<GatewayConfig> = {}) {
    this.router = new IntelligentRouter(name);
    this.config = {
      port: 3000,
      timeout: 30000,
      maxRetries: 3,
      enableCircuitBreaker: true,
      enableRateLimit: true,
      enableLogging: true,
      ...config,
    };
  }

  registerRoute(route: RouteRule): void {
    this.router.registerRoute(route);
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const route = this.router.findRoute(req.path, req.method);

      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      // Aplicar middlewares customizados
      if (route.middlewares) {
        for (const middleware of route.middlewares) {
          await new Promise((resolve, reject) => {
            middleware(req, res, (err?: any) => {
              if (err) reject(err);
              else resolve(null);
            });
          });
        }
      }

      // Transformar requisição
      if (route.transformRequest) {
        req.body = route.transformRequest(req);
      }

      // Selecionar backend
      const backend = this.router.selectBackend(route, req.ip);
      if (!backend) {
        return res.status(503).json({ error: 'No available backends' });
      }

      // Executar com resiliência
      try {
        const lbName = `gateway-${route.path}`;
        const response = await this.router['resilienceManager'].executeWithResilience(
          lbName,
          () => this.forwardRequest(req, backend),
          {
            circuitBreaker: route.circuitBreaker,
            timeout: route.timeout,
            retry: true,
          }
        );

        // Transformar resposta
        let finalResponse = response;
        if (route.transformResponse) {
          finalResponse = route.transformResponse(response);
        }

        const responseTime = Date.now() - startTime;
        this.logRequest(req.method, req.path, response.statusCode || 200, responseTime, backend.id);

        res.status(response.statusCode || 200).json(finalResponse);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.logRequest(req.method, req.path, 500, responseTime, backend.id);

        res.status(500).json({
          error: 'Gateway error',
          message: String(error),
        });
      }
    };
  }

  private async forwardRequest(req: Request, backend: BackendServer): Promise<any> {
    // Simular forward para backend
    // Em produção, usar http.request ou axios
    return {
      statusCode: 200,
      body: { forwarded: true, backend: backend.id },
      headers: {},
    };
  }

  private logRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    backend: string
  ): void {
    if (!this.config.enableLogging) return;

    this.requestLog.push({
      timestamp: Date.now(),
      method,
      path,
      statusCode,
      responseTime,
      backend,
    });

    if (this.requestLog.length > this.maxLogs) {
      this.requestLog = this.requestLog.slice(-this.maxLogs);
    }
  }

  getRequestLog(limit: number = 100): typeof this.requestLog {
    return this.requestLog.slice(-limit);
  }

  getStatus(): {
    router: any;
    config: GatewayConfig;
    requestLogSize: number;
  } {
    return {
      router: this.router.getStatus(),
      config: this.config,
      requestLogSize: this.requestLog.length,
    };
  }

  getMetrics(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    topPaths: Array<{ path: string; count: number }>;
  } {
    const totalRequests = this.requestLog.length;
    const avgResponseTime =
      this.requestLog.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests || 0;
    const errorCount = this.requestLog.filter(log => log.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100 || 0;

    const pathCounts: Record<string, number> = {};
    for (const log of this.requestLog) {
      pathCounts[log.path] = (pathCounts[log.path] || 0) + 1;
    }

    const topPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topPaths,
    };
  }
}

// ============================================================================
// 6. GATEWAY BUILDER (Fluent API)
// ============================================================================

export class GatewayBuilder {
  private gateway: APIGateway;
  private currentRoute: Partial<RouteRule> = {};

  constructor(name: string, config?: Partial<GatewayConfig>) {
    this.gateway = new APIGateway(name, config);
  }

  route(path: string, pattern?: RegExp): this {
    this.currentRoute = { path, pattern, methods: [], backends: [] };
    return this;
  }

  methods(...methods: string[]): this {
    this.currentRoute.methods = methods.map(m => m.toUpperCase());
    return this;
  }

  backends(...backends: BackendServer[]): this {
    this.currentRoute.backends = backends;
    return this;
  }

  loadBalancing(algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random'): this {
    this.currentRoute.loadBalancingAlgorithm = algorithm;
    return this;
  }

  timeout(ms: number): this {
    this.currentRoute.timeout = ms;
    return this;
  }

  retries(count: number): this {
    this.currentRoute.retries = count;
    return this;
  }

  circuitBreaker(enabled: boolean): this {
    this.currentRoute.circuitBreaker = enabled;
    return this;
  }

  rateLimit(maxRequests: number, windowMs: number): this {
    this.currentRoute.rateLimit = { maxRequests, windowMs };
    return this;
  }

  transformRequest(transformer: (req: Request) => any): this {
    this.currentRoute.transformRequest = transformer;
    return this;
  }

  transformResponse(transformer: (res: any) => any): this {
    this.currentRoute.transformResponse = transformer;
    return this;
  }

  register(): this {
    if (this.currentRoute.path && this.currentRoute.methods && this.currentRoute.backends) {
      this.gateway.registerRoute(this.currentRoute as RouteRule);
    }
    this.currentRoute = {};
    return this;
  }

  build(): APIGateway {
    return this.gateway;
  }
}
