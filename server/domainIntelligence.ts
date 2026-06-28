import axios from 'axios';

export interface DomainIntelligenceData {
  domain: string;
  registrar: string;
  registrarCountry: string;
  createdDate: string;
  expiryDate: string;
  ageInDays: number;
  nameServers: string[];
  country: string;
  ipAddress: string;
  sslCertificate: {
    issuer: string;
    expiryDate: string;
    isValid: boolean;
    organization: string;
  } | null;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  reputation: {
    virustotal: string;
    abuseipdb: string;
    alienvault: string;
  };
  error?: string;
}

/**
 * Extrair domínio de uma URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Buscar informações WHOIS do domínio
 */
async function getWhoisData(domain: string): Promise<any> {
  try {
    const apiKey = process.env.WHOIS_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get(`https://www.whoisxmlapi.com/api/v1`, {
      params: {
        apiKey,
        domain,
        outputFormat: 'JSON',
      },
      timeout: 5000,
    });

    if (response.data?.WhoisRecord) {
      const record = response.data.WhoisRecord;
      return {
        registrar: record.registrarName || 'Unknown',
        registrarCountry: record.registrarCountry || 'Unknown',
        createdDate: record.createdDate || null,
        expiryDate: record.expiryDate || null,
        nameServers: record.nameServers || [],
      };
    }
  } catch (error) {
    console.error('WHOIS API error:', error);
  }
  return null;
}

/**
 * Calcular idade do domínio em dias
 */
