import { Globe2 } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";

interface AttackPoint { label: string; x: number; y: number; severity: "low" | "medium" | "high" | "critical"; }

const points: AttackPoint[] = [
  { label: "NA edge cluster", x: 22, y: 38, severity: "medium" },
  { label: "EU scanner burst", x: 51, y: 32, severity: "high" },
  { label: "APAC botnet node", x: 76, y: 48, severity: "critical" },
  { label: "LATAM probing", x: 35, y: 66, severity: "low" },
];

function color(severity: AttackPoint["severity"]) {
  if (severity === "critical") return "bg-rose-400 shadow-rose-400/50";
  if (severity === "high") return "bg-amber-300 shadow-amber-300/50";
  if (severity === "medium") return "bg-cyan-300 shadow-cyan-300/40";
  return "bg-emerald-300 shadow-emerald-300/40";
}

export function AttackMap({ campaigns = [] }: { campaigns?: unknown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe2 className="size-4 text-cyan-300" />Global Attack Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-80 overflow-hidden rounded-md border border-slate-800 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),rgba(15,23,42,0.82)_45%,rgba(2,6,23,1))]">
          <div className="absolute inset-6 rounded-[50%] border border-cyan-300/20" />
          <div className="absolute inset-x-0 top-1/2 border-t border-cyan-300/10" />
          <div className="absolute inset-y-0 left-1/2 border-l border-cyan-300/10" />
          {points.map((point) => <div key={point.label} className="absolute" style={{ left: point.x + "%", top: point.y + "%" }} title={point.label}><span className={"block size-3 rounded-full shadow-lg " + color(point.severity)} /><span className="absolute left-4 top-[-4px] whitespace-nowrap text-xs text-slate-300">{point.label}</span></div>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{campaigns.slice(0, 4).map((_, index) => <Badge key={index} tone="warning">Campaign {index + 1}</Badge>)}{campaigns.length === 0 && <Badge tone="neutral">No active global campaign</Badge>}</div>
      </CardContent>
    </Card>
  );
}
