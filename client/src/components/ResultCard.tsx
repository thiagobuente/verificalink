import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ResultadoAnalise, Motivo, TipoMotivo } from "@/lib/riskScoring";

type ResultadoAnaliseComResumo = ResultadoAnalise & { resumo?: string };

interface ResultCardProps {
  resultado: ResultadoAnaliseComResumo;
  url: string;
}

export function ResultCard({ resultado, url }: ResultCardProps) {
  const [expandido, setExpandido] = React.useState(true);

  // Determinar cor dinamica baseada no score
  const getScoreColor = (score: number) => {
    if (score <= 20) return "from-green-600 to-green-700";
    if (score <= 40) return "from-yellow-600 to-yellow-700";
    if (score <= 70) return "from-orange-600 to-orange-700";
    return "from-red-600 to-red-700";
  };

  const getScoreBgColor = (score: number) => {
    if (score <= 20) return "from-green-900/40 to-green-800/20 border-green-600/50";
    if (score <= 40) return "from-yellow-900/40 to-yellow-800/20 border-yellow-600/50";
    if (score <= 70) return "from-orange-900/40 to-orange-800/20 border-orange-600/50";
    return "from-red-900/40 to-red-800/20 border-red-600/50";
  };

  const getIconColor = (score: number) => {
    if (score <= 20) return "text-green-400";
    if (score <= 40) return "text-yellow-400";
    if (score <= 70) return "text-orange-400";
    return "text-red-400";
  };

  const getRiskLabel = (score: number) => {
    if (score <= 20) return "🟢 BAIXO RISCO";
    if (score <= 40) return "🟡 RISCO MODERADO";
    if (score <= 70) return "🟠 ALTO RISCO";
    return "🔴 RISCO CRÍTICO";
  };

  const getClassificacaoColor = (nivelRisco: string) => {
    if (nivelRisco === "Alto Risco") return "text-red-400";
    if (nivelRisco === "Suspeito") return "text-yellow-400";
    return "text-green-400";
  };

  const getMotivoIcon = (tipo: TipoMotivo) => {
    switch (tipo) {
      case "positivo":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "suspeito":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "critico":
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getMotivoTextColor = (tipo: TipoMotivo) => {
    switch (tipo) {
      case "positivo":
        return "text-green-300";
      case "suspeito":
        return "text-yellow-300";
      case "critico":
        return "text-red-300";
    }
  };

  return (
    <div className="space-y-4 mt-6">
      {/* CARD CENTRAL DE RESULTADO - NOVO DESIGN */}
      <div
        className={`
          relative border-2 rounded-xl p-8 backdrop-blur
          bg-gradient-to-br ${getScoreBgColor(resultado.score)}
          animate-in fade-in slide-in-from-top-4 duration-500
          shadow-xl
        `}
      >
        {/* Glow effect */}
        <div
          className={`
            absolute inset-0 rounded-xl blur-2xl opacity-20 -z-10
            ${resultado.score <= 20 ? "bg-green-500" : resultado.score <= 40 ? "bg-yellow-500" : resultado.score <= 70 ? "bg-orange-500" : "bg-red-500"}
          `}
        />

        {/* Content */}
        <div className="relative z-10 text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {resultado.ehAmeacaConfirmada ? (
              <AlertTriangle className={`w-16 h-16 ${getIconColor(resultado.score)}`} />
            ) : (
              <CheckCircle2 className={`w-16 h-16 ${getIconColor(resultado.score)}`} />
            )}
          </div>

          {/* Risk Label */}
          <div className={`text-2xl font-bold ${getIconColor(resultado.score)}`}>
            {getRiskLabel(resultado.score)}
          </div>

          {/* Score */}
          <div className="flex justify-center items-baseline gap-2">
            <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(resultado.score)} bg-clip-text text-transparent`}>
              {resultado.score}%
            </div>
          </div>

          {/* Classification */}
          <div className="text-slate-300 text-sm font-medium">
            Classificação: <span className={getClassificacaoColor(resultado.nivelRisco)}>{resultado.classificacao}</span>
          </div>

          {/* Summary */}
          <div className="text-slate-300 text-sm leading-relaxed pt-2">
            {resultado.resumo || "Análise concluída com sucesso"}
          </div>

          {/* Status */}
          <div className="text-xs text-slate-400 pt-2">
            ✓ Análise concluída com sucesso
          </div>
        </div>
      </div>

      {/* MOTIVOS CATEGORIZADOS */}
      <div
        className="border-2 border-cyan-500/30 rounded-xl overflow-hidden backdrop-blur bg-slate-800/50"
        onClick={() => setExpandido(!expandido)}
      >
        <button className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
          <div className="text-left">
            <h3 className="text-lg font-bold text-cyan-300 mb-1">
              Análise Técnica
            </h3>
            <p className="text-sm text-gray-400">
              {resultado.motivos.length} fator{resultado.motivos.length !== 1 ? "es" : ""} detectado{resultado.motivos.length !== 1 ? "s" : ""}
            </p>
          </div>
          {expandido ? (
            <ChevronUp className="w-6 h-6 text-cyan-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-cyan-400" />
          )}
        </button>

        {expandido && (
          <div className="border-t border-cyan-500/20 p-6 space-y-3 max-h-96 overflow-y-auto">
            {resultado.motivos.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum fator detectado</p>
            ) : (
              resultado.motivos.map((motivo, idx) => (
                <div key={idx} className="flex gap-3 pb-3 border-b border-slate-700/50 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    {getMotivoIcon(motivo.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${getMotivoTextColor(motivo.tipo)}`}>
                      {motivo.texto}
                    </p>
                    {motivo.detalhes && (
                      <p className="text-xs text-gray-400 mt-1">
                        {motivo.detalhes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* RECOMENDAÇÕES */}
      <div className="border-2 border-blue-500/30 rounded-xl p-6 backdrop-blur bg-slate-800/50">
        <h3 className="text-lg font-bold text-blue-300 mb-4">Recomendações</h3>
        <ul className="space-y-2">
          {resultado.recomendacoes.map((rec, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-gray-300">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
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
