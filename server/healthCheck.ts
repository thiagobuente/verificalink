/**
 * Health Check & Failover Module
 * Monitora saúde dos backends e executa failover automático
 */

import { BackendServer } from './loadBalancer';

// ============================================================================
// 1. HEALTH CHECK TYPES
// ============================================================================

export type HealthCheckType = 'http' | 'tcp' | 'dns' | 'custom';

export interface HealthCheckConfig {
  type: HealthCheckType;
  interval: number;           // ms
  timeout: number;            // ms
  unhealthyThreshold: number; // Falhas consecutivas para marcar como unhealthy
  healthyThreshold: number;   // Sucessos consecutivos para marcar como healthy
  path?: string;              // Para HTTP checks
  expectedStatus?: number;    // Para HTTP checks
  port?: number;              // Para TCP checks
  customCheck?: () => Promise<boolean>;
}

export interface HealthCheckResult {
  serverId: string;
  healthy: boolean;
  responseTime: number;
  timestamp: number;
  error?: string;
}

// ============================================================================
// 2. HEALTH CHECKER
// ============================================================================

export class HealthChecker {
  private servers: Map<string, BackendServer> = new Map();
  private configs: Map<string, HealthCheckConfig> = new Map();
  private failureCounters: Map<string, number> = new Map();
  private successCounters: Map<string, number> = new Map();
  private lastCheckTime: Map<string, number> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private results: HealthCheckResult[] = [];
  private readonly maxResults = 1000;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  registerServer(server: BackendServer, config: HealthCheckConfig): void {
    this.servers.set(server.id, server);
    this.configs.set(server.id, config);
    this.failureCounters.set(server.id, 0);
    this.successCounters.set(server.id, 0);
  }

  startHealthChecks(): void {
    for (const [serverId, config] of this.configs.entries()) {
      const interval = setInterval(() => {
        this.performHealthCheck(serverId);
      }, config.interval);

      this.checkIntervals.set(serverId, interval);
      console.log(`✅ Health check started for server ${serverId}`);
    }
  }

  stopHealthChecks(): void {
    for (const [serverId, interval] of this.checkIntervals.entries()) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
    console.log(`⏹️  All health checks stopped`);
  }

  private async performHealthCheck(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    const config = this.configs.get(serverId);

    if (!server || !config) return;

    const startTime = Date.now();

    try {
      const isHealthy = await this.executeHealthCheck(server, config);
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        this.onHealthCheckSuccess(serverId, responseTime, config);
      } else {
        this.onHealthCheckFailure(serverId, responseTime, config);
      }

      this.recordResult({
        serverId,
        healthy: isHealthy,
        responseTime,
        timestamp: Date.now(),
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.onHealthCheckFailure(serverId, responseTime, config, String(error));

      this.recordResult({
        serverId,
        healthy: false,
        responseTime,
        timestamp: Date.now(),
        error: String(error),
      });
    }

    this.lastCheckTime.set(serverId, Date.now());
  }

  private async executeHealthCheck(
    server: BackendServer,
    config: HealthCheckConfig
  ): Promise<boolean> {
    switch (config.type) {
      case 'http':
        return this.httpHealthCheck(server, config);
      case 'tcp':
        return this.tcpHealthCheck(server, config);
      case 'dns':
        return this.dnsHealthCheck(server, config);
      case 'custom':
        return config.customCheck ? config.customCheck() : true;
      default:
        return true;
    }
  }

  private async httpHealthCheck(
    server: BackendServer,
    config: HealthCheckConfig
  ): Promise<boolean> {
    const url = `http://${server.host}:${server.port}${config.path || '/health'}`;
    const expectedStatus = config.expectedStatus || 200;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      return response.status === expectedStatus;
    } catch (error) {
      return false;
    }
  }

