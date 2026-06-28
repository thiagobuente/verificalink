/**
 * Hybrid Security Scoring Engine - Motor Avançado de Pontuação
 * Combina 12+ fatores de risco de múltiplas fontes (heurísticas, APIs, reputação)
 * Score final: 0-100 com justificativa textual e recomendações personalizadas
 * 
 * Pesos:
 * - Heurísticas locais: 30%
 * - VirusTotal: 25%
 * - AbuseIPDB: 20%
 * - URLhaus: 15%
 * - Whitelist: Redutor de risco
 */

import { VirusTotalResult, calculateVirusTotalRiskScore } from '../integrations/virustotal';
import { AbuseIPDBAnalysis, calculateAbuseIPDBRiskScore } from '../integrations/abuseipdb';
import { URLhausAnalysis, calculateURLhausRiskScore } from '../integrations/urlhaus';
import { isTrustedDomain, extractMainDomain } from './trustedDomains';

export interface RiskSignal {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  description: string;
  icon: string;
  source: 'heuristic' | 'virustotal' | 'abuseipdb' | 'urlhaus' | 'whitelist';
}

export interface HybridScoringResult {
  url: string;
  finalScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  classification: string;
  signals: RiskSignal[];
  justification: string;
  recommendations: string[];
  confidence: number; // 0-100
  sources: {
    heuristics: boolean;
    virusTotal: boolean;
    abuseIPDB: boolean;
    urlhaus: boolean;
    whitelist: boolean;
  };
}

/**
 * Calcular score híbrido combinando múltiplas fontes
 */
