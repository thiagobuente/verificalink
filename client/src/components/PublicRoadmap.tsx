import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export interface RoadmapItem {
  id: string;
  title: string;
  status: "completed" | "in-progress";
  icon?: string;
}

interface PublicRoadmapProps {
  completedItems?: RoadmapItem[];
  inProgressItems?: RoadmapItem[];
  title?: string;
  subtitle?: string;
}

/**
 * Componente de Roadmap Público
 */
export function PublicRoadmap({
  completedItems = DEFAULT_COMPLETED,
  inProgressItems = DEFAULT_IN_PROGRESS,
  title = "🗺️ Roadmap Público",
  subtitle = "Veja o que já foi implementado e o que vem por aí",
}: PublicRoadmapProps) {
  return (
    <div className="public-roadmap-container w-full">
      {/* Header */}
      <div className="public-roadmap-header text-center mb-12">
        <h2 className="public-roadmap-title text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="public-roadmap-subtitle text-gray-600 dark:text-gray-400 text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {/* Content Grid */}
      <div className="public-roadmap-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completed Section */}
        <div className="public-roadmap-section">
          <div className="section-header flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Implementado
            </h3>
            <span className="ml-auto px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-semibold rounded-full">
              {completedItems.length}
            </span>
          </div>

          <div className="section-items space-y-3">
            {completedItems.map((item, index) => (
              <div
                key={item.id}
                className="roadmap-item completed-item"
                style={{
                  animation: `slideInLeft 0.5s ease-out ${index * 0.05}s backwards`,
                }}
              >
                <div className="item-icon">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="item-content">
                  <p className="item-title">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Section */}
        <div className="public-roadmap-section">
          <div className="section-header flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Em Desenvolvimento
            </h3>
            <span className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-semibold rounded-full">
              {inProgressItems.length}
            </span>
          </div>

          <div className="section-items space-y-3">
            {inProgressItems.map((item, index) => (
              <div
                key={item.id}
                className="roadmap-item in-progress-item"
                style={{
                  animation: `slideInRight 0.5s ease-out ${index * 0.05}s backwards`,
                }}
              >
                <div className="item-icon">
                  <div className="spinner"></div>
                </div>
                <div className="item-content">
                  <p className="item-title">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="public-roadmap-footer mt-12 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>💡 Transparência:</strong> Este roadmap é atualizado regularmente. Prioridades podem mudar baseado em feedback da comunidade.
        </p>
      </div>
    </div>
  );
}

/**
 * Componente de Selo de Fontes Consultadas
 */
export function SourcesBadge() {
  return (
    <div className="sources-badge-container">
      <div className="sources-badge">
        <div className="badge-icon">🌐</div>
        <div className="badge-content">
          <div className="badge-label">Verificado por</div>
          <div className="badge-value">14 Fontes de Inteligência</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Funcionalidades completadas
 */
export const DEFAULT_COMPLETED: RoadmapItem[] = [
  { id: "sources-1", title: "VirusTotal", status: "completed" },
  { id: "sources-2", title: "Google Safe Browsing", status: "completed" },
  { id: "sources-3", title: "URLhaus", status: "completed" },
  { id: "sources-4", title: "AbuseIPDB", status: "completed" },
  { id: "sources-5", title: "Censys", status: "completed" },
  { id: "sources-6", title: "MaxMind", status: "completed" },
];

/**
 * Funcionalidades em desenvolvimento
 */
export const DEFAULT_IN_PROGRESS: RoadmapItem[] = [
  { id: "ai-1", title: "IA para classificação de ameaças", status: "in-progress" },
  { id: "reports-1", title: "Relatórios PDF", status: "in-progress" },
  { id: "history-1", title: "Histórico de análises", status: "in-progress" },
  { id: "dashboard-1", title: "Dashboard SOC", status: "in-progress" },
  { id: "threat-intel-1", title: "Threat Intelligence avançada", status: "in-progress" },
];
