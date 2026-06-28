import { createHmac } from "crypto";
import type { RemediationActionRequest } from "../../autonomous/remediation/remediationTypes";

export interface ManusApiResponse {
  ok: boolean;
  status: number;
  executionRef?: string;
  body?: unknown;
  error?: string;
}

const manusBaseUrl = process.env.MANUS_API_URL || "";
const manusApiKey = process.env.MANUS_API_KEY || "";
const manusSecret = process.env.MANUS_API_SECRET || "";
const timeoutMs = Number(process.env.MANUS_API_TIMEOUT_MS || 8000);
const maxRetries = Number(process.env.MANUS_API_RETRIES || 2);

function sign(payload: string): string {
  if (!manusSecret) return "";
  return createHmac("sha256", manusSecret).update(payload).digest("hex");
}

async function withTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class ManusApiAdapter {
  async sendAction(request: RemediationActionRequest): Promise<ManusApiResponse> {
    if (!manusBaseUrl || !manusApiKey) return { ok: true, status: 202, executionRef: "manus-simulated", body: { simulated: true, reason: "MANUS_API_URL or MANUS_API_KEY not configured" } };
    const payload = JSON.stringify({ type: "soar.remediation", request });
    const headers = { "Content-Type": "application/json", Authorization: "Bearer " + manusApiKey, "X-Manus-Signature": sign(payload) };
    let lastError = "Unknown Manus error";
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await withTimeout(manusBaseUrl.replace(/\/$/, "") + "/soar/actions", { method: "POST", headers, body: payload });
        const body = await response.json().catch(() => undefined);
        if (response.ok) return { ok: true, status: response.status, executionRef: typeof body === "object" && body && "executionId" in body ? String((body as { executionId?: string }).executionId) : undefined, body };
        lastError = "Manus returned HTTP " + String(response.status);
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Manus request failed";
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * (2 ** attempt)));
    }
    return { ok: false, status: 0, error: lastError };
  }
}

export const manusApiAdapter = new ManusApiAdapter();
