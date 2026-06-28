/**
 * Sistema de Pontuação com Pesos
 * Calcula score de risco baseado em múltiplos fatores com pesos específicos
 */

export interface ScoringFactor {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number; // 0-100
  description: string;
  icon: string;
}

export interface ScoringResult {
  totalScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  factors: ScoringFactor[];
  justification: string;
  confidence: number; // 0-100
  recommendations: string[];
}

/**
 * Fatores de risco com pesos
 */
const RISK_FACTORS = {
  // Domínio
  recentlyCreated: { weight: 15, severity: 'high', icon: '📅' },
  suspiciousTLD: { weight: 10, severity: 'medium', icon: '🌐' },
  noWhois: { weight: 8, severity: 'medium', icon: '❓' },
  
  // URL
  urlLength: { weight: 5, severity: 'low', icon: '📏' },
  manyNumbers: { weight: 8, severity: 'medium', icon: '🔢' },
  suspiciousCharacters: { weight: 12, severity: 'high', icon: '🔤' },
  typosquatting: { weight: 20, severity: 'critical', icon: '🎭' },
  
  // Redirecionamentos
  redirects: { weight: 10, severity: 'medium', icon: '↪️' },
  shortUrl: { weight: 8, severity: 'medium', icon: '🔗' },
  
  // Reputação
  blacklisted: { weight: 30, severity: 'critical', icon: '🚫' },
  phishingDetected: { weight: 25, severity: 'critical', icon: '🎣' },
  malwareDetected: { weight: 35, severity: 'critical', icon: '🦠' },
  abuseReported: { weight: 20, severity: 'high', icon: '🚨' },
};

/**
 * Calcular score com pesos
 */
export function calculateWeightedScore(factors: ScoringFactor[]): ScoringResult {
  let totalWeight = 0;
  let weightedSum = 0;
  const detectedFactors: ScoringFactor[] = [];

  for (const factor of factors) {
    // Converter severidade em pontos (0-100)
    const severityPoints = {
      'low': 20,
      'medium': 50,
      'high': 75,
      'critical': 100,
    }[factor.severity];

    const contribution = (factor.weight * severityPoints) / 100;
    weightedSum += contribution;
    totalWeight += factor.weight;
    detectedFactors.push(factor);
  }

  // Normalizar score (0-100)
  const totalScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  // Determinar nível de risco
  const riskLevel = getRiskLevel(totalScore);

  // Gerar justificativa
  const justification = generateJustification(detectedFactors, totalScore);

  // Calcular confiança (baseado em número de fatores detectados)
  const confidence = Math.min(100, 50 + (detectedFactors.length * 10));

  // Gerar recomendações
  const recommendations = generateRecommendations(riskLevel, detectedFactors);

  return {
    totalScore,
    riskLevel,
    factors: detectedFactors,
    justification,
    confidence,
    recommendations,
  };
}

/**
 * Determinar nível de risco baseado no score
 */
function getRiskLevel(score: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 15) return 'safe';
  if (score <= 30) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

/**
 * Gerar justificativa textual do score
 */
function generateJustification(factors: ScoringFactor[], score: number): string {
  if (factors.length === 0) {
    return 'Nenhum fator de risco detectado. URL aparenta ser segura.';
  }

  const criticalFactors = factors.filter(f => f.severity === 'critical');
  const highFactors = factors.filter(f => f.severity === 'high');
  const mediumFactors = factors.filter(f => f.severity === 'medium');

  let justification = '';

  if (criticalFactors.length > 0) {
    justification += `⚠️ Detectados ${criticalFactors.length} fator(es) crítico(s): ${criticalFactors.map(f => f.name).join(', ')}. `;
  }

  if (highFactors.length > 0) {
    justification += `⚠️ Detectados ${highFactors.length} fator(es) de alto risco: ${highFactors.map(f => f.name).join(', ')}. `;
  }

  if (mediumFactors.length > 0) {
    justification += `⚠️ Detectados ${mediumFactors.length} fator(es) de médio risco: ${mediumFactors.map(f => f.name).join(', ')}. `;
  }

  return justification.trim();
}

/**
 * Gerar recomendações baseadas no risco
 */
function generateRecommendations(
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical',
  factors: ScoringFactor[]
): string[] {
  const recommendations: string[] = [];

  switch (riskLevel) {
    case 'safe':
      recommendations.push('✅ URL aparenta ser segura');
      recommendations.push('✅ Você pode clicar com confiança');
      break;

    case 'low':
      recommendations.push('⚠️ Risco baixo detectado');
      recommendations.push('✅ Provavelmente seguro, mas fique atento');
      break;

    case 'medium':
      recommendations.push('⚠️ Risco médio detectado');
      recommendations.push('❌ Não clique em links suspeitos');
      recommendations.push('⚠️ Confirme com o remetente antes de clicar');
      break;

    case 'high':
      recommendations.push('🚨 Alto risco detectado');
      recommendations.push('❌ NÃO clique neste link');
      recommendations.push('❌ NÃO informe dados pessoais ou senhas');
      recommendations.push('⚠️ Confirme com o remetente por telefone');
      break;

    case 'critical':
      recommendations.push('🚨 RISCO CRÍTICO DETECTADO');
      recommendations.push('❌ NÃO clique neste link');
      recommendations.push('❌ NÃO informe dados pessoais, senhas ou dados bancários');
      recommendations.push('⚠️ Denuncie este link como phishing/malware');
      recommendations.push('⚠️ Confirme com o remetente por telefone');
      break;
  }

  return recommendations;
}

/**
 * Formatar score para exibição visual
 */
export function formatScoreForDisplay(score: number): {
  level: string;
  color: string;
  emoji: string;
  percentage: string;
} {
  const riskLevel = getRiskLevel(score);

  const display = {
    'safe': { level: 'Seguro', color: 'green', emoji: '🟢', percentage: `${score}%` },
    'low': { level: 'Baixo Risco', color: 'green', emoji: '🟢', percentage: `${score}%` },
    'medium': { level: 'Médio Risco', color: 'yellow', emoji: '🟡', percentage: `${score}%` },
    'high': { level: 'Alto Risco', color: 'orange', emoji: '🔴', percentage: `${score}%` },
    'critical': { level: 'Crítico', color: 'red', emoji: '🔴', percentage: `${score}%` },
  };

  return display[riskLevel];
}

/**
 * Criar fator de risco
 */
export function createRiskFactor(
  name: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  icon: string = '⚠️'
): ScoringFactor {
  const factorConfig = Object.values(RISK_FACTORS).find(f => f.severity === severity);
  const weight = factorConfig?.weight || 10;

  return {
    name,
    severity,
    weight,
    description,
    icon,
  };
}
