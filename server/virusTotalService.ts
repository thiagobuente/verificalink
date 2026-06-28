/**
 * VirusTotal Service
 * Verifies file hashes against VirusTotal database for known malware
 */

import { invokeLLM } from './core/llm';

export interface VirusTotalResult {
  hash: string;
  found: boolean;
  detections: number;
  vendors: number;
  lastAnalysisDate?: Date;
  malwareNames: string[];
  threatCategories: string[];
  riskLevel: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  vendors_detected: {
    vendor: string;
    category: string;
    engine_name: string;
  }[];
}

export interface VirusTotalAnalysis {
  result: VirusTotalResult;
  recommendations: string[];
  shouldBlock: boolean;
}

/**
 * Calculate SHA-256 hash of file (done on client side)
 * This function is for reference - actual hashing happens in PDFAnalyzer component
 */
export function getHashAlgorithm(): string {
  return 'SHA-256';
}

/**
 * Query VirusTotal API for file hash
 * Uses the built-in Manus API integration
 */
export async function queryVirusTotal(fileHash: string): Promise<VirusTotalResult> {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      throw new Error('VirusTotal API key not configured');
    }

    // Call VirusTotal API via fetch
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      // File not found in VirusTotal database
      return {
        hash: fileHash,
        found: false,
        detections: 0,
        vendors: 0,
        malwareNames: [],
        threatCategories: [],
        riskLevel: 'unknown',
        vendors_detected: [],
      };
    }

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.statusText}`);
    }

    const data = await response.json();
    const attributes = data.data?.attributes || {};
    const stats = attributes.last_analysis_stats || {};
    const results = attributes.last_analysis_results || {};

    // Extract detected malware names and categories
    const malwareNames = new Set<string>();
    const threatCategories = new Set<string>();
    const vendors_detected: VirusTotalResult["vendors_detected"] = [];

    Object.entries(results).forEach(([vendor, result]: [string, any]) => {
      if (result.category !== 'undetected') {
        malwareNames.add(result.result || vendor);
        threatCategories.add(result.category);
        vendors_detected.push({
          vendor,
          category: result.category,
          engine_name: result.engine_name || vendor,
        });
      }
    });

    const detections = stats.malicious || 0;
    const totalVendors = Object.keys(results).length;

    // Determine risk level
    let riskLevel: 'clean' | 'suspicious' | 'malicious' | 'unknown' = 'clean';
    if (detections >= 5) {
      riskLevel = 'malicious';
    } else if (detections >= 2) {
      riskLevel = 'suspicious';
    } else if (detections > 0) {
      riskLevel = 'suspicious';
    }

    return {
      hash: fileHash,
      found: true,
      detections,
      vendors: totalVendors,
      lastAnalysisDate: attributes.last_analysis_date
        ? new Date(attributes.last_analysis_date * 1000)
        : undefined,
      malwareNames: Array.from(malwareNames),
      threatCategories: Array.from(threatCategories),
      riskLevel,
      vendors_detected,
    };
  } catch (error) {
    console.error('VirusTotal query error:', error);
    throw new Error(`Falha ao consultar VirusTotal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Analyze VirusTotal result and provide recommendations
 */
export function analyzeVirusTotalResult(result: VirusTotalResult): VirusTotalAnalysis {
  const recommendations: string[] = [];
  let shouldBlock = false;

  if (!result.found) {
    recommendations.push('✅ Arquivo não encontrado no banco de dados do VirusTotal');
    recommendations.push('💡 Isso significa que o arquivo é novo ou não foi analisado anteriormente');
  } else if (result.riskLevel === 'clean') {
    recommendations.push('✅ Arquivo não detectado como malware por nenhum antivírus');
    recommendations.push('✓ Nenhuma ameaça conhecida identificada');
  } else if (result.riskLevel === 'suspicious') {
    recommendations.push('⚠️ ATENÇÃO: Arquivo detectado como suspeito por ' + result.detections + ' antivírus(es)');
    recommendations.push('🛑 NÃO abra este arquivo a menos que você confie completamente na origem');
    recommendations.push('📋 Malwares detectados: ' + result.malwareNames.join(', '));
    shouldBlock = true;
  } else if (result.riskLevel === 'malicious') {
    recommendations.push('🚨 CRÍTICO: Arquivo detectado como MALICIOSO por ' + result.detections + ' antivírus(es)');
    recommendations.push('🛑 BLOQUEADO: Não abra este arquivo sob nenhuma circunstância');
    recommendations.push('📋 Malwares detectados: ' + result.malwareNames.join(', '));
    recommendations.push('📞 Reporte este arquivo às autoridades de segurança');
    shouldBlock = true;
  }

  // Add category-specific recommendations
  if (result.threatCategories.includes('trojan')) {
    recommendations.push('🦠 Trojan detectado: Pode roubar dados ou controlar seu computador');
  }
  if (result.threatCategories.includes('ransom')) {
    recommendations.push('🔐 Ransomware detectado: Pode criptografar seus arquivos');
  }
  if (result.threatCategories.includes('worm')) {
    recommendations.push('🐛 Worm detectado: Pode se replicar e infectar outros arquivos');
  }
  if (result.threatCategories.includes('spyware')) {
    recommendations.push('👁️ Spyware detectado: Pode monitorar suas atividades');
  }
  if (result.threatCategories.includes('adware')) {
    recommendations.push('📢 Adware detectado: Pode exibir anúncios indesejados');
  }

  return {
    result,
    recommendations,
    shouldBlock,
  };
}

/**
 * Get risk color based on VirusTotal result
 */
export function getVirusTotalRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'malicious':
      return 'from-red-600/20 to-red-900/20 border-red-500/30';
    case 'suspicious':
      return 'from-orange-600/20 to-orange-900/20 border-orange-500/30';
    case 'unknown':
      return 'from-yellow-600/20 to-yellow-900/20 border-yellow-500/30';
    case 'clean':
      return 'from-green-600/20 to-green-900/20 border-green-500/30';
    default:
      return 'from-slate-600/20 to-slate-900/20 border-slate-500/30';
  }
}

/**
 * Get risk icon based on VirusTotal result
 */
export function getVirusTotalRiskIcon(riskLevel: string): string {
  switch (riskLevel) {
    case 'malicious':
      return '🚨';
    case 'suspicious':
      return '⚠️';
    case 'unknown':
      return '❓';
    case 'clean':
      return '✅';
    default:
      return '❓';
  }
}

/**
 * Get risk label based on VirusTotal result
 */
export function getVirusTotalRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'malicious':
      return 'MALICIOSO';
    case 'suspicious':
      return 'SUSPEITO';
    case 'unknown':
      return 'DESCONHECIDO';
    case 'clean':
      return 'LIMPO';
    default:
      return 'DESCONHECIDO';
  }
}
