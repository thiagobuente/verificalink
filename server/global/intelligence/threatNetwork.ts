import type { StoredIncident } from "../../providers/storage/incidentStore";
import { anonymizeTenantId, anonymizeThreatValue, type AnonymizedSignalType } from "./anonymizer";
import { buildBroadcastAlerts, type GlobalThreatAlert } from "./broadcastEngine";
import { correlateGlobalThreats, type GlobalCorrelationResult } from "./globalCorrelationEngine";
import { canShareThreatSignal } from "./tenantThreatSharingSettings";

export interface SharedThreatSignal {
  signalId: string;
  type: "ioc" | "campaign" | "attack_pattern";
  hashedValue: string;
  severity: number;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  sourceTenant: string;
}

export interface GlobalThreatFeed {
  campaigns: GlobalCorrelationResult["campaigns"];
  emergingPatterns: GlobalCorrelationResult["emergingPatterns"];
  anonymizedIocs: SharedThreatSignal[];
  attackTrends: string[];
  alerts: GlobalThreatAlert[];
  generatedAt: number;
}

const signals = new Map<string, SharedThreatSignal>();
const signalWindowMs = 60 * 60 * 1000;

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function dedupeKey(signal: SharedThreatSignal): string {
  return [signal.type, signal.hashedValue, Math.floor(signal.firstSeen / signalWindowMs)].join(":");
}

function severityFromIncident(incident: StoredIncident): number {
  return Math.max(Number(incident.scoring?.threatScore ?? 0), Number(incident.correlation?.correlationScore ?? 0), Number(incident.ioc?.riskScore ?? 0));
}

function typeFromIoc(type: string | undefined): AnonymizedSignalType {
  if (type === "ip" || type === "domain" || type === "url" || type === "hash" || type === "email") return type;
  return "unknown";
}

function upsertSignal(signal: SharedThreatSignal): void {
  const key = dedupeKey(signal);
  const existing = signals.get(key);
  if (!existing) {
    signals.set(key, signal);
    return;
  }
  signals.set(key, {
    ...existing,
    severity: Math.max(existing.severity, signal.severity),
    confidence: Math.max(existing.confidence, signal.confidence),
    firstSeen: Math.min(existing.firstSeen, signal.firstSeen),
    lastSeen: Math.max(existing.lastSeen, signal.lastSeen),
  });
}

export class ThreatNetwork {
  publishIncident(incident: StoredIncident): SharedThreatSignal[] {
    const published: SharedThreatSignal[] = [];
    const tenantId = incident.tenantId;
    const sourceTenant = anonymizeTenantId(tenantId);
    const now = Date.now();

    if (canShareThreatSignal(tenantId, "ioc") && incident.ioc?.value) {
      const hashedValue = anonymizeThreatValue(String(incident.ioc.value), typeFromIoc(incident.ioc.type));
      const signal: SharedThreatSignal = {
        signalId: "sig_" + stableHash([sourceTenant, "ioc", hashedValue, String(now)].join("|")),
        type: "ioc",
        hashedValue,
        severity: severityFromIncident(incident),
        confidence: Number(incident.aiOperator?.confidence ?? incident.correlation?.correlationScore ?? 60),
        firstSeen: incident.timestamp,
        lastSeen: now,
        sourceTenant,
      };
      upsertSignal(signal);
      published.push(signal);
    }

    if (canShareThreatSignal(tenantId, "attack_pattern") && incident.attackIntelligence?.attackType) {
      const hashedValue = anonymizeThreatValue(String(incident.attackIntelligence.attackType), "unknown");
      const signal: SharedThreatSignal = {
        signalId: "sig_" + stableHash([sourceTenant, "attack_pattern", hashedValue, String(now)].join("|")),
        type: "attack_pattern",
        hashedValue,
        severity: severityFromIncident(incident),
        confidence: Number(incident.attackIntelligence.confidence ?? 60),
        firstSeen: incident.timestamp,
        lastSeen: now,
        sourceTenant,
      };
      upsertSignal(signal);
      published.push(signal);
    }

    if (canShareThreatSignal(tenantId, "campaign") && incident.orchestration?.length) {
      const hashedValue = anonymizeThreatValue(String(incident.orchestration[0]?.playbook?.id ?? incident.incidentId), "unknown");
      const signal: SharedThreatSignal = {
        signalId: "sig_" + stableHash([sourceTenant, "campaign", hashedValue, String(now)].join("|")),
        type: "campaign",
        hashedValue,
        severity: severityFromIncident(incident),
        confidence: Number(incident.aiOperator?.confidence ?? 70),
        firstSeen: incident.timestamp,
        lastSeen: now,
        sourceTenant,
      };
      upsertSignal(signal);
      published.push(signal);
    }

    return published;
  }

  listSignals(): SharedThreatSignal[] {
    return [...signals.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  }

  getFeed(): GlobalThreatFeed {
    const currentSignals = this.listSignals();
    const correlation = correlateGlobalThreats(currentSignals);
    return {
      campaigns: correlation.campaigns,
      emergingPatterns: correlation.emergingPatterns,
      anonymizedIocs: currentSignals.filter((signal) => signal.type === "ioc").slice(0, 100),
      attackTrends: correlation.largeScaleAttackDetected ? ["global attack campaign detected"] : correlation.emergingPatterns.slice(0, 3).map((pattern) => pattern.summary),
      alerts: buildBroadcastAlerts(correlation.campaigns, currentSignals),
      generatedAt: Date.now(),
    };
  }
}

export const threatNetwork = new ThreatNetwork();
