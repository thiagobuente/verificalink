/**
 * Load Balancer Module
 * Implementa algoritmos de balanceamento de carga para distribuição inteligente
 */

// ============================================================================
// 1. BACKEND SERVER DEFINITION
// ============================================================================

export interface BackendServer {
  id: string;
  host: string;
  port: number;
  weight: number;
  healthy: boolean;
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastHealthCheckTime?: number;
}

export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
}

// ============================================================================
// 2. LOAD BALANCER ALGORITHMS
// ============================================================================

export class LoadBalancer {
  private servers: Map<string, BackendServer> = new Map();
  private currentIndex = 0;
  private config: LoadBalancerConfig;
  private readonly name: string;

  constructor(name: string, config: Partial<LoadBalancerConfig> = {}) {
    this.name = name;
    this.config = {
      algorithm: 'round-robin',
      healthCheckInterval: 10000,
      healthCheckTimeout: 5000,
      maxRetries: 3,
      ...config,
    };
  }

  addServer(server: BackendServer): void {
    this.servers.set(server.id, server);
  }

  removeServer(serverId: string): void {
    this.servers.delete(serverId);
  }

  getServer(clientIp?: string): BackendServer | null {
    const healthyServers = Array.from(this.servers.values()).filter(s => s.healthy);

    if (healthyServers.length === 0) {
      console.warn(`No healthy servers available for ${this.name}`);
      return null;
    }

    switch (this.config.algorithm) {
      case 'round-robin':
        return this.roundRobin(healthyServers);
      case 'least-connections':
        return this.leastConnections(healthyServers);
      case 'weighted':
        return this.weighted(healthyServers);
      case 'ip-hash':
        return this.ipHash(healthyServers, clientIp);
      case 'random':
        return this.random(healthyServers);
      default:
        return healthyServers[0];
    }
  }

  private roundRobin(servers: BackendServer[]): BackendServer {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex++;
    return server;
  }

  private leastConnections(servers: BackendServer[]): BackendServer {
    return servers.reduce((prev, current) =>
      current.activeConnections < prev.activeConnections ? current : prev
    );
  }

  private weighted(servers: BackendServer[]): BackendServer {
    const totalWeight = servers.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }

    return servers[0];
  }

  private ipHash(servers: BackendServer[], clientIp?: string): BackendServer {
    if (!clientIp) {
      return servers[0];
    }

    // Simples hash do IP
    const hash = clientIp.split('.').reduce((acc, octet) => {
      return (acc * 256 + parseInt(octet)) % servers.length;
    }, 0);

    return servers[Math.abs(hash) % servers.length];
  }

  private random(servers: BackendServer[]): BackendServer {
    return servers[Math.floor(Math.random() * servers.length)];
  }

  recordRequest(serverId: string, responseTime: number, success: boolean): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    server.totalRequests++;
    if (!success) {
      server.failedRequests++;
    }

    const alpha = 0.3; // Fator de suavização exponencial
    server.averageResponseTime =
      alpha * responseTime + (1 - alpha) * server.averageResponseTime;
  }

  incrementConnections(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeConnections++;
    }
  }

  decrementConnections(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server && server.activeConnections > 0) {
      server.activeConnections--;
    }
  }

  getServers(): BackendServer[] {
    return Array.from(this.servers.values());
  }

  getHealthyServers(): BackendServer[] {
    return Array.from(this.servers.values()).filter(s => s.healthy);
  }

  getStatus(): {
    name: string;
    algorithm: string;
    totalServers: number;
    healthyServers: number;
    servers: BackendServer[];
  } {
    return {
      name: this.name,
      algorithm: this.config.algorithm,
      totalServers: this.servers.size,
      healthyServers: this.getHealthyServers().length,
      servers: this.getServers(),
    };
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

// ============================================================================
// 3. STICKY SESSIONS
// ============================================================================

export class StickySessionManager {
  private sessionMap: Map<string, string> = new Map(); // sessionId -> serverId
  private readonly maxSessions = 10000;
  private readonly sessionTimeout = 3600000; // 1 hora
  private sessionTimestamps: Map<string, number> = new Map();

  assignServer(sessionId: string, serverId: string): void {
    this.sessionMap.set(sessionId, serverId);
    this.sessionTimestamps.set(sessionId, Date.now());

    // Limpar sessões antigas
    if (this.sessionMap.size > this.maxSessions) {
      this.cleanupOldSessions();
    }
  }

  getServer(sessionId: string): string | null {
    const serverId = this.sessionMap.get(sessionId);

    if (serverId) {
      const timestamp = this.sessionTimestamps.get(sessionId);
      if (timestamp && Date.now() - timestamp > this.sessionTimeout) {
        this.sessionMap.delete(sessionId);
        this.sessionTimestamps.delete(sessionId);
        return null;
      }
    }

    return serverId || null;
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [sessionId, timestamp] of this.sessionTimestamps.entries()) {
      if (now - timestamp > this.sessionTimeout) {
        toDelete.push(sessionId);
      }
    }

    for (const sessionId of toDelete) {
      this.sessionMap.delete(sessionId);
      this.sessionTimestamps.delete(sessionId);
    }
  }

  getStatus(): {
    activeSessions: number;
    maxSessions: number;
  } {
    return {
      activeSessions: this.sessionMap.size,
      maxSessions: this.maxSessions,
    };
  }
}

