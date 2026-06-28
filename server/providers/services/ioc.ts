import type { IocType } from "../interfaces/provider";

export function detectIocType(value: string): IocType {
  const normalized = value.trim();
  if (/^[a-f0-9]{32,64}$/i.test(normalized)) return "hash";
  if (/^https?:\/\//i.test(normalized)) return "url";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "email";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) return "ip";
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return "domain";
  return "unknown";
}

export function normalizeIoc(value: string): string {
  return value.trim();
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function base64Url(value: string): string {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