function calculateDomainAge(createdDate: string | null): number {
  if (!createdDate) return 0;
  try {
    const created = new Date(createdDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Buscar informações de geolocalização de IP
 */
async function getGeoLocation(ipAddress: string): Promise<any> {
  try {
    const apiKey = process.env.MAXMIND_API_KEY;
    if (!apiKey) {
      // Fallback para ip-api.com (sem chave)
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
        timeout: 5000,
      });
      if (response.data?.status === 'success') {
        return {
          country: response.data.country,
          countryCode: response.data.countryCode,
          city: response.data.city,
          isp: response.data.isp,
        };
      }
    }
  } catch (error) {
    console.error('GeoLocation API error:', error);
  }
  return null;
}

/**
 * Buscar informações de SSL/TLS
 */
async function getSSLInfo(domain: string): Promise<any> {
  try {
    const response = await axios.get(`https://crt.sh/?q=${domain}&output=json`, {
      timeout: 5000,
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      const cert = response.data[0];
      return {
        issuer: cert.issuer_name || 'Unknown',
        expiryDate: cert.not_after || null,
        isValid: new Date(cert.not_after) > new Date(),
        organization: cert.name_value?.split('\n')[0] || 'Unknown',
      };
    }
  } catch (error) {
    console.error('SSL Info error:', error);
  }
  return null;
}

/**
 * Buscar reputação do domínio em múltiplas fontes
 */
async function getDomainReputation(domain: string, ipAddress: string): Promise<any> {
  const reputation: any = {};

  // VirusTotal
  try {
    const vtKey = process.env.VIRUSTOTAL_API_KEY;
    if (vtKey) {
      const response = await axios.get(`https://www.virustotal.com/api/v3/domains/${domain}`, {
        headers: { 'x-apikey': vtKey },
        timeout: 5000,
      });
      if (response.data?.data?.attributes?.last_analysis_stats) {
        const stats = response.data.data.attributes.last_analysis_stats;
        reputation.virustotal = `${stats.malicious || 0} malicious, ${stats.suspicious || 0} suspicious`;
      }
    }
  } catch (error) {
    console.error('VirusTotal error:', error);
  }

  // AbuseIPDB
  try {
    const abuseKey = process.env.ABUSEIPDB_API_KEY;
    if (abuseKey && ipAddress) {
      const response = await axios.get(`https://api.abuseipdb.com/api/v2/check`, {
        params: { ipAddress },
        headers: { Key: abuseKey, Accept: 'application/json' },
        timeout: 5000,
      });
      if (response.data?.data) {
        reputation.abuseipdb = `${response.data.data.abuseConfidenceScore}% confidence`;
      }
    }
  } catch (error) {
    console.error('AbuseIPDB error:', error);
  }

  // AlienVault OTX
  try {
    const otxKey = process.env.ALIENVAULT_OTX_API_KEY;
    if (otxKey) {
      const response = await axios.get(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`, {
        headers: { 'X-OTX-API-KEY': otxKey },
        timeout: 5000,
      });
      if (response.data?.pulse_info) {
        reputation.alienvault = `${response.data.pulse_info.count} pulses`;
      }
    }
  } catch (error) {
    console.error('AlienVault error:', error);
  }

  return reputation;
}

/**
 * Calcular score de risco do domínio
 */
function calculateRiskScore(data: Partial<DomainIntelligenceData>): { score: number; level: 'low' | 'medium' | 'high' | 'critical'; factors: string[] } {
  let score = 50; // Score base
  const factors: string[] = [];

  // Domínio muito novo (< 30 dias)
  if (data.ageInDays && data.ageInDays < 30) {
    score += 20;
    factors.push('Domínio muito novo (< 30 dias)');
  }

  // Domínio novo (30-90 dias)
  if (data.ageInDays && data.ageInDays < 90) {
    score += 10;
    factors.push('Domínio relativamente novo (< 90 dias)');
  }

  // Sem SSL válido
  if (!data.sslCertificate?.isValid) {
    score += 15;
    factors.push('Sem certificado SSL válido');
  }

  // Registrador suspeito
  const suspiciousRegistrars = ['namecheap', 'godaddy', 'register.com'];
  if (data.registrar && suspiciousRegistrars.some(r => data.registrar?.toLowerCase().includes(r))) {
    score -= 5; // Reduzir score para registradores comuns
  }

  // País de alto risco
  const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
  if (data.registrarCountry && highRiskCountries.includes(data.registrarCountry)) {
    score += 15;
    factors.push(`Registrador em país de alto risco (${data.registrarCountry})`);
  }

  // Reputação negativa
  if (data.reputation?.virustotal && data.reputation.virustotal.includes('malicious')) {
    score += 25;
    factors.push('Reputação negativa no VirusTotal');
  }

  if (data.reputation?.abuseipdb && parseInt(data.reputation.abuseipdb) > 50) {
    score += 20;
    factors.push('IP com alta taxa de abuso (AbuseIPDB)');
  }

  // Limitar score entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Determinar nível de risco
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (score >= 80) level = 'critical';
  else if (score >= 60) level = 'high';
  else if (score >= 40) level = 'medium';

  return { score, level, factors };
}

/**
 * Função principal para buscar Domain Intelligence
 */
export async function getDomainIntelligence(url: string): Promise<DomainIntelligenceData> {
  const domain = extractDomain(url);

  try {
    // Buscar dados WHOIS
    const whoisData = await getWhoisData(domain);
    const ageInDays = calculateDomainAge(whoisData?.createdDate);

    // Buscar informações de SSL
    const sslInfo = await getSSLInfo(domain);

    // Buscar geolocalização (placeholder - seria necessário resolver DNS primeiro)
    const geoData = await getGeoLocation('0.0.0.0'); // Placeholder

    // Buscar reputação
    const reputation = await getDomainReputation(domain, '0.0.0.0');

    // Construir dados preliminares
    const preliminaryData: Partial<DomainIntelligenceData> = {
      domain,
      registrar: whoisData?.registrar || 'Unknown',
      registrarCountry: whoisData?.registrarCountry || 'Unknown',
      createdDate: whoisData?.createdDate || 'Unknown',
      expiryDate: whoisData?.expiryDate || 'Unknown',
      ageInDays,
      nameServers: whoisData?.nameServers || [],
      country: geoData?.country || 'Unknown',
      ipAddress: '0.0.0.0', // Placeholder
      sslCertificate: sslInfo,
      reputation,
    };

    // Calcular score de risco
    const { score, level, factors } = calculateRiskScore(preliminaryData);

    return {
      domain,
      registrar: preliminaryData.registrar!,
      registrarCountry: preliminaryData.registrarCountry!,
      createdDate: preliminaryData.createdDate!,
      expiryDate: preliminaryData.expiryDate!,
      ageInDays,
      nameServers: preliminaryData.nameServers!,
      country: preliminaryData.country!,
      ipAddress: preliminaryData.ipAddress!,
      sslCertificate: preliminaryData.sslCertificate || null,
      riskScore: score,
      riskLevel: level,
      riskFactors: factors,
      reputation,
    };
  } catch (error) {
    console.error('Domain Intelligence error:', error);
    return {
      domain,
      registrar: 'Error',
      registrarCountry: 'Unknown',
      createdDate: 'Unknown',
      expiryDate: 'Unknown',
      ageInDays: 0,
      nameServers: [],
      country: 'Unknown',
      ipAddress: 'Unknown',
      sslCertificate: null,
      riskScore: 0,
      riskLevel: 'low',
      riskFactors: [],
      reputation: { virustotal: 'unknown', abuseipdb: 'unknown', alienvault: 'unknown' },
      error: 'Failed to fetch domain intelligence data',
    };
  }
}
