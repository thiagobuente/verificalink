interface DomainSnapshot {
  domain: string;
  timestamp: Date;
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  mxRecords: number;
  threats: number;
  registrar: string;
  country: string;
  age: number;
}

interface DomainEvolution {
  domain: string;
  snapshots: DomainSnapshot[];
  scoreHistory: { date: Date; score: number }[];
  riskLevelChanges: { date: Date; from: string; to: string }[];
  threatHistory: { date: Date; type: string; severity: string }[];
  trends: {
    scoreDirection: 'improving' | 'degrading' | 'stable';
    scoreChange: number;
    lastChange: Date;
  };
}

class DomainHistoryTracker {
  private history = new Map<string, DomainSnapshot[]>();
  private threatLog = new Map<string, Array<{ date: Date; type: string; severity: string }>>();

  recordSnapshot(snapshot: DomainSnapshot): void {
    if (!this.history.has(snapshot.domain)) {
      this.history.set(snapshot.domain, []);
    }

    const snapshots = this.history.get(snapshot.domain)!;
    snapshots.push(snapshot);

    // Keep only last 365 snapshots (1 year of daily snapshots)
    if (snapshots.length > 365) {
      snapshots.shift();
    }
  }

  recordThreat(domain: string, threatType: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    if (!this.threatLog.has(domain)) {
      this.threatLog.set(domain, []);
    }

    this.threatLog.get(domain)!.push({
      date: new Date(),
      type: threatType,
      severity,
    });
  }

