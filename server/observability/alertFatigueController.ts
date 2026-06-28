export interface SOCInternalAlert {
  alertId: string;
  tenantId: string;
  signature: string;
  severity: string;
  message: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

const alerts = new Map<string, SOCInternalAlert>();
const cooldownMs = 10 * 60 * 1000;

export function registerAlert(input: Omit<SOCInternalAlert, "alertId" | "count" | "firstSeen" | "lastSeen">): SOCInternalAlert | undefined {
  const key = input.tenantId + ":" + input.signature;
  const now = Date.now();
  const existing = alerts.get(key);
  if (existing && now - existing.lastSeen < cooldownMs) {
    const merged = { ...existing, count: existing.count + 1, lastSeen: now };
    alerts.set(key, merged);
    return undefined;
  }
  const alert = { ...input, alertId: key, count: 1, firstSeen: now, lastSeen: now };
  alerts.set(key, alert);
  return alert;
}

export function listAlerts(tenantId: string): SOCInternalAlert[] {
  return [...alerts.values()].filter((alert) => alert.tenantId === tenantId).sort((a, b) => b.lastSeen - a.lastSeen);
}