// ============================================================================
// 4. CONSISTENT HASHING
// ============================================================================

export class ConsistentHash {
  private ring: Map<number, BackendServer> = new Map();
  private virtualNodes = 150;
  private readonly name: string;

  constructor(name: string, virtualNodes: number = 150) {
    this.name = name;
    this.virtualNodes = virtualNodes;
  }

  addServer(server: BackendServer): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${server.id}:${i}`);
      this.ring.set(hash, server);
    }
  }

  removeServer(serverId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${serverId}:${i}`);
      this.ring.delete(hash);
    }
  }

  getServer(key: string): BackendServer | null {
    if (this.ring.size === 0) {
      return null;
    }

    const hash = this.hash(key);
    const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);

    for (const ringHash of sortedHashes) {
      if (ringHash >= hash) {
        return this.ring.get(ringHash) || null;
      }
    }

    // Voltar ao início do anel
    return this.ring.get(sortedHashes[0]) || null;
  }

  private hash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Converter para 32-bit integer
    }
    return Math.abs(hash);
  }

  getStatus(): {
    name: string;
    serversInRing: number;
    virtualNodes: number;
  } {
    const uniqueServers = new Set(this.ring.values());
    return {
      name: this.name,
      serversInRing: uniqueServers.size,
      virtualNodes: this.virtualNodes,
    };
  }
}

// ============================================================================
// 5. LOAD BALANCER POOL
// ============================================================================

export class LoadBalancerPool {
  private loadBalancers: Map<string, LoadBalancer> = new Map();
  private stickySessionManagers: Map<string, StickySessionManager> = new Map();
  private consistentHashes: Map<string, ConsistentHash> = new Map();

  createLoadBalancer(name: string, config?: Partial<LoadBalancerConfig>): LoadBalancer {
    const lb = new LoadBalancer(name, config);
    this.loadBalancers.set(name, lb);
    return lb;
  }

  getLoadBalancer(name: string): LoadBalancer | null {
    return this.loadBalancers.get(name) || null;
  }

  createStickySessionManager(name: string): StickySessionManager {
    const ssm = new StickySessionManager();
    this.stickySessionManagers.set(name, ssm);
    return ssm;
  }

  getStickySessionManager(name: string): StickySessionManager | null {
    return this.stickySessionManagers.get(name) || null;
  }

  createConsistentHash(name: string, virtualNodes?: number): ConsistentHash {
    const ch = new ConsistentHash(name, virtualNodes);
    this.consistentHashes.set(name, ch);
    return ch;
  }

  getConsistentHash(name: string): ConsistentHash | null {
    return this.consistentHashes.get(name) || null;
  }

  getStatus(): {
    loadBalancers: any[];
    stickySessions: any[];
    consistentHashes: any[];
  } {
    return {
      loadBalancers: Array.from(this.loadBalancers.values()).map(lb => lb.getStatus()),
      stickySessions: Array.from(this.stickySessionManagers.values()).map(ssm => ssm.getStatus()),
      consistentHashes: Array.from(this.consistentHashes.values()).map(ch => ch.getStatus()),
    };
  }
}