  getEvolution(domain: string): DomainEvolution | null {
    const snapshots = this.history.get(domain);
    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    // Calculate score history
    const scoreHistory = snapshots.map(s => ({
      date: s.timestamp,
      score: s.score,
    }));

    // Calculate risk level changes
    const riskLevelChanges: Array<{ date: Date; from: string; to: string }> = [];
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].riskLevel !== snapshots[i - 1].riskLevel) {
        riskLevelChanges.push({
          date: snapshots[i].timestamp,
          from: snapshots[i - 1].riskLevel,
          to: snapshots[i].riskLevel,
        });
      }
    }

    // Get threat history
    const threatHistory = this.threatLog.get(domain) || [];

    // Calculate trends
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    const scoreChange = lastSnapshot.score - firstSnapshot.score;

    let scoreDirection: 'improving' | 'degrading' | 'stable';
    if (scoreChange < -5) {
      scoreDirection = 'improving';
    } else if (scoreChange > 5) {
      scoreDirection = 'degrading';
    } else {
      scoreDirection = 'stable';
    }

    return {
      domain,
      snapshots,
      scoreHistory,
      riskLevelChanges,
      threatHistory,
      trends: {
        scoreDirection,
        scoreChange,
        lastChange: lastSnapshot.timestamp,
      },
    };
  }

  // Detect significant changes
  detectSignificantChanges(domain: string): string[] {
    const evolution = this.getEvolution(domain);
    if (!evolution || evolution.snapshots.length < 2) {
      return [];
    }

    const changes: string[] = [];
    const lastSnapshot = evolution.snapshots[evolution.snapshots.length - 1];
    const previousSnapshot = evolution.snapshots[evolution.snapshots.length - 2];

    // Score change
    const scoreChange = lastSnapshot.score - previousSnapshot.score;
    if (Math.abs(scoreChange) > 20) {
      if (scoreChange > 0) {
        changes.push(`⚠️ Risk score increased by ${scoreChange} points`);
      } else {
        changes.push(`✅ Risk score improved by ${Math.abs(scoreChange)} points`);
      }
    }

    // Risk level change
    if (lastSnapshot.riskLevel !== previousSnapshot.riskLevel) {
      changes.push(`Risk level changed from ${previousSnapshot.riskLevel} to ${lastSnapshot.riskLevel}`);
    }

    // Authentication changes
    if (lastSnapshot.spf !== previousSnapshot.spf) {
      changes.push(`SPF record ${lastSnapshot.spf ? 'added' : 'removed'}`);
    }
    if (lastSnapshot.dkim !== previousSnapshot.dkim) {
      changes.push(`DKIM record ${lastSnapshot.dkim ? 'added' : 'removed'}`);
    }
    if (lastSnapshot.dmarc !== previousSnapshot.dmarc) {
      changes.push(`DMARC record ${lastSnapshot.dmarc ? 'added' : 'removed'}`);
    }

    // MX record changes
    if (lastSnapshot.mxRecords !== previousSnapshot.mxRecords) {
      changes.push(`MX records changed from ${previousSnapshot.mxRecords} to ${lastSnapshot.mxRecords}`);
    }

    // Threat count changes
    if (lastSnapshot.threats !== previousSnapshot.threats) {
      if (lastSnapshot.threats > previousSnapshot.threats) {
        changes.push(`🚨 New threats detected: ${lastSnapshot.threats - previousSnapshot.threats}`);
      } else {
        changes.push(`✅ Threats resolved: ${previousSnapshot.threats - lastSnapshot.threats}`);
      }
    }

    return changes;
  }

  // Predict future risk based on trends
  predictFutureRisk(domain: string): {
    prediction: 'improving' | 'degrading' | 'stable';
    confidence: number;
    estimatedScore: number;
  } | null {
    const evolution = this.getEvolution(domain);
    if (!evolution || evolution.snapshots.length < 7) {
      return null; // Need at least 7 data points
    }

    // Calculate trend using linear regression
    const scores = evolution.scoreHistory.slice(-30); // Last 30 snapshots
    if (scores.length < 7) {
      return null;
    }

    const n = scores.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = scores.reduce((sum, s) => sum + s.score, 0);
    const sumXY = scores.reduce((sum, s, i) => sum + (i + 1) * s.score, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict score for next 30 days
    const estimatedScore = Math.round(intercept + slope * (n + 30));

    let prediction: 'improving' | 'degrading' | 'stable';
    if (slope < -1) {
      prediction = 'improving';
    } else if (slope > 1) {
      prediction = 'degrading';
    } else {
      prediction = 'stable';
    }

    // Calculate confidence based on R-squared
    const yMean = sumY / n;
    const ssRes = scores.reduce((sum, s, i) => {
      const predicted = intercept + slope * (i + 1);
      return sum + Math.pow(s.score - predicted, 2);
    }, 0);
    const ssTot = scores.reduce((sum, s) => sum + Math.pow(s.score - yMean, 2), 0);
    const rSquared = 1 - ssRes / ssTot;
    const confidence = Math.round(rSquared * 100);

    return {
      prediction,
      confidence,
      estimatedScore: Math.max(0, Math.min(100, estimatedScore)),
    };
  }

  // Generate timeline report
  generateTimeline(domain: string): string {
    const evolution = this.getEvolution(domain);
    if (!evolution) {
      return `No history found for ${domain}`;
    }

    let timeline = `# Domain History Timeline: ${domain}\n\n`;

    timeline += `**Total Records**: ${evolution.snapshots.length}\n`;
    timeline += `**First Recorded**: ${evolution.snapshots[0].timestamp.toISOString()}\n`;
    timeline += `**Last Updated**: ${evolution.snapshots[evolution.snapshots.length - 1].timestamp.toISOString()}\n\n`;

    timeline += `## Score Trend\n\n`;
    timeline += `**Direction**: ${evolution.trends.scoreDirection}\n`;
    timeline += `**Change**: ${evolution.trends.scoreChange > 0 ? '+' : ''}${evolution.trends.scoreChange}\n\n`;

    if (evolution.riskLevelChanges.length > 0) {
      timeline += `## Risk Level Changes\n\n`;
      for (const change of evolution.riskLevelChanges) {
        timeline += `- ${change.date.toISOString()}: ${change.from} → ${change.to}\n`;
      }
      timeline += '\n';
    }

    if (evolution.threatHistory.length > 0) {
      timeline += `## Threat History\n\n`;
      for (const threat of evolution.threatHistory.slice(-10)) {
        timeline += `- ${threat.date.toISOString()}: ${threat.type} (${threat.severity})\n`;
      }
      timeline += '\n';
    }

    const prediction = this.predictFutureRisk(domain);
    if (prediction) {
      timeline += `## Future Prediction\n\n`;
      timeline += `**Trend**: ${prediction.prediction}\n`;
      timeline += `**Confidence**: ${prediction.confidence}%\n`;
      timeline += `**Estimated Score (30 days)**: ${prediction.estimatedScore}/100\n`;
    }

    return timeline;
  }
}

export const domainHistoryTracker = new DomainHistoryTracker();
