import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { currentTenantId } from "../../platform/tenant/tenantContext";
import { recordTenantUsage } from "../../platform/saas/tenantProvisioning";
import { threatNetwork } from "../../global/intelligence/threatNetwork";
import type { AggregatedIocResult } from "../aggregator/iocAggregator";
import { socAuditLogger } from "../audit/socAuditLogger";
import { recordAIOperatorAdjustment, recordActionDistribution, recordCorrelationLatency, recordIncidentStored, recordProviderFailureRate, recordStorageFailure } from "./metrics";

export interface StoredIncident {
  tenantId: string;
  incidentId: string;
  timestamp: number;
  ioc: any;
  scoring: any;
  correlation: any;
  attackIntelligence?: any;
  narrative?: any;
  actions?: any;
  responses?: any;
  orchestration?: any;
  aiOperator?: any;
  versions: {
    scoringVersion: string;
    correlationVersion: string;
    intelligenceVersion: string;
    narrativeVersion: string;
  };
  fingerprint: string;
  compressed?: boolean;
}

const dataDir = process.env.SOC_DATA_DIR || path.resolve(process.cwd(), "data", "soc");
const incidentFile = path.join(dataDir, "incidents.jsonl");
const maxStoredIncidents = Number(process.env.SOC_MAX_STORED_INCIDENTS || 5000);
const compressionTtlMs = Number(process.env.SOC_INCIDENT_COMPRESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const recentIncidents = new Map<string, StoredIncident>();

function ensureDataDir(): void {
  mkdirSync(dataDir, { recursive: true });
}

function stableHash(parts: string[]): string {
  let hash = 2166136261;
  const input = parts.join("|");
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cacheKey(tenantId: string, incidentId: string): string {
  return tenantId + ":" + incidentId;
}

function sanitizeProviders(result: AggregatedIocResult) {
  return result.providers.map((provider) => ({
    providerId: provider.providerId,
    providerName: provider.providerName,
    ioc: provider.ioc,
    iocType: provider.iocType,
    riskScore: provider.riskScore,
    malicious: provider.malicious,
    reputation: provider.reputation,
    confidence: provider.confidence,
    country: provider.country,
    asn: provider.asn,
    tags: provider.tags,
    categories: provider.categories,
    references: provider.references,
    timeline: provider.timeline,
    queriedAt: provider.queriedAt,
  }));
}

function fingerprint(result: AggregatedIocResult): string {
  const cluster = unique([result.ioc, ...(result.correlation?.relatedCluster ?? [])]).map((value) => value.toLowerCase()).sort().join(",");
  const providerSignals = result.providers.map((provider) => provider.providerId + ":" + String(provider.malicious) + ":" + String(provider.riskScore >= 35)).sort().join(",");
  return stableHash([result.tenantId, cluster, providerSignals]);
}

function compressIncident(incident: StoredIncident): StoredIncident {
  if (Date.now() - incident.timestamp < compressionTtlMs) return incident;
  return {
    ...incident,
    ioc: {
      value: incident.ioc.value,
      type: incident.ioc.type,
      reputation: incident.ioc.reputation,
      malicious: incident.ioc.malicious,
      providerCount: incident.ioc.providers?.length ?? incident.ioc.providerCount ?? 0,
    },
    correlation: incident.correlation ? {
      correlationScore: incident.correlation.correlationScore,
      relatedCluster: incident.correlation.relatedCluster,
      correlationExplanation: incident.correlation.correlationExplanation,
    } : undefined,
    compressed: true,
  };
}

function readAll(): StoredIncident[] {
  try {
    if (!existsSync(incidentFile)) return [];
    return readFileSync(incidentFile, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as StoredIncident);
  } catch {
    return [];
  }
}

function rewriteAll(incidents: StoredIncident[]): void {
  ensureDataDir();
  const limited = incidents.slice(-maxStoredIncidents).map(compressIncident);
  writeFileSync(incidentFile, limited.map((incident) => JSON.stringify(incident)).join("\n") + (limited.length ? "\n" : ""), "utf8");
}

function buildStoredIncident(result: AggregatedIocResult): StoredIncident | undefined {
  if (!result.incident) return undefined;
  return {
    tenantId: result.tenantId,
    incidentId: result.incident.id,
    timestamp: Date.now(),
    ioc: {
      tenantId: result.tenantId,
      value: result.ioc,
      type: result.iocType,
      riskScore: result.riskScore,
      malicious: result.malicious,
      reputation: result.reputation,
      confidence: result.confidence,
      tags: result.tags,
      categories: result.categories,
      timeline: result.timeline,
      providers: sanitizeProviders(result),
      failures: result.failures,
      queriedAt: result.queriedAt,
    },
    scoring: { threatScore: result.threatScore, riskLevel: result.riskLevel, explanation: result.explanation },
    correlation: result.correlation,
    attackIntelligence: result.attackIntelligence,
    narrative: result.attackNarrative,
    actions: result.socActions,
    responses: result.socResponses,
    orchestration: result.socOrchestration,
    aiOperator: result.socAIOperator,
    versions: {
      scoringVersion: "ioc-scoring-v1",
      correlationVersion: "ioc-correlation-v1",
      intelligenceVersion: "attack-intelligence-v1",
      narrativeVersion: "attack-narrative-v1",
    },
    fingerprint: fingerprint(result),
  };
}

function mergeStoredIncident(existing: StoredIncident, next: StoredIncident): StoredIncident {
  return {
    ...existing,
    ...next,
    tenantId: existing.tenantId,
    timestamp: Math.max(existing.timestamp, next.timestamp),
    ioc: { ...existing.ioc, ...next.ioc, tenantId: existing.tenantId },
    scoring: { ...existing.scoring, ...next.scoring },
    correlation: next.correlation ?? existing.correlation,
    attackIntelligence: next.attackIntelligence ?? existing.attackIntelligence,
    narrative: next.narrative ?? existing.narrative,
    actions: next.actions ?? existing.actions,
    responses: next.responses ?? existing.responses,
    orchestration: next.orchestration ?? existing.orchestration,
    aiOperator: next.aiOperator ?? existing.aiOperator,
    compressed: false,
  };
}

export class IncidentStore {
  persistResult(result: AggregatedIocResult): StoredIncident | undefined {
    try {
      const next = buildStoredIncident(result);
      if (!next) return undefined;
      const all = readAll();
      const existingIndex = all.findIndex((incident) => incident.tenantId === next.tenantId && (incident.fingerprint === next.fingerprint || incident.incidentId === next.incidentId));
      const stored = existingIndex >= 0 ? mergeStoredIncident(all[existingIndex], next) : next;
      if (existingIndex >= 0) all[existingIndex] = stored;
      else all.push(stored);
      rewriteAll(all);
      recentIncidents.set(cacheKey(stored.tenantId, stored.incidentId), stored);
      recordIncidentStored(stored.tenantId);
      recordTenantUsage(stored.tenantId, { iocProcessed: 1, incidentsGenerated: 1, correlationRuns: result.correlation ? 1 : 0 });
      recordCorrelationLatency(result.correlation ? Math.max(0, Date.parse(result.queriedAt) - Date.parse(result.providers[0]?.queriedAt ?? result.queriedAt)) : 0);
      recordProviderFailureRate(result.failures.length, result.providers.length + result.failures.length);
      recordActionDistribution(stored.tenantId, result.socActions);
      recordAIOperatorAdjustment(stored.tenantId, Boolean(result.socAIOperator && result.socAIOperator.adjustedPriority !== result.riskLevel));
      socAuditLogger.log("incident_created", "Incident output persisted", stored.incidentId, { tenantId: stored.tenantId, fingerprint: stored.fingerprint });
      if (result.threatScore !== undefined) socAuditLogger.log("score_changed", "Scoring output stored", stored.incidentId, { tenantId: stored.tenantId, threatScore: result.threatScore, riskLevel: result.riskLevel });
      if (result.correlation) socAuditLogger.log("correlation_decision", "Correlation decision stored", stored.incidentId, { tenantId: stored.tenantId, correlationScore: result.correlation.correlationScore });
      if (result.socActions?.length) socAuditLogger.log("action_suggested", "SOC actions stored", stored.incidentId, { tenantId: stored.tenantId, count: result.socActions.length });
      if (result.socResponses?.length) socAuditLogger.log("response_generated", "SOC responses stored", stored.incidentId, { tenantId: stored.tenantId, count: result.socResponses.length });
      if (result.socAIOperator) socAuditLogger.log("ai_operator_decision", "AI operator interpretation stored", stored.incidentId, { tenantId: stored.tenantId, adjustedPriority: result.socAIOperator.adjustedPriority });
      threatNetwork.publishIncident(stored);
      return stored;
    } catch (error) {
      recordStorageFailure();
      socAuditLogger.log("storage_failed", "Incident storage failed", result.incident?.id, { tenantId: result.tenantId, error: error instanceof Error ? error.message : String(error) });
      return undefined;
    }
  }

  list(tenantId = currentTenantId(), limit = 1000): StoredIncident[] {
    return readAll().filter((incident) => incident.tenantId === tenantId).slice(-Math.min(limit, 1000)).reverse();
  }

  findByIncidentId(incidentId: string, tenantId = currentTenantId()): StoredIncident | undefined {
    return recentIncidents.get(cacheKey(tenantId, incidentId)) ?? readAll().reverse().find((incident) => incident.tenantId === tenantId && incident.incidentId === incidentId);
  }

  summarize(tenantId = currentTenantId(), limit = 1000) {
    return this.list(tenantId, limit).map((incident) => ({
      tenantId: incident.tenantId,
      incidentId: incident.incidentId,
      timestamp: incident.timestamp,
      ioc: {
        tenantId: incident.tenantId,
        value: incident.ioc.value,
        type: incident.ioc.type,
        riskScore: incident.ioc.riskScore,
        reputation: incident.ioc.reputation,
        malicious: incident.ioc.malicious,
        providerCount: incident.ioc.providers?.length ?? incident.ioc.providerCount ?? 0,
        failureCount: incident.ioc.failures?.length ?? 0,
      },
      scoring: incident.scoring,
      correlation: incident.correlation ? {
        correlationScore: incident.correlation.correlationScore,
        relatedCluster: incident.correlation.relatedCluster,
        correlationExplanation: incident.correlation.correlationExplanation,
      } : undefined,
      attackIntelligence: incident.attackIntelligence,
      narrative: incident.narrative,
      actions: incident.actions,
      responses: incident.responses,
      orchestration: incident.orchestration,
      aiOperator: incident.aiOperator,
      versions: incident.versions,
      compressed: incident.compressed,
    }));
  }
}

export const incidentStore = new IncidentStore();
