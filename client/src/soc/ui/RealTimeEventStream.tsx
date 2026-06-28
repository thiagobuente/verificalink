import { Radio } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { useSOCStream } from "../hooks/useSOCStream";

export function RealTimeEventStream() {
  const { events, connected } = useSOCStream(80);
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Radio className="size-4 text-cyan-300" />Real-Time Event Stream</span><Badge tone={connected ? "success" : "neutral"}>{connected ? "live" : "polling"}</Badge></CardTitle></CardHeader>
      <CardContent>
        <div className="max-h-96 space-y-2 overflow-auto pr-1">
          {events.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">Waiting for Command Center events.</div>}
          {events.map((event, index) => <div key={(event.id ?? "event") + String(index)} className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><div className="flex items-center justify-between"><Badge tone="info">{event.type ?? "SOC_EVENT"}</Badge><span className="text-xs text-slate-500">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : "now"}</span></div><p className="mt-2 text-sm text-slate-300">{event.summary ?? JSON.stringify(event.payload ?? {}).slice(0, 140)}</p></div>)}
        </div>
      </CardContent>
    </Card>
  );
}
