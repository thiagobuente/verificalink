import { Activity, AlertTriangle, Bot, Gauge, ShieldAlert } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { useSOCDashboard } from "../hooks/useSOCDashboard";
import { normalizeIncidents } from "../utils/socUIDataNormalizer";
import { OperationalSOCView } from "./OperationalSOCView";
import { SOCHealthDashboard } from "./SOCHealthDashboard";
import { AttackMap } from "../visualization/AttackMap";

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

export function SOCDashboard() {
  const { data, loading, error } = useSOCDashboard();
  const incidents = normalizeIncidents(data.incidents);
  const health = asRecord(data.health);
  const score = Number(health.systemHealthScore ?? 0);
  const critical = incidents.filter((incident) => incident.severity === "critical").length;
  const high = incidents.filter((incident) => incident.severity === "high").length;
  const alerts = data.alerts ?? [];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="py-4"><Gauge className="mb-3 size-5 text-cyan-300" /><div className="text-2xl font-semibold text-slate-50">{loading ? "--" : score}</div><div className="text-xs text-slate-500">SOC health score</div></CardContent></Card>
        <Card><CardContent className="py-4"><ShieldAlert className="mb-3 size-5 text-rose-300" /><div className="text-2xl font-semibold text-slate-50">{critical}</div><div className="text-xs text-slate-500">critical incidents</div></CardContent></Card>
        <Card><CardContent className="py-4"><AlertTriangle className="mb-3 size-5 text-amber-300" /><div className="text-2xl font-semibold text-slate-50">{high}</div><div className="text-xs text-slate-500">high risk incidents</div></CardContent></Card>
        <Card><CardContent className="py-4"><Bot className="mb-3 size-5 text-emerald-300" /><div className="text-2xl font-semibold text-slate-50">{alerts.length}</div><div className="text-xs text-slate-500">grouped alerts</div></CardContent></Card>
      </div>
      {error && <Card><CardContent className="py-3 text-sm text-amber-200">{error}</CardContent></Card>}
      <Card><CardHeader><CardTitle className="flex items-center justify-between"><span className="flex items-center gap-2"><Activity className="size-4 text-cyan-300" />SOC Command Overview</span><Badge tone="info">real-time</Badge></CardTitle></CardHeader><CardContent><OperationalSOCView dashboard={data} /></CardContent></Card>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><SOCHealthDashboard /><AttackMap campaigns={data.campaigns} /></div>
    </div>
  );
}
