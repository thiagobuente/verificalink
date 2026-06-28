import { GitBranch } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/base";
import { correlationToGraph, type SOCUIGraphEdge, type SOCUIGraphNode } from "../utils/socUIDataNormalizer";

function tone(type: SOCUIGraphNode["type"]) {
  if (type === "provider") return "info";
  if (type === "campaign") return "warning";
  if (type === "action") return "success";
  return "neutral";
}

export function CorrelationGraph({ incident }: { incident?: unknown }) {
  const graph = incident ? correlationToGraph(incident) : { nodes: [] as SOCUIGraphNode[], edges: [] as SOCUIGraphEdge[] };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GitBranch className="size-4 text-cyan-300" />Correlation Graph</CardTitle>
      </CardHeader>
      <CardContent>
        {graph.nodes.length === 0 ? <div className="rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400">No correlation graph available yet.</div> : (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-72 overflow-hidden rounded-md border border-slate-800 bg-slate-950/70 p-4">
              <div className="absolute inset-x-0 top-1/2 border-t border-cyan-300/10" />
              <div className="relative grid h-full grid-cols-2 gap-3 sm:grid-cols-3">
                {graph.nodes.map((node) => (
                  <div key={node.id} className="flex min-h-24 flex-col justify-between rounded-md border border-slate-700 bg-slate-900/80 p-3 shadow-lg shadow-black/20">
                    <span className="truncate text-sm font-semibold text-slate-100">{node.label}</span>
                    <Badge tone={tone(node.type)}>{node.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {graph.edges.map((edge) => <div key={edge.id} className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300"><span className="font-semibold text-cyan-200">{edge.source}</span>{" -> "}{edge.target}<div className="text-xs text-slate-500">{edge.label}</div></div>)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
