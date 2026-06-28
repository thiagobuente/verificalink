import { Brain, ShieldAlert } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { CorrelationGraph } from "../visualization/CorrelationGraph";
import { IncidentTimelineView } from "./IncidentTimelineView";
import { useIncidentDetail } from "../hooks/useIncidentDetail";

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

export function IncidentDetailView({ incidentId, fallbackIncident }: { incidentId?: string; fallbackIncident?: unknown }) {
  const { data, loading } = useIncidentDetail(incidentId);
  const incident = data ?? fallbackIncident;
  const record = asRecord(incident);
  const intelligence = asRecord(record.attackIntelligence);
  const narrative = asRecord(record.narrative);
  const actions = Array.isArray(record.actions) ? record.actions.map(asRecord) : [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-300" />Incident Drill-Down</CardTitle></CardHeader>
        <CardContent><div className="flex flex-wrap items-center gap-2"><Badge tone="info">{String(record.incidentId ?? incidentId ?? "selected incident")}</Badge>{loading && <Badge tone="neutral">loading</Badge>}</div><p className="mt-3 text-sm text-slate-300">{String(intelligence.summary ?? narrative.summary ?? "Select an incident to inspect timeline, intelligence, actions and evolution changes.")}</p></CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><IncidentTimelineView timeline={record.timeline} /><CorrelationGraph incident={incident} /></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="size-4 text-cyan-300" />Attack Intelligence & SOC Actions</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2"><div className="rounded-md border border-slate-800 bg-slate-950/50 p-3"><div className="text-sm font-semibold text-slate-100">Intelligence</div><p className="mt-2 text-sm text-slate-400">{String(intelligence.attackType ?? narrative.title ?? "Awaiting intelligence data")}</p></div><div className="rounded-md border border-slate-800 bg-slate-950/50 p-3"><div className="text-sm font-semibold text-slate-100">Actions</div><div className="mt-2 flex flex-wrap gap-2">{actions.map((action, index) => <Badge key={index} tone="warning">{String(action.actionType ?? "action")}</Badge>)}{actions.length === 0 && <span className="text-sm text-slate-500">No SOC action generated.</span>}</div></div></CardContent>
      </Card>
    </div>
  );
}
