import { Globe2, Zap } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, RiskBadge } from "@/components/base";
import type { ThreatMapEvent } from "@/hooks/useLiveSocData";
import { cn } from "@/lib/utils";

export function ThreatMap({ events }: { events: ThreatMapEvent[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="size-5 text-cyan-300" />Threat Map</CardTitle></CardHeader>
      <CardContent>
        <div className="relative min-h-80 overflow-hidden rounded-lg border border-slate-800 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_58%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="absolute left-[12%] top-[24%] h-[38%] w-[18%] rounded-[48%] border border-cyan-300/20 bg-cyan-300/5" />
          <div className="absolute left-[42%] top-[18%] h-[34%] w-[16%] rounded-[45%] border border-cyan-300/20 bg-cyan-300/5" />
          <div className="absolute left-[66%] top-[30%] h-[32%] w-[22%] rounded-[48%] border border-cyan-300/20 bg-cyan-300/5" />
          {events.map((event) => <div key={event.id} className="absolute" style={{ left: String(event.x) + "%", top: String(event.y) + "%" }}><span className={cn("absolute -left-2 -top-2 size-4 rounded-full animate-ping", event.severity === "danger" ? "bg-rose-400" : event.severity === "warning" ? "bg-amber-300" : "bg-cyan-300")} /><span className={cn("relative flex size-4 items-center justify-center rounded-full border", event.severity === "danger" ? "border-rose-200 bg-rose-500" : event.severity === "warning" ? "border-amber-100 bg-amber-400" : "border-cyan-100 bg-cyan-400")} /></div>)}
          <div className="absolute bottom-4 left-4 right-4 grid gap-2 md:grid-cols-3">
            {events.slice(0, 3).map((event) => <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 backdrop-blur"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-100">{event.city}</p><RiskBadge level={event.severity} /></div><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Zap className="size-3" />{event.type} · {event.country}</p></div>)}
          </div>
          <Badge tone="info" className="absolute right-4 top-4">Live simulated</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
