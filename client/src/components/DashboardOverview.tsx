import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Binary,
  DatabaseZap,
  FileText,
  Fingerprint,
  Globe2,
  Hash,
  Link2,
  Mail,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, RiskBadge, Section, StatCard } from "@/components/base";
import { ApiHealthPanel } from "@/components/soc/ApiHealthPanel";
import { DataTable, type DataTableColumn } from "@/components/soc/DataTable";
import { ThreatMap } from "@/components/soc/ThreatMap";
import { useLiveSocData } from "@/hooks/useLiveSocData";
import { useProviderApiHealth } from "@/hooks/useProviderApiHealth";

const threatTrend = [
  { time: "00h", critical: 8, medium: 22, low: 31 },
  { time: "04h", critical: 5, medium: 18, low: 26 },
  { time: "08h", critical: 11, medium: 34, low: 48 },
  { time: "12h", critical: 16, medium: 46, low: 62 },
  { time: "16h", critical: 21, medium: 58, low: 70 },
  { time: "20h", critical: 18, medium: 52, low: 66 },
];

const iocDistribution = [
  { name: "URLs", value: 783, color: "#fbbf24" },
  { name: "Domains", value: 1248, color: "#22d3ee" },
  { name: "Hashes", value: 186, color: "#fb7185" },
  { name: "Emails", value: 549, color: "#34d399" },
];

const threatFeed = [
  { title: "Phishing bancário em expansão", source: "URLhaus", severity: "danger" as const, time: "3 min" },
  { title: "Domínio lookalike recém-criado", source: "DNS Reputation", severity: "warning" as const, time: "11 min" },
  { title: "Hash correlacionado com downloader", source: "VirusTotal", severity: "danger" as const, time: "18 min" },
  { title: "Email com engenharia social", source: "Internal ML", severity: "warning" as const, time: "26 min" },
];

const activityTimeline = [
  { title: "Arquivo PDF enviado para análise", detail: "3 URLs extraídas e correlacionadas", level: "neutral" as const },
  { title: "Alerta crítico escalado", detail: "Campanha de credenciais falsas", level: "danger" as const },
  { title: "API URLScan sincronizada", detail: "Novos indicadores adicionados", level: "safe" as const },
  { title: "Hash SHA-256 classificado", detail: "Resultado cruzado em múltiplas fontes", level: "warning" as const },
];

const quickActions: Array<{ label: string; icon: LucideIcon; variant: "primary" | "secondary" }> = [
  { label: "Analisar URL", icon: Search, variant: "primary" },
  { label: "Enviar arquivo", icon: UploadCloud, variant: "secondary" },
  { label: "Criar relatório", icon: FileText, variant: "secondary" },
];

type ReportRow = { name: string; type: string; risk: string; updated: string };
const latestReports: ReportRow[] = [
  { name: "Daily SOC Digest", type: "PDF", risk: "Médio", updated: "Hoje 08:30" },
  { name: "Campanha Fake Banking", type: "Threat", risk: "Crítico", updated: "Hoje 07:10" },
  { name: "IOC Export - URLs", type: "CSV", risk: "Baixo", updated: "Ontem 22:45" },
  { name: "Malware Intake", type: "JSON", risk: "Crítico", updated: "Ontem 19:15" },
  { name: "API Health Summary", type: "Ops", risk: "Baixo", updated: "Ontem 16:05" },
];

const reportColumns: Array<DataTableColumn<ReportRow>> = [
  { key: "name", header: "Relatório", sortable: true, render: (row) => <span className="font-semibold text-slate-100">{row.name}</span> },
  { key: "type", header: "Tipo", sortable: true },
  { key: "risk", header: "Risco", sortable: true },
  { key: "updated", header: "Atualizado", sortable: true },
];

