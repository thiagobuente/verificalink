import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScoreInteligente } from "@/lib/intelligentScoring";
import { AnaliseDetalhada, formatarMotivos } from "@/lib/detailedAnalysis";

interface ProfessionalResultCardProps {
  scoreInteligente: ScoreInteligente;
  analiseDetalhada: AnaliseDetalhada;
  url: string;
}

export function ProfessionalResultCard({
  scoreInteligente,
  analiseDetalhada,
  url
}: ProfessionalResultCardProps) {
  const [expandidoEstrutura, setExpandidoEstrutura] = React.useState(true);
  const [expandidoReputacao, setExpandidoReputacao] = React.useState(true);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "from-red-600 to-red-700";
    if (score >= 40) return "from-yellow-600 to-yellow-700";
    return "from-green-600 to-green-700";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-red-900/30 border-red-500/50";
    if (score >= 40) return "bg-yellow-900/30 border-yellow-500/50";
    return "bg-green-900/30 border-green-500/50";
  };

  const getClassificacaoColor = (score: number) => {
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-yellow-400";
    return "text-green-400";
  };

  const motivos = formatarMotivos(scoreInteligente.componentes);

  return (
    <div className="space-y-4 mt-6">
      {/* SCORE VISUAL */}
      <div
        className={`border-2 rounded-xl p-8 ${getScoreBgColor(
          scoreInteligente.scoreTotal
        )} backdrop-blur transition-all`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Score de Risco</p>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(
                  scoreInteligente.scoreTotal
                )} bg-clip-text text-transparent`}
              >
                {scoreInteligente.scoreTotal}
              </span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400 mb-2">Classificação</p>
            <p
              className={`text-lg font-bold ${getClassificacaoColor(
                scoreInteligente.scoreTotal
              )}`}
            >
              {analiseDetalhada.resultado.classificacao}
            </p>
            {analiseDetalhada.resultado.ehAmeacaConfirmada && (
              <p className="text-xs text-red-400 mt-2">⚠️ Ameaça Confirmada</p>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getScoreColor(
              scoreInteligente.scoreTotal
            )} transition-all`}
            style={{ width: `${scoreInteligente.scoreTotal}%` }}
          />
        </div>
      </div>

      {/* MOTIVOS DA ANÁLISE */}
      <div className="border-2 border-cyan-500/30 rounded-xl p-6 backdrop-blur bg-slate-800/50">
        <h3 className="text-lg font-bold text-cyan-300 mb-4">Motivos da Análise</h3>
        
        <div className="space-y-3">
          {/* Positivos */}
          {motivos.positivos.length > 0 && (
            <div className="space-y-2">
              {motivos.positivos.map((motivo, idx) => (
                <div key={`pos-${idx}`} className="flex gap-3 text-sm">
                  <span className="text-green-400 flex-shrink-0">✔</span>
                  <span className="text-green-300">{motivo.replace("✔ ", "")}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suspeitos */}
          {motivos.suspeitos.length > 0 && (
            <div className="space-y-2">
              {motivos.suspeitos.map((motivo, idx) => (
                <div key={`sus-${idx}`} className="flex gap-3 text-sm">
                  <span className="text-yellow-400 flex-shrink-0">⚠</span>
                  <span className="text-yellow-300">{motivo.replace("⚠ ", "")}</span>
                </div>
              ))}
            </div>
          )}

          {/* Críticos */}
          {motivos.criticos.length > 0 && (
            <div className="space-y-2">
              {motivos.criticos.map((motivo, idx) => (
                <div key={`crit-${idx}`} className="flex gap-3 text-sm">
                  <span className="text-red-400 flex-shrink-0">❌</span>
                  <span className="text-red-300">{motivo.replace("❌ ", "")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ANÁLISE ESTRUTURAL */}
      <div
        className="border-2 border-blue-500/30 rounded-xl overflow-hidden backdrop-blur bg-slate-800/50"
        onClick={() => setExpandidoEstrutura(!expandidoEstrutura)}
      >
        <button className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
          <div className="text-left">
            <h3 className="text-lg font-bold text-blue-300">
              {analiseDetalhada.estrutural.titulo}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Score: {analiseDetalhada.estrutural.scoreTotal}/100
            </p>
          </div>
          {expandidoEstrutura ? (
            <ChevronUp className="w-6 h-6 text-blue-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-blue-400" />
          )}
        </button>

        {expandidoEstrutura && (
          <div className="border-t border-blue-500/20 p-6 space-y-3">
            {analiseDetalhada.estrutural.componentes.map((comp, idx) => (
              <div key={idx} className="pb-3 border-b border-slate-700/50 last:border-0 last:pb-0">
                <p className="font-semibold text-blue-300 text-sm mb-2">
                  {comp.nome}
                </p>
                <ul className="space-y-1">
                  {comp.motivos.map((motivo, midx) => (
                    <li key={midx} className="text-xs text-gray-300 ml-4">
                      {motivo}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ANÁLISE DE REPUTAÇÃO */}
      <div
        className="border-2 border-purple-500/30 rounded-xl overflow-hidden backdrop-blur bg-slate-800/50"
        onClick={() => setExpandidoReputacao(!expandidoReputacao)}
      >
        <button className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
          <div className="text-left">
            <h3 className="text-lg font-bold text-purple-300">
              {analiseDetalhada.reputacao.titulo}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Score: {analiseDetalhada.reputacao.scoreTotal}/100
            </p>
          </div>
          {expandidoReputacao ? (
            <ChevronUp className="w-6 h-6 text-purple-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-purple-400" />
          )}
        </button>

        {expandidoReputacao && (
          <div className="border-t border-purple-500/20 p-6 space-y-3">
            {analiseDetalhada.reputacao.componentes.map((comp, idx) => (
              <div key={idx} className="pb-3 border-b border-slate-700/50 last:border-0 last:pb-0">
                <p className="font-semibold text-purple-300 text-sm mb-2">
                  {comp.nome}
                </p>
                <ul className="space-y-1">
                  {comp.motivos.map((motivo, midx) => (
                    <li key={midx} className="text-xs text-gray-300 ml-4">
                      {motivo}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMENDAÇÃO */}
      <div className="border-2 border-green-500/30 rounded-xl p-6 backdrop-blur bg-slate-800/50">
        <h3 className="text-lg font-bold text-green-300 mb-3">Recomendação</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {analiseDetalhada.resultado.recomendacao}
        </p>
      </div>

      {/* URL ANALISADA */}
      <div className="border-2 border-slate-600/30 rounded-xl p-4 backdrop-blur bg-slate-800/50">
        <p className="text-xs text-gray-500 mb-2">URL Analisada</p>
        <p className="text-sm text-gray-300 break-all font-mono">
          {url}
        </p>
      </div>
    </div>
  );
}
