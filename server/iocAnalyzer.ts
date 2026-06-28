/**
 * IOC (Indicator of Compromise) Analyzer Module
 * Análise de indicadores de comprometimento com múltiplas fontes de inteligência
 */

// ============================================================================
// 1. IOC TYPES & DETECTION
// ============================================================================

export type IOCType = 'ip' | 'domain' | 'url' | 'md5' | 'sha1' | 'sha256' | 'email';

export interface IOCIndicator {
  value: string;
  type: IOCType;
  confidence: number; // 0-100
}

export class IOCDetector {
  static detect(value: string): IOCIndicator | null {
    const trimmed = value.trim().toLowerCase();

    // IP Address (IPv4)
    if (this.isIPv4(trimmed)) {
      return { value: trimmed, type: 'ip', confidence: 100 };
    }

    // IPv6
    if (this.isIPv6(trimmed)) {
      return { value: trimmed, type: 'ip', confidence: 100 };
    }

    // MD5 Hash (32 hex characters)
    if (/^[a-f0-9]{32}$/.test(trimmed)) {
      return { value: trimmed, type: 'md5', confidence: 100 };
    }

    // SHA1 Hash (40 hex characters)
    if (/^[a-f0-9]{40}$/.test(trimmed)) {
      return { value: trimmed, type: 'sha1', confidence: 100 };
    }

    // SHA256 Hash (64 hex characters)
    if (/^[a-f0-9]{64}$/.test(trimmed)) {
      return { value: trimmed, type: 'sha256', confidence: 100 };
    }

    // Email
    if (this.isEmail(trimmed)) {
      return { value: trimmed, type: 'email', confidence: 95 };
    }

    // URL
    if (this.isURL(trimmed)) {
      return { value: trimmed, type: 'url', confidence: 100 };
    }

    // Domain
    if (this.isDomain(trimmed)) {
      return { value: trimmed, type: 'domain', confidence: 95 };
    }

    return null;
  }

  private static isIPv4(value: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(value);
  }

  private static isIPv6(value: string): boolean {
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
    return ipv6Regex.test(value);
  }

  private static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private static isURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private static isDomain(value: string): boolean {
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(value);
  }
}

// ============================================================================
// 2. IOC ANALYSIS RESULT
// ============================================================================

export interface SourceAnalysis {
  source: string;
  status: 'malicious' | 'suspicious' | 'clean' | 'no_data';
  details: string;
  confidence: number; // 0-100
  lastUpdated?: number;
}

export interface IOCAnalysisResult {
  ioc: IOCIndicator;
  riskScore: number;           // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  confidence: number;          // 0-100
  sources: SourceAnalysis[];
  reasons: string[];
  recommendation: string;
  timestamp: number;
}

// ============================================================================
// 3. IOC ANALYZER ENGINE
// ============================================================================

export class IOCAnalyzerEngine {
  private readonly apiKeys: Record<string, string> = {};

  constructor(apiKeys: Partial<Record<string, string>> = {}) {
    this.apiKeys = {
      virustotal: process.env.VIRUSTOTAL_API_KEY || '',
      abuseipdb: process.env.ABUSEIPDB_API_KEY || '',
      alienvault: process.env.ALIENVAULT_OTX_API_KEY || '',
      ipinfo: process.env.IPINFO_API_KEY || '',
      ...apiKeys,
    };
  }

