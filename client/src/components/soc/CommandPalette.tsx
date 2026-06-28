import React, { useEffect, useMemo, useState } from "react";
import { Database, FileText, Globe2, Hash, Link2, Mail, Search, Shield, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge, Button } from "@/components/base";
import { cn } from "@/lib/utils";

type CommandKind = "IOC" | "URL" | "IP" | "Domínio" | "Email" | "Hash" | "Ferramenta" | "Página";

export interface CommandResult {
  id: string;
  label: string;
  description: string;
  kind: CommandKind;
  target?: string;
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectTarget?: (target: string) => void;
}

const results: CommandResult[] = [
  { id: "overview", label: "Overview SOC", description: "KPIs, Threat Map, API Health e relatórios", kind: "Página", target: "overview" },
  { id: "ti", label: "Threat Intelligence", description: "Gráficos, filtros e indicadores correlacionados", kind: "Página", target: "threat-intelligence" },
  { id: "ioc-workspace", label: "IOC Workspace", description: "Correlação automática e múltiplas análises", kind: "Ferramenta", target: "ioc-workspace" },
  { id: "ai-assistant", label: "AI Security Assistant", description: "Resumo executivo, MITRE e mitigação", kind: "Ferramenta", target: "ai-assistant" },
  { id: "mitre", label: "MITRE ATT&CK Explorer", description: "Táticas, técnicas e TTPs", kind: "Página", target: "mitre" },
  { id: "reports", label: "Report Generator", description: "PDF, JSON e CSV", kind: "Ferramenta", target: "reports" },
  { id: "cases", label: "Case Management", description: "Incidentes, notas e analistas", kind: "Página", target: "cases" },
  { id: "plugins", label: "Plugin Architecture", description: "Integrações independentes", kind: "Página", target: "plugins" },
  { id: "settings", label: "Settings", description: "Idioma, tema e preferências", kind: "Página", target: "settings" },
  { id: "history", label: "Histórico de análises", description: "Busca por análises recentes", kind: "Página", target: "history" },
  { id: "malware", label: "Análise de Malware", description: "Upload e verificação de arquivos", kind: "Ferramenta", target: "malware" },
  { id: "pdf", label: "PDF Reports", description: "Análise de URLs em documentos", kind: "Ferramenta", target: "pdf" },
  { id: "url-1", label: "https://login-banco-validacao.net", description: "URL crítica detectada no threat feed", kind: "URL", target: "threat-intelligence" },
  { id: "domain-1", label: "pix-validacao-segura.net", description: "Domínio recém-criado com reputação baixa", kind: "Domínio", target: "monitoring" },
  { id: "email-1", label: "contato@suporte-pagamento.co", description: "Email com padrão de engenharia social", kind: "Email", target: "threat-intelligence" },
  { id: "hash-1", label: "a7c9f41e...9b20", description: "Hash correlacionado com downloader", kind: "Hash", target: "threat-intelligence" },
  { id: "ip-1", label: "185.199.108.153", description: "IP observado em varredura recente", kind: "IP", target: "threat-intelligence" },
];

const iconByKind: Record<CommandKind, React.ReactNode> = {
  IOC: <Database className="size-4" />,
  URL: <Link2 className="size-4" />,
  IP: <Globe2 className="size-4" />,
  Domínio: <Globe2 className="size-4" />,
  Email: <Mail className="size-4" />,
  Hash: <Hash className="size-4" />,
  Ferramenta: <Wrench className="size-4" />,
  Página: <FileText className="size-4" />,
};

export function CommandPalette({ open: controlledOpen, onOpenChange, onSelectTarget }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return results;
    return results.filter((item) => [item.label, item.description, item.kind].some((value) => value.toLowerCase().includes(term)));
  }, [query]);

  const run = (item: CommandResult) => {
    if (item.target) onSelectTarget?.(item.target);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Button variant="secondary" className="hidden min-w-56 justify-between text-slate-400 lg:flex" onClick={() => setOpen(true)}><span className="flex items-center gap-2"><Search className="size-4" />Pesquisar IOC, URL, hash...</span><kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd></Button>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir busca global"><Search /></Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[18%] max-w-2xl translate-y-0 border-slate-700 bg-slate-950 p-0 text-slate-100">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3"><Search className="size-5 text-cyan-300" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar IOC, URLs, IPs, domínios, emails, hashes, ferramentas e páginas" className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" /></div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">Nenhum resultado encontrado.</div> : filtered.map((item) => <button key={item.id} onClick={() => run(item)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-900")}><span className="flex size-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-cyan-200">{iconByKind[item.kind] ?? <Shield className="size-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-100">{item.label}</span><span className="block truncate text-xs text-slate-500">{item.description}</span></span><Badge tone="neutral">{item.kind}</Badge></button>)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
