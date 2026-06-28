import { RadioTower } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/base";
import type { ApiHealthStatus } from "@/hooks/useLiveSocData";

function tone(status: ApiHealthStatus["status"]) {
  if (status === "online") return "success";
  if (status === "degraded") return "warning";
  return "danger";
}

export function ApiHealthPanel({ apis }: { apis: ApiHealthStatus[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><RadioTower className="size-5 text-cyan-300" />API Health</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {apis.map((api) => <div key={api.name} className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">{api.name}</p><p className="text-xs text-slate-500">latência {api.latency}ms · resposta {api.responseTime}ms · uptime {api.uptime.toFixed(2)}%</p></div><Badge tone={tone(api.status)}>{api.status}</Badge></div><Progress value={api.uptime} tone={api.status === "online" ? "success" : api.status === "degraded" ? "warning" : "danger"} /></div>)}
      </CardContent>
    </Card>
  );
}
