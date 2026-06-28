import type { SharedThreatSignal } from "./threatNetwork";

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateGlobalThreatScore(signals: SharedThreatSignal[]): number {
  if (signals.length === 0) return 0;
  const tenants = new Set(signals.map((signal) => signal.sourceTenant)).size;
  const base = signals.reduce((sum, signal) => sum + signal.severity * (signal.confidence / 100), 0) / signals.length;
  const spreadBoost = tenants > 1 ? Math.min(35, tenants * 8) : -10;
  const firstSeen = Math.min(...signals.map((signal) => signal.firstSeen));
  const lastSeen = Math.max(...signals.map((signal) => signal.lastSeen));
  const temporalSpreadHours = Math.max(1, (lastSeen - firstSeen) / (60 * 60 * 1000));
  const temporalBoost = temporalSpreadHours <= 24 && tenants > 1 ? 12 : tenants > 2 ? 8 : 0;
  return clamp(base + spreadBoost + temporalBoost);
}

export function globalSeverityLabel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
