/**
 * VirusTotal Integration - Análise Profunda Completa
 * Integração com API v3 do VirusTotal para análise contra 90+ antivírus
 * Retorna: detecções, suspeitas, limpas, data, reputação, link para relatório
 */

import axios from 'axios';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3';

export interface VirusTotalAnalysisStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
}

export interface VirusTotalDetection {
  engine: string;
  result: string;
  category: string;
}

export interface VirusTotalResult {
  url: string;
  analysisId: string;
  
  // Estatísticas de detecção
  totalEngines: number;
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount: number;
  undetectedCount: number;
  
  // Reputação e data
  reputation: number;
  lastAnalysisDate: string;
  
  // Detecções detalhadas (top 10)
  detections: VirusTotalDetection[];
  
  // Veredicto
  verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'HARMLESS' | 'UNDETECTED';
  
  // Link para relatório externo
  reportUrl: string;
}

/**
 * Analisar URL com VirusTotal - Integração Completa
 * Retorna análise contra 90+ antivírus com todas as informações
 */
export async function analyzeURLWithVirusTotal(url: string): Promise<VirusTotalResult | null> {
  try {
    if (!VIRUSTOTAL_API_KEY) {
      console.warn('⚠️ VirusTotal API key não configurada');
      return null;
    }

    console.log(`🔍 Analisando URL com VirusTotal: ${url}`);

    // 1. Submeter URL para análise
    const encodedURL = new URLSearchParams();
    encodedURL.append('url', url);

    const submitResponse = await axios.post(
      `${VIRUSTOTAL_API_URL}/urls`,
      encodedURL,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    const analysisId = submitResponse.data.data.id;
    console.log(`📊 Analysis ID: ${analysisId}`);

    // 2. Aguardar e recuperar resultados (com retry)
    let analysis: any = null;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        const analysisResponse = await axios.get(
          `${VIRUSTOTAL_API_URL}/analyses/${analysisId}`,
          {
            headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
            timeout: 10000,
          }
        );

        const attributes = analysisResponse.data.data.attributes;
        
        // Verificar se análise foi concluída
        if (attributes.status === 'completed' && attributes.stats) {
          analysis = analysisResponse.data.data;
          console.log(`✅ Análise concluída`);
          break;
        }

        console.log(`⏳ Análise em progresso (tentativa ${retries + 1}/${maxRetries})`);
        retries++;
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error('❌ Falha ao obter análise após retries');
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!analysis) {
      console.warn('⚠️ Análise não disponível');
      return null;
    }

    const attributes = analysis.attributes;
    const stats = attributes.stats as VirusTotalAnalysisStats;
    const totalEngines = stats.malicious + stats.suspicious + stats.harmless + stats.undetected + (stats.timeout || 0);

    // 3. Extrair detecções (top 10)
    const detections: VirusTotalDetection[] = [];
    if (attributes.last_analysis_results) {
      Object.entries(attributes.last_analysis_results).forEach(([engine, result]: [string, any]) => {
        if (result.result && result.result !== 'undetected' && detections.length < 10) {
          detections.push({
            engine: result.engine_name || engine,
            result: result.result,
            category: result.category || 'unknown',
          });
        }
      });
    }

    // 4. Determinar veredicto
    let verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'HARMLESS' | 'UNDETECTED' = 'HARMLESS';
    if (stats.malicious > 0) {
      verdict = 'MALICIOUS';
    } else if (stats.suspicious > 0) {
      verdict = 'SUSPICIOUS';
    } else if (stats.undetected > 0 && stats.harmless === 0) {
      verdict = 'UNDETECTED';
    }

    // 5. Construir resultado completo
    const result: VirusTotalResult = {
      url,
      analysisId,
      totalEngines,
      maliciousCount: stats.malicious,
      suspiciousCount: stats.suspicious,
      harmlessCount: stats.harmless,
      undetectedCount: stats.undetected,
      reputation: attributes.reputation || 0,
      lastAnalysisDate: attributes.last_submission_date 
        ? new Date(attributes.last_submission_date * 1000).toISOString()
        : new Date().toISOString(),
      detections,
      verdict,
      reportUrl: `https://www.virustotal.com/gui/home/url/${analysisId}`,
    };

    console.log(`📈 Resultado: ${stats.malicious}/${totalEngines} detecções maliciosas`);
    return result;

  } catch (error) {
    console.error('❌ Erro na análise VirusTotal:', error);
    return null;
  }
}

/**
 * Calcular score de risco baseado em VirusTotal (0-100)
 * Fórmula: (maliciosos * 100 + suspeitos * 50) / total
 */
export function calculateVirusTotalRiskScore(result: VirusTotalResult): number {
  if (result.totalEngines === 0) return 0;

  const riskScore = (
    (result.maliciousCount * 100) + 
    (result.suspiciousCount * 50)
  ) / result.totalEngines;
  
  return Math.min(100, Math.round(riskScore));
}

/**
 * Obter descrição textual do veredicto
 */
export function getVirusTotalVerdictDescription(verdict: string): string {
  const descriptions: Record<string, string> = {
    MALICIOUS: '🚨 URL detectada como maliciosa por múltiplos antivírus',
    SUSPICIOUS: '⚠️ URL apresenta características suspeitas',
    HARMLESS: '✅ URL analisada como segura',
    UNDETECTED: '❓ URL não foi detectada como maliciosa',
  };
  
  return descriptions[verdict] || '❓ Análise indisponível';
}

/**
 * Formatar resultado para exibição
 * Exemplo: "7/96 motores detectaram ameaça"
 */
export function formatVirusTotalResult(result: VirusTotalResult): string {
  if (result.maliciousCount === 0) {
    return `✅ ${result.harmlessCount}/${result.totalEngines} motores - Nenhuma ameaça conhecida`;
  }
  
  return `🚨 ${result.maliciousCount}/${result.totalEngines} motores detectaram ameaça`;
}

/**
 * Obter status legível para o usuário
 */
export function getVirusTotalStatus(result: VirusTotalResult): string {
  if (result.maliciousCount === 0 && result.suspiciousCount === 0) {
    return 'Nenhuma ameaça conhecida';
  } else if (result.maliciousCount > 0) {
    return 'Potencialmente perigoso';
  } else if (result.suspiciousCount > 0) {
    return 'Suspeito';
  }
  return 'Desconhecido';
}
