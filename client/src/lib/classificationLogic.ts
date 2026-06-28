/**
 * Lógica de Classificação Profissional
 * Diferencia: Malicioso (Google), Suspeito (Trusted+Suspicious), Alto Risco (Suspicious), Seguro
 * Mensagens contextualizadas baseadas em reputação, heurística e histórico
 */

import { ehDominioConfiavel } from "./trustedDomains";

export type NivelClassificacao = "Seguro" | "Suspeito" | "Alto Risco" | "Malicioso";

export interface ClassificacaoProfissional {
  nivel: NivelClassificacao;
  mensagem: string;
  recomendacao: string;
  ehAmeacaConfirmada: boolean; // true = Google Safe Browsing detectou, false = apenas heurística
  fonte: "Google Safe Browsing" | "Análise Heurística" | "Hibrida";
}

/**
 * Classifica URL com lógica profissional
 * 
 * Prioridade:
 * 1. Google Safe Browsing detectou? → Malicioso
 * 2. Domínio confiável + características suspeitas? → Suspeito
 * 3. Características suspeitas em domínio desconhecido? → Alto Risco
 * 4. Sem características suspeitas? → Seguro
 */
export function classificarURL(
  url: string,
  scoreTotal: number,
  temCaracteristicasSuspeitas: boolean,
  googleDetected: boolean,
  ameacasGoogle?: string[]
): ClassificacaoProfissional {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const ehConfiavel = ehDominioConfiavel(hostname);

    // 1. MALICIOSO - Detectado pelo Google Safe Browsing (ameaça confirmada)
    if (googleDetected && ameacasGoogle && ameacasGoogle.length > 0) {
      const tiposAmeaca = ameacasGoogle.join(", ");
      return {
        nivel: "Malicioso",
        mensagem: `Ameaça confirmada pelo Google Safe Browsing: ${tiposAmeaca}`,
        recomendacao: "NÃO acesse este link. Ele foi identificado como malicioso por sistemas de segurança profissionais. Se recebeu por WhatsApp, denuncie à plataforma.",
        ehAmeacaConfirmada: true,
        fonte: "Google Safe Browsing"
      };
    }

    // 2. SUSPEITO - Domínio confiável + características suspeitas
    if (ehConfiavel && temCaracteristicasSuspeitas) {
      return {
        nivel: "Suspeito",
        mensagem: `URL com características incomuns em domínio conhecido (${hostname}).`,
        recomendacao: "Este link usa um domínio legítimo, mas tem características estruturais incomuns. Verifique a origem antes de clicar. Não insira dados pessoais sem confirmar.",
        ehAmeacaConfirmada: false,
        fonte: "Análise Heurística"
      };
    }

    // 3. ALTO RISCO - Características suspeitas em domínio desconhecido
    if (!ehConfiavel && temCaracteristicasSuspeitas) {
      return {
        nivel: "Alto Risco",
        mensagem: "URL com características estruturais incomuns em domínio desconhecido e padrões comuns de phishing.",
        recomendacao: "Tenha cuidado com este link. Apresenta características estruturais que aparecem frequentemente em golpes. Se recebeu por WhatsApp, confirme com a pessoa por ligação antes de clicar.",
        ehAmeacaConfirmada: false,
        fonte: "Análise Heurística"
      };
    }

    // 4. SEGURO - Sem características suspeitas
    if (!temCaracteristicasSuspeitas) {
      if (ehConfiavel) {
        return {
          nivel: "Seguro",
          mensagem: `✔ Domínio confiável (${hostname}) sem características suspeitas.`,
          recomendacao: "Você pode acessar este link com confiança. Mesmo assim, mantenha-se atento a phishing e nunca compartilhe dados sensíveis por links.",
          ehAmeacaConfirmada: false,
          fonte: "Análise Heurística"
        };
      } else {
        return {
          nivel: "Seguro",
          mensagem: "URL não apresenta características suspeitas detectáveis.",
          recomendacao: "Este link não apresenta padrões de phishing conhecidos. Mesmo assim, sempre verifique a origem e nunca compartilhe dados sensíveis.",
          ehAmeacaConfirmada: false,
          fonte: "Análise Heurística"
        };
      }
    }

    // Fallback (não deve chegar aqui)
    return {
      nivel: "Suspeito",
      mensagem: "Análise inconclusiva.",
      recomendacao: "Verifique a origem do link antes de clicar.",
      ehAmeacaConfirmada: false,
      fonte: "Análise Heurística"
    };
  } catch (erro) {
    return {
      nivel: "Suspeito",
      mensagem: "URL inválida ou não pode ser analisada.",
      recomendacao: "Verifique se o link está correto.",
      ehAmeacaConfirmada: false,
      fonte: "Análise Heurística"
    };
  }
}

/**
 * Gera cor para exibição visual baseada no nível
 */
export function obterCorNivel(nivel: NivelClassificacao): string {
  switch (nivel) {
    case "Seguro":
      return "#10b981"; // Verde
    case "Suspeito":
      return "#f59e0b"; // Amarelo
    case "Alto Risco":
      return "#ef4444"; // Vermelho
    case "Malicioso":
      return "#7c2d12"; // Vermelho escuro
    default:
      return "#6b7280"; // Cinza
  }
}

/**
 * Gera ícone para exibição visual baseada no nível
 */
export function obterIconeNivel(nivel: NivelClassificacao): string {
  switch (nivel) {
    case "Seguro":
      return "✔";
    case "Suspeito":
      return "⚠";
    case "Alto Risco":
      return "❌";
    case "Malicioso":
      return "🚫";
    default:
      return "?";
  }
}
