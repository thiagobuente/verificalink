import type { IocQuery } from "../../providers/interfaces/provider";
import { recordExternalIngestion } from "../observability/enterpriseMetrics";
import { normalizeExternalEvent, type EnterpriseSecurityEvent } from "../normalizer/globalNormalizer";

export type CloudProvider = "aws" | "azure" | "gcp";

export interface CloudIngestionInput {
  tenantId: string;
  provider: CloudProvider;
  payload: unknown;
  timestamp?: number | string;
  severity?: string | number;
}

export class CloudIngestion {
  normalize(input: CloudIngestionInput): EnterpriseSecurityEvent {
    recordExternalIngestion(input.tenantId);
    const source = input.provider === "aws" ? "aws-cloudwatch" : input.provider === "azure" ? "azure-monitor" : "gcp-security-command-center";
    return normalizeExternalEvent({
      tenantId: input.tenantId,
      source,
      timestamp: input.timestamp,
      payload: input.payload,
      severity: input.severity,
      type: input.provider,
    });
  }

  toIocQuery(event: EnterpriseSecurityEvent): IocQuery {
    return {
      tenantId: event.tenantId,
      value: event.value,
      type: event.value.startsWith("http") ? "url" : event.value.includes(".") ? "domain" : "unknown",
    };
  }
}

export const cloudIngestion = new CloudIngestion();
