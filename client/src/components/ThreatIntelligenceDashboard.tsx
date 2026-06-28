import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Filter, Globe, Search, Shield, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress, RiskBadge, Section, Skeleton, StatCard } from "@/components/base";

interface ThreatStats {
  totalAnalyzed: number;
  threatsDetected: number;
  phishingCount: number;
  malwareCount: number;
  typosquattingCount: number;
  suspiciousCount: number;
  safeCount: number;
  topThreats: Array<{ name: string; count: number; severity: "danger" | "warning" | "neutral" }>;
  hourlyTrend: Array<{ hour: string; threats: number; safe: number }>;
  threatsByRegion: Array<{ region: string; count: number }>;
}

interface ThreatIntelligenceDashboardProps {
  isLoading?: boolean;
}

const MOCK_THREAT_STATS: ThreatStats = {
  totalAnalyzed: 15234,
  threatsDetected: 3847,
  phishingCount: 1923,
  malwareCount: 856,
  typosquattingCount: 612,
  suspiciousCount: 456,
  safeCount: 11387,
  topThreats: [
    { name: "Phishing", count: 1923, severity: "danger" },
    { name: "Malware", count: 856, severity: "danger" },
    { name: "Typosquatting", count: 612, severity: "warning" },
    { name: "Fake Banking", count: 234, severity: "warning" },
    { name: "Credential Theft", count: 222, severity: "danger" },
  ],
  hourlyTrend: [
    { hour: "00:00", threats: 145, safe: 420 },
    { hour: "04:00", threats: 89, safe: 360 },
    { hour: "08:00", threats: 234, safe: 610 },
    { hour: "12:00", threats: 456, safe: 840 },
    { hour: "16:00", threats: 523, safe: 930 },
    { hour: "20:00", threats: 678, safe: 1010 },
    { hour: "23:59", threats: 412, safe: 720 },
  ],
  threatsByRegion: [
    { region: "São Paulo", count: 1234 },
    { region: "Rio de Janeiro", count: 856 },
    { region: "Minas Gerais", count: 612 },
    { region: "Bahia", count: 456 },
    { region: "Outros", count: 689 },
  ],
};

const distribution = [
  { name: "Seguro", value: MOCK_THREAT_STATS.safeCount, color: "#34d399" },
  { name: "Phishing", value: MOCK_THREAT_STATS.phishingCount, color: "#fb7185" },
  { name: "Malware", value: MOCK_THREAT_STATS.malwareCount, color: "#f97316" },
  { name: "Typosquatting", value: MOCK_THREAT_STATS.typosquattingCount, color: "#fbbf24" },
  { name: "Suspeito", value: MOCK_THREAT_STATS.suspiciousCount, color: "#a78bfa" },
];

const threatTable = [
  { indicator: "login-banco-validacao.net", type: "Domínio", source: "URLScan", confidence: 96, severity: "danger" as const },
  { indicator: "bit.ly/secure-pix-verify", type: "URL", source: "URLhaus", confidence: 88, severity: "warning" as const },
  { indicator: "a7c9...f41e", type: "SHA-256", source: "VirusTotal", confidence: 93, severity: "danger" as const },
  { indicator: "contato@suporte-pagamento.co", type: "Email", source: "Internal ML", confidence: 79, severity: "warning" as const },
  { indicator: "relatorio-fiscal.pdf", type: "PDF", source: "Sandbox", confidence: 64, severity: "neutral" as const },
];

type ChartTooltipItem = { dataKey?: string; name?: string; value?: number | string; color?: string };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
      {label ? <p className="mb-1 font-semibold text-slate-200">{label}</p> : null}
      {payload.map((entry) => <p key={entry.dataKey ?? entry.name} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>)}
    </div>
  );
}

