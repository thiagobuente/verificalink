export interface TenantThreatSharingSettings {
  tenantId: string;
  enabled: boolean;
  iocSharing: boolean;
  campaignSharing: boolean;
  behavioralPatterns: boolean;
}

const settings = new Map<string, TenantThreatSharingSettings>();

function settingsFromEnv(tenantId: string): TenantThreatSharingSettings | undefined {
  try {
    const raw = process.env.TENANT_THREAT_SHARING_SETTINGS;
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as TenantThreatSharingSettings[];
    return parsed.find((item) => item.tenantId === tenantId);
  } catch {
    return undefined;
  }
}

export function getThreatSharingSettings(tenantId: string): TenantThreatSharingSettings {
  return settings.get(tenantId) ?? settingsFromEnv(tenantId) ?? {
    tenantId,
    enabled: false,
    iocSharing: false,
    campaignSharing: false,
    behavioralPatterns: false,
  };
}

export function setThreatSharingSettings(next: TenantThreatSharingSettings): TenantThreatSharingSettings {
  settings.set(next.tenantId, next);
  return next;
}

export function canShareThreatSignal(tenantId: string, signalType: "ioc" | "campaign" | "attack_pattern"): boolean {
  const setting = getThreatSharingSettings(tenantId);
  if (!setting.enabled) return false;
  if (signalType === "ioc") return setting.iocSharing;
  if (signalType === "campaign") return setting.campaignSharing;
  return setting.behavioralPatterns;
}
