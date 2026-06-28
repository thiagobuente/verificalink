import { getCache, setCache, cacheKeys, cacheTTL } from './cache';

interface DomainComparison {
  domain: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  age: number;
  registrar: string;
  country: string;
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  mxRecords: number;
  threats: number;
}

interface ComparisonResult {
  domains: DomainComparison[];
  riskiest: DomainComparison;
  safest: DomainComparison;
  averageScore: number;
  patterns: string[];
  clusters: string[][];
  recommendations: string[];
  timestamp: Date;
}

class ComparativeAnalyzer {
  // Detect similar domains (homograph attacks, typosquatting)
  detectSimilarDomains(domains: string[]): string[][] {
    const clusters: string[][] = [];
    const processed = new Set<string>();

    for (const domain1 of domains) {
      if (processed.has(domain1)) continue;

      const cluster = [domain1];
      processed.add(domain1);

      for (const domain2 of domains) {
        if (processed.has(domain2)) continue;

        const similarity = this.calculateSimilarity(domain1, domain2);
        if (similarity > 0.7) {
          cluster.push(domain2);
          processed.add(domain2);
        }
      }

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private calculateSimilarity(domain1: string, domain2: string): number {
    const base1 = domain1.split('.')[0];
    const base2 = domain2.split('.')[0];

    // Levenshtein distance
    const distance = this.levenshteinDistance(base1, base2);
    const maxLength = Math.max(base1.length, base2.length);

    return 1 - distance / maxLength;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Analyze infrastructure (shared IP, nameservers, registrar)
  async analyzeInfrastructure(domains: DomainComparison[]): Promise<string[]> {
    const patterns: string[] = [];

    // Check for shared registrars
    const registrarGroups = domains.reduce((acc, d) => {
      if (!acc[d.registrar]) acc[d.registrar] = [];
      acc[d.registrar].push(d.domain);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [registrar, domainList] of Object.entries(registrarGroups)) {
      if (domainList.length > 1) {
        patterns.push(`${domainList.length} domains registered with ${registrar}`);
      }
    }

    // Check for shared countries
    const countryGroups = domains.reduce((acc, d) => {
      if (!acc[d.country]) acc[d.country] = [];
      acc[d.country].push(d.domain);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [country, domainList] of Object.entries(countryGroups)) {
      if (domainList.length > 1) {
        patterns.push(`${domainList.length} domains registered in ${country}`);
      }
    }

    return patterns;
  }

  // Detect coordinated attacks
  detectCoordinatedAttacks(domains: DomainComparison[]): string[] {
    const indicators: string[] = [];

    // Check for similar risk profiles
    const highRiskDomains = domains.filter(d => d.riskLevel === 'critical' || d.riskLevel === 'high');
    if (highRiskDomains.length >= 2) {
      indicators.push(`${highRiskDomains.length} high-risk domains detected - possible coordinated attack`);
    }

    // Check for similar creation dates
    const recentDomains = domains.filter(d => d.age < 30);
    if (recentDomains.length >= 2) {
      indicators.push(`${recentDomains.length} recently created domains - possible campaign`);
    }

    // Check for missing authentication
    const noAuthDomains = domains.filter(d => !d.spf || !d.dkim || !d.dmarc);
    if (noAuthDomains.length >= 2) {
      indicators.push(`${noAuthDomains.length} domains with weak email authentication`);
    }

    return indicators;
  }

  async compareAnalysis(comparisons: DomainComparison[]): Promise<ComparisonResult> {
    if (comparisons.length === 0) {
      throw new Error('No domains to compare');
    }

    // Calculate average score
    const averageScore = Math.round(
      comparisons.reduce((sum, c) => sum + c.score, 0) / comparisons.length
    );

    // Find riskiest and safest
    const riskiest = comparisons.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    const safest = comparisons.reduce((prev, current) =>
      current.score < prev.score ? current : prev
    );

    // Detect similar domains
    const clusters = this.detectSimilarDomains(comparisons.map(c => c.domain));

    // Analyze infrastructure
    const infrastructurePatterns = await this.analyzeInfrastructure(comparisons);

    // Detect coordinated attacks
    const attackIndicators = this.detectCoordinatedAttacks(comparisons);

    // Generate recommendations
    const recommendations: string[] = [];

    if (clusters.length > 0) {
      recommendations.push(`⚠️ Detected ${clusters.length} cluster(s) of similar domains - possible phishing campaign`);
    }

    if (attackIndicators.length > 0) {
      recommendations.push(`🚨 ${attackIndicators[0]}`);
    }

    if (averageScore > 70) {
      recommendations.push('⚠️ Overall high risk - exercise extreme caution with all these domains');
    }

    const result: ComparisonResult = {
      domains: comparisons,
      riskiest,
      safest,
      averageScore,
      patterns: [...infrastructurePatterns, ...attackIndicators],
      clusters,
      recommendations,
      timestamp: new Date(),
    };

    return result;
  }

  // Generate comparison report
  generateReport(comparison: ComparisonResult): string {
    let report = '# Domain Comparison Report\n\n';

    report += `**Analysis Date**: ${comparison.timestamp.toISOString()}\n`;
    report += `**Domains Analyzed**: ${comparison.domains.length}\n`;
    report += `**Average Risk Score**: ${comparison.averageScore}/100\n\n`;

    report += '## Risk Summary\n\n';
    report += `| Domain | Score | Risk Level | Age (days) | Registrar |\n`;
    report += `|--------|-------|-----------|-----------|----------|\n`;

    for (const domain of comparison.domains) {
      report += `| ${domain.domain} | ${domain.score} | ${domain.riskLevel} | ${domain.age} | ${domain.registrar} |\n`;
    }

    report += '\n## Riskiest Domain\n\n';
    report += `**${comparison.riskiest.domain}** - Score: ${comparison.riskiest.score}/100 (${comparison.riskiest.riskLevel})\n`;

    report += '\n## Safest Domain\n\n';
    report += `**${comparison.safest.domain}** - Score: ${comparison.safest.score}/100 (${comparison.safest.riskLevel})\n`;

    if (comparison.clusters.length > 0) {
      report += '\n## Similar Domains Detected\n\n';
      for (const cluster of comparison.clusters) {
        report += `- ${cluster.join(' ↔ ')}\n`;
      }
    }

    if (comparison.patterns.length > 0) {
      report += '\n## Infrastructure Patterns\n\n';
      for (const pattern of comparison.patterns) {
        report += `- ${pattern}\n`;
      }
    }

    if (comparison.recommendations.length > 0) {
      report += '\n## Recommendations\n\n';
      for (const rec of comparison.recommendations) {
        report += `- ${rec}\n`;
      }
    }

    return report;
  }
}

export const comparativeAnalyzer = new ComparativeAnalyzer();
