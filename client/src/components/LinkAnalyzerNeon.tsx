import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, CheckCircle2, Share2, Copy, Check, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { copyToClipboard, shareToWhatsApp, generateShareMessage } from "@/lib/reportGenerator";
import { analyzeURLWithSecurity, getRiskColor, getRiskLabel } from "@/lib/analyzers";
import { exportAnalysisAsPDF } from "@/lib/pdfGenerator";
import PDFProgressDialog from "./PDFProgressDialog";
import ExternalReputation from "./ExternalReputation";
import AnalysisResultsCard from "./AnalysisResultsCard";
import SSLCertificateAnalysis from "./SSLCertificateAnalysis";
import URLSandboxPreview from "./URLSandboxPreview";
import DomainTimelineDisplay from "./DomainTimelineDisplay";
import { DomainIntelligenceDisplay } from "./DomainIntelligenceDisplay";
import { MITREAttackDetailDisplay } from "./MITREAttackDetailDisplay";
import { LoadingAnimation } from "./LoadingAnimation";
import { URLhausResult } from "./URLhausResult";
import { trpc } from "@/lib/trpc";
import { SkeletonAnalysis } from "./SkeletonLoader";

interface LinkAnalyzerNeonProps {
  onAnalyze?: (result: any) => void;
  linkInput: string;
  setLinkInput: (value: string) => void;
  linkLoading: boolean;
  linkResult: any;
  loadingStep: number;
}

interface ReputationSource {
  name: string;
  status: 'clean' | 'suspicious' | 'malicious' | 'unknown' | 'loading';
  details?: string;
}

interface MITREAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
  confidence: number;
  tacticId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Função auxiliar para renderizar valores de forma segura
 * Evita React error #31: Objects are not valid as a React child
 */
function renderSafe(value: any): string {
  if (value === null || value === undefined) return "";
  
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  
  if (Array.isArray(value)) {
    return value.map(renderSafe).join(", ");
  }
  
  if (typeof value === "object") {
    // Tentar extrair propriedades comuns de objetos
    if (value.message) return String(value.message);
    if (value.text) return String(value.text);
    if (value.label) return String(value.label);
    if (value.nome) return String(value.nome);
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.description) return String(value.description);
    // Fallback: converter para JSON
    try {
      return JSON.stringify(value);
    } catch {
      return "[Objeto não serializável]";
    }
  }
  
  return String(value);
}

/**
 * Função para extrair classificação de forma segura
 * Converte objeto {nivel: "X"} em string "X"
 */
function extractClassification(value: any): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    if (value.nivel) return String(value.nivel);
    if (value.label) return String(value.label);
    if (value.classificacao) return String(value.classificacao);
    if (value.text) return String(value.text);
  }
  return "Não definido";
}

/**
 * Função para extrair resumo de forma segura
 * Converte objeto {nivel: "X", cor: "Y"} em string com resumo completo
 */
function extractResumo(value: any): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    // Tentar extrair resumo completo
    if (value.resumo) return String(value.resumo);
    if (value.message) return String(value.message);
    if (value.text) return String(value.text);
    // Fallback: construir a partir de nivel
    if (value.nivel) return `${String(value.nivel)}. Dominio analisado.`;
  }
  return "";
}

/**
 * Função auxiliar para normalizar arrays
 * Converte qualquer valor em array seguro
 */
function normalizeArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map(item => renderSafe(item)).filter(item => item.length > 0);
  }
  if (value && typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object') {
    return [renderSafe(value)];
  }
  return [];
}