type ChartTooltipItem = { dataKey?: string; name?: string; value?: number | string; color?: string };
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">{label ? <p className="mb-1 font-semibold text-slate-200">{label}</p> : null}{payload.map((entry) => <p key={entry.dataKey ?? entry.name} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>)}</div>;
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export function DashboardOverview() {
  const { kpis, apiHealth, mapEvents, updatedAt } = useLiveSocData();
  const providerApiHealth = useProviderApiHealth(apiHealth);
  const kpiCards = [
    { label: "Threat Score", value: String(kpis.threatScore), detail: "atualiza a cada 5s", icon: Radar, tone: "danger" as const },
    { label: "Critical Alerts", value: formatNumber(kpis.criticalAlerts), detail: "prioridade alta", icon: ShieldAlert, tone: "danger" as const },
    { label: "Medium Alerts", value: formatNumber(kpis.mediumAlerts), detail: "em triagem", icon: AlertTriangle, tone: "warning" as const },
    { label: "Low Alerts", value: formatNumber(kpis.lowAlerts), detail: "monitoramento", icon: ShieldCheck, tone: "success" as const },
  ];
  const iocStats = [
    { label: "IOC Count", value: formatNumber(kpis.iocCount), icon: Fingerprint, tone: "info" as const },
    { label: "Domains", value: formatNumber(kpis.domains), icon: Globe2, tone: "info" as const },
    { label: "URLs", value: formatNumber(kpis.urls), icon: Link2, tone: "warning" as const },
    { label: "Hashes", value: formatNumber(kpis.hashes), icon: Hash, tone: "danger" as const },
    { label: "Emails", value: formatNumber(kpis.emails), icon: Mail, tone: "success" as const },
    { label: "Malware", value: formatNumber(kpis.malware), icon: Binary, tone: "danger" as const },
    { label: "PDF Reports", value: formatNumber(kpis.pdfReports), icon: FileText, tone: "neutral" as const },
    { label: "API Checks", value: "9.8k", icon: DatabaseZap, tone: "info" as const },
  ];

  return (
    <div className="space-y-6">
      <Section title="Command Center" description="Visão SOC live com dados simulados quando não há backend disponível." action={<Badge tone="info">Live {updatedAt.toLocaleTimeString("pt-BR")}</Badge>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpiCards.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}</div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"><ThreatMap events={mapEvents} /><Card><CardHeader><CardTitle className="flex items-center gap-2"><Radar className="size-5 text-cyan-300" />IOC Statistics</CardTitle></CardHeader><CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={iocDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={3}>{iocDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><RechartsTooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer></div></CardContent></Card></div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Card className="overflow-hidden"><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-5 text-cyan-300" />Threat Timeline</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={threatTrend} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}><defs><linearGradient id="criticalGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.38} /><stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} /></linearGradient><linearGradient id="mediumGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#fbbf24" stopOpacity={0.28} /><stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} /><XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><RechartsTooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="critical" name="Críticos" stroke="#fb7185" fill="url(#criticalGradient)" strokeWidth={2} isAnimationActive /><Area type="monotone" dataKey="medium" name="Médios" stroke="#fbbf24" fill="url(#mediumGradient)" strokeWidth={2} isAnimationActive /><Area type="monotone" dataKey="low" name="Baixos" stroke="#34d399" fill="transparent" strokeWidth={2} isAnimationActive /></AreaChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-5 text-cyan-300" />Recent Activity</CardTitle></CardHeader><CardContent><div className="relative space-y-4 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-px before:bg-slate-800">{activityTimeline.map((item) => <div key={item.title} className="relative flex gap-3 pl-1"><span className="mt-1 size-5 rounded-full border border-slate-700 bg-slate-950 ring-4 ring-slate-950" /><div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/50 p-3"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-100">{item.title}</p><RiskBadge level={item.level} /></div><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div></div>)}</div></CardContent></Card></div>

      <Section title="IOC Coverage" description="Indicadores ativos por superfície de análise."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">{iocStats.map((ioc) => <StatCard key={ioc.label} label={ioc.label} value={ioc.value} detail="live" icon={ioc.icon} tone={ioc.tone} />)}</div></Section>

      <div className="grid gap-6 xl:grid-cols-3"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-cyan-300" />Threat Feed</CardTitle></CardHeader><CardContent className="space-y-3">{threatFeed.map((feed) => <div key={feed.title} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 transition hover:border-cyan-300/30"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">{feed.title}</p><p className="mt-1 text-xs text-slate-500">{feed.source} · {feed.time}</p></div><RiskBadge level={feed.severity} /></div></div>)}</CardContent></Card><ApiHealthPanel apis={providerApiHealth} /><Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="size-5 text-cyan-300" />Quick Actions</CardTitle></CardHeader><CardContent className="grid gap-3">{quickActions.map(({ label, icon: Icon, variant }) => <Button key={label} variant={variant} className="justify-start"><Icon />{label}</Button>)}</CardContent></Card></div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-cyan-300" />Latest Reports</CardTitle></CardHeader><CardContent><DataTable columns={reportColumns} data={latestReports} searchPlaceholder="Buscar relatórios" pageSize={3} emptyTitle="Nenhum relatório encontrado" emptyDescription="Os relatórios SOC aparecerão aqui quando disponíveis." /></CardContent></Card>
    </div>
  );
}
