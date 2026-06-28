import React, { useMemo, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button, Input } from "@/components/base";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends object> {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends object>({ columns, data, searchPlaceholder = "Buscar", pageSize = 5, emptyTitle = "Nenhum registro", emptyDescription = "Ajuste os filtros para ver resultados." }: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = term ? data.filter((row) => Object.values(row as Record<string, unknown>).some((value) => String(value).toLowerCase().includes(term))) : data;
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const left = String(a[sortKey] ?? "");
      const right = String(b[sortKey] ?? "");
      return sortDirection === "asc" ? left.localeCompare(right) : right.localeCompare(left);
    });
  }, [data, query, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: keyof T) => {
    setPage(1);
    if (sortKey === key) setSortDirection((value) => value === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("asc"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="sm:w-80" />
        <div className="flex items-center gap-2 text-xs text-slate-500"><Search className="size-4" />{filtered.length} resultados</div>
      </div>
      {visible.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>{columns.map((column) => <th key={String(column.key)} className="px-4 py-3"><button className="inline-flex items-center gap-2" onClick={() => column.sortable && toggleSort(column.key)}>{column.header}{column.sortable ? <ArrowDownUp className="size-3" /> : null}</button></th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {visible.map((row, index) => <tr key={index} className="bg-slate-950/40 transition hover:bg-slate-900">{columns.map((column) => <td key={String(column.key)} className="px-4 py-3 text-slate-300">{column.render ? column.render(row) : String((row as Record<keyof T, unknown>)[column.key] ?? "")}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-slate-500"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft />Anterior</Button><Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima<ChevronRight /></Button></div></div>
    </div>
  );
}
