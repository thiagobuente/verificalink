/**
 * Sistema de Faixas de Score Humanas
 * Transforma números em classificações compreensíveis
 */

export type RiskLevel = "seguro" | "suspeito" | "alto_risco" | "malicioso";

export interface ScoreRange {
  level: RiskLevel;
  minScore: number;
  maxScore: number;
  label: string;
  emoji: string;
  cor: string;
  descricao: string;
  recomendacao: string;
}

export const SCORE_RANGES: Record<RiskLevel, ScoreRange> = {
  seguro: {
    level: "seguro",
    minScore: 0,
    maxScore: 20,
    label: "Seguro",
    emoji: "✅",
    cor: "bg-green-500/20 text-green-400",
    descricao: "URL parece segura com base na análise realizada",
    recomendacao: "Você pode acessar com confiança"
  },
  suspeito: {
    level: "suspeito",
    minScore: 21,
    maxScore: 45,
    label: "Suspeito",
    emoji: "⚠️",
    cor: "bg-yellow-500/20 text-yellow-400",
    descricao: "URL apresenta características incomuns",
    recomendacao: "Verifique cuidadosamente antes de acessar"
  },
  alto_risco: {
    level: "alto_risco",
    minScore: 46,
    maxScore: 70,
    label: "Alto Risco",
    emoji: "🔴",
    cor: "bg-orange-500/20 text-orange-400",
    descricao: "URL apresenta padrões comuns em phishing",
    recomendacao: "Não recomendamos acessar. Verifique a origem"
  },
  malicioso: {
    level: "malicioso",
    minScore: 71,
    maxScore: 100,
    label: "Malicioso",
    emoji: "❌",
    cor: "bg-red-500/20 text-red-400",
    descricao: "URL foi identificada como maliciosa",
    recomendacao: "NÃO ACESSE. URL confirmada como perigosa"
  }
};

/**
 * Retorna a faixa de score baseada no valor numérico
 */
export function getRiskLevel(score: number): ScoreRange {
  if (score <= 20) return SCORE_RANGES.seguro;
  if (score <= 45) return SCORE_RANGES.suspeito;
  if (score <= 70) return SCORE_RANGES.alto_risco;
  return SCORE_RANGES.malicioso;
}

/**
 * Retorna a porcentagem de risco (0-100%)
 */
export function getRiskPercentage(score: number): number {
  return Math.min(100, Math.max(0, score));
}

/**
 * Retorna descrição humanizada do score
 */
export function getScoreDescription(score: number): string {
  const range = getRiskLevel(score);
  return `${range.emoji} ${range.label} (${score}%)`;
}
