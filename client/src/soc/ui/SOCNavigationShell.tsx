import { useMemo, useState } from "react";
import { Activity, BellRing, Bot, Gauge, Globe2, LayoutDashboard, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/base";
import { SOCDashboard } from "./SOCDashboard";
import { OperationalSOCView } from "./OperationalSOCView";
import { IncidentDetailView } from "./IncidentDetailView";
import { AlertCenter } from "./AlertCenter";
import { SOCHealthDashboard } from "./SOCHealthDashboard";
import { RealTimeEventStream } from "./RealTimeEventStream";
import { IOCInvestigationWorkspace } from "../workspace/IOCInvestigationWorkspace";
import { AttackMap } from "../visualization/AttackMap";
import { useSOCDashboard } from "../hooks/useSOCDashboard";
import { normalizeIncidents } from "../utils/socUIDataNormalizer";

type Tab = "dashboard" | "incidents" | "investigations" | "alerts" | "intelligence" | "automation" | "health";

export function SOCNavigationShell() {
  const [active, setActive] = useState<Tab>("dashboard");
  const { data } = useSOCDashboard();
  const incidents = normalizeIncidents(data.incidents);
  const selected = incidents[0];
  const nav = useMemo(() => [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "incidents" as Tab, label: "Incidents", icon: ShieldAlert },
    { id: "investigations" as Tab, label: "Investigations", icon: Search },
    { id: "alerts" as Tab, label: "Alerts", icon: BellRing },
    { id: "intelligence" as Tab, label: "Intelligence", icon: Globe2 },
    { id: "automation" as Tab, label: "Automation", icon: Bot },
    { id: "health" as Tab, label: "Health", icon: Gauge },
  ], []);
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <Card><CardContent className="space-y-2 p-3">{nav.map((item) => { const Icon = item.icon; return <Button key={item.id} variant={active === item.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActive(item.id)}><Icon className="size-4" />{item.label}</Button>; })}</CardContent></Card>
      <div>
        {active === "dashboard" && <SOCDashboard />}
        {active === "incidents" && <IncidentDetailView incidentId={selected?.id} fallbackIncident={(data.incidents ?? [])[0]} />}
        {active === "investigations" && <IOCInvestigationWorkspace />}
        {active === "alerts" && <AlertCenter alerts={data.alerts} />}
        {active === "intelligence" && <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><AttackMap campaigns={data.campaigns} /><RealTimeEventStream /></div>}
        {active === "automation" && <OperationalSOCView dashboard={data} />}
        {active === "health" && <SOCHealthDashboard />}
      </div>
    </div>
  );
}
