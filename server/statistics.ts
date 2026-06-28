/**
 * Release-safe in-memory platform statistics.
 */

type AnalysisType = 'link' | 'message' | 'pdf';
type RiskLevel = 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';

interface AnalysisRecord {
  analysisType: AnalysisType;
  riskLevel: RiskLevel;
  threatDetected: boolean;
  createdAt: Date;
}

const history: AnalysisRecord[] = [];

export async function recordAnalysis(analysisType: AnalysisType, riskLevel: RiskLevel, threatDetected: boolean): Promise<boolean> {
  history.push({ analysisType, riskLevel, threatDetected, createdAt: new Date() });
  if (history.length > 5000) history.shift();
  return true;
}

export async function getStatistics() {
  return {
    total_analyses: history.length,
    total_threats_detected: history.filter((item) => item.threatDetected).length,
    total_malicious_urls: history.filter((item) => item.analysisType === 'link' && item.threatDetected && (item.riskLevel === 'Alto' || item.riskLevel === 'Crítico')).length,
    total_link_analyses: history.filter((item) => item.analysisType === 'link').length,
    total_message_analyses: history.filter((item) => item.analysisType === 'message').length,
    total_pdf_analyses: history.filter((item) => item.analysisType === 'pdf').length,
    high_risk_detected: history.filter((item) => item.riskLevel === 'Alto').length,
    critical_risk_detected: history.filter((item) => item.riskLevel === 'Crítico').length,
    last_updated: new Date(),
  };
}

export async function getStatisticsByType(analysisType: AnalysisType) {
  const items = history.filter((item) => item.analysisType === analysisType);
  return {
    total: items.length,
    threats: items.filter((item) => item.threatDetected).length,
    critical: items.filter((item) => item.riskLevel === 'Crítico').length,
    high: items.filter((item) => item.riskLevel === 'Alto').length,
  };
}

export async function getStatisticsByDays(days = 7) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const grouped = new Map<string, { date: string; total: number; threats: number }>();
  for (const item of history.filter((entry) => entry.createdAt.getTime() >= since)) {
    const date = item.createdAt.toISOString().slice(0, 10);
    const current = grouped.get(date) ?? { date, total: 0, threats: 0 };
    current.total += 1;
    current.threats += item.threatDetected ? 1 : 0;
    grouped.set(date, current);
  }
  return [...grouped.values()].sort((left, right) => right.date.localeCompare(left.date));
}
