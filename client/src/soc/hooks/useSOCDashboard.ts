import { useEffect, useState } from "react";

export interface SOCDashboardData {
  incidents: unknown[];
  campaigns: unknown[];
  alerts: unknown[];
  health?: unknown;
  automationStatus?: unknown;
  evolutionStatus?: unknown;
  timeline?: unknown[];
  commandCenter?: unknown;
}

const fallback: SOCDashboardData = { incidents: [], campaigns: [], alerts: [], timeline: [] };

export function useSOCDashboard(refreshMs = 10000) {
  const [data, setData] = useState<SOCDashboardData>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/soc/dashboard", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("SOC dashboard unavailable");
        const payload = await response.json() as { success?: boolean; data?: SOCDashboardData };
        if (active) setData(payload.data ?? fallback);
        if (active) setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "SOC dashboard unavailable");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, refreshMs);
    return () => { active = false; window.clearInterval(timer); };
  }, [refreshMs]);

  return { data, loading, error };
}
