import { useEffect, useState } from "react";

export interface SOCStreamEvent {
  id?: string;
  type?: string;
  timestamp?: number;
  summary?: string;
  payload?: unknown;
}

export function useSOCStream(limit = 100) {
  const [events, setEvents] = useState<SOCStreamEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let closed = false;
    if (typeof EventSource !== "undefined") {
      const source = new EventSource("/api/soc/stream");
      source.onopen = () => setConnected(true);
      source.onmessage = (message) => {
        try {
          const parsed = JSON.parse(message.data) as SOCStreamEvent;
          setEvents((current) => [parsed, ...current].slice(0, limit));
        } catch {
          setEvents((current) => [{ type: "message", summary: message.data, timestamp: Date.now() }, ...current].slice(0, limit));
        }
      };
      source.onerror = () => setConnected(false);
      return () => { closed = true; source.close(); };
    }

    async function poll() {
      if (closed) return;
      const response = await fetch("/api/soc/stream", { headers: { Accept: "application/json" } });
      const payload = await response.json() as { data?: SOCStreamEvent[] };
      if (!closed) setEvents((payload.data ?? []).slice(0, limit));
    }
    void poll();
    const timer = window.setInterval(poll, 5000);
    return () => { closed = true; window.clearInterval(timer); };
  }, [limit]);

  return { events, connected };
}
