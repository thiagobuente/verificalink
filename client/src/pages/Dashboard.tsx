import React, { Suspense, lazy, useMemo, useState } from "react";
import { BarChart3, Brain, Briefcase, Clock, Eye, FileText, GitBranch, LayoutDashboard, Puzzle, ScrollText, Settings, Share2, ShieldAlert, Upload } from "lucide-react";
import { DashboardLayout, type DashboardNavItem } from "@/layouts/DashboardLayout";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ThreatIntelligenceDashboard } from "@/components/ThreatIntelligenceDashboard";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/base";

const UserAnalysisHistory = lazy(() => import("@/components/UserAnalysisHistory"));
const ShareAlert = lazy(() => import("@/components/ShareAlert"));
const MalwareAnalyzer = lazy(() => import("@/components/MalwareAnalyzer"));
const DomainMonitoring = lazy(() => import("@/components/DomainMonitoring"));
const PDFAnalyzer = lazy(() => import("@/components/PDFAnalyzer"));
const IOCCorrelationWorkspace = lazy(() => import("@/components/enterprise/IOCCorrelationWorkspace").then((module) => ({ default: module.IOCCorrelationWorkspace })));
const AISecurityAssistant = lazy(() => import("@/components/enterprise/AISecurityAssistant").then((module) => ({ default: module.AISecurityAssistant })));
const MITREAttackExplorer = lazy(() => import("@/components/enterprise/MITREAttackExplorer").then((module) => ({ default: module.MITREAttackExplorer })));
const PDFReportGenerator = lazy(() => import("@/components/enterprise/PDFReportGenerator").then((module) => ({ default: module.PDFReportGenerator })));
const CaseManagement = lazy(() => import("@/components/enterprise/CaseManagement").then((module) => ({ default: module.CaseManagement })));
const SearchHistoryEnhanced = lazy(() => import("@/components/enterprise/SearchHistoryEnhanced").then((module) => ({ default: module.SearchHistoryEnhanced })));
const SettingsPanel = lazy(() => import("@/components/enterprise/SettingsPanel").then((module) => ({ default: module.SettingsPanel })));
const PluginArchitecturePanel = lazy(() => import("@/components/enterprise/PluginArchitecturePanel").then((module) => ({ default: module.PluginArchitecturePanel })));
const SOCNavigationShell = lazy(() => import("@/soc/ui/SOCNavigationShell").then((module) => ({ default: module.SOCNavigationShell })));

type DashboardTab = "overview" | "soc-platform" | "threat-intelligence" | "ioc-workspace" | "ai-assistant" | "mitre" | "reports" | "cases" | "history" | "sharing" | "malware" | "monitoring" | "pdf" | "plugins" | "settings";

interface TabConfig extends DashboardNavItem<DashboardTab> {
  component: React.ReactNode;
}

function LazyPanel({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>}>{children}</Suspense>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [collapsed, setCollapsed] = useState(false);

  const tabs = useMemo<TabConfig[]>(() => [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" />, component: <DashboardOverview />, description: "KPIs, IOCs, APIs e alertas" },
    { id: "soc-platform", label: "SOC Platform", icon: <ShieldAlert className="size-4" />, component: <LazyPanel><SOCNavigationShell /></LazyPanel>, description: "Operação SOC, incidentes, alertas e automação" },
    { id: "threat-intelligence", label: "Threat Intelligence", icon: <BarChart3 className="size-4" />, component: <ThreatIntelligenceDashboard />, description: "Gráficos, filtros e indicadores" },
    { id: "ioc-workspace", label: "IOC Workspace", icon: <GitBranch className="size-4" />, component: <LazyPanel><IOCCorrelationWorkspace /></LazyPanel>, description: "Correlação e abas de análise" },
    { id: "ai-assistant", label: "AI Assistant", icon: <Brain className="size-4" />, component: <LazyPanel><AISecurityAssistant /></LazyPanel>, description: "Resumo, impacto e mitigação" },
    { id: "mitre", label: "MITRE ATT&CK", icon: <ScrollText className="size-4" />, component: <LazyPanel><MITREAttackExplorer /></LazyPanel>, description: "Táticas, técnicas e TTPs" },
    { id: "reports", label: "Reports", icon: <FileText className="size-4" />, component: <LazyPanel><PDFReportGenerator /></LazyPanel>, description: "PDF, JSON e CSV" },
    { id: "cases", label: "Cases", icon: <Briefcase className="size-4" />, component: <LazyPanel><CaseManagement /></LazyPanel>, description: "Incidentes e atribuições" },
    { id: "history", label: "Histórico", icon: <Clock className="size-4" />, component: <LazyPanel><SearchHistoryEnhanced /><UserAnalysisHistory /></LazyPanel>, description: "Filtros, favoritos e tags" },
    { id: "sharing", label: "Compartilhamento", icon: <Share2 className="size-4" />, component: <LazyPanel><ShareAlert url="" riskScore={0} threats={[]} riskLevel="safe" /></LazyPanel>, description: "Alertas compartilháveis" },
    { id: "malware", label: "Malware", icon: <Upload className="size-4" />, component: <LazyPanel><MalwareAnalyzer /></LazyPanel>, description: "Upload e análise" },
    { id: "monitoring", label: "Monitoramento", icon: <Eye className="size-4" />, component: <LazyPanel><DomainMonitoring /></LazyPanel>, description: "Domínios contínuos" },
    { id: "pdf", label: "PDF", icon: <FileText className="size-4" />, component: <LazyPanel><PDFAnalyzer /></LazyPanel>, description: "URLs em documentos" },
    { id: "plugins", label: "Plugins", icon: <Puzzle className="size-4" />, component: <LazyPanel><PluginArchitecturePanel /></LazyPanel>, description: "Integrações independentes" },
    { id: "settings", label: "Settings", icon: <Settings className="size-4" />, component: <LazyPanel><SettingsPanel /></LazyPanel>, description: "Preferências e integrações" },
  ], []);

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <DashboardLayout title="Shield Security Scanner" subtitle="Plataforma Enterprise de Threat Intelligence, SOC e correlação de IOCs." activeId={activeTab} items={tabs} collapsed={collapsed} onCollapsedChange={setCollapsed} onSelect={setActiveTab}>
      <div className="space-y-6"><Card className="overflow-hidden border-cyan-300/20 bg-slate-950/60"><CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-xl">{currentTab.icon}{activeTab === "overview" ? "Overview SOC" : currentTab.label}</CardTitle><p className="mt-1 text-sm text-slate-400">{currentTab.description}</p></div><div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-400">Enterprise Threat Intelligence</div></CardHeader><CardContent className="p-0"><div className="border-t border-slate-800 p-4 sm:p-5 lg:p-6">{currentTab.component}</div></CardContent></Card></div>
    </DashboardLayout>
  );
}
