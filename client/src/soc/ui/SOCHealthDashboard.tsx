import { Activity, Gauge, ShieldCheck } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { useSOCHealth } from "../hooks/useSOCHealth";

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

export function SOCHealthDashboard() {
  const { data, loading } = useSOCHealth();
  const providers = Array.isArray(data.providerStability) ? data.providerStability.map(asRecord) : [];
  const score = data.systemHealthScore ?? 0;
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="size-4 text-cyan-300" />SOC Health Score</CardTitle></CardHeader>
        <CardContent>
          <div className="text-5xl font-semibold text-slate-50">{loading ? "--" : score}</div>
          <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300" style={{ width: Math.max(0, Math.min(100, score)) + "%" }} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><Badge tone={score >= 70 ? "success" : "warning"}>{score >= 70 ? "stable" : "degraded"}</Badge><Badge tone="info">automation guarded</Badge></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" />Provider Stability</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {providers.map((provider) => <div key={String(provider.id)} className="rounded-md border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">{String(provider.name ?? provider.id)}</span><Badge tone={String(provider.status) === "healthy" ? "success" : "warning"}>{String(provider.status ?? "unknown")}</Badge></div><p className="mt-1 text-xs text-slate-500">Latency: {String(provider.latency ?? 0)}ms | Errors: {String(provider.errors ?? 0)}</p></div>)}
            {providers.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">No provider health data.</div>}
          </div>
          <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300"><Activity className="mr-2 inline size-4 text-cyan-300" />Drift and evolution status are monitored by the SOC safety layer.</div>
        </CardContent>
      </Card>
    </div>
  );
}
