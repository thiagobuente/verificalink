import { Puzzle } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Section } from "@/components/base";
import { DataTable, type DataTableColumn } from "@/components/soc/DataTable";
import { threatIntelPlugins } from "@/plugins/threat-intel/registry";
import type { ThreatIntelPlugin } from "@/plugins/threat-intel/types";

const columns: Array<DataTableColumn<ThreatIntelPlugin>> = [
  { key: "name", header: "Integração", sortable: true },
  { key: "vendor", header: "Fornecedor", sortable: true },
  { key: "enabled", header: "Status", render: (row) => <Badge tone={row.enabled ? "success" : "neutral"}>{row.enabled ? "enabled" : "disabled"}</Badge> },
];
export function PluginArchitecturePanel() {
  return <div className="space-y-6"><Section title="Plugin Architecture" description="Integrações independentes, sem dependência direta do Dashboard." /><Card><CardHeader><CardTitle className="flex items-center gap-2"><Puzzle className="size-5 text-cyan-300" />Threat Intel Plugins</CardTitle></CardHeader><CardContent><DataTable columns={columns} data={threatIntelPlugins} searchPlaceholder="Buscar plugin" /></CardContent></Card></div>;
}