export function calculateHybridScore(
  url: string,
  heuristics: {
    isShortURL: boolean;
    suspiciousTLD: boolean;
    excessiveSubdomains: number;
    typosquatting: boolean;
    manyNumbers: boolean;
    suspiciousCharacters: boolean;
  },
  virusTotal: VirusTotalResult | null,
  abuseIPDB: AbuseIPDBAnalysis | null,
  urlhaus: URLhausAnalysis | null
): HybridScoringResult {
  const signals: RiskSignal[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  const mainDomain = extractMainDomain(url);
  const isTrusted = isTrustedDomain(mainDomain);

  // ============================================
  // 1. HEURÍSTICAS LOCAIS (30%)
  // ============================================
  
  if (heuristics.isShortURL && !isTrusted) {
    signals.push({
      name: 'URL Encurtada',
      severity: 'medium',
      weight: 5,
      description: 'URL encurtada detectada - pode ocultar destino real',
      icon: '🔗',
      source: 'heuristic',
    });
    totalScore += 5 * 50;
    totalWeight += 5;
  }

  if (heuristics.suspiciousTLD && !isTrusted) {
    signals.push({
      name: 'TLD Suspeito',
      severity: 'medium',
      weight: 4,
      description: 'Domínio usa TLD gratuito ou suspeito (.tk, .ml, .ga, .cf)',
      icon: '🌐',
      source: 'heuristic',
    });
    totalScore += 4 * 50;
    totalWeight += 4;
  }

  if (heuristics.excessiveSubdomains > 2 && !isTrusted) {
    signals.push({
      name: 'Excesso de Subdomínios',
      severity: 'high',
      weight: 6,
      description: `${heuristics.excessiveSubdomains} subdomínios detectados - padrão de phishing`,
      icon: '📊',
      source: 'heuristic',
    });
    totalScore += 6 * 75;
    totalWeight += 6;
  }

  if (heuristics.typosquatting && !isTrusted) {
    signals.push({
      name: 'Typosquatting Detectado',
      severity: 'critical',
      weight: 8,
      description: 'Domínio parece imitar marca conhecida com pequenas variações',
      icon: '🎭',
      source: 'heuristic',
    });
    totalScore += 8 * 100;
    totalWeight += 8;
  }

  if (heuristics.manyNumbers && !isTrusted) {
    signals.push({
      name: 'Muitos Números',
      severity: 'low',
      weight: 3,
      description: 'URL contém muitos números - padrão comum em phishing',
      icon: '🔢',
      source: 'heuristic',
    });
    totalScore += 3 * 20;
    totalWeight += 3;
  }

  if (heuristics.suspiciousCharacters && !isTrusted) {
    signals.push({
      name: 'Caracteres Suspeitos',
      severity: 'medium',
      weight: 4,
      description: 'URL contém caracteres incomuns ou codificados',
      icon: '🔤',
      source: 'heuristic',
    });
    totalScore += 4 * 50;
    totalWeight += 4;
  }

  // ============================================
  // 2. VIRUSTOTAL (25%)
  // ============================================
  
  if (virusTotal) {
    const vtScore = calculateVirusTotalRiskScore(virusTotal);
    
    if (virusTotal.maliciousCount > 0) {
      signals.push({
        name: `VirusTotal: ${virusTotal.maliciousCount}/${virusTotal.totalEngines} Detecções`,
        severity: 'critical',
        weight: 25,
        description: `${virusTotal.maliciousCount} motores antivírus detectaram malware`,
        icon: '🦠',
        source: 'virustotal',
      });
      totalScore += 25 * vtScore;
      totalWeight += 25;
    } else if (virusTotal.suspiciousCount > 0) {
      signals.push({
        name: `VirusTotal: ${virusTotal.suspiciousCount} Suspeitas`,
        severity: 'high',
        weight: 17,
        description: `${virusTotal.suspiciousCount} motores marcaram como suspeito`,
        icon: '⚠️',
        source: 'virustotal',
      });
      totalScore += 17 * (vtScore * 0.7);
      totalWeight += 17;
    }
  }

  // ============================================
  // 3. ABUSEIPDB (20%)
  // ============================================
  
  if (abuseIPDB) {
    const abuseScore = calculateAbuseIPDBRiskScore(abuseIPDB);
    
    if (abuseIPDB.totalReports > 0) {
      signals.push({
        name: `AbuseIPDB: ${abuseIPDB.totalReports} Denúncias`,
        severity: abuseScore >= 75 ? 'critical' : 'high',
        weight: 20,
        description: `IP ${abuseIPDB.ip} tem ${abuseIPDB.totalReports} denúncias de abuso (Score: ${abuseScore}%)`,
        icon: '🚨',
        source: 'abuseipdb',
      });
      totalScore += 20 * abuseScore;
      totalWeight += 20;
    }
  }

  // ============================================
  // 4. URLHAUS (15%)
  // ============================================
  
  if (urlhaus && urlhaus.isInDatabase) {
    const uhScore = calculateURLhausRiskScore(urlhaus);
    
    signals.push({
      name: `URLhaus: ${urlhaus.threat}`,
      severity: 'critical',
      weight: 15,
      description: `URL identificada como ${urlhaus.threat} no banco de dados URLhaus`,
      icon: '🚫',
      source: 'urlhaus',
    });
    totalScore += 15 * uhScore;
    totalWeight += 15;
  }

  // ============================================
  // 5. WHITELIST (Redutor de risco)
  // ============================================
  
  if (isTrusted) {
    signals.push({
      name: 'Domínio Confiável',
      severity: 'low',
      weight: 0,
      description: `Domínio ${mainDomain} está na lista de domínios confiáveis`,
      icon: '✅',
      source: 'whitelist',
    });
    // Reduzir score em 50% se domínio é confiável
    totalScore *= 0.5;
  }

  // ============================================
  // CALCULAR SCORE FINAL
  // ============================================
  
  const finalScore = totalWeight > 0 
    ? Math.round((totalScore / totalWeight) * 100)
    : 0;

  const normalizedScore = Math.max(0, Math.min(100, finalScore));
  const riskLevel = getRiskLevel(normalizedScore);
  const classification = getClassification(riskLevel, normalizedScore);
  const justification = generateJustification(signals, normalizedScore, isTrusted);
  const recommendations = generateRecommendations(riskLevel, signals);

  const sourcesCount = [
    signals.some(s => s.source === 'heuristic'),
    virusTotal !== null,
    abuseIPDB !== null,
    urlhaus !== null,
  ].filter(Boolean).length;
  const confidence = Math.min(100, 50 + (sourcesCount * 12));

  return {
    url,
    finalScore: normalizedScore,
    riskLevel,
    classification,
    signals,
    justification,
    recommendations,
    confidence,
    sources: {
      heuristics: signals.some(s => s.source === 'heuristic'),
      virusTotal: virusTotal !== null,
      abuseIPDB: abuseIPDB !== null,
      urlhaus: urlhaus !== null,
      whitelist: isTrusted,
    },
  };
}

function getRiskLevel(score: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 15) return 'safe';
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

function getClassification(riskLevel: string, score: number): string {
  const classifications: Record<string, string> = {
    'safe': `🟢 Seguro (${score}%)`,
    'low': `🟢 Baixo Risco (${score}%)`,
    'medium': `🟡 Risco Moderado (${score}%)`,
    'high': `🟠 Alto Risco (${score}%)`,
    'critical': `🔴 Crítico (${score}%)`,
  };
  return classifications[riskLevel] || `❓ Desconhecido (${score}%)`;
}

function generateJustification(signals: RiskSignal[], score: number, isTrusted: boolean): string {
  if (signals.length === 0) {
    return 'Nenhum fator de risco detectado. URL aparenta ser segura.';
  }

  const criticalSignals = signals.filter(s => s.severity === 'critical');
  const highSignals = signals.filter(s => s.severity === 'high');

  let justification = '';

  if (isTrusted && score < 30) {
    justification += '✅ Domínio confiável detectado. ';
  }

  if (criticalSignals.length > 0) {
    justification += `🚨 ${criticalSignals.length} fator(es) crítico(s) detectado(s). `;
  }

  if (highSignals.length > 0) {
    justification += `⚠️ ${highSignals.length} fator(es) de alto risco. `;
  }

  return justification.trim() || 'Análise concluída com múltiplas fontes.';
}

function generateRecommendations(riskLevel: string, signals: RiskSignal[]): string[] {
  const recommendations: string[] = [];

  switch (riskLevel) {
    case 'safe':
      recommendations.push('✅ Nenhum sinal crítico foi identificado');
      recommendations.push('✅ Você pode clicar com confiança');
      break;
    case 'low':
      recommendations.push('⚠️ Há sinais leves de risco');
      recommendations.push('✅ Provavelmente seguro, mas fique atento');
      break;
    case 'medium':
      recommendations.push('⚠️ Há sinais que merecem atenção');
      recommendations.push('❌ Verifique o remetente antes de clicar');
      break;
    case 'high':
      recommendations.push('🚨 Evite clicar ou informar dados pessoais');
      recommendations.push('❌ Confirme por canal oficial com o remetente');
      break;
    case 'critical':
      recommendations.push('🚨 NÃO CLIQUE - Forte indicação de golpe');
      recommendations.push('❌ NÃO informe dados pessoais ou senhas');
      recommendations.push('⚠️ Denuncie como phishing/malware');
      break;
  }

  return recommendations;
}
