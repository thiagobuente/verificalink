import { Brain, ShieldAlert } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, RiskBadge, Section } from "@/components/base";
import { correlateIoc } from "@/domain/ioc/correlationEngine";
import { mitreTechniques } from "@/domain/mitre/mitreData";

const analysis = correlateIoc("login-banco-validacao.net");

export function AISecurityAssistant() {
  const mitre = mitreTechniques.slice(0, 3);
  return (
    <div className="space-y-6">
      <Section title="AI Security Assistant" description="Painel preparado para futura integração com LLM, usando dados simulados no momento." action={<Badge tone="info">LLM-ready</Badge>} />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="size-5 text-cyan-300" />Resumo executivo</CardTitle></CardHeader><CardContent className="space-y-4"><RiskBadge level={analysis.severity}>Severidade {analysis.severity}</RiskBadge><p className="text-sm text-slate-300">O indicador analisado apresenta sinais consistentes de infraestrutura usada em campanha de phishing com correlações em múltiplas fontes externas.</p><div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Impacto provável</p><p className="mt-2 text-sm text-slate-300">Roubo de credenciais, fraude financeira e redirecionamento para páginas falsas.</p></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-cyan-300" />Explicação técnica</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-slate-300">Foram observadas relações com domínio, IP de hospedagem e hash de payload. A confiança média das relações indica risco operacional relevante.</p><div className="grid gap-3 md:grid-cols-2">{mitre.map((item) => <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"><Badge tone="neutral">{item.id}</Badge><p className="mt-2 font-semibold text-slate-100">{item.technique}</p><p className="mt-1 text-xs text-slate-500">{item.tactic}</p></div>)}</div></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Recomendações de mitigação</CardTitle></CardHeader><CardContent><ul className="grid gap-3 md:grid-cols-2">{["Bloquear domínio e IP em DNS/proxy.", "Forçar troca de senha para usuários expostos.", "Criar regra de detecção para padrões de URL similares.", "Executar hunting em logs de email e endpoint."].map((item) => <li key={item} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">{item}</li>)}</ul></CardContent></Card>
    </div>
  );
}
