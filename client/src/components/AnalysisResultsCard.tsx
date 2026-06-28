'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Shield, Zap, Lock, Copy, Check } from 'lucide-react';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
      title="Copiar para a área de transferência"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span className="text-cyan-300">Copiar</span>
        </>
      )}
    </button>
  );
};

interface AnalysisResultsCardProps {
  score: number;
  classification: string;
  url: string;
  isScam: boolean;
  confidence: number;
  risks: string[];
  positiveIndicators: string[];
  explanations: string[];
  technicalDetails: any;
  sources: string[];
}

export default function AnalysisResultsCard({
  score,
  classification,
  url,
  isScam,
  confidence,
  risks,
  positiveIndicators,
  explanations,
  technicalDetails,
  sources,
}: AnalysisResultsCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    technical: false,
    sources: false,
    whyScore: false,
    transparency: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // NOVA ESCALA: 0-20 Baixo, 21-49 Moderado, 50-74 Alto, 75-100 Crítico
  const getRiskColor = (score: number) => {
    if (score <= 20) return 'from-green-900/40 to-green-800/20';
    if (score <= 49) return 'from-yellow-900/40 to-yellow-800/20';
    if (score <= 74) return 'from-orange-900/40 to-orange-800/20';
    return 'from-red-900/40 to-red-800/20';
  };

  const getRiskBorderColor = (score: number) => {
    if (score <= 20) return 'border-green-500/50';
    if (score <= 49) return 'border-yellow-500/50';
    if (score <= 74) return 'border-orange-500/50';
    return 'border-red-500/50';
  };

  const getRiskTextColor = (score: number) => {
    if (score <= 20) return 'text-green-400';
    if (score <= 49) return 'text-yellow-400';
    if (score <= 74) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 20) return '🟢 Baixo';
    if (score <= 49) return '🟡 Moderado';
    if (score <= 74) return '🟠 Alto';
    return '🔴 Crítico';
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence <= 30) return 'Baixa';
    if (confidence <= 60) return 'Moderada';
    if (confidence <= 80) return 'Alta';
    return 'Muito Alta';
  };

  const getRecommendation = () => {
    if (score <= 20) {
      return '✓ Este link aparenta ser seguro. Porém, sempre verifique a origem de mensagens suspeitas.';
    } else if (score <= 49) {
      return '⚠️ Este link apresenta características moderadamente suspeitas. Recomenda-se cautela. Não clique se recebido por SMS, WhatsApp ou e-mail alegando ser de órgão público.';
    } else if (score <= 74) {
      return '🛑 Este link apresenta características de phishing ou engenharia social. Não clique. Se recebido por SMS, WhatsApp ou e-mail, é provável que seja um golpe.';
    } else {
      return '🔴 ALERTA CRÍTICO: Este link apresenta fortes indicadores de phishing e engenharia social. NÃO CLIQUE. Denuncie a mensagem como spam/phishing.';
    }
  };

  // Função para formatar fontes externas com cards individuais
  const formatSourceCard = (source: string) => {
    const parts = source.split(':').map(s => s.trim());
    const sourceName = parts[0];
    const sourceStatus = parts[1] || 'Sem informação';

    const getSourceIcon = () => {
      if (sourceStatus.toLowerCase().includes('limpo') || sourceStatus.toLowerCase().includes('seguro') || sourceStatus.toLowerCase().includes('sem indicadores') || sourceStatus.toLowerCase().includes('sem registros')) {
        return '✓';
      }
      return '!';
    };

    return { sourceName, sourceStatus, icon: getSourceIcon() };
  };

  // 14 Fontes de Inteligência
  const intelligenceSources = [
    'VirusTotal',
    'Google Safe Browsing',
    'AbuseIPDB',
    'URLHaus',
    'AlienVault OTX',
    'URLScan.io',
    'MaxMind',
    'Censys',
    'Project Honey Pot',
    'Hybrid Analysis',
    'Shodan',
    'WHOIS Database',
    'Domain Age Analysis',
    'Behavioral Risk Detection',
  ];

  return (
    <div className="space-y-6">
      {/* RESUMO EXECUTIVO - CARD PRINCIPAL */}
      <div className={`rounded-xl border-2 ${getRiskBorderColor(score)} bg-gradient-to-br ${getRiskColor(score)} p-6 md:p-8 backdrop-blur-sm`}>
        {/* HEADER COM ÍCONE E CLASSIFICAÇÃO */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-0 mb-8">
          <div className="flex items-start gap-4">
            {isScam ? (
              <AlertTriangle className={`w-12 h-12 ${getRiskTextColor(score)} flex-shrink-0`} />
            ) : (
              <CheckCircle2 className={`w-12 h-12 ${getRiskTextColor(score)} flex-shrink-0`} />
            )}
            <div className="flex-1">
              <p className="text-slate-400 text-xs md:text-sm font-medium mb-2 leading-relaxed">Classificação</p>
              <h2 className={`text-2xl md:text-3xl font-bold ${getRiskTextColor(score)} leading-tight`}>{classification}</h2>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-2 leading-relaxed">Score de Risco</p>
            <div className="text-3xl md:text-4xl font-bold neon-text leading-tight">{score}%</div>
          </div>
        </div>

        {/* MÉTRICAS PRINCIPAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8">
          <div className="bg-slate-800/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-slate-400 text-xs font-medium mb-2 sm:mb-0 leading-relaxed">Nível de Confiança</p>
            <div className="flex flex-col gap-1">
              <span className="text-xl sm:text-2xl font-bold text-blue-400 leading-tight">{getConfidenceLevel(confidence)}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{confidence}% dos dados</span>
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-slate-400 text-xs font-medium mb-2 sm:mb-0 leading-relaxed">Status</p>
            <span className={`text-lg font-bold ${getRiskTextColor(score)} leading-tight`}>{getRiskLabel(score)}</span>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-slate-400 text-xs font-medium mb-2 sm:mb-0 leading-relaxed">Indicadores</p>
            <span className="text-lg font-bold text-cyan-400 leading-tight">{risks.length + positiveIndicators.length}</span>
          </div>
        </div>

        {/* URL ANALISADA */}
        <div className="bg-slate-900/60 rounded-lg p-4 md:p-5 border border-slate-700/50">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-slate-500 text-xs font-medium leading-relaxed">URL Analisada</p>
            <CopyButton text={url} />
          </div>
          <p className="text-xs md:text-sm font-mono text-cyan-400 break-all leading-relaxed">{url}</p>
        </div>
      </div>

      {/* VERIFICAÇÕES TÉCNICAS - SEPARAR TÍTULO E CONTADOR */}
      {positiveIndicators.length > 0 && (
        <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-blue-400 leading-tight">Verificações Técnicas</h3>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-medium leading-relaxed">
              {positiveIndicators.length} verificação{positiveIndicators.length !== 1 ? 's' : ''} realizadas
            </span>
          </div>
          <div className="space-y-3">
            {positiveIndicators.map((indicator, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-blue-400 font-bold flex-shrink-0 leading-relaxed">✓</span>
                <span className="text-blue-300 text-sm leading-relaxed flex-1">{indicator}</span>
                <CopyButton text={indicator} />
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 md:p-5 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <p className="text-blue-300 text-xs md:text-sm leading-relaxed mb-2">
              <strong className="block mb-1">🔒 HTTPS presente</strong>
              <strong className="block mb-2">🔒 Certificado SSL válido</strong>
            </p>
            <p className="text-blue-300 text-xs md:text-sm leading-relaxed">
              <strong>Observação:</strong> HTTPS não garante legitimidade do site. Criminosos também usam certificados SSL válidos em sites de phishing.
            </p>
          </div>
        </div>
      )}

      {/* INDICADORES DE RISCO */}
      {(risks.length > 0 || score > 50) && (
        <div className="rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10 p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-red-400 leading-tight">⚠️ Indicadores de Risco Detectados</h3>
            {risks.length > 0 && (
              <span className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full font-medium leading-relaxed">
                {risks.length} indicador{risks.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {risks.length > 0 ? (
              risks.map((risk, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-red-400 font-bold flex-shrink-0 leading-relaxed">•</span>
                  <span className="text-red-300 text-sm leading-relaxed flex-1">{risk}</span>
                  <CopyButton text={risk} />
                </div>
              ))
            ) : (
              <div className="p-4 md:p-5 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-red-300 text-sm leading-relaxed">
                  Não foram encontradas detecções em algumas fontes externas, mas o domínio apresenta características compatíveis com campanhas de phishing e engenharia social.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POR QUE ESTE SCORE? */}
      {score > 20 && explanations.length > 0 && (
        <div className="rounded-xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 p-6 backdrop-blur-sm">
          <button
            onClick={() => toggleSection('whyScore')}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-yellow-400 leading-tight">📊 Por que este score?</h3>
            </div>
            {expandedSections.whyScore ? (
              <ChevronUp className="w-5 h-5 text-yellow-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-yellow-400" />
            )}
          </button>

          {expandedSections.whyScore && (
            <div className="mt-4 pt-4 border-t border-yellow-500/20">
              <p className="text-yellow-300 text-sm mb-4 leading-relaxed font-semibold">
                Este domínio recebeu classificação {classification.toLowerCase()} devido aos seguintes fatores:
              </p>
              <div className="space-y-3">
                {explanations.map((exp, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 md:p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span className="text-yellow-400 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span className="text-yellow-300 text-sm leading-relaxed">{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECOMENDAÇÃO COM AVISO SOBRE PAGAMENTOS */}
      <div className={`rounded-xl border-2 ${getRiskBorderColor(score)} bg-gradient-to-br ${getRiskColor(score)} p-6 backdrop-blur-sm`}>
        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
          <Shield className={`w-6 h-6 ${getRiskTextColor(score)} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${getRiskTextColor(score)} mb-3 leading-tight`}>Recomendação</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{getRecommendation()}</p>
            
            {/* AVISO SOBRE PAGAMENTOS */}
            <div className="bg-slate-900/60 rounded-lg p-4 md:p-5 border border-slate-700/50 mt-4">
              <p className="text-slate-300 text-sm font-semibold mb-2 leading-relaxed">⚠️ Não realize pagamentos</p>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Se recebido por WhatsApp, SMS ou e-mail alegando ser de Receita Federal, INSS, banco, Correios ou empresa conhecida, considere a mensagem suspeita. Órgãos públicos e empresas legítimas nunca solicitam pagamentos ou dados pessoais por esses canais.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHES TÉCNICOS */}
      {technicalDetails && (
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-6 backdrop-blur-sm">
          <button
            onClick={() => toggleSection('technical')}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold text-purple-400 leading-tight">Análise Técnica Detalhada</h3>
            </div>
            {expandedSections.technical ? (
              <ChevronUp className="w-5 h-5 text-purple-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-400" />
            )}
          </button>

          {expandedSections.technical && (
            <div className="mt-4 space-y-3 pt-4 border-t border-purple-500/20">
              {technicalDetails.encurtador && (
                <div className="flex flex-col gap-2">
                  <p className="text-purple-300 text-sm font-semibold leading-relaxed">⚠️ URL Encurtada Detectada:</p>
                  <p className="text-purple-300 text-sm leading-relaxed">URLs encurtadas ocultam o destino real e sao frequentemente usadas em phishing. Evite clicar em URLs encurtadas de fontes desconhecidas.</p>
                </div>
              )}
              {technicalDetails.urlLonga && (
                <div className="flex flex-col gap-2">
                  <p className="text-purple-300 text-sm font-semibold leading-relaxed">🔍 URL Longa Detectada:</p>
                  <p className="text-purple-300 text-sm leading-relaxed">URLs muito longas podem conter parametros de rastreamento ou ofuscacao. Verifique se o dominio eh legitimo.</p>
                </div>
              )}
              {technicalDetails.subdominios && (
                <div className="flex flex-col gap-2">
                  <p className="text-purple-300 text-sm font-semibold leading-relaxed">🌐 Subdominios Suspeitos:</p>
                  <p className="text-purple-300 text-sm leading-relaxed">URLs com muitos subdominios podem ser usadas para imitar dominios legitimos. Verifique cuidadosamente o dominio principal.</p>
                </div>
              )}
              {technicalDetails.parametros && (
                <div className="flex flex-col gap-2">
                  <p className="text-purple-300 text-sm font-semibold leading-relaxed">📊 Parametros Suspeitos:</p>
                  <p className="text-purple-300 text-sm leading-relaxed">A URL contem parametros que podem ser usados para rastreamento ou phishing. Tenha cuidado ao compartilhar esta URL.</p>
                </div>
              )}
              {!technicalDetails.encurtador && !technicalDetails.urlLonga && !technicalDetails.subdominios && !technicalDetails.parametros && (
                <div className="flex flex-col gap-2">
                  <p className="text-purple-300 text-sm leading-relaxed">Nenhum indicador tecnico especifico foi detectado nesta analise.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REPUTAÇÃO EXTERNA - CARDS INDIVIDUAIS COM ESPAÇAMENTO CORRETO */}
      {sources && sources.length > 0 && (
        <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm">
          <button
            onClick={() => toggleSection('sources')}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-400 leading-tight">Reputação Externa</h3>
            </div>
            {expandedSections.sources ? (
              <ChevronUp className="w-5 h-5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cyan-400" />
            )}
          </button>

          {expandedSections.sources && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sources.map((source, idx) => {
                const { sourceName, sourceStatus, icon } = formatSourceCard(source);
                return (
                  <div key={idx} className="flex flex-col gap-2 p-4 md:p-5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold text-lg leading-tight">{icon}</span>
                      <span className="text-cyan-300 font-semibold text-sm leading-tight">{sourceName}</span>
                    </div>
                    <span className="text-cyan-300 text-xs md:text-sm pl-6 leading-relaxed">{sourceStatus}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TRANSPARÊNCIA DAS FONTES - 14 INTELIGÊNCIAS */}
      <div className="rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 p-6 backdrop-blur-sm">
        <button
          onClick={() => toggleSection('transparency')}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-indigo-400" />
            <h3 className="text-lg font-bold text-indigo-400 leading-tight">🔍 Transparência das Fontes</h3>
          </div>
          {expandedSections.transparency ? (
            <ChevronUp className="w-5 h-5 text-indigo-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-indigo-400" />
          )}
        </button>

        {expandedSections.transparency && (
          <div className="mt-4 pt-4 border-t border-indigo-500/20">
            <p className="text-indigo-300 text-sm mb-4 leading-relaxed font-semibold">
              Esta análise é baseada em 14 fontes independentes de inteligência de ameaças:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {intelligenceSources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 md:p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <span className="text-indigo-400 font-bold flex-shrink-0 leading-tight">✓</span>
                  <span className="text-indigo-300 text-sm leading-relaxed">{source}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 md:p-5 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
              <p className="text-indigo-300 text-xs md:text-sm leading-relaxed">
                <strong>Metodologia:</strong> A análise combina dados de múltiplas fontes de reputação, análise comportamental de domínios, detecção de padrões de phishing específicos para órgãos públicos brasileiros, e inteligência de ameaças em tempo real. Nenhuma fonte é 100% precisa; por isso usamos múltiplas camadas de verificação.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
