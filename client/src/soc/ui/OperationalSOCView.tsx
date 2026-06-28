import { Activity, Bot, Server } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { AlertCenter } from "./AlertCenter";
import { RealTimeEventStream } from "./RealTimeEventStream";
import { normalizeIncidents } from "../utils/socUIDataNormalizer";

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

export function OperationalSOCView({ dashboard }: { dashboard: { incidents?: unknown[]; alerts?: unknown[]; health?: unknown; automationStatus?: unknown } }) {
  const incidents = normalizeIncidents(dashboard.incidents ?? []);
  const health = asRecord(dashboard.health);
  const providers = Array.isArray(health.providerStability) ? health.providerStability.map(asRecord) : [];
  const automation = asRecord(dashboard.automationStatus);
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4 text-cyan-300" />Real-Time Incidents</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Incident</th><th className="p-2">Severity</th><th className="p-2">Confidence</th><th className="p-2">Correlation</th><th className="p-2">Status</th></tr></thead>
                <tbody>{incidents.slice(0, 12).map((incident) => <tr key={incident.id} className="border-t border-slate-800"><td className="p-2 text-slate-200">{incident.title}</td><td className="p-2"><Badge tone={incident.severity === "critical" ? "danger" : incident.severity === "high" ? "warning" : "info"}>{incident.severity}</Badge></td><td className="p-2 text-slate-400">{incident.confidence}%</td><td className="p-2 text-slate-400">{incident.correlationScore ?? 0}</td><td className="p-2 text-slate-400">{incident.status}</td></tr>)}</tbody>
              </table>
              {incidents.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">No active incidents.</div>}
            </div>
          </CardContent>
        </Card>
        <AlertCenter alerts={dashboard.alerts} />
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Server className="size-4 text-emerald-300" />Provider Health</CardTitle></CardHeader>
          <CardContent className="space-y-2">{providers.map((provider) => <div key={String(provider.id)} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3"><span className="text-sm text-slate-200">{String(provider.name ?? provider.id)}</span><Badge tone={String(provider.status) === "healthy" ? "success" : "warning"}>{String(provider.status ?? "unknown")}</Badge></div>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="size-4 text-cyan-300" />Automation Activity</CardTitle></CardHeader>
          <CardContent><div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-md bg-slate-950 p-3"><div className="text-xl text-emerald-300">{Array.isArray(automation.executed) ? automation.executed.length : 0}</div><div className="text-slate-500">executed</div></div><div className="rounded-md bg-slate-950 p-3"><div className="text-xl text-amber-300">{Array.isArray(automation.pending) ? automation.pending.length : 0}</div><div className="text-slate-500">pending</div></div><div className="rounded-md bg-slate-950 p-3"><div className="text-xl text-rose-300">{Array.isArray(automation.blocked) ? automation.blocked.length : 0}</div><div className="text-slate-500">blocked</div></div></div></CardContent>
        </Card>
        <RealTimeEventStream />
      </div>
    </div>
  );
}
