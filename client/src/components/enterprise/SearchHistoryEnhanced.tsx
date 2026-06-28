import { Download, Star, Tag } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Section } from "@/components/base";
import { DataTable, type DataTableColumn } from "@/components/soc/DataTable";
import { exportCsv, exportJson } from "@/domain/export/exporters";

type HistoryRow = { query: string; type: string; risk: string; favorite: string; tags: string; exported: string };
const rows: HistoryRow[] = [
  { query: "login-banco-validacao.net", type: "domain", risk: "High", favorite: "yes", tags: "phishing, banking", exported: "json" },
  { query: "185.199.108.153", type: "ip", risk: "Medium", favorite: "no", tags: "scan", exported: "csv" },
  { query: "a7c9f41e9b20", type: "hash", risk: "High", favorite: "yes", tags: "malware", exported: "pdf" },
];
const columns: Array<DataTableColumn<HistoryRow>> = [
  { key: "query", header: "Consulta", sortable: true, render: (row) => <span className="font-mono text-xs text-slate-100">{row.query}</span> },
  { key: "type", header: "Tipo", sortable: true },
  { key: "risk", header: "Risco", sortable: true },
  { key: "favorite", header: "Favorito", render: (row) => row.favorite === "yes" ? <Star className="size-4 fill-amber-300 text-amber-300" /> : <span className="text-slate-600">-</span> },
  { key: "tags", header: "Tags", render: (row) => <div className="flex flex-wrap gap-1">{row.tags.split(",").map((tag) => <Badge key={tag} tone="neutral"><Tag className="size-3" />{tag.trim()}</Badge>)}</div> },
];
export function SearchHistoryEnhanced() {
  const json = exportJson(rows);
  const csv = exportCsv(rows);
  return <div className="space-y-6"><Section title="Search History" description="Histórico aprimorado com filtros, favoritos, tags e exportação." action={<div className="flex gap-2"><Button variant="secondary"><Download />JSON</Button><Button variant="secondary"><Download />CSV</Button><Button><Download />PDF</Button></div>} /><Card><CardHeader><CardTitle>Consultas recentes</CardTitle></CardHeader><CardContent><DataTable columns={columns} data={rows} searchPlaceholder="Filtrar histórico" /><details className="mt-4 text-xs text-slate-500"><summary>Export preview</summary><pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-950 p-3">{json.slice(0, 400)}\n{csv}</pre></details></CardContent></Card></div>;
}
