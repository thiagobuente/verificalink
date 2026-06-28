import React from "react";
import { Shield, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface SourceStatus {
  name: string;
  status: "clean" | "malicious" | "no-records" | "not-found" | "unknown";
  details?: string;
}

interface SourcesPanelProps {
  sources: SourceStatus[];
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ sources }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "clean":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "malicious":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "no-records":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "not-found":
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "clean":
        return "Limpo";
      case "malicious":
        return "Malicioso";
      case "no-records":
        return "Sem registros";
      case "not-found":
        return "Não encontrado";
      default:
        return "Desconhecido";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "clean":
        return "text-green-400";
      case "malicious":
        return "text-red-400";
      case "no-records":
        return "text-yellow-400";
      case "not-found":
        return "text-slate-400";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="border-2 border-cyan-500/30 rounded-xl p-6 backdrop-blur bg-slate-800/50">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-bold text-cyan-300">
          Fontes de Inteligência Consultadas
        </h3>
      </div>

      <div className="space-y-3">
        {sources.map((source, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(source.status)}
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">
                  🛡 {source.name}
                </p>
                {source.details && (
                  <p className="text-xs text-slate-400 mt-1">{source.details}</p>
                )}
              </div>
            </div>
            <div className={`text-xs font-medium ${getStatusColor(source.status)}`}>
              {getStatusText(source.status)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-900/20 border border-blue-600/30">
        <p className="text-xs text-blue-300">
          💡 <strong>Nota:</strong> As fontes consultadas incluem bancos de dados de ameaças globais.
          Um resultado "Limpo" não garante 100% de segurança.
        </p>
      </div>
    </div>
  );
};
