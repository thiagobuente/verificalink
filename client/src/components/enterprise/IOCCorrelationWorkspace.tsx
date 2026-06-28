import { useMemo, useState } from "react";
import { GitBranch, Plus, Search, X } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Progress, RiskBadge, Section, StatCard } from "@/components/base";
import { DataTable, type DataTableColumn } from "@/components/soc/DataTable";
import { correlateIoc } from "@/domain/ioc/correlationEngine";
import { useIocAggregator } from "@/hooks/useIocAggregator";
import type { IocCorrelationResult, IocRelationship } from "@/domain/ioc/types";
import { cn } from "@/lib/utils";

const defaultIocs = ["login-banco-validacao.net", "185.199.108.153"];
const relationColumns: Array<DataTableColumn<IocRelationship>> = [
  { key: "value", header: "Indicador", sortable: true, render: (row) => <span className="font-mono text-xs text-slate-100">{row.value}</span> },
  { key: "type", header: "Tipo", sortable: true },
  { key: "relation", header: "Relação", sortable: true },
  { key: "confidence", header: "Confiança", sortable: true, render: (row) => <div className="flex items-center gap-2"><Progress value={row.confidence} className="w-24" /><span className="text-xs">{row.confidence}%</span></div> },
  { key: "source", header: "Origem", sortable: true },
];

export function IOCCorrelationWorkspace() {
  const [tabs, setTabs] = useState(defaultIocs);
  const [active, setActive] = useState(defaultIocs[0]);
  const [draft, setDraft] = useState("");
  const fallbackResult = useMemo<IocCorrelationResult>(() => correlateIoc(active), [active]);
  const result = useIocAggregator(active, fallbackResult);

  const addIoc = () => {
    const value = draft.trim();
    if (!value) return;
    setTabs((items) => items.includes(value) ? items : [...items, value]);
    setActive(value);
    setDraft("");
  };

  const closeTab = (value: string) => {
    setTabs((items) => {
      const next = items.filter((item) => item !== value);
      if (active === value) setActive(next[0] ?? "");
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Section title="IOC Workspace" description="Múltiplas análises abertas simultaneamente com correlação automática.">
        <div className="flex flex-col gap-3 lg:flex-row"><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="IP, domínio, URL, hash ou email" /><Button onClick={addIoc}><Plus />Analisar IOC</Button></div>
        <div className="flex gap-2 overflow-x-auto">{tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", active === tab ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-slate-800 bg-slate-950 text-slate-400")}><Search className="size-4" />{tab}<span onClick={(event) => { event.stopPropagation(); closeTab(tab); }}><X className="size-3" /></span></button>)}</div>
      </Section>

      {active ? <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Risk Score" value={String(result.riskScore)} detail={result.type.toUpperCase()} icon={GitBranch} tone={result.severity === "danger" ? "danger" : result.severity === "warning" ? "warning" : "success"} /><StatCard label="Relações" value={String(result.relationships.length)} detail="indicadores relacionados" icon={GitBranch} tone="info" /><StatCard label="Fontes" value={String(result.sources.length)} detail="providers ativos" icon={GitBranch} tone="neutral" /><StatCard label="Timeline" value={String(result.timeline.length)} detail="eventos correlacionados" icon={GitBranch} tone="info" /></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="size-5 text-cyan-300" />Correlação para {result.query}<RiskBadge level={result.severity} /></CardTitle></CardHeader><CardContent><DataTable columns={relationColumns} data={result.relationships} searchPlaceholder="Filtrar relações" /></CardContent></Card><Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent className="space-y-3">{result.timeline.map((event) => <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center justify-between"><p className="font-semibold text-slate-100">{event.timestamp} · {event.title}</p><RiskBadge level={event.severity} /></div><p className="mt-1 text-sm text-slate-500">{event.detail} · {event.source}</p></div>)}</CardContent></Card></div> : null}
    </div>
  );
}
