import { socCommandCenter } from "../command-center/socCommandCenter";
import { getStabilityMode } from "../command-center/stabilityModeController";
import { socTimelineEngine } from "../command-center/timeline/socTimelineEngine";
import { limitedResponseEngine, socEvolutionEngine, threatNetwork, defenseCoordinator, socWarGameEngine } from "../global";
import { calculateSOCHealthScore } from "../health/socHealthScoreEngine";
import { socObservabilityCore } from "../observability/socObservabilityCore";
import { listAlerts } from "../observability/alertFatigueController";
import { socSLAEngine } from "../observability/socSLAEngine";
import { iocAggregator, incidentStore, getSOCMetrics } from "../providers";
import { triggerSOCRecovery } from "../recovery/socAutoRecoveryEngine";
import { socSelfHealingEngine } from "../autonomous";

interface HealthDashboard {
  systemHealthScore: number;
  pipelineLatency: Record<string, number>;
  providerStability: unknown[];
  evolutionStability: unknown;
  automationSafetyStatus: unknown;
  commandCenterStatus: { mode: string; lagMs: number; alerts: unknown[] };
  sloAlerts: unknown[];
}

function avgMetric(snapshot: ReturnType<typeof socObservabilityCore.snapshot>, metricName: string): number {
  const metric = snapshot.metrics.histograms.find((item) => item.metricKey.startsWith(metricName + ":"));
  return metric?.avg ?? 0;
}

function providerFailureRate(providers: Array<{ status?: string; errors?: number }>): number {
  if (providers.length === 0) return 0;
  const failures = providers.filter((provider) => provider.status === "failed" || (provider.errors ?? 0) > 0).length;
  return failures / providers.length;
}

export class SOCGateway {
  dashboard(tenantId: string) {
    const incidents = incidentStore.summarize(tenantId, 1000);
    const commandCenter = socCommandCenter.feed(tenantId) as { alerts?: unknown[]; events?: unknown[]; systemHealth?: unknown };
    return {
      incidents: incidents.slice(0, 100),
      campaigns: threatNetwork.getFeed().campaigns,
      alerts: [...(commandCenter.alerts ?? []), ...listAlerts(tenantId)],
      health: this.healthDashboard(tenantId),
      automationStatus: limitedResponseEngine.status(tenantId),
      evolutionStatus: socEvolutionEngine.evaluate(),
      timeline: socTimelineEngine.buildMany(incidents, 250),
      commandCenter,
    };
  }

  healthDashboard(tenantId: string): HealthDashboard {
    const providers = iocAggregator.getHealth();
    const metrics = getSOCMetrics();
    const observability = socObservabilityCore.snapshot();
    const pipelineLatency = {
      iocPipelineMs: avgMetric(observability, "ioc_response_ms"),
      providerResponseMs: avgMetric(observability, "provider_response_time_ms"),
      correlationMs: avgMetric(observability, "correlation_ms") || metrics.averageCorrelationLatencyMs,
      incidentCreationMs: avgMetric(observability, "incident_creation_ms"),
      commandCenterLagMs: avgMetric(observability, "command_center_lag_ms"),
      automationExecutionMs: avgMetric(observability, "automation_execution_time_ms"),
    };
    const healthScore = calculateSOCHealthScore({
      latencyMs: Math.max(pipelineLatency.iocPipelineMs, pipelineLatency.correlationMs, pipelineLatency.commandCenterLagMs),
      failureRate: Math.max(providerFailureRate(providers), metrics.providerFailureRate),
      driftStable: getStabilityMode() !== "recovery",
      automationSafe: true,
      incidentAccuracy: 0.9,
    });
    const sloAlerts = [
      socSLAEngine.evaluate(tenantId, "ioc_response_ms", pipelineLatency.iocPipelineMs),
      socSLAEngine.evaluate(tenantId, "correlation_ms", pipelineLatency.correlationMs),
      socSLAEngine.evaluate(tenantId, "incident_creation_ms", pipelineLatency.incidentCreationMs),
      socSLAEngine.evaluate(tenantId, "command_center_lag_ms", pipelineLatency.commandCenterLagMs),
    ].filter(Boolean);
    return {
      systemHealthScore: healthScore,
      pipelineLatency,
      providerStability: providers.map((provider) => ({ id: provider.id, name: provider.name, status: provider.status, latency: provider.latency, errors: provider.errors })),
      evolutionStability: socEvolutionEngine.evaluate(),
      automationSafetyStatus: limitedResponseEngine.status(tenantId),
      commandCenterStatus: { mode: getStabilityMode(), lagMs: pipelineLatency.commandCenterLagMs, alerts: listAlerts(tenantId) },
      sloAlerts,
    };
  }

  systemSnapshot(tenantId: string) {
    const health = this.healthDashboard(tenantId);
    const recovery = health.systemHealthScore < 50 ? triggerSOCRecovery({ commandCenterDegraded: true }) : undefined;
    return {
      healthScore: health.systemHealthScore,
      incidents: incidentStore.summarize(tenantId, 1000).slice(0, 100),
      driftStatus: getStabilityMode(),
      evolutionState: socEvolutionEngine.evaluate(),
      providerHealth: iocAggregator.getHealth(),
      automationState: limitedResponseEngine.status(tenantId),
      defense: defenseCoordinator.buildFeed(),
      wargame: socWarGameEngine.snapshot(tenantId),
      observability: socObservabilityCore.snapshot(),
      recovery,
      selfHealing: socSelfHealingEngine.status(),
    };
  }
}

export const socGateway = new SOCGateway();
