import { Clock3 } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { normalizeTimeline } from "../utils/socUIDataNormalizer";

export function IncidentTimelineView({ timeline }: { timeline?: unknown }) {
  const events = normalizeTimeline(timeline);
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4 text-cyan-300" />Incident Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">No timeline events yet.</div>}
          {events.map((event) => <div key={event.id} className="border-l border-cyan-300/30 pl-4"><div className="rounded-md border border-slate-800 bg-slate-900/60 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone="info">{event.type}</Badge><span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</span></div><p className="mt-2 text-sm text-slate-200">{event.summary}</p><p className="text-xs text-slate-500">{event.source}</p></div></div>)}
        </div>
      </CardContent>
    </Card>
  );
}
