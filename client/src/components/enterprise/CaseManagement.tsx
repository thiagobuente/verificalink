import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Section } from "@/components/base";
import { DataTable, type DataTableColumn } from "@/components/soc/DataTable";

type CaseRow = { id: string; title: string; status: string; analyst: string; priority: string; notes: string; history: string };
const initialCases: CaseRow[] = [
  { id: "CASE-1024", title: "Phishing bancário", status: "Open", analyst: "Thiago", priority: "High", notes: "Bloqueio DNS solicitado.", history: "Criado > Triagem" },
  { id: "CASE-1025", title: "Hash malicioso", status: "Investigating", analyst: "SOC L2", priority: "Medium", notes: "Aguardando sandbox.", history: "Criado > Enriquecido" },
];
const columns: Array<DataTableColumn<CaseRow>> = [
  { key: "id", header: "Caso", sortable: true, render: (row) => <Badge tone="info">{row.id}</Badge> },
  { key: "title", header: "Incidente", sortable: true },
  { key: "status", header: "Status", sortable: true },
  { key: "analyst", header: "Analista", sortable: true },
  { key: "priority", header: "Prioridade", sortable: true },
  { key: "notes", header: "Notas" },
];
export function CaseManagement() {
  const [cases, setCases] = useState(initialCases);
  const [title, setTitle] = useState("");
  const openCase = () => { if (!title.trim()) return; setCases((items) => [{ id: "CASE-" + String(1026 + items.length), title, status: "Open", analyst: "Unassigned", priority: "Medium", notes: "Caso aberto manualmente.", history: "Criado" }, ...items]); setTitle(""); };
  return <div className="space-y-6"><Section title="Case Management" description="Sistema local simples para incidentes, notas, status, atribuição, prioridade e histórico."><div className="flex flex-col gap-3 lg:flex-row"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do incidente" /><Button onClick={openCase}><Plus />Abrir incidente</Button></div></Section><Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="size-5 text-cyan-300" />Casos</CardTitle></CardHeader><CardContent><DataTable columns={columns} data={cases} searchPlaceholder="Buscar casos" /></CardContent></Card></div>;
}
