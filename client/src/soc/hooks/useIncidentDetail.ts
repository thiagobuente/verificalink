import { useEffect, useState } from "react";

export function useIncidentDetail(incidentId?: string) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!incidentId) return;
    const resolvedIncidentId = incidentId;
    let active = true;
    setLoading(true);
    async function load() {
      try {
        const response = await fetch("/api/soc/incidents/" + encodeURIComponent(resolvedIncidentId), { headers: { Accept: "application/json" } });
        const payload = await response.json() as { data?: unknown };
        if (active) setData(payload.data ?? null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [incidentId]);
  return { data, loading };
}
