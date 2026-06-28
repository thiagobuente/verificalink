import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { CorrelationGraph } from "../visualization/CorrelationGraph";

interface AggregationState { loading: boolean; result?: unknown; error?: string; }

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

export function IOCInvestigationWorkspace() {
  const [ioc, setIoc] = useState("");
  const [history, setHistory] = useState<unknown[]>([]);
  const [state, setState] = useState<AggregationState>({ loading: false });
  const providers = useMemo(() => {
    const result = asRecord(state.result);
    const list = Array.isArray(result.providers) ? result.providers : [];
    return list.map(asRecord);
  }, [state.result]);

  async function analyze() {
    if (!ioc.trim()) return;
    setState({ loading: true });
    try {
      const response = await fetch("/api/ioc/aggregate", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ioc }) });
      const payload = await response.json() as { success?: boolean; data?: unknown; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "IOC analysis failed");
      setState({ loading: false, result: payload.data });
      setHistory((current) => [payload.data, ...current].slice(0, 10));
    } catch (err) {
      setState({ loading: false, error: err instanceof Error ? err.message : "IOC analysis failed" });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="size-4 text-cyan-300" />IOC Investigation Workspace</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row"><input value={ioc} onChange={(event) => setIoc(event.target.value)} placeholder="IP, domain, URL, hash or email" className="min-h-10 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300" /><Button onClick={analyze} disabled={state.loading}>{state.loading ? "Analyzing" : "Analyze IOC"}</Button></div>
          {state.error && <p className="mt-3 text-sm text-rose-300">{state.error}</p>}
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" />Provider Comparison</CardTitle></CardHeader><CardContent className="space-y-2">{providers.map((provider) => <div key={String(provider.providerId)} className="rounded-md border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{String(provider.providerName ?? provider.providerId)}</span><Badge tone={provider.malicious ? "danger" : "info"}>{String(provider.reputation ?? "unknown")}</Badge></div><p className="mt-1 text-xs text-slate-500">Risk {String(provider.riskScore ?? 0)} | Confidence {String(provider.confidence ?? 0)}</p></div>)}{providers.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">Run an IOC analysis to compare providers.</div>}</CardContent></Card>
        <CorrelationGraph incident={state.result} />
      </div>
      <Card><CardHeader><CardTitle>IOC History</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{history.map((item, index) => <Badge key={index} tone="neutral">{String(asRecord(item).ioc ?? "ioc")}</Badge>)}{history.length === 0 && <span className="text-sm text-slate-500">No local IOC history in this session.</span>}</div></CardContent></Card>
    </div>
  );
}
