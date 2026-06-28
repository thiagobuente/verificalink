/**
 * Análise Detalhada Profissional
 * Organiza resultado em seções: Estrutural, Reputação, Resultado
 */

import { ScoreInteligente, ComponenteScore } from "./intelligentScoring";

export interface SecaoAnalise {
  titulo: string;
  componentes: ComponenteScore[];
  scoreTotal: number;
}

export interface AnaliseDetalhada {
  estrutural: SecaoAnalise;
  reputacao: SecaoAnalise;
  resultado: {
    classificacao: string;
    recomendacao: string;
    ehAmeacaConfirmada: boolean;
  };
}

/**
 * Organiza componentes de score em seções
 */
export function organizarAnaliseDetalhada(
  scoreInteligente: ScoreInteligente,
  nivelRisco: string
): AnaliseDetalhada {
  // Separar componentes por categoria
  const componentesEstruturais = scoreInteligente.componentes.filter(
    c => ["estrutura", "subdominio", "https", "encurtador"].includes(c.categoria ?? "")
  );

  const componentesReputacao = scoreInteligente.componentes.filter(
    c => ["reputacao", "idade", "blacklist"].includes(c.categoria ?? "")
  );

  // Calcular scores por seção
  const scoreEstruturalTotal = componentesEstruturais.reduce((acc, c) => acc + c.score, 0) / Math.max(componentesEstruturais.length, 1);
  const scoreReputacaoTotal = componentesReputacao.reduce((acc, c) => acc + c.score, 0) / Math.max(componentesReputacao.length, 1);

  // Gerar classificação
  const classificacao = gerarClassificacaoDetalhada(
    scoreInteligente.scoreTotal,
    nivelRisco,
    scoreEstruturalTotal,
    scoreReputacaoTotal
  );

  // Gerar recomendação
  const recomendacao = gerarRecomendacaoDetalhada(nivelRisco, scoreEstruturalTotal, scoreReputacaoTotal);

  // Determinar se é ameaça confirmada
  const ehAmeacaConfirmada = (scoreInteligente.scoreBlacklist ?? 0) > 0 || (scoreInteligente.scoreEncurtador ?? 0) > 30;

  return {
    estrutural: {
      titulo: "Análise Estrutural",
      componentes: componentesEstruturais,
      scoreTotal: Math.round(scoreEstruturalTotal)
    },
    reputacao: {
      titulo: "Análise de Reputação",
      componentes: componentesReputacao,
      scoreTotal: Math.round(scoreReputacaoTotal)
    },
    resultado: {
      classificacao,
      recomendacao,
      ehAmeacaConfirmada
    }
  };
}

/**
 * Gera classificação detalhada
 */
function gerarClassificacaoDetalhada(
  scoreTotal: number,
  nivelRisco: string,
  scoreEstrutura: number,
  scoreReputacao: number
): string {
  if (scoreTotal <= 15) {
    return "✔ Seguro - Domínio confiável";
  }

  if (scoreTotal <= 40) {
    if (scoreReputacao > scoreEstrutura) {
      return "⚠ Suspeito por reputação desconhecida";
    }
    return "⚠ Suspeito estruturalmente";
  }

  if (scoreTotal <= 70) {
    if (scoreReputacao > 50) {
      return "❌ Alto Risco - Reputação comprometida";
    }
    return "❌ Alto Risco - Padrão de phishing";
  }

  return "❌ Alto Risco - Ameaça confirmada";
}

/**
 * Gera recomendação detalhada
 */
function gerarRecomendacaoDetalhada(
  nivelRisco: string,
  scoreEstrutura: number,
  scoreReputacao: number
): string {
  if (nivelRisco === "Seguro") {
    return "Você pode acessar este link com confiança. Mesmo assim, mantenha-se atento a phishing.";
  }

  if (nivelRisco === "Suspeito") {
    if (scoreReputacao > scoreEstrutura) {
      return "Este domínio é desconhecido. Verifique a origem antes de clicar. Se recebeu por WhatsApp, confirme com a pessoa por ligação.";
    }
    return "Esta URL possui características incomuns. Verifique antes de clicar. Não insira dados pessoais ou bancários.";
  }

  return "Este link apresenta padrões suspeitos de phishing. Recomendamos não clicar. Se recebeu por WhatsApp, confirme com a pessoa por ligação antes de qualquer ação.";
}

/**
 * Formata motivos para exibição
 */
export function formatarMotivos(componentes: ComponenteScore[]): {
  positivos: string[];
  suspeitos: string[];
  criticos: string[];
} {
  const positivos: string[] = [];
  const suspeitos: string[] = [];
  const criticos: string[] = [];

  componentes.forEach(componente => {
    componente.motivos.forEach(motivo => {
      if (motivo.startsWith("✔")) {
        positivos.push(motivo);
      } else if (motivo.startsWith("⚠")) {
        suspeitos.push(motivo);
      } else if (motivo.startsWith("❌")) {
        criticos.push(motivo);
      } else {
        // Classificar automaticamente baseado no score
        if (componente.score === 0) {
          positivos.push(`✔ ${motivo}`);
        } else if (componente.score > 50) {
          criticos.push(`❌ ${motivo}`);
        } else {
          suspeitos.push(`⚠ ${motivo}`);
        }
      }
    });
  });

  return { positivos, suspeitos, criticos };
}
