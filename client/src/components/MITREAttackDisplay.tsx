/**
 * MITRE ATT&CK Display Component
 * Exibe mapeamento de técnicas MITRE ATT&CK de forma visual e educativa
 */

import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';

export interface MITREAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
  confidence: number;
}

export interface MITREAttackDisplayProps {
  techniques: MITREAttackTechnique[];
  disclaimer?: string;
  referenceUrl?: string;
}

const TACTIC_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Initial Access': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  'Reconnaissance': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  'Resource Development': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  'Execution': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  'Credential Access': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
  'Collection': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  'Defense Evasion': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  'Lateral Movement': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700' },
  'Persistence': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
  'Impact': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
};

const getTacticColor = (tactic: string) => {
  return TACTIC_COLORS[tactic] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' };
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return 'bg-red-600';
  if (confidence >= 75) return 'bg-orange-600';
  if (confidence >= 60) return 'bg-yellow-600';
  return 'bg-gray-600';
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 90) return 'Muito Alta';
  if (confidence >= 75) return 'Alta';
  if (confidence >= 60) return 'Média';
  return 'Baixa';
};

export const MITREAttackDisplay: React.FC<MITREAttackDisplayProps> = ({
  techniques,
  disclaimer = 'O mapeamento MITRE ATT&CK é educativo e aproximado, baseado nos indicadores detectados pela análise.',
  referenceUrl = 'https://attack.mitre.org'
}) => {
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  // Agrupar técnicas por tática
  const tacticGroups: Record<string, MITREAttackTechnique[]> = {};
  techniques.forEach(technique => {
    if (!tacticGroups[technique.tactic]) {
      tacticGroups[technique.tactic] = [];
    }
    tacticGroups[technique.tactic].push(technique);
  });

  // Ordenar táticas por ordem de importância (Initial Access primeiro)
  const tacticOrder = [
    'Initial Access',
    'Reconnaissance',
    'Resource Development',
    'Execution',
    'Credential Access',
    'Collection',
    'Defense Evasion',
    'Lateral Movement',
    'Persistence',
    'Impact'
  ];

  const sortedTactics = Object.keys(tacticGroups).sort((a, b) => {
    const aIndex = tacticOrder.indexOf(a);
    const bIndex = tacticOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  if (techniques.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          🧠 MITRE ATT&CK Framework
        </h3>
        <p className="text-sm text-gray-400">
          Mapeamento de técnicas de ataque conhecidas baseado nos indicadores detectados
        </p>
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg text-blue-300 text-sm flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">ℹ️ Informação Educativa</p>
          <p>{disclaimer}</p>
          <a
            href={referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 mt-2"
          >
            Saiba mais sobre MITRE ATT&CK
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Técnicas por Tática */}
      <div className="space-y-3">
        {sortedTactics.map(tactic => {
          const tacticTechniques = tacticGroups[tactic];
          const colors = getTacticColor(tactic);

          return (
            <div key={tactic} className={`border-2 rounded-lg overflow-hidden ${colors.border}`}>
              {/* Tática Header */}
              <div className={`${colors.bg} p-3 font-semibold ${colors.text}`}>
                {tactic}
              </div>

              {/* Técnicas */}
              <div className="bg-gray-900 space-y-2 p-3">
                {tacticTechniques.map(technique => (
                  <div
                    key={technique.id}
                    className="bg-gray-800 rounded border border-gray-700 overflow-hidden"
                  >
                    {/* Técnica Header */}
                    <button
                      onClick={() =>
                        setExpandedTechnique(
                          expandedTechnique === technique.id ? null : technique.id
                        )
                      }
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        {/* Técnica ID e Nome */}
                        <div className="flex-1">
                          <p className="font-mono text-sm text-cyan-400">{technique.id}</p>
                          <p className="text-white font-semibold">{technique.name}</p>
                        </div>

                        {/* Confiança */}
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getConfidenceColor(technique.confidence)}`}
                              style={{ width: `${technique.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">
                            {technique.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <div className="ml-2">
                        {expandedTechnique === technique.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Técnica Details */}
                    {expandedTechnique === technique.id && (
                      <div className="bg-gray-750 border-t border-gray-700 p-3 space-y-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Descrição</p>
                          <p className="text-sm text-gray-300">{technique.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Confiança</p>
                            <p className="text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(technique.confidence)} text-white`}>
                                {getConfidenceLabel(technique.confidence)}
                              </span>
                            </p>
                          </div>

                          <a
                            href={technique.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 text-sm font-semibold"
                          >
                            Ver no MITRE
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300">
        <p className="font-semibold mb-2">📊 Resumo da Análise</p>
        <ul className="space-y-1 text-xs">
          <li>• Total de técnicas mapeadas: <span className="text-cyan-400 font-semibold">{techniques.length}</span></li>
          <li>• Táticas identificadas: <span className="text-cyan-400 font-semibold">{sortedTactics.length}</span></li>
          <li>• Confiança média: <span className="text-cyan-400 font-semibold">
            {Math.round(techniques.reduce((a, t) => a + t.confidence, 0) / techniques.length)}%
          </span></li>
        </ul>
      </div>
    </div>
  );
};

export default MITREAttackDisplay;
