import { currentTenantId } from "../../platform/tenant/tenantContext";
import { socAuditLogger } from "../audit/socAuditLogger";
import { correlateIocResult } from "../correlation/correlationEngine";
import { calculateIocScoring } from "../scoring/iocScoringEngine";
import { incidentStore, type StoredIncident } from "../storage/incidentStore";
import { recordReplayRequest } from "../storage/metrics";

export interface IncidentReplayResult {
  tenantId: string;
  incidentId: string;
  replayedAt: number;
  originalVersions: StoredIncident["versions"];
  scoring?: unknown;
  correlation?: unknown;
  intelligence?: unknown;
  warning?: string;
}

const replayTimestamps = new Map<string, number[]>();
const replayWindowMs = 60 * 1000;
const maxReplayPerWindow = Number(process.env.SOC_REPLAY_RATE_LIMIT || 20);

function canReplay(tenantId: string): boolean {
  const now = Date.now();
  const timestamps = replayTimestamps.get(tenantId) ?? [];
  while (timestamps.length > 0 && now - timestamps[0] > replayWindowMs) timestamps.shift();
  if (timestamps.length >= maxReplayPerWindow) return false;
  timestamps.push(now);
  replayTimestamps.set(tenantId, timestamps);
  return true;
}

export class IncidentReplayEngine {
  replay(incidentId: string, tenantId = currentTenantId()): IncidentReplayResult | undefined {
    if (!canReplay(tenantId)) {
      return {
        tenantId,
        incidentId,
        replayedAt: Date.now(),
        originalVersions: { scoringVersion: "unknown", correlationVersion: "unknown", intelligenceVersion: "unknown", narrativeVersion: "unknown" },
        warning: "Replay rate limit reached",
      };
    }
    recordReplayRequest();
    socAuditLogger.log("replay_requested", "Incident replay requested", incidentId, { tenantId });
    const stored = incidentStore.findByIncidentId(incidentId, tenantId);
    if (!stored || stored.tenantId !== tenantId) return undefined;
    const providers = stored.ioc.providers ?? [];
    let scoring: unknown;
    let correlation: unknown;
    try {
      scoring = providers.length > 0 ? calculateIocScoring(providers) : undefined;
    } catch {
      scoring = undefined;
    }
    try {
      correlation = providers.length > 0 ? correlateIocResult({
        ioc: stored.ioc.value,
        iocType: stored.ioc.type,
        riskScore: stored.ioc.riskScore,
        malicious: stored.ioc.malicious,
        tags: stored.ioc.tags ?? [],
        categories: stored.ioc.categories ?? [],
        references: [],
        timeline: stored.ioc.timeline ?? [],
        providers,
        ...(scoring && typeof scoring === "object" ? scoring as Record<string, unknown> : {}),
      }) : undefined;
    } catch {
      correlation = undefined;
    }
    return {
      tenantId,
      incidentId,
      replayedAt: Date.now(),
      originalVersions: stored.versions,
      scoring,
      correlation,
      intelligence: stored.attackIntelligence ? {
        incidentId,
        summary: stored.attackIntelligence.summary,
        confidence: stored.attackIntelligence.confidence,
        replayNote: "Intelligence replay is simulated from tenant-scoped stored insights.",
      } : undefined,
    };
  }
}

export const incidentReplayEngine = new IncidentReplayEngine();
