/**
 * URLhaus Integration - Verificação Completa
 * Integração com banco de dados de URLs maliciosas do URLhaus
 * Retorna: ameaça, data, status, tags
 */

import axios from 'axios';

const URLHAUS_API_URL = 'https://urlhaus-api.abuse.ch/v1';

export interface URLhausURLData {
  id: string;
  url: string;
  url_status: string;
  host: string;
  date_added: string;
  threat: string;
  reporter: string;
  tags: string[];
}

export interface URLhausAPIResponse {
  query_status: string;
  url_count: number;
  urls: URLhausURLData[];
}

export interface URLhausAnalysis {
  url: string;
  isInDatabase: boolean;
  threat: string | null;
  dateAdded: string | null;
  tags: string[];
  urlStatus: string | null;
  reporter: string | null;
}

// Mapa de severidade de ameaças
const THREAT_SEVERITY: Record<string, number> = {
  'malware': 100,
  'phishing': 95,
  'ransomware': 95,
  'exploit': 90,
  'trojan': 90,
  'botnet': 85,
  'spyware': 85,
  'worm': 85,
  'adware': 60,
  'suspicious': 70,
  'unknown': 50,
};

/**
 * Verificar URL em URLhaus - Integração Completa
 */
export async function checkURLInURLhaus(url: string): Promise<URLhausAnalysis | null> {
  try {
    console.log(`🔍 Verificando URL em URLhaus: ${url}`);

    const response = await axios.post(
      `${URLHAUS_API_URL}/url/`,
      { url },
      {
        timeout: 10000,
      }
    );

    const data: URLhausAPIResponse = response.data;

    if (data.query_status === 'ok' && data.url_count > 0 && data.urls.length > 0) {
      const urlData = data.urls[0];
      
      const analysis: URLhausAnalysis = {
        url,
        isInDatabase: true,
        threat: urlData.threat,
        dateAdded: urlData.date_added,
        tags: urlData.tags || [],
        urlStatus: urlData.url_status,
        reporter: urlData.reporter,
      };

      console.log(`🚨 URL encontrada em URLhaus: ${urlData.threat}`);
      return analysis;
    }

    console.log(`✅ URL não encontrada em URLhaus`);
    return {
      url,
      isInDatabase: false,
      threat: null,
      dateAdded: null,
      tags: [],
      urlStatus: null,
      reporter: null,
    };

  } catch (error) {
    console.error('❌ Erro ao verificar URL em URLhaus:', error);
    return null;
  }
}

/**
 * Calcular score de risco baseado em URLhaus (0-100)
 */
export function calculateURLhausRiskScore(analysis: URLhausAnalysis): number {
  if (!analysis.isInDatabase) return 0;

  const threat = analysis.threat?.toLowerCase() || 'unknown';
  return THREAT_SEVERITY[threat] || 50;
}

/**
 * Obter descrição de ameaça
 */
export function getURLhausThreatDescription(threat: string | null): string {
  const descriptions: Record<string, string> = {
    'malware': '🚨 URL identificada como distribuindo malware',
    'phishing': '🚨 URL identificada como phishing',
    'ransomware': '🚨 URL identificada como ransomware',
    'exploit': '🚨 URL identificada como exploit',
    'botnet': '🚨 URL associada a botnet',
    'trojan': '🚨 URL identificada como trojan',
    'spyware': '🚨 URL identificada como spyware',
    'worm': '🚨 URL identificada como worm',
    'adware': '⚠️ URL identificada como adware',
    'suspicious': '⚠️ URL identificada como suspeita',
  };

  const key = threat?.toLowerCase() || 'unknown';
  return descriptions[key] || '⚠️ URL identificada como potencialmente maliciosa';
}

/**
 * Formatar resultado para exibição
 */
export function formatURLhausResult(analysis: URLhausAnalysis): string {
  if (!analysis.isInDatabase) {
    return '✅ URL não encontrada em banco de dados de malware';
  }
  
  return `🚨 URL detectada como ${analysis.threat} no URLhaus`;
}

/**
 * Obter status legível para o usuário
 */
export function getURLhausStatus(analysis: URLhausAnalysis): string {
  if (!analysis.isInDatabase) {
    return 'Não detectada';
  }
  
  const threat = analysis.threat?.toLowerCase() || 'unknown';
  
  if (['malware', 'phishing', 'ransomware', 'exploit', 'trojan'].includes(threat)) {
    return 'Crítica';
  } else if (['botnet', 'spyware', 'worm'].includes(threat)) {
    return 'Alta';
  } else if (threat === 'adware') {
    return 'Moderada';
  }
  
  return 'Suspeita';
}

/**
 * Extrair informações de tags
 */
export function extractTagsInfo(tags: string[]): string {
  if (!tags || tags.length === 0) return 'Sem tags';
  return tags.join(', ');
}
