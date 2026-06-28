import { ExternalLink, ChevronDown, ChevronUp, Shield, Zap, Target, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface MITRESubTechnique {
  id: string;
  name: string;
  description: string;
}

interface MITREMitigation {
  id: string;
  name: string;
  description: string;
}

interface MITREAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  tacticId: string;
  description: string;
  url: string;
  confidence: number;
  subTechniques?: MITRESubTechnique[];
  mitigations?: MITREMitigation[];
  detectionMethods?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Props {
  techniques: MITREAttackTechnique[];
  isLoading?: boolean;
}

const TACTIC_COLORS: Record<string, string> = {
  'Reconnaissance': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'Resource Development': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'Initial Access': 'bg-red-500/10 border-red-500/30 text-red-400',
  'Execution': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  'Persistence': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  'Privilege Escalation': 'bg-red-600/10 border-red-600/30 text-red-600',
  'Defense Evasion': 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  'Credential Access': 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  'Discovery': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'Lateral Movement': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  'Collection': 'bg-green-500/10 border-green-500/30 text-green-400',
  'Command and Control': 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  'Exfiltration': 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  'Impact': 'bg-red-700/10 border-red-700/30 text-red-600',
};

export function MITREAttackDetailDisplay({ techniques, isLoading }: Props) {
  const [expandedTechniques, setExpandedTechniques] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
          <span className="text-gray-300">Carregando técnicas MITRE ATT&CK...</span>
        </div>
      </div>
    );
  }

  if (techniques.length === 0) {
    return (
      <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <span className="text-green-300">Nenhuma técnica MITRE ATT&CK identificada</span>
        </div>
      </div>
    );
  }

  const toggleTechnique = (id: string) => {
    const newExpanded = new Set(expandedTechniques);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTechniques(newExpanded);
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const groupedByTactic = techniques.reduce((acc, technique) => {
    if (!acc[technique.tactic]) {
      acc[technique.tactic] = [];
    }
    acc[technique.tactic].push(technique);
    return acc;
  }, {} as Record<string, MITREAttackTechnique[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-4 backdrop-blur">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-cyan-400">
          <Target className="w-5 h-5" />
          Técnicas MITRE ATT&CK Identificadas
        </h3>
        <p className="text-sm text-gray-400">
          {techniques.length} técnica(s) mapeada(s) em {Object.keys(groupedByTactic).length} tática(s)
        </p>
      </div>

      {/* Técnicas agrupadas por tática */}
      <div className="space-y-3">
        {Object.entries(groupedByTactic).map(([tactic, tacticTechniques]) => (
          <div key={tactic} className="space-y-2">
            {/* Tática Header */}
            <div className={`rounded-lg border-2 p-3 backdrop-blur ${TACTIC_COLORS[tactic] || 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
              <p className="font-semibold">{tactic}</p>
              <p className="text-xs opacity-75">{tacticTechniques.length} técnica(s)</p>
            </div>

            {/* Técnicas */}
            <div className="space-y-2 ml-2">
              {tacticTechniques.map((technique) => (
                <div
                  key={technique.id}
                  className="rounded-lg border border-slate-600/50 bg-slate-800/30 backdrop-blur overflow-hidden"
                >
                  {/* Técnica Summary */}
                  <button
                    onClick={() => toggleTechnique(technique.id)}
                    className="w-full p-4 hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getRiskIcon(technique.riskLevel)}</span>
                          <code className="text-sm font-mono text-cyan-400">{technique.id}</code>
                          <span className="text-sm font-semibold text-gray-200">{technique.name}</span>
                          <span className="ml-auto text-xs px-2 py-1 rounded bg-slate-700/50 text-gray-300">
                            {Math.round(technique.confidence)}% confiança
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{technique.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedTechniques.has(technique.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Técnica Details */}
                  {expandedTechniques.has(technique.id) && (
                    <div className="border-t border-slate-600/50 p-4 space-y-4 bg-slate-800/50">
                      {/* Sub-técnicas */}
                      {technique.subTechniques && technique.subTechniques.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm text-cyan-300 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Sub-técnicas
                          </h5>
                          <div className="space-y-2 ml-6">
                            {technique.subTechniques.map((sub) => (
                              <div key={sub.id} className="text-sm">
                                <p className="font-mono text-cyan-400">{sub.id}</p>
                                <p className="text-gray-300">{sub.name}</p>
                                <p className="text-xs text-gray-500">{sub.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Métodos de Detecção */}
                      {technique.detectionMethods && technique.detectionMethods.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm text-green-300 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Métodos de Detecção
                          </h5>
                          <ul className="space-y-1 ml-6">
                            {technique.detectionMethods.map((method, idx) => (
                              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>{method}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Mitigações */}
                      {technique.mitigations && technique.mitigations.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm text-blue-300 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Mitigações Recomendadas
                          </h5>
                          <div className="space-y-2 ml-6">
                            {technique.mitigations.map((mitigation) => (
                              <div key={mitigation.id} className="text-sm">
                                <p className="font-semibold text-blue-300">{mitigation.name}</p>
                                <p className="text-gray-400">{mitigation.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Link para MITRE ATT&CK */}
                      <div className="pt-2 border-t border-slate-600/50">
                        <a
                          href={technique.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Ver na MITRE ATT&CK
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recomendações Gerais */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur">
        <h4 className="mb-2 font-semibold text-blue-400">💡 Recomendações Gerais</h4>
        <ul className="space-y-1 text-sm text-gray-300">
          <li>• Mantenha sistemas e software atualizados</li>
          <li>• Implemente autenticação multifator (MFA)</li>
          <li>• Treine usuários sobre segurança e phishing</li>
          <li>• Monitore atividades suspeitas na rede</li>
          <li>• Mantenha backups regulares de dados críticos</li>
          <li>• Use ferramentas de detecção de intrusão (IDS)</li>
        </ul>
      </div>

      {/* Legenda de Risco */}
      <div className="rounded-lg border border-slate-600/50 bg-slate-800/30 p-3 backdrop-blur">
        <p className="text-xs font-semibold text-gray-400 mb-2">Legenda de Risco:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔴</span>
            <span className="text-gray-300">Crítico</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟠</span>
            <span className="text-gray-300">Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟡</span>
            <span className="text-gray-300">Médio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟢</span>
            <span className="text-gray-300">Baixo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
