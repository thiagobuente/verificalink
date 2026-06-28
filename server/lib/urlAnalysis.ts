/**
 * URL Analysis with Trusted Domains Whitelist
 * Integra análise de phishing com whitelist de domínios confiáveis
 */

import {
  isTrustedDomain,
  getTrustedDomainInfo,
  shouldSkipPhishingHeuristics,
  extractMainDomain,
  extractRootDomain,
  isURLFromTrustedDomain,
} from './trustedDomains';

export interface URLAnalysisResult {
  url: string;
  isTrusted: boolean;
  domain: string;
  rootDomain: string;
  trustInfo: {
    provider?: string;
    category?: string;
    description?: string;
  } | null;
  phishingRiskScore: number;
  phishingIndicators: string[];
  shouldSkipPhishingHeuristics: boolean;
  recommendation: string;
}

/**
 * Analisar URL com verificação de whitelist
 */
export function analyzeURLWithWhitelist(url: string): URLAnalysisResult {
  const mainDomain = extractMainDomain(url);
  const rootDomain = extractRootDomain(mainDomain);
  const isTrusted = isURLFromTrustedDomain(url);
  const trustInfo = isTrustedDomain(mainDomain) ? getTrustedDomainInfo(mainDomain) : null;
  const skipPhishing = shouldSkipPhishingHeuristics(mainDomain);

  let phishingRiskScore = 0;
  const phishingIndicators: string[] = [];

  // Se é domínio confiável, não aplicar heurísticas de phishing
  if (isTrusted && skipPhishing) {
    return {
      url,
      isTrusted,
      domain: mainDomain,
      rootDomain,
      trustInfo: trustInfo ? {
        provider: trustInfo.provider,
        category: trustInfo.category,
        description: trustInfo.description,
      } : null,
      phishingRiskScore: 0,
      phishingIndicators: [],
      shouldSkipPhishingHeuristics: true,
      recommendation: `Domínio confiável de ${trustInfo?.provider}. Seguro para clicar.`,
    };
  }

  // Aplicar heurísticas de phishing
  if (!isTrusted) {
    // 1. Verificar URL encurtada
    if (isURLShortener(mainDomain)) {
      phishingRiskScore += 30;
      phishingIndicators.push('URL encurtada detectada - pode ocultar destino real');
    }

    // 2. Verificar subdomínios suspeitos
    const suspiciousSubdomains = checkSuspiciousSubdomains(mainDomain);
    if (suspiciousSubdomains.length > 0) {
      phishingRiskScore += 20;
      phishingIndicators.push(`Subdomínios suspeitos: ${suspiciousSubdomains.join(', ')}`);
    }

    // 3. Verificar caracteres homógrafos (lookalike)
    if (hasHomoglyphAttack(mainDomain)) {
      phishingRiskScore += 25;
      phishingIndicators.push('Domínio contém caracteres semelhantes a marcas conhecidas (homoglifo)');
    }

    // 4. Verificar TLD suspeito
    if (isSuspiciousTLD(mainDomain)) {
      phishingRiskScore += 15;
      phishingIndicators.push('TLD (extensão) suspeita ou incomum');
    }

    // 5. Verificar números em domínio
    if (hasNumbersInDomain(mainDomain)) {
      phishingRiskScore += 10;
      phishingIndicators.push('Domínio contém números (comum em phishing)');
    }

    // 6. Verificar hífens em domínio
    if (hasTooManyHyphens(mainDomain)) {
      phishingRiskScore += 10;
      phishingIndicators.push('Domínio contém múltiplos hífens (comum em phishing)');
    }
  }

  // Limitar score a 100
  phishingRiskScore = Math.min(100, phishingRiskScore);

  // Gerar recomendação
  let recommendation = '';
  if (isTrusted) {
    recommendation = `Domínio confiável de ${trustInfo?.provider}. Seguro para clicar.`;
  } else if (phishingRiskScore >= 70) {
    recommendation = '⚠️ ALTO RISCO: Este domínio apresenta características de phishing. NÃO clique!';
  } else if (phishingRiskScore >= 40) {
    recommendation = '⚠️ RISCO MODERADO: Verifique o domínio antes de clicar. Desconfie de pedidos de dados pessoais.';
  } else if (phishingRiskScore > 0) {
    recommendation = 'ℹ️ RISCO BAIXO: Domínio parece legítimo, mas sempre verifique por ligação antes de compartilhar dados.';
  } else {
    recommendation = '✓ Domínio parece seguro, mas sempre desconfie de links inesperados.';
  }

  return {
    url,
    isTrusted,
    domain: mainDomain,
    rootDomain,
    trustInfo: trustInfo ? {
      provider: trustInfo.provider,
      category: trustInfo.category,
      description: trustInfo.description,
    } : null,
    phishingRiskScore,
    phishingIndicators,
    shouldSkipPhishingHeuristics: skipPhishing,
    recommendation,
  };
}

