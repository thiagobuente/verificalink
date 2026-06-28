import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Section } from "@/components/base";
import { DataTable, type DataTableColumn } from "@/components/soc/DataTable";
import { mitreTechniques, type MitreTechnique } from "@/domain/mitre/mitreData";

const columns: Array<DataTableColumn<MitreTechnique>> = [
  { key: "id", header: "ID", sortable: true, render: (row) => <Badge tone="neutral">{row.id}</Badge> },
  { key: "tactic", header: "Tática", sortable: true },
  { key: "technique", header: "Técnica", sortable: true },
  { key: "mitigation", header: "Mitigação" },
  { key: "reference", header: "Referência", render: (row) => <a className="inline-flex items-center gap-1 text-cyan-300" href={row.reference} target="_blank" rel="noreferrer">MITRE <ExternalLink className="size-3" /></a> },
];

export function MITREAttackExplorer() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => mitreTechniques.filter((item) => [item.id, item.tactic, item.technique, item.mitigation].some((value) => value.toLowerCase().includes(query.toLowerCase()))), [query]);
  return <div className="space-y-6"><Section title="MITRE ATT&CK Explorer" description="Pesquisa modular de técnicas, TTPs, táticas, mitigações e referências."><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar técnica, TTP ou tática" /></Section><Card><CardHeader><CardTitle className="flex items-center gap-2"><Search className="size-5 text-cyan-300" />Técnicas</CardTitle></CardHeader><CardContent><DataTable columns={columns} data={filtered} searchPlaceholder="Filtrar tabela MITRE" /></CardContent></Card></div>;
}