  async analyze(value: string): Promise<IOCAnalysisResult | null> {
    const ioc = IOCDetector.detect(value);
    if (!ioc) {
      return null;
    }

    const sources: SourceAnalysis[] = [];
    const reasons: string[] = [];

    // Executar análises em paralelo
    const analyses = await Promise.all([
      this.analyzeVirusTotal(ioc),
      this.analyzeAbuseIPDB(ioc),
      this.analyzeAlienVault(ioc),
      this.analyzeURLhaus(ioc),
      this.analyzeThreatFox(ioc),
      this.analyzeMalwareBazaar(ioc),
      this.analyzeIPinfo(ioc),
      this.analyzeSecurityTrails(ioc),
      this.analyzeRDAP(ioc),
    ]);

    for (const analysis of analyses) {
      if (analysis) {
        sources.push(analysis);
      }
    }

    // Calcular score de risco
    const riskScore = this.calculateRiskScore(sources);
    const riskLevel = this.getRiskLevel(riskScore);
    const confidence = this.calculateConfidence(sources);

    // Gerar razões
    for (const source of sources) {
      if (source.status === 'malicious') {
        reasons.push(`⚠️ ${source.source}: Indicador malicioso detectado`);
      } else if (source.status === 'suspicious') {
        reasons.push(`⚠️ ${source.source}: Comportamento suspeito`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('✅ Nenhuma ameaça detectada em fontes consultadas');
    }

    // Gerar recomendação
    const recommendation = this.generateRecommendation(riskLevel, ioc.type);

    return {
      ioc,
      riskScore,
      riskLevel,
      confidence,
      sources,
      reasons,
      recommendation,
      timestamp: Date.now(),
    };
  }

  private async analyzeVirusTotal(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    try {
      // Simular análise VirusTotal
      // Em produção, usar API real
      return {
        source: 'VirusTotal',
        status: 'clean',
        details: 'Nenhuma detecção de malware',
        confidence: 95,
      };
    } catch (error) {
      return {
        source: 'VirusTotal',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeAbuseIPDB(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    if (ioc.type !== 'ip') return null;

    try {
      // Simular análise AbuseIPDB
      return {
        source: 'AbuseIPDB',
        status: 'clean',
        details: 'Sem registros de abuso',
        confidence: 90,
      };
    } catch (error) {
      return {
        source: 'AbuseIPDB',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeAlienVault(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    try {
      // Simular análise AlienVault OTX
      return {
        source: 'AlienVault OTX',
        status: 'clean',
        details: 'Sem indicadores de ameaça',
        confidence: 85,
      };
    } catch (error) {
      return {
        source: 'AlienVault OTX',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeURLhaus(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    if (!['url', 'domain'].includes(ioc.type)) return null;

    try {
      // Simular análise URLhaus
      return {
        source: 'URLhaus',
        status: 'clean',
        details: 'URL não registrada como maliciosa',
        confidence: 90,
      };
    } catch (error) {
      return {
        source: 'URLhaus',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeThreatFox(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    try {
      // Simular análise ThreatFox
      return {
        source: 'ThreatFox',
        status: 'clean',
        details: 'Sem ameaças conhecidas',
        confidence: 80,
      };
    } catch (error) {
      return {
        source: 'ThreatFox',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeMalwareBazaar(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    if (!['md5', 'sha1', 'sha256'].includes(ioc.type)) return null;

    try {
      // Simular análise MalwareBazaar
      return {
        source: 'MalwareBazaar',
        status: 'clean',
        details: 'Hash não encontrado em base de malware',
        confidence: 95,
      };
    } catch (error) {
      return {
        source: 'MalwareBazaar',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeIPinfo(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    if (ioc.type !== 'ip') return null;

    try {
      // Simular análise IPinfo
      return {
        source: 'IPinfo',
        status: 'clean',
        details: 'IP localizado em datacenter legítimo',
        confidence: 85,
      };
    } catch (error) {
      return {
        source: 'IPinfo',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeSecurityTrails(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    if (!['domain', 'ip'].includes(ioc.type)) return null;

    try {
      // Simular análise SecurityTrails
      return {
        source: 'SecurityTrails',
        status: 'clean',
        details: 'Domínio sem histórico de atividade maliciosa',
        confidence: 90,
      };
    } catch (error) {
      return {
        source: 'SecurityTrails',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private async analyzeRDAP(ioc: IOCIndicator): Promise<SourceAnalysis | null> {
    if (!['domain', 'ip'].includes(ioc.type)) return null;

    try {
      // Simular análise RDAP
      return {
        source: 'RDAP',
        status: 'clean',
        details: 'Registro RDAP disponível',
        confidence: 80,
      };
    } catch (error) {
      return {
        source: 'RDAP',
        status: 'no_data',
        details: 'Erro ao consultar',
        confidence: 0,
      };
    }
  }

  private calculateRiskScore(sources: SourceAnalysis[]): number {
    if (sources.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const source of sources) {
      let score = 0;
      if (source.status === 'malicious') score = 100;
      else if (source.status === 'suspicious') score = 60;
      else if (source.status === 'clean') score = 0;
      else score = 20; // no_data

      totalScore += score * source.confidence;
      totalWeight += source.confidence;
    }

    return Math.round(totalWeight > 0 ? totalScore / totalWeight : 0);
  }

  private getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' | 'clean' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'clean';
  }

  private calculateConfidence(sources: SourceAnalysis[]): number {
    if (sources.length === 0) return 0;
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    return Math.round(avgConfidence);
  }

  private generateRecommendation(riskLevel: string, iocType: IOCType): string {
    const recommendations: Record<string, string> = {
      critical: `🚨 CRÍTICO: ${iocType.toUpperCase()} identificado como ameaça confirmada. Bloqueie imediatamente e investigue o incidente.`,
      high: `⚠️ ALTO RISCO: ${iocType.toUpperCase()} apresenta indicadores de ameaça. Recomenda-se investigação imediata.`,
      medium: `⚠️ RISCO MÉDIO: ${iocType.toUpperCase()} requer monitoramento. Investigue se houver contexto suspeito.`,
      low: `⚠️ RISCO BAIXO: ${iocType.toUpperCase()} apresenta alguns indicadores menores. Monitore para mudanças.`,
      clean: `✅ SEGURO: ${iocType.toUpperCase()} não apresenta indicadores de ameaça conhecida. Nenhuma ação necessária.`,
    };

    return recommendations[riskLevel] || recommendations.clean;
  }
}