/**
 * Verificar se é URL encurtada
 */
function isURLShortener(domain: string): boolean {
  const shorteners = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'short.link',
    'buff.ly', 'adf.ly', 'rebrand.ly', 'clck.ru', 'qr.ae',
    'is.gd', 'soo.gd', 'tiny.cc', 'tr.im', 'twurl.nl',
  ];
  
  return shorteners.some(s => domain.toLowerCase().includes(s.toLowerCase()));
}

/**
 * Verificar subdomínios suspeitos
 */
function checkSuspiciousSubdomains(domain: string): string[] {
  const suspicious: string[] = [];
  const parts = domain.split('.');
  
  if (parts.length > 2) {
    const subdomains = parts.slice(0, -2);
    
    // Verificar subdomínios que parecem ser marcas conhecidas
    const knownBrands = ['paypal', 'amazon', 'apple', 'google', 'microsoft', 'facebook', 'bank', 'secure', 'verify', 'confirm', 'update', 'login'];
    
    subdomains.forEach(sub => {
      if (knownBrands.some(brand => sub.toLowerCase().includes(brand))) {
        suspicious.push(sub);
      }
    });
  }
  
  return suspicious;
}

/**
 * Verificar ataque de homoglifo (caracteres semelhantes)
 */
function hasHomoglyphAttack(domain: string): boolean {
  // Caracteres que parecem semelhantes: 0 (zero) vs O (letra O), 1 (um) vs l (L minúsculo), etc
  const homoglyphPatterns = [
    /0o/i, // zero + letra O
    /1l/i, // um + L minúsculo
    /rn/i, // r + n (parecem m)
  ];
  
  return homoglyphPatterns.some(pattern => pattern.test(domain));
}

/**
 * Verificar TLD suspeito
 */
function isSuspiciousTLD(domain: string): boolean {
  const suspiciousTLDs = [
    '.tk', '.ml', '.ga', '.cf', // TLDs gratuitos
    '.work', '.download', '.review', '.trade', '.science', // TLDs genéricos suspeitos
  ];
  
  return suspiciousTLDs.some(tld => domain.toLowerCase().endsWith(tld));
}

/**
 * Verificar números em domínio
 */
function hasNumbersInDomain(domain: string): boolean {
  // Remover TLD
  const parts = domain.split('.');
  const mainPart = parts[0];
  
  return /\d/.test(mainPart);
}

/**
 * Verificar múltiplos hífens
 */
function hasTooManyHyphens(domain: string): boolean {
  const parts = domain.split('.');
  const mainPart = parts[0];
  
  return (mainPart.match(/-/g) || []).length >= 2;
}

/**
 * Calcular score de confiança geral (0-100)
 */
export function calculateTrustScore(analysisResult: URLAnalysisResult): number {
  if (analysisResult.isTrusted) {
    return 100;
  }
  
  return 100 - analysisResult.phishingRiskScore;
}

/**
 * Obter cor de risco
 */
export function getRiskColor(score: number): string {
  if (score >= 70) return 'red'; // Alto risco
  if (score >= 40) return 'yellow'; // Risco moderado
  if (score > 0) return 'orange'; // Risco baixo
  return 'green'; // Seguro
}

/**
 * Obter emoji de risco
 */
export function getRiskEmoji(score: number): string {
  if (score >= 70) return '🚨'; // Alto risco
  if (score >= 40) return '⚠️'; // Risco moderado
  if (score > 0) return 'ℹ️'; // Risco baixo
  return '✓'; // Seguro
}
