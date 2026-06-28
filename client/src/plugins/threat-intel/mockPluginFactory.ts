import { correlateIoc } from "@/domain/ioc/correlationEngine";
import type { ThreatIntelPlugin } from "./types";

export function createMockThreatIntelPlugin(id: string, name: string, vendor: string): ThreatIntelPlugin {
  return {
    id,
    name,
    vendor,
    enabled: true,
    async query(ioc: string) {
      return correlateIoc(ioc);
    },
  };
}
