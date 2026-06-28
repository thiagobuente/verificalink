import { AlertTriangle, CheckCircle2, AlertCircle, Copy, Download, Share2, ExternalLink, Zap } from "lucide-react";
import { useState } from "react";

interface ThreatReportProps {
  url: string;
  score: number; // 0-100
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  classification: string;
  signals: any[];
  justification: string;
  recommendations: string[];
  sources: {
    heuristics: boolean;
    virusTotal: boolean;
    abuseIPDB: boolean;
    urlhaus: boolean;
    whitelist: boolean;
  };
  onCopyReport: () => void;
  onDownloadPDF: () => void;
  onShareWhatsApp: () => void;
}

export function ThreatReport({
  url,
  score,
  riskLevel,
  classification,
  signals,
  justification,
  recommendations,
  sources,
  onCopyReport,
  onDownloadPDF,
  onShareWhatsApp,
}: ThreatReportProps) {
  const [copied, setCopied] = useState(false);

  // Determinar cores baseado no risco
  const getRiskColors = () => {
    switch (riskLevel) {
      case "safe":
        return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: "🟢" };
      case "low":
        return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: "🟢" };
      case "medium":
        return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", icon: "🟡" };
      case "high":
        return { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "🟠" };
      case "critical":
        return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "🔴" };
      default:
        return { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", icon: "❓" };
    }
  };

  const colors = getRiskColors();

  const handleCopy = () => {
    onCopyReport();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header - Threat Report */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h2 className="text-3xl font-orbitron font-bold text-cyan-300">Threat Report</h2>
        </div>
        <p className="text-gray-400 text-sm">Análise completa de segurança da URL</p>
      </div>

      {/* URL Analisada */}
      <div className={`p-6 rounded-lg border ${colors.border} ${colors.bg} backdrop-blur mb-6`}>
        <p className="text-xs text-gray-400 mb-2">URL ANALISADA</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-mono text-gray-200 truncate">{url}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="p-2 hover:bg-white/10 rounded transition"
            title="Copiar URL"
          >
            <Copy className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Risk Score - Gauge Visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score Principal */}
        <div className={`p-6 rounded-lg border ${colors.border} ${colors.bg} backdrop-blur`}>
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Risk Score</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-orbitron font-bold text-white mb-2">{score}</div>
              <p className="text-sm text-gray-400">/100</p>
            </div>
            <div className={`text-6xl ${colors.text}`}>{colors.icon}</div>
          </div>
        </div>

        {/* Threat Level */}
        <div className={`p-6 rounded-lg border ${colors.border} ${colors.bg} backdrop-blur`}>
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Threat Level</p>
          <div>
            <p className={`text-2xl font-orbitron font-bold ${colors.text} mb-2`}>{classification}</p>
            <p className="text-xs text-gray-400">Classificação de risco</p>
          </div>
        </div>

        {/* Confiança */}
        <div className={`p-6 rounded-lg border ${colors.border} ${colors.bg} backdrop-blur`}>
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Confiança</p>
          <div>
            <p className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
              {Math.round(50 + (Object.values(sources).filter(Boolean).length * 12))}%
            </p>
            <p className="text-xs text-gray-400">Baseado em {Object.values(sources).filter(Boolean).length} fonte(s)</p>
          </div>
        </div>
      </div>

      {/* Justificativa */}
      {justification && (
        <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 backdrop-blur mb-8">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Análise Técnica</p>
          <p className="text-gray-300 leading-relaxed">{justification}</p>
        </div>
      )}

      {/* Sinais Detectados */}
      {signals.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Sinais Detectados ({signals.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((signal, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-gray-500/30 bg-gray-500/5 backdrop-blur hover:border-gray-500/50 transition"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">{signal.icon}</span>
                  <div className="flex-1">
                    <p className="font-rajdhani font-bold text-gray-200">{signal.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{signal.description}</p>
                    <div className="mt-2 inline-block">
                      <span className={`text-xs px-2 py-1 rounded-full font-rajdhani
                        ${signal.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                          signal.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          signal.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'}`}>
                        {signal.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Recomendações</p>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border border-gray-500/30 bg-gray-500/5 backdrop-blur">
                <AlertTriangle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fontes Consultadas */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Fontes Consultadas</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {sources.heuristics && (
            <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 text-center">
              <p className="text-xs text-green-300 font-rajdhani">✓ Heurísticas</p>
            </div>
          )}
          {sources.virusTotal && (
            <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 text-center">
              <p className="text-xs text-orange-300 font-rajdhani">✓ VirusTotal</p>
            </div>
          )}
          {sources.abuseIPDB && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-center">
              <p className="text-xs text-red-300 font-rajdhani">✓ AbuseIPDB</p>
            </div>
          )}
          {sources.urlhaus && (
            <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-center">
              <p className="text-xs text-yellow-300 font-rajdhani">✓ URLhaus</p>
            </div>
          )}
          {sources.whitelist && (
            <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 text-center">
              <p className="text-xs text-purple-300 font-rajdhani">✓ Whitelist</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition font-rajdhani font-bold"
        >
          <Copy className="w-5 h-5" />
          {copied ? "Copiado!" : "Copiar Relatório"}
        </button>

        <button
          onClick={onDownloadPDF}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-green-500/50 bg-green-500/10 text-green-300 hover:bg-green-500/20 transition font-rajdhani font-bold"
        >
          <Download className="w-5 h-5" />
          Baixar PDF
        </button>

        <button
          onClick={onShareWhatsApp}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition font-rajdhani font-bold"
        >
          <Share2 className="w-5 h-5" />
          Compartilhar
        </button>
      </div>

      {/* Aviso Legal */}
      <div className="mt-8 p-4 rounded-lg border border-gray-500/30 bg-gray-500/5 backdrop-blur">
        <p className="text-xs text-gray-400">
          ⚠️ <strong>Aviso Legal:</strong> Esta ferramenta realiza análise preventiva e não garante 100% de segurança. 
          Não informe senhas, dados bancários ou códigos recebidos por mensagem sem confirmar a origem.
        </p>
      </div>
    </div>
  );
}
