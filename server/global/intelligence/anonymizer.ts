import { createHash } from "crypto";

export type AnonymizedSignalType = "ip" | "domain" | "url" | "hash" | "email" | "unknown";

const salt = process.env.GLOBAL_THREAT_HASH_SALT || "shield-security-global-threat-network";

function sha256(value: string): string {
  return createHash("sha256").update(salt + ":" + value.toLowerCase().trim()).digest("hex");
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol + "//" + url.hostname;
  } catch {
    return value.split(/[?#]/)[0];
  }
}

export function anonymizeTenantId(tenantId: string): string {
  return "tenant_" + sha256(tenantId).slice(0, 16);
}

export function anonymizeThreatValue(value: string, type: AnonymizedSignalType = "unknown"): string {
  if (type === "url") return "url:" + sha256(normalizeUrl(value));
  if (type === "domain") {
    const prefix = value.split(".")[0]?.slice(0, 3).replace(/[^a-z0-9]/gi, "x").toLowerCase() || "dom";
    return "domain:" + prefix + ":" + sha256(value).slice(0, 32);
  }
  if (type === "ip") return "ip:" + sha256(value);
  if (type === "email") return "email:" + sha256(value);
  if (type === "hash") return "hash:" + sha256(value);
  return "ioc:" + sha256(value);
}

export function anonymizePattern(value: string): string {
  return "pattern:" + sha256(value).slice(0, 32);
}