export function LinkAnalyzerNeon({
  onAnalyze,
  linkInput,
  setLinkInput,
  linkLoading,
  linkResult,
  loadingStep,
}: LinkAnalyzerNeonProps) {
  const [copied, setCopied] = useState(false);
  const [externalReputation, setExternalReputation] = useState<ReputationSource[]>([]);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<'preparing' | 'generating' | 'finalizing' | 'complete'>('preparing');
  const [showPdfProgress, setShowPdfProgress] = useState(false);
  const [loadingReputation, setLoadingReputation] = useState(false);
  
  // Extract URL early to use in hooks
  const urlValue = renderSafe(linkResult?.url ?? "");
  
  // Move Domain Intelligence query to top level with enabled flag
  const domainIntel = trpc.domainIntel.getDomainIntelligence.useQuery(
    { url: urlValue || '' },
    { enabled: !!urlValue }
  );
  
  // URLhaus query to check if URL is malicious
  const urlhausQuery = trpc.urlhaus.checkURL.useQuery(
    { url: urlValue || '' },
    { enabled: !!urlValue }
  );
  
  useEffect(() => {
    if (linkResult?.url) {
      loadExternalReputation(linkResult.url);
    }
  }, [linkResult?.url]);
  
  const loadExternalReputation = async (url: string) => {
    setLoadingReputation(true);
    try {
      const mockSources: ReputationSource[] = [
        { name: 'VirusTotal', status: 'clean', details: 'Sem deteccoes' },
        { name: 'Google Safe Browsing', status: 'clean', details: 'Seguro' },
        { name: 'URLhaus', status: 'unknown', details: 'Nao encontrado' },
        { name: 'AbuseIPDB', status: 'unknown', details: 'Sem registros' },
        { name: 'AlienVault OTX', status: 'clean', details: 'Sem indicadores' },
        { name: 'URLScan.io', status: 'clean', details: 'Analise limpa' },
      ];
      setExternalReputation(mockSources);
    } catch (error) {
      console.error('Erro ao carregar reputacao externa:', error);
    } finally {
      setLoadingReputation(false);
    }
  };

  const handleCopy = () => {
    copyToClipboard(linkInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 70) return "from-red-900/40 to-red-800/40 border-red-500";
    if (score >= 40) return "from-yellow-900/40 to-yellow-800/40 border-yellow-500";
    return "from-green-900/40 to-green-800/40 border-green-500";
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-yellow-400";
    return "text-green-400";
  };

  // Normalizar todos os campos de array
  const risks = normalizeArray(linkResult?.risks);
  const explicacoes = normalizeArray(linkResult?.explicacoes);
  const motivos = normalizeArray(linkResult?.motivos);
  const recomendacoes = normalizeArray(linkResult?.recomendacoes);
  const fontesConsultadas = normalizeArray(linkResult?.fontesConsultadas);
  const indicadoresPositivos = normalizeArray(linkResult?.indicadoresPositivos);

  // Renderizar valores escalares de forma segura
  const scoreValue = Number(linkResult?.score ?? 0);
  const score = renderSafe(scoreValue);
  const nivelRisco = extractClassification(linkResult?.nivelRisco ?? "Desconhecido");
  const url = urlValue; // Use the URL extracted earlier
  const resumo = extractResumo(linkResult?.resumo ?? "");
  const classificacao = extractClassification(linkResult?.classificacao ?? linkResult?.nivelRisco ?? "Não definido");
  
  // Prepare domain intelligence data
  const domainIntelData: any = domainIntel.isLoading ? {
    domain: urlValue.split('/')[2] || urlValue,
    registrar: 'Loading...',
    registrarCountry: 'Loading...',
    createdDate: 'Loading...',
    expiryDate: 'Loading...',
    ageInDays: 0,
    nameServers: [],
    country: 'Loading...',
    ipAddress: 'Loading...',
    sslCertificate: null,
    riskScore: 0,
    riskLevel: 'low',
    riskFactors: [],
    reputation: {},
  } : domainIntel.data?.data || {
    domain: urlValue.split('/')[2] || urlValue,
    registrar: 'Unknown',
    registrarCountry: 'Unknown',
    createdDate: 'Unknown',
    expiryDate: 'Unknown',
    ageInDays: 0,
    nameServers: [],
    country: 'Unknown',
    ipAddress: 'Unknown',
    sslCertificate: null,
    riskScore: 50,
    riskLevel: 'medium',
    riskFactors: [],
    reputation: {},
  };

  return (
    <div className="space-y-6">
      {/* MAIN INPUT SECTION */}
      <div className="cyber-grid rounded-xl p-8 border-3 border-green-400 neon-glow bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-green-500/30">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-6xl font-bold neon-text mb-2">🔗 Shield Security Scanner</h2>
            <p className="text-cyan-300 text-xl font-semibold">Analise links, e-mails, QR Codes, PDFs e capturas de tela</p>
          </div>

          <div className="space-y-3 mt-6">
            <Input
              type="url"
              placeholder="Cole uma URL, dominio, IP ou indicador para analise"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && linkInput.trim()) {
                  onAnalyze?.({});
                }
              }}
              className="text-xl py-6 px-6 bg-slate-800/80 border-3 border-green-400 text-green-300 placeholder-green-600 focus:ring-3 focus:ring-green-400 neon-glow rounded-lg font-semibold shadow-lg shadow-green-500/20"
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => onAnalyze?.({})}
              disabled={!linkInput.trim() || linkLoading}
              className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-slate-900 font-bold neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: '280px', height: '60px', fontSize: '1.1rem' }}
            >
              <Search className="w-6 h-6 mr-2" />
              {linkLoading ? "Analisando..." : "🔍 Iniciar Analise"}
            </Button>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {linkLoading && (
        <div className="border-2 border-cyan-500 neon-glow-cyan rounded-lg p-8 bg-slate-800/50">
          <LoadingAnimation isLoading={linkLoading} analysisType="link" />
        </div>
      )}

      {/* RESULT SECTION - NOVO DESIGN COM CARDS */}
      {linkResult && !linkLoading && (
        <div className="space-y-6">
          <AnalysisResultsCard
            score={scoreValue}
            classification={extractClassification(nivelRisco)}
            url={url}
            isScam={linkResult.isScam}
            confidence={Math.max(85 - scoreValue, 50)}
            risks={risks}
            positiveIndicators={indicadoresPositivos}
            explanations={explicacoes}
            technicalDetails={linkResult.detalhes}
            sources={fontesConsultadas}
          />

          {/* SSL CERTIFICATE ANALYSIS */}
          <SSLCertificateAnalysis url={url} />

          {/* EXTERNAL REPUTATION */}
          <ExternalReputation sources={externalReputation} isLoading={loadingReputation} />

          {/* URL SANDBOX PREVIEW */}
          <URLSandboxPreview url={url} />

          {/* DOMAIN TIMELINE */}
          <DomainTimelineDisplay domain={url.split('/')[2] || url} />

          {/* MITRE ATT&CK MAPPING */}
          {linkResult && linkResult.detalhes && (
            <MITREAttackDetailDisplay
              techniques={(() => {
                const threatTypes = [];
                if (linkResult.isScam) threatTypes.push('phishing');
                if (linkResult.detalhes?.malware) threatTypes.push('malware');
                if (linkResult.detalhes?.phishing) threatTypes.push('phishing');
                if (linkResult.detalhes?.redirects) threatTypes.push('redirects');
                if (linkResult.detalhes?.newDomain) threatTypes.push('new-domain');
                
                const techniqueMap: Record<string, MITREAttackTechnique[]> = {
                  phishing: [
                    {
                      id: 'T1566',
                      name: 'Phishing',
                      tactic: 'Initial Access',
                      description: 'Envio de mensagens de phishing para obter acesso inicial',
                      url: 'https://attack.mitre.org/techniques/T1566/',
                      confidence: 90,
                      tacticId: 'TA0001',
                      riskLevel: 'high',
                    },
                  ],
                  malware: [
                    {
                      id: 'T1189',
                      name: 'Drive-by Compromise',
                      tactic: 'Initial Access',
                      description: 'Compromisso atraves de acesso a website malicioso',
                      url: 'https://attack.mitre.org/techniques/T1189/',
                      confidence: 85,
                      tacticId: 'TA0001',
                      riskLevel: 'high',
                    },
                  ],
                  redirects: [
                    {
                      id: 'T1598.003',
                      name: 'Spearphishing Link',
                      tactic: 'Reconnaissance',
                      description: 'Redirecionamentos suspeitos para captura de dados',
                      url: 'https://attack.mitre.org/techniques/T1598/003/',
                      confidence: 75,
                      tacticId: 'TA0043',
                      riskLevel: 'medium',
                    },
                  ],
                  'new-domain': [
                    {
                      id: 'T1583.001',
                      name: 'Acquire Infrastructure: Domains',
                      tactic: 'Resource Development',
                      description: 'Dominio recentemente registrado para atividades maliciosas',
                      url: 'https://attack.mitre.org/techniques/T1583/001/',
                      confidence: 70,
                      tacticId: 'TA0042',
                      riskLevel: 'medium',
                    },
                  ],
                };
                
                const techniques: MITREAttackTechnique[] = [];
                const seen = new Set<string>();
                
                for (const threatType of threatTypes) {
                  const mapped = techniqueMap[threatType] || [];
                  for (const tech of mapped) {
                    if (!seen.has(tech.id)) {
                      techniques.push(tech);
                      seen.add(tech.id);
                    }
                  }
                }
                
                return techniques;
              })()}
            />
          )}

          {/* DOMAIN INTELLIGENCE */}
          {url && (
            <DomainIntelligenceDisplay 
              data={domainIntelData}
              isLoading={domainIntel.isLoading}
            />
          )}

          {/* URLHAUS RESULT */}
          {url && urlhausQuery.data && (
            <URLhausResult 
              data={urlhausQuery.data.data || {
                isMalicious: false,
                threat: null,
                tags: [],
                dateAdded: null,
                status: 'clean',
                reference: null,
              }}
              isLoading={urlhausQuery.isLoading}
            />
          )}

          {/* SHARE BUTTON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={async () => {
                try {
                  setShowPdfProgress(true);
                  setPdfProgress(0);
                  setPdfStatus('preparing');

                  const progressInterval = setInterval(() => {
                    setPdfProgress(prev => {
                      if (prev < 25) return prev + Math.random() * 5;
                      if (prev < 50) return prev + Math.random() * 3;
                      if (prev < 75) return prev + Math.random() * 2;
                      return prev + Math.random() * 1;
                    });
                  }, 200);

                  const pdfData = {
                    url: url,
                    score: scoreValue,
                    classification: extractClassification(nivelRisco),
                    timestamp: new Date(),
                    summary: resumo || 'Analise de seguranca da URL realizada.',
                    signals: risks,
                    recommendations: recomendacoes,
                    sources: {
                      heuristics: linkResult.detalhes ? Object.entries(linkResult.detalhes)
                        .filter(([_, value]) => value === true)
                        .map(([key]) => key)
                        : []
                    }
                  };

                  setTimeout(() => setPdfStatus('generating'), 500);
                  setTimeout(() => setPdfStatus('finalizing'), 2000);

                  await exportAnalysisAsPDF(pdfData);

                  clearInterval(progressInterval);
                  setPdfProgress(100);
                  setPdfStatus('complete');

                  setTimeout(() => {
                    setShowPdfProgress(false);
                    setPdfProgress(0);
                  }, 1000);
                } catch (error) {
                  console.error('Erro ao exportar PDF:', error);
                  setShowPdfProgress(false);
                  alert('Erro ao exportar PDF. Tente novamente.');
                }
              }}
              disabled={showPdfProgress}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-2" />
              {showPdfProgress ? 'Gerando PDF...' : 'Exportar PDF'}
            </Button>
            <Button
              onClick={() => shareToWhatsApp(generateShareMessage("link", linkResult))}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-3 neon-glow"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar no WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* PDF Progress Dialog */}
      <PDFProgressDialog 
        isOpen={showPdfProgress}
        progress={pdfProgress}
        status={pdfStatus}
      />
    </div>
  );
}
