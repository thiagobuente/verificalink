/**
 * AbuseIPDB Integration - Verificação Completa de IPs
 * Integração com API do AbuseIPDB para análise de IPs maliciosos
 * Retorna: score, reports, país, ISP, última denúncia, tipo de uso
 */

import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';

const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2';

const dnsLookup = promisify(dns.lookup);

export interface AbuseIPDBReportDetail {
  reportedAt: string;
  comment: string;
  categories: number[];
  reporterId: number;
  reporterCountryCode: string;
}

export interface AbuseIPDBResult {
  ipAddress: string;
  abuseConfidenceScore: number;
  countryCode: string;
  countryName: string;
  usageType: string;
  isp: string;
  domain: string;
  hostnames: string[];
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
  isWhitelisted: boolean;
  isPrivate: boolean;
  reports: AbuseIPDBReportDetail[];
}

export interface AbuseIPDBAnalysis {
  ip: string;
  abuseScore: number;
  totalReports: number;
  country: string;
  isp: string;
  isPublic: boolean;
  lastReported: string | null;
  categories: string[];
  isBlacklisted: boolean;
}

// Mapa de categorias de abuso
const ABUSE_CATEGORIES: Record<number, string> = {
  3: 'Fraude',
  4: 'Emulação de IP',
  5: 'Porta Escanear',
  6: 'Phishing',
  7: 'Proxy/VPN',
  8: 'Spam',
  9: 'SSH',
  10: 'Malware',
  11: 'Botnet',
  12: 'Exploit',
  13: 'Scan de Vulnerabilidade',
  14: 'Honeypot',
  15: 'Brute Force',
  16: 'Ataque DDoS',
  17: 'Não Autorizado',
  18: 'Força Bruta',
  19: 'Sondagem de Rede',
  20: 'SSH Brute Force',
  21: 'FTP Brute Force',
  22: 'IMAP Brute Force',
  23: 'POP3 Brute Force',
  24: 'SMTP Brute Force',
  25: 'MySQL Brute Force',
  26: 'Telnet Brute Force',
  27: 'LDAP Brute Force',
  28: 'SNMP Brute Force',
  29: 'MSSQL Brute Force',
  30: 'Oracle Brute Force',
  31: 'PostgreSQL Brute Force',
  32: 'VNC Brute Force',
  33: 'RDP Brute Force',
  34: 'HTTP Brute Force',
  35: 'HTTPS Brute Force',
  36: 'Proxy HTTP Brute Force',
  37: 'Proxy HTTPS Brute Force',
  38: 'SOCKS5 Brute Force',
  39: 'Minecraft Brute Force',
  40: 'IRC Brute Force',
  41: 'DNS Brute Force',
  42: 'NTP Brute Force',
  43: 'SNMP Brute Force',
  44: 'Memcached Brute Force',
  45: 'Redis Brute Force',
  46: 'Elasticsearch Brute Force',
  47: 'Cassandra Brute Force',
  48: 'MongoDB Brute Force',
  49: 'CouchDB Brute Force',
  50: 'Riak Brute Force',
};

/**
 * Resolver domínio para IP
 */
export async function resolveDomainToIP(domain: string): Promise<string | null> {
  try {
    const result = await dnsLookup(domain);
    return result.address;
  } catch (error) {
    console.warn(`⚠️ Não foi possível resolver domínio: ${domain}`);
    return null;
  }
}

/**
 * Verificar IP em AbuseIPDB - Integração Completa
 */
export async function checkIPInAbuseIPDB(ip: string): Promise<AbuseIPDBAnalysis | null> {
  try {
    if (!ABUSEIPDB_API_KEY) {
      console.warn('⚠️ AbuseIPDB API key não configurada');
      return null;
    }

    console.log(`🔍 Verificando IP em AbuseIPDB: ${ip}`);

    const response = await axios.get(
      `${ABUSEIPDB_API_URL}/check`,
      {
        params: {
          ipAddress: ip,
          maxAgeInDays: 90,
          verbose: true,
        },
        headers: {
          'Key': ABUSEIPDB_API_KEY,
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    );

    const ipData: AbuseIPDBResult = response.data.data;

    // Extrair categorias dos reports
    const categories = new Set<string>();
    if (ipData.reports && Array.isArray(ipData.reports)) {
      ipData.reports.forEach(report => {
        if (Array.isArray(report.categories)) {
          report.categories.forEach(catNum => {
            const catName = ABUSE_CATEGORIES[catNum];
            if (catName) categories.add(catName);
          });
        }
      });
    }

    const analysis: AbuseIPDBAnalysis = {
      ip,
      abuseScore: ipData.abuseConfidenceScore || 0,
      totalReports: ipData.totalReports || 0,
      country: ipData.countryName || ipData.countryCode || 'Desconhecido',
      isp: ipData.isp || 'Desconhecido',
      isPublic: !ipData.isPrivate,
      lastReported: ipData.lastReportedAt || null,
      categories: Array.from(categories),
      isBlacklisted: (ipData.abuseConfidenceScore || 0) >= 75,
    };

    console.log(`📊 Score: ${analysis.abuseScore}% | Reports: ${analysis.totalReports}`);
    return analysis;

  } catch (error) {
    console.error('❌ Erro ao verificar IP em AbuseIPDB:', error);
    return null;
  }
}

/**
 * Calcular score de risco baseado em AbuseIPDB (0-100)
 * Score já vem como 0-100 da API
 */
export function calculateAbuseIPDBRiskScore(analysis: AbuseIPDBAnalysis): number {
  return analysis.abuseScore;
}

/**
 * Obter descrição de risco
 */
export function getAbuseIPDBRiskDescription(score: number): string {
  if (score >= 75) {
    return '🚨 IP altamente suspeito - Múltiplos relatos de abuso';
  } else if (score >= 50) {
    return '⚠️ IP suspeito - Vários relatos de atividade maliciosa';
  } else if (score >= 25) {
    return '⚠️ IP com histórico de atividade suspeita';
  } else if (score > 0) {
    return '❓ IP com alguns relatos de abuso';
  }
  return '✅ IP sem histórico de abuso relatado';
}

/**
 * Formatar resultado para exibição
 * Exemplo: "Score: 85% | Reports: 12"
 */
export function formatAbuseIPDBResult(analysis: AbuseIPDBAnalysis): string {
  if (analysis.totalReports === 0) {
    return `✅ Score: 0% | Reports: 0 | Status: Sem histórico de abuso`;
  }
  
  return `⚠️ Score: ${analysis.abuseScore}% | Reports: ${analysis.totalReports} | País: ${analysis.country}`;
}

/**
 * Obter status legível para o usuário
 */
export function getAbuseIPDBStatus(analysis: AbuseIPDBAnalysis): string {
  if (analysis.totalReports === 0) {
    return 'Sem histórico de abuso';
  } else if (analysis.abuseScore >= 75) {
    return 'Altamente suspeito';
  } else if (analysis.abuseScore >= 50) {
    return 'Suspeito';
  } else if (analysis.abuseScore >= 25) {
    return 'Moderadamente suspeito';
  }
  return 'Baixo risco';
}
