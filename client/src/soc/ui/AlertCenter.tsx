import { BellRing } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";

function read(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

export function AlertCenter({ alerts = [] }: { alerts?: unknown[] }) {
  const grouped = alerts.map(read);
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="size-4 text-amber-300" />Alert Center</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2"><Badge tone="danger">Critical</Badge><Badge tone="warning">High</Badge><Badge tone="info">Grouped</Badge><Badge tone="neutral">Suppressed duplicates visible</Badge></div>
        <div className="space-y-2">
          {grouped.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">No active alerts.</div>}
          {grouped.slice(0, 12).map((alert, index) => <div key={String(alert.signature ?? index)} className="rounded-md border border-slate-800 bg-slate-900/60 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-100">{String(alert.message ?? alert.type ?? "SOC alert")}</span><Badge tone={String(alert.severity) === "critical" ? "danger" : "warning"}>{String(alert.severity ?? "medium")}</Badge></div><p className="mt-1 text-xs text-slate-500">Count: {String(alert.count ?? 1)} | Signature: {String(alert.signature ?? "grouped")}</p></div>)}
        </div>
      </CardContent>
    </Card>
  );
}
