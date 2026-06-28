import { useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, RadioTower, XCircle } from "lucide-react";
import { Badge, Button, Card } from "@/components/base";
import { cn } from "@/lib/utils";

const notifications = [
  { id: "api-otx", title: "OTX oscilando", detail: "Tempo de resposta acima do normal", type: "api" },
  { id: "analysis-new", title: "Nova análise concluída", detail: "3 IOCs correlacionados", type: "success" },
  { id: "error-pdf", title: "Erro em PDF report", detail: "Documento protegido por senha", type: "error" },
  { id: "alert-critical", title: "Alerta crítico", detail: "Phishing bancário detectado", type: "alert" },
];

const iconByType = {
  api: RadioTower,
  success: CheckCircle2,
  error: XCircle,
  alert: AlertTriangle,
};

export function NotificationsCenter() {
  const [open, setOpen] = useState(false);
  const unread = useMemo(() => notifications.length, []);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Abrir notificações" className="relative">
        <Bell />
        {unread > 0 ? <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread}</span> : null}
      </Button>
      {open ? (
        <Card className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div><p className="font-semibold text-slate-100">Notifications</p><p className="text-xs text-slate-500">APIs, análises, erros e alertas</p></div><Badge tone="danger">{unread}</Badge></div>
          <div className="max-h-80 overflow-y-auto p-2">
            {notifications.map((item) => {
              const Icon = iconByType[item.type as keyof typeof iconByType];
              return <div key={item.id} className="flex gap-3 rounded-lg p-3 transition hover:bg-slate-900"><span className={cn("flex size-9 items-center justify-center rounded-lg border", item.type === "error" || item.type === "alert" ? "border-rose-300/30 bg-rose-400/10 text-rose-200" : "border-cyan-300/30 bg-cyan-400/10 text-cyan-200")}><Icon className="size-4" /></span><div><p className="text-sm font-semibold text-slate-100">{item.title}</p><p className="text-xs text-slate-500">{item.detail}</p></div></div>;
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
