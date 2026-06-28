import type { IocCorrelationResult } from "@/domain/ioc/types";

export interface ThreatIntelPlugin {
  id: string;
  name: string;
  vendor: string;
  enabled: boolean;
  query: (ioc: string) => Promise<IocCorrelationResult | null>;
}
