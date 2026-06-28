import { useEffect, useState } from "react";
import type { ApiHealthStatus } from "./useLiveSocData";

type ProviderStatus = "online" | "degraded" | "offline" | "unconfigured";

interface ProviderHealthResponseItem {
  id: string;
  name: string;
  status: ProviderStatus;
  latency: number;
  lastQuery?: string;
  errors: number;
  uptime: number;
  responseTime: number;
}

interface ProviderHealthResponse {
  success: boolean;
  data?: ProviderHealthResponseItem[];
}

function toPanelStatus(status: ProviderStatus): ApiHealthStatus["status"] {
  if (status === "online") return "online";
  if (status === "degraded") return "degraded";
  return "offline";
}

function mapHealth(item: ProviderHealthResponseItem): ApiHealthStatus {
  return {
    name: item.name,
    status: toPanelStatus(item.status),
    latency: item.latency,
    uptime: item.uptime,
    responseTime: item.responseTime,
    lastChecked: item.lastQuery ? new Date(item.lastQuery) : new Date(),
  };
}

export function useProviderApiHealth(fallback: ApiHealthStatus[]): ApiHealthStatus[] {
  const [health, setHealth] = useState<ApiHealthStatus[] | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const response = await fetch("/api/providers/health", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Provider health request failed");
        const payload = (await response.json()) as ProviderHealthResponse;
        if (active && payload.success && payload.data) {
          setHealth(payload.data.map(mapHealth));
        }
      } catch {
        if (active) setHealth(null);
      }
    }

    void loadHealth();
    const interval = window.setInterval(loadHealth, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return health && health.length > 0 ? health : fallback;
}
