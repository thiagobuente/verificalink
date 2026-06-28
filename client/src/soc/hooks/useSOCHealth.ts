import { useEffect, useState } from "react";

export interface SOCHealthData {
  systemHealthScore?: number;
  pipelineLatency?: Record<string, number>;
  providerStability?: unknown[];
  evolutionStability?: unknown;
  automationSafetyStatus?: unknown;
  commandCenterStatus?: unknown;
}

export function useSOCHealth(refreshMs = 15000) {
  const [data, setData] = useState<SOCHealthData>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/soc/health", { headers: { Accept: "application/json" } });
        const payload = await response.json() as { data?: SOCHealthData };
        if (active) setData(payload.data ?? {});
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, refreshMs);
    return () => { active = false; window.clearInterval(timer); };
  }, [refreshMs]);
  return { data, loading };
}