  private async tcpHealthCheck(
    server: BackendServer,
    config: HealthCheckConfig
  ): Promise<boolean> {
    const port = config.port || server.port;

    return new Promise(resolve => {
      const socket = require('net').createConnection(
        { host: server.host, port },
        () => {
          socket.destroy();
          resolve(true);
        }
      );

      socket.setTimeout(config.timeout);
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        resolve(false);
      });
    });
  }

  private async dnsHealthCheck(
    server: BackendServer,
    config: HealthCheckConfig
  ): Promise<boolean> {
    return new Promise(resolve => {
      const dns = require('dns');
      dns.lookup(server.host, (err: any) => {
        resolve(!err);
      });
    });
  }

  private onHealthCheckSuccess(
    serverId: string,
    responseTime: number,
    config: HealthCheckConfig
  ): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    this.failureCounters.set(serverId, 0);
    const successCount = (this.successCounters.get(serverId) || 0) + 1;
    this.successCounters.set(serverId, successCount);

    if (successCount >= config.healthyThreshold && !server.healthy) {
      server.healthy = true;
      this.successCounters.set(serverId, 0);
      console.log(`🟢 Server ${serverId} is now HEALTHY`);
    }
  }

  private onHealthCheckFailure(
    serverId: string,
    responseTime: number,
    config: HealthCheckConfig,
    error?: string
  ): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    this.successCounters.set(serverId, 0);
    const failureCount = (this.failureCounters.get(serverId) || 0) + 1;
    this.failureCounters.set(serverId, failureCount);

    if (failureCount >= config.unhealthyThreshold && server.healthy) {
      server.healthy = false;
      this.failureCounters.set(serverId, 0);
      console.log(`🔴 Server ${serverId} is now UNHEALTHY: ${error}`);
    }
  }

  private recordResult(result: HealthCheckResult): void {
    this.results.push(result);
    if (this.results.length > this.maxResults) {
      this.results = this.results.slice(-this.maxResults);
    }
  }

  getStatus(): {
    name: string;
    servers: Array<{
      id: string;
      healthy: boolean;
      lastCheck?: number;
      failureCount: number;
      successCount: number;
    }>;
  } {
    const servers = Array.from(this.servers.values()).map(server => ({
      id: server.id,
      healthy: server.healthy,
      lastCheck: this.lastCheckTime.get(server.id),
      failureCount: this.failureCounters.get(server.id) || 0,
      successCount: this.successCounters.get(server.id) || 0,
    }));

    return { name: this.name, servers };
  }

  getResults(limit: number = 100): HealthCheckResult[] {
    return this.results.slice(-limit);
  }
}

// ============================================================================
// 3. FAILOVER MANAGER
// ============================================================================

export class FailoverManager {
  private primaryServers: BackendServer[] = [];
  private backupServers: BackendServer[] = [];
  private failoverActive = false;
  private failoverTime?: number;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  setPrimaryServers(servers: BackendServer[]): void {
    this.primaryServers = servers;
  }

  setBackupServers(servers: BackendServer[]): void {
    this.backupServers = servers;
  }

  getActiveServers(): BackendServer[] {
    if (this.failoverActive) {
      return this.backupServers.filter(s => s.healthy);
    }
    return this.primaryServers.filter(s => s.healthy);
  }

  checkAndExecuteFailover(): boolean {
    const primaryHealthy = this.primaryServers.some(s => s.healthy);

    if (!primaryHealthy && !this.failoverActive) {
      this.activateFailover();
      return true;
    }

    if (primaryHealthy && this.failoverActive) {
      this.deactivateFailover();
      return true;
    }

    return false;
  }

  private activateFailover(): void {
    this.failoverActive = true;
    this.failoverTime = Date.now();
    console.log(`🔄 FAILOVER ACTIVATED for ${this.name}`);
    console.log(`   Using backup servers: ${this.backupServers.map(s => s.id).join(', ')}`);
  }

  private deactivateFailover(): void {
    this.failoverActive = false;
    const duration = this.failoverTime ? Date.now() - this.failoverTime : 0;
    console.log(`✅ FAILOVER DEACTIVATED for ${this.name} (duration: ${duration}ms)`);
    this.failoverTime = undefined;
  }

  getStatus(): {
    name: string;
    failoverActive: boolean;
    failoverTime?: number;
    primaryServers: number;
    backupServers: number;
    activeServers: number;
  } {
    return {
      name: this.name,
      failoverActive: this.failoverActive,
      failoverTime: this.failoverTime,
      primaryServers: this.primaryServers.length,
      backupServers: this.backupServers.length,
      activeServers: this.getActiveServers().length,
    };
  }
}

// ============================================================================
// 4. HEALTH CHECK MONITOR
// ============================================================================

export class HealthCheckMonitor {
  private healthCheckers: Map<string, HealthChecker> = new Map();
  private failoverManagers: Map<string, FailoverManager> = new Map();
  private monitorInterval?: NodeJS.Timeout;
  private readonly checkInterval = 5000; // 5 segundos

  registerHealthChecker(name: string, checker: HealthChecker): void {
    this.healthCheckers.set(name, checker);
  }

  registerFailoverManager(name: string, manager: FailoverManager): void {
    this.failoverManagers.set(name, manager);
  }

  startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      for (const [name, manager] of this.failoverManagers.entries()) {
        if (manager.checkAndExecuteFailover()) {
          console.log(`⚠️  Failover status changed for ${name}`);
        }
      }
    }, this.checkInterval);

    console.log(`✅ Health check monitoring started`);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
    console.log(`⏹️  Health check monitoring stopped`);
  }

  getStatus(): {
    healthCheckers: any[];
    failoverManagers: any[];
  } {
    return {
      healthCheckers: Array.from(this.healthCheckers.values()).map(hc => hc.getStatus()),
      failoverManagers: Array.from(this.failoverManagers.values()).map(fm => fm.getStatus()),
    };
  }
}