export const ThreatIntelligenceDashboard: React.FC<ThreatIntelligenceDashboardProps> = ({ isLoading = false }) => {
  const [stats] = useState<ThreatStats>(MOCK_THREAT_STATS);
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"all" | "danger" | "warning" | "neutral">("all");

  useEffect(() => {
    const interval = setInterval(() => setRefreshTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const threatPercentage = ((stats.threatsDetected / stats.totalAnalyzed) * 100).toFixed(1);
  const safePercentage = ((stats.safeCount / stats.totalAnalyzed) * 100).toFixed(1);

  const filteredTable = useMemo(() => {
    return threatTable.filter((row) => {
      const matchesQuery = row.indicator.toLowerCase().includes(query.toLowerCase()) || row.type.toLowerCase().includes(query.toLowerCase()) || row.source.toLowerCase().includes(query.toLowerCase());
      const matchesSeverity = severity === "all" || row.severity === severity;
      return matchesQuery && matchesSeverity;
    });
  }, [query, severity]);

  if (isLoading) {
    return <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  }

  return (
    <div className="space-y-6">
      <Section title="Threat Intelligence" description="Correlação operacional com indicadores, fontes externas, severidade e tendências em tempo quase real." action={<Badge tone="info">Atualizado {refreshTime.toLocaleTimeString("pt-BR")}</Badge>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Analisado" value={stats.totalAnalyzed.toLocaleString("pt-BR")} detail="volume agregado" icon={BarChart3} tone="info" />
          <StatCard label="Ameaças" value={stats.threatsDetected.toLocaleString("pt-BR")} detail={threatPercentage + "% do total"} icon={AlertTriangle} tone="danger" />
          <StatCard label="Seguro" value={stats.safeCount.toLocaleString("pt-BR")} detail={safePercentage + "% do total"} icon={Shield} tone="success" />
          <StatCard label="Malware" value={stats.malwareCount.toLocaleString("pt-BR")} detail="amostras e URLs" icon={Activity} tone="danger" />
          <StatCard label="Typosquatting" value={stats.typosquattingCount.toLocaleString("pt-BR")} detail="domínios similares" icon={Globe} tone="warning" />
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-cyan-300" />Tendência por hora</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.hourlyTrend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs><linearGradient id="threatArea" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.32} /><stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="threats" name="Ameaças" stroke="#fb7185" fill="url(#threatArea)" strokeWidth={2} />
                  <Area type="monotone" dataKey="safe" name="Seguros" stroke="#34d399" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-300" />Distribuição</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={3}>
                    {distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-cyan-300" />Top ameaças</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topThreats} layout="vertical" margin={{ left: 18, right: 10, top: 6, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Detecções" radius={[0, 8, 8, 0]} fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="size-5 text-cyan-300" />Ameaças por região</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.threatsByRegion} margin={{ left: -20, right: 10, top: 6, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="region" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Ameaças" radius={[8, 8, 0, 0]} fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2"><Filter className="size-5 text-cyan-300" />Indicadores correlacionados</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar por IOC, tipo ou fonte" className="sm:w-72" />
              <div className="flex gap-2">
                {(["all", "danger", "warning", "neutral"] as const).map((item) => <Button key={item} variant={severity === item ? "primary" : "secondary"} size="sm" onClick={() => setSeverity(item)}>{item === "all" ? "Todos" : item === "danger" ? "Crítico" : item === "warning" ? "Médio" : "Baixo"}</Button>)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">Indicador</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fonte</th><th className="px-4 py-3">Confiança</th><th className="px-4 py-3">Severidade</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTable.map((row) => <tr key={row.indicator} className="bg-slate-950/40 transition hover:bg-slate-900"><td className="px-4 py-3 font-mono text-xs text-slate-100">{row.indicator}</td><td className="px-4 py-3 text-slate-400">{row.type}</td><td className="px-4 py-3 text-slate-400">{row.source}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><Progress value={row.confidence} tone={row.confidence > 90 ? "success" : "warning"} className="w-24" /><span className="text-xs text-slate-400">{row.confidence}%</span></div></td><td className="px-4 py-3"><RiskBadge level={row.severity} /></td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatIntelligenceDashboard;
