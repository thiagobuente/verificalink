interface SourceResult {
  source: string;
  status: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  score: number; // 0-100
  confidence: number; // 0-100
  details?: any;
  timestamp: Date;
}

interface AggregatedResult {
  domain: string;
  overallScore: number; // 0-100
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  consensus: number; // Percentage of sources agreeing
  sources: SourceResult[];
  weightedScores: Record<string, number>;
  recommendations: string[];
  timestamp: Date;
}

class MultiSourceAggregator {
  // Source weights (higher = more important)
  private sourceWeights: Record<string, number> = {
    'virustotal': 0.25,
    'google-safe-browsing': 0.20,
    'urlhaus': 0.15,
    'abuseipdb': 0.15,
    'spamhaus': 0.10,
    'surbl': 0.08,
    'phishtank': 0.05,
    'malwarebytes': 0.02,
  };

  async aggregateResults(domain: string, sources: SourceResult[]): Promise<AggregatedResult> {
    if (sources.length === 0) {
      throw new Error('No sources provided');
    }

    // Calculate weighted scores
    const weightedScores: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const source of sources) {
      const weight = this.sourceWeights[source.source] || 0.05;
      const weightedScore = source.score * weight;

      weightedScores[source.source] = weightedScore;
      totalWeightedScore += weightedScore;
      totalWeight += weight;
    }

    // Normalize weighted score
    const overallScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;

    // Calculate consensus
    const maliciousCount = sources.filter(s => s.status === 'malicious').length;
    const suspiciousCount = sources.filter(s => s.status === 'suspicious').length;
    const cleanCount = sources.filter(s => s.status === 'clean').length;

    const consensus = Math.round(Math.max(maliciousCount, suspiciousCount, cleanCount) / sources.length * 100);

    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (overallScore >= 80 || maliciousCount >= sources.length * 0.5) {
      overallRisk = 'critical';
    } else if (overallScore >= 60 || maliciousCount >= sources.length * 0.3) {
      overallRisk = 'high';
    } else if (overallScore >= 40 || suspiciousCount >= sources.length * 0.5) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(domain, overallRisk, sources);

    return {
      domain,
      overallScore,
      overallRisk,
      consensus,
      sources,
      weightedScores,
      recommendations,
      timestamp: new Date(),
    };
  }

  private generateRecommendations(domain: string, risk: string, sources: SourceResult[]): string[] {
    const recommendations: string[] = [];

    if (risk === 'critical') {
      recommendations.push('🚨 AVOID THIS DOMAIN - Multiple sources confirm malicious activity');
      recommendations.push('Report this domain to your email provider');
      recommendations.push('Block this domain in your firewall/email filter');
    } else if (risk === 'high') {
      recommendations.push('⚠️ Exercise extreme caution with this domain');
      recommendations.push('Verify sender identity through alternative channels');
      recommendations.push('Consider blocking or quarantining emails from this domain');
    } else if (risk === 'medium') {
      recommendations.push('Be cautious - some sources flagged this domain');
      recommendations.push('Verify any links or attachments before clicking');
      recommendations.push('Check sender details carefully');
    }

    // Source-specific recommendations
    const maliciousSources = sources.filter(s => s.status === 'malicious').map(s => s.source);
    if (maliciousSources.length > 0) {
      recommendations.push(`Flagged by: ${maliciousSources.join(', ')}`);
    }

    return recommendations;
  }

  // Calculate source reliability
  getSourceReliability(): Record<string, { weight: number; reliability: number }> {
    return Object.entries(this.sourceWeights).reduce((acc, [source, weight]) => {
      acc[source] = {
        weight,
        reliability: weight * 100, // Simple reliability metric
      };
      return acc;
    }, {} as Record<string, { weight: number; reliability: number }>);
  }

  // Handle conflicting results
  resolveConflicts(sources: SourceResult[]): { resolved: boolean; reason: string } {
    const statuses = sources.map(s => s.status);
    const uniqueStatuses = new Set(statuses);

    if (uniqueStatuses.size === 1) {
      return { resolved: true, reason: 'All sources agree' };
    }

    // If majority agrees, consider it resolved
    const statusCounts = statuses.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(statusCounts));
    if (maxCount >= sources.length * 0.7) {
      return { resolved: true, reason: 'Majority consensus reached' };
    }

    return { resolved: false, reason: 'Conflicting results from sources' };
  }
}

export const multiSourceAggregator = new MultiSourceAggregator();
