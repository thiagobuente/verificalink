import React, { useState } from "react";
import { ChevronDown, AlertCircle, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export type SourceStatus = "clean" | "suspicious" | "dangerous" | "unchecked" | "unavailable";

export interface SourceData {
  id: string;
  name: string;
  icon: string;
  status: SourceStatus;
  detections?: number;
  totalEngines?: number;
  description?: string;
  lastChecked?: string;
  details?: string;
}

interface ConsultedSourcesPanelProps {
  sources: SourceData[];
  totalSources?: number;
}

const statusConfig = {
  clean: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    label: "✓ Limpo",
    description: "Nenhuma ameaça detectada",
  },
  suspicious: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    label: "⚠️ Suspeito",
    description: "Possível ameaça detectada",
  },
  dangerous: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    label: "❌ Perigoso",
    description: "Ameaça confirmada",
  },
  unchecked: {
    icon: Clock,
    color: "text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    label: "⏳ Não consultado",
    description: "Ainda não foi verificado",
  },
  unavailable: {
    icon: AlertCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    label: "⚠️ Indisponível",
    description: "Serviço temporariamente indisponível",
  },
};

const SourceCard: React.FC<{
  source: SourceData;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ source, isExpanded, onToggle }) => {
  const config = statusConfig[source.status];
  const IconComponent = config.icon;

  return (
    <div
      className={`border rounded-lg p-4 transition-all cursor-pointer ${config.bgColor} ${config.borderColor} border`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{source.icon}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
              {source.name}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconComponent className={`w-5 h-5 ${config.color}`} />
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700 space-y-2">
          {source.detections !== undefined && source.totalEngines !== undefined && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Detecções: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {source.detections}/{source.totalEngines}
              </span>
            </div>
          )}
          {source.lastChecked && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Última verificação: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {source.lastChecked}
              </span>
            </div>
          )}
          {source.details && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Detalhes: </span>
              <p className="text-gray-900 dark:text-white mt-1">{source.details}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ConsultedSourcesPanel: React.FC<ConsultedSourcesPanelProps> = ({
  sources,
  totalSources = 14,
}) => {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const toggleExpanded = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  // Calcular estatísticas
  const consultedCount = sources.filter((s) => s.status !== "unchecked").length;
  const dangerousCount = sources.filter((s) => s.status === "dangerous").length;
  const suspiciousCount = sources.filter((s) => s.status === "suspicious").length;
  const cleanCount = sources.filter((s) => s.status === "clean").length;

  // Calcular percentual de progresso
  const progressPercentage = (consultedCount / totalSources) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Header com indicador de progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            🔍 Fontes Consultadas
          </h3>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {consultedCount}/{totalSources}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Resumo de status */}
        <div className="flex flex-wrap gap-4 text-xs md:text-sm">
          {dangerousCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {dangerousCount} perigoso{dangerousCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {suspiciousCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {suspiciousCount} suspeito{suspiciousCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {cleanCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {cleanCount} limpo{cleanCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid de fontes - responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            isExpanded={expandedSources.has(source.id)}
            onToggle={() => toggleExpanded(source.id)}
          />
        ))}
      </div>

      {/* Nota de transparência */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs md:text-sm text-blue-900 dark:text-blue-200">
          <strong>ℹ️ Transparência:</strong> Esta análise consulta múltiplas fontes de inteligência
          de ameaças para fornecer um resultado mais confiável. Se uma fonte não responder, a
          análise continua com as demais.
        </p>
      </div>
    </div>
  );
};
