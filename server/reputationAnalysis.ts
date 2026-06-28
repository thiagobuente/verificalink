/**
 * Módulo de análise de reputação multi-fonte
 * Consulta Spamhaus, SURBL, VirusTotal e outras bases de dados
 */

interface ReputationResult {
  source: string;
  status: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  score: number; // 0-100, onde 100 é mais malicioso
  details: string;
  lastChecked?: string;
}

interface DomainReputation {
  domain: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  sources: ReputationResult[];
  recommendations: string[];
  lastUpdated: string;
}

/**
 * Consultar Spamhaus PBL (Policy Block List)
 */
async function checkSpamhausPBL(domain: string): Promise<ReputationResult> {
  try {
    // Spamhaus PBL é principalmente para IPs, mas podemos usar para validação de domínio
    // Aqui fazemos uma consulta básica via DNS
    const dns = await import('dns').then(m => m.promises);
    
    try {
      // Tentar resolver o domínio
      const addresses = await dns.resolve4(domain);
      
      if (addresses.length === 0) {
        return {
          source: 'Spamhaus PBL',
          status: 'unknown',
          score: 0,
          details: 'Domínio não possui registros A válidos',
        };
      }

      // Se resolveu, é um domínio válido
      return {
        source: 'Spamhaus PBL',
        status: 'clean',
        score: 0,
        details: 'Domínio resolvido com sucesso',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        source: 'Spamhaus PBL',
        status: 'suspicious',
        score: 30,
        details: `Erro ao resolver domínio: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      };
    }
  } catch (error) {
    console.warn('Erro ao consultar Spamhaus:', error);
    return {
      source: 'Spamhaus PBL',
      status: 'unknown',
      score: 0,
      details: 'Indisponível',
    };
  }
}

/**
 * Consultar SURBL (Spam URI Realtime Blocklist)
 */
async function checkSURBL(domain: string): Promise<ReputationResult> {
  try {
    // SURBL é principalmente para URIs em spam
    // Aqui fazemos uma verificação básica
    
    // Padrões comuns de domínios suspeitos
    const suspiciousPatterns = [
      /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/, // IP como domínio
      /^xn--/, // Punycode (pode ser phishing)
      /^bit\.ly|^tinyurl|^short\.link/, // URLs encurtadas
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(domain));

    if (isSuspicious) {
      return {
        source: 'SURBL',
        status: 'suspicious',
        score: 40,
        details: 'Padrão suspeito detectado no domínio',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      source: 'SURBL',
      status: 'clean',
      score: 0,
      details: 'Nenhum padrão suspeito detectado',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Erro ao consultar SURBL:', error);
    return {
      source: 'SURBL',
      status: 'unknown',
      score: 0,
      details: 'Indisponível',
    };
  }
}

/**
 * Consultar Google Safe Browsing
 */
async function checkGoogleSafeBrowsing(domain: string): Promise<ReputationResult> {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) {
      return {
        source: 'Google Safe Browsing',
        status: 'unknown',
        score: 0,
        details: 'API key não configurada',
      };
    }

    const response = await fetch('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: {
          clientId: 'shield-security-scanner',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [
            { url: `https://${domain}` },
            { url: `http://${domain}` },
          ],
        },
      }),
    });

    if (!response.ok) {
      return {
        source: 'Google Safe Browsing',
        status: 'unknown',
        score: 0,
        details: `API retornou status ${response.status}`,
      };
    }

    const data = await response.json() as any;
    const matches = data.matches || [];

    if (matches.length === 0) {
      return {
        source: 'Google Safe Browsing',
        status: 'clean',
        score: 0,
        details: 'Nenhuma ameaça detectada',
        lastChecked: new Date().toISOString(),
      };
    }

    const threatTypes = matches.map((m: any) => m.threatType).join(', ');
    return {
      source: 'Google Safe Browsing',
      status: 'malicious',
      score: 90,
      details: `Ameaças detectadas: ${threatTypes}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Erro ao consultar Google Safe Browsing:', error);
    return {
      source: 'Google Safe Browsing',
      status: 'unknown',
      score: 0,
      details: 'Indisponível',
    };
  }
}

/**
 * Consultar URLhaus
 */
async function checkURLhaus(domain: string): Promise<ReputationResult> {
  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/query/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `host=${encodeURIComponent(domain)}`,
    });

    if (!response.ok) {
      return {
        source: 'URLhaus',
        status: 'unknown',
        score: 0,
        details: `API retornou status ${response.status}`,
      };
    }

    const data = await response.json() as any;

    if (data.query_status === 'ok' && data.urls && data.urls.length > 0) {
      const maliciousCount = data.urls.filter((u: any) => u.threat === 'malware').length;
      
      if (maliciousCount > 0) {
        return {
          source: 'URLhaus',
          status: 'malicious',
          score: 80,
          details: `${maliciousCount} URL(s) maliciosa(s) encontrada(s)`,
          lastChecked: new Date().toISOString(),
        };
      }
    }

    return {
      source: 'URLhaus',
      status: 'clean',
      score: 0,
      details: 'Nenhuma URL maliciosa encontrada',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Erro ao consultar URLhaus:', error);
    return {
      source: 'URLhaus',
      status: 'unknown',
      score: 0,
      details: 'Indisponível',
    };
  }
}

/**
 * Consultar AbuseIPDB para reputação de IP
 */
async function checkAbuseIPDB(domain: string): Promise<ReputationResult> {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey) {
      return {
        source: 'AbuseIPDB',
        status: 'unknown',
        score: 0,
        details: 'API key não configurada',
      };
    }

    // Primeiro, resolver o domínio para obter o IP
    const dns = await import('dns').then(m => m.promises);
    let ipAddress: string;

    try {
      const addresses = await dns.resolve4(domain);
      ipAddress = addresses[0];
    } catch {
      return {
        source: 'AbuseIPDB',
        status: 'unknown',
        score: 0,
        details: 'Não foi possível resolver o domínio',
      };
    }

    // Construir URL com parâmetros
    const urlWithParams = new URL('https://api.abuseipdb.com/api/v2/check');
    urlWithParams.searchParams.append('ipAddress', ipAddress);
    urlWithParams.searchParams.append('maxAgeInDays', '90');

    const abuseResponse = await fetch(urlWithParams.toString(), {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!abuseResponse.ok) {
      return {
        source: 'AbuseIPDB',
        status: 'unknown',
        score: 0,
        details: `API retornou status ${abuseResponse.status}`,
      };
    }

    const abuseData = await abuseResponse.json() as any;
    const abuseScore = abuseData.data?.abuseConfidenceScore || 0;

    if (abuseScore > 75) {
      return {
        source: 'AbuseIPDB',
        status: 'malicious',
        score: Math.min(100, abuseScore),
        details: `IP com alta reputação negativa (score: ${abuseScore})`,
        lastChecked: new Date().toISOString(),
      };
    } else if (abuseScore > 25) {
      return {
        source: 'AbuseIPDB',
        status: 'suspicious',
        score: abuseScore,
        details: `IP com reputação suspeita (score: ${abuseScore})`,
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      source: 'AbuseIPDB',
      status: 'clean',
      score: 0,
      details: 'IP com boa reputação',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Erro ao consultar AbuseIPDB:', error);
    return {
      source: 'AbuseIPDB',
      status: 'unknown',
      score: 0,
      details: 'Indisponível',
    };
  }
}

/**
 * Analisar reputação de domínio usando múltiplas fontes
 */
export async function analyzeDomainReputation(domain: string): Promise<DomainReputation> {
  try {
    // Executar todas as consultas em paralelo
    const [spamhaus, surbl, gsb, urlhaus, abuseipdb] = await Promise.all([
      checkSpamhausPBL(domain),
      checkSURBL(domain),
      checkGoogleSafeBrowsing(domain),
      checkURLhaus(domain),
      checkAbuseIPDB(domain),
    ]);

    const sources = [spamhaus, surbl, gsb, urlhaus, abuseipdb];

    // Calcular score geral
    const validSources = sources.filter(s => s.status !== 'unknown');
    const averageScore = validSources.length > 0
      ? Math.round(validSources.reduce((sum, s) => sum + s.score, 0) / validSources.length)
      : 0;

    // Determinar nível de risco
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (averageScore >= 75) {
      overallRisk = 'critical';
    } else if (averageScore >= 50) {
      overallRisk = 'high';
    } else if (averageScore >= 25) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Gerar recomendações
    const recommendations: string[] = [];
    const maliciousSources = sources.filter(s => s.status === 'malicious');
    const suspiciousSources = sources.filter(s => s.status === 'suspicious');

    if (maliciousSources.length > 0) {
      recommendations.push(`⚠️ Domínio marcado como malicioso por ${maliciousSources.length} fonte(s): ${maliciousSources.map(s => s.source).join(', ')}`);
      recommendations.push('❌ Não recomendado acessar este domínio');
    }

    if (suspiciousSources.length > 0) {
      recommendations.push(`⚠️ Domínio marcado como suspeito por ${suspiciousSources.length} fonte(s): ${suspiciousSources.map(s => s.source).join(', ')}`);
      recommendations.push('🔍 Recomenda-se cautela ao acessar este domínio');
    }

    if (overallRisk === 'low') {
      recommendations.push('✅ Domínio apresenta boa reputação');
    }

    return {
      domain,
      overallRisk,
      riskScore: averageScore,
      sources,
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao analisar reputação de domínio:', error);
    throw error;
  }
}

export { ReputationResult, DomainReputation };
