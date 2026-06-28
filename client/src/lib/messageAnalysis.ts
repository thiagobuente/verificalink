/*
 * Análise de Mensagens Suspeitas
 * Implementa heurística para detectar padrões de golpe em textos
 */

import { detectarGolpeOrgaoPublico, gerarMensagemGolpeOrgaoPublico } from "./urlDetection";

// ===== PADRÕES DE GOLPE =====
export const padrõesGolpe = [
  {
    pattern: /urgente|imediato|agora|rápido/i,
    risco: "urgência",
    descricao: "Mensagem usa linguagem urgente para pressionar"
  },
  {
    pattern: /confirme|verifique|valide|autentique/i,
    risco: "verificação",
    descricao: "Pede confirmação de dados ou autenticação"
  },
  {
    pattern: /pix|transferência|dinheiro|pagamento|débito/i,
    risco: "dinheiro",
    descricao: "Mensagem menciona dinheiro ou transações"
  },
  {
    pattern: /prêmio|ganhou|sorteio|concurso|brinde/i,
    risco: "prêmio",
    descricao: "Oferece prêmio ou ganho inesperado"
  },
  {
    pattern: /clique|toque|acesse|visite|abra/i,
    risco: "clique",
    descricao: "Pressiona para clicar em link"
  },
  {
    pattern: /senha|código|pin|cvv|cpf|cnpj/i,
    risco: "dados",
    descricao: "Pede dados sensíveis ou pessoais"
  },
  {
    pattern: /bloqueado|suspenso|cancelado|desativado|expirado/i,
    risco: "bloqueio",
    descricao: "Diz que conta está bloqueada ou suspensa"
  },
  {
    pattern: /atualizar|baixar|instalar|app|aplicativo/i,
    risco: "app",
    descricao: "Pede para baixar ou instalar algo"
  },
  {
    pattern: /suporte|atendimento|central|whatsapp|banco/i,
    risco: "impersonação",
    descricao: "Finge ser suporte de empresa conhecida"
  },
  {
    pattern: /não responda|não compartilhe|não comente|confidencial/i,
    risco: "sigilo",
    descricao: "Pede sigilo ou não compartilhamento"
  }
];

// ===== PALAVRAS-CHAVE DE GOLPE =====
export const palavrasChaveGolpe = [
  "whatsapp",
  "nubank",
  "itau",
  "bradesco",
  "caixa",
  "banco",
  "pix",
  "verificação",
  "confirmação",
  "urgente",
  "imediato",
  "prêmio",
  "ganhou",
  "sorteio",
  "clique",
  "acesse",
  "senha",
  "código",
  "cpf",
  "dados",
  "bloqueado",
  "suspenso",
  "atualizar",
  "baixar",
  "instalar",
  "app",
  "suporte",
  "atendimento",
  "central"
];

// ===== ANÁLISE DE MENSAGEM =====
export const analisarMensagem = (mensagem: string, url?: string) => {
  const riscos = {
    urgencia: false,
    verificacao: false,
    dinheiro: false,
    premio: false,
    clique: false,
    dados: false,
    bloqueio: false,
    app: false,
    impersonacao: false,
    sigilo: false
  };

  const padrõesDetectados: string[] = [];
  let score = 0;

  // Verificar cada padrão
  padrõesGolpe.forEach(({ pattern, risco, descricao }) => {
    if (pattern.test(mensagem)) {
      riscos[risco as keyof typeof riscos] = true;
      padrõesDetectados.push(descricao);
      
      // Aumentar score baseado no risco
      if (risco === "dinheiro" || risco === "dados") score += 25;
      else if (risco === "verificação" || risco === "bloqueio") score += 20;
      else if (risco === "urgência" || risco === "clique") score += 15;
      else score += 10;
    }
  });

  // Detectar múltiplos padrões (aumenta suspeita)
  const padrõesCount = Object.values(riscos).filter(Boolean).length;
  if (padrõesCount >= 3) score += 20;
  if (padrõesCount >= 5) score += 30;

  // Verificar comprimento da mensagem
  if (mensagem.length < 50) {
    score += 5; // Mensagens muito curtas podem ser suspeitas
  }

  // Verificar se tem links
  const temLink = /https?:\/\/|www\.|bit\.ly|tinyurl|\.xyz|\.top|\.click/i.test(mensagem);
  if (temLink) score += 15;

  // Verificar se tem números de telefone
  const temTelefone = /\(\d{2}\)\s?\d{4,5}-\d{4}|\d{11}/.test(mensagem);
  if (temTelefone) score += 10;

  // Verificar se tem muitos emojis (comum em golpes)
  const emojiCount = (mensagem.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 5) score += 10;

  // Verificar se tem CAPS LOCK excessivo
  const capsCount = (mensagem.match(/[A-Z]/g) || []).length;
  const capsRatio = capsCount / mensagem.length;
  if (capsRatio > 0.5 && mensagem.length > 20) score += 10;

  // Normalizar score para 0-100
  score = Math.min(score, 100);

  // Detectar golpe de órgão público (NOVO)
  let golpeOrgaoPublico = null;
  let mensagemGolpeOrgaoPublico = "";
  if (url) {
    golpeOrgaoPublico = detectarGolpeOrgaoPublico(mensagem, url);
    if (golpeOrgaoPublico.ehGolpe) {
      mensagemGolpeOrgaoPublico = gerarMensagemGolpeOrgaoPublico(mensagem, url, golpeOrgaoPublico);
      // Aumentar score se detectar golpe de órgão público
      if (golpeOrgaoPublico.risco === "CRÍTICO") score = 100;
      else if (golpeOrgaoPublico.risco === "ALTO") score = Math.max(score, 80);
    }
  }

  return {
    score,
    riscos,
    padrõesDetectados,
    temLink,
    temTelefone,
    emojiCount,
    capsRatio,
    golpeOrgaoPublico, // NOVO
    mensagemGolpeOrgaoPublico // NOVO
  };
};

// ===== GERAR EXPLICAÇÃO PARA MENSAGEM =====
export const gerarExplicacaoMensagem = (analise: any) => {
  const explicacoes = [];

  if (analise.riscos.urgencia) {
    explicacoes.push(
      "⚠️ Mensagem usa linguagem urgente para pressionar você. Golpistas criam pressa para você não pensar direito."
    );
  }

  if (analise.riscos.verificacao) {
    explicacoes.push(
      "⚠️ Pede para confirmar ou verificar dados. Empresas legítimas NUNCA pedem isso por WhatsApp."
    );
  }

  if (analise.riscos.dinheiro) {
    explicacoes.push(
      "⚠️ Mensagem menciona dinheiro, PIX ou transferência. Cuidado com pedidos de dinheiro por WhatsApp."
    );
  }

  if (analise.riscos.premio) {
    explicacoes.push(
      "⚠️ Oferece prêmio ou ganho inesperado. Se você não participou de nada, é golpe!"
    );
  }

  if (analise.riscos.clique) {
    explicacoes.push(
      "⚠️ Pressiona para clicar em link. Desconfie de links de pessoas desconhecidas."
    );
  }

  if (analise.riscos.dados) {
    explicacoes.push(
      "⚠️ Pede dados sensíveis como senha, CPF ou código. Nunca compartilhe isso por WhatsApp!"
    );
  }

  if (analise.riscos.bloqueio) {
    explicacoes.push(
      "⚠️ Diz que sua conta está bloqueada ou suspensa. Ligue para o número oficial da empresa para confirmar."
    );
  }

  if (analise.riscos.app) {
    explicacoes.push(
      "⚠️ Pede para baixar ou instalar algo. Malware é frequentemente distribuído assim."
    );
  }

  if (analise.riscos.impersonacao) {
    explicacoes.push(
      "⚠️ Finge ser suporte de empresa conhecida. Ligue para o número oficial para confirmar."
    );
  }

  if (analise.riscos.sigilo) {
    explicacoes.push(
      "⚠️ Pede sigilo ou não compartilhamento. Golpistas usam isso para evitar que você avise outros."
    );
  }

  if (analise.temLink) {
    explicacoes.push(
      "⚠️ Mensagem contém link. Verifique a URL antes de clicar - pode ser phishing."
    );
  }

  if (analise.temTelefone) {
    explicacoes.push(
      "⚠️ Contém número de telefone. Cuidado com números desconhecidos."
    );
  }

  if (analise.emojiCount > 5) {
    explicacoes.push(
      "⚠️ Muitos emojis podem indicar tentativa de parecer amigável/legítimo."
    );
  }

  if (analise.capsRatio > 0.5) {
    explicacoes.push(
      "⚠️ Excesso de CAPS LOCK é comum em mensagens de golpe."
    );
  }

  return explicacoes;
};

// ===== GERAR RESUMO PARA MENSAGEM =====
export const gerarResumoMensagem = (score: number) => {
  if (score <= 25) {
    return "✅ Mensagem parece segura. Mas sempre desconfie de mensagens de desconhecidos.";
  }
  if (score <= 50) {
    return "⚠️ Mensagem apresenta características suspeitas. Recomendamos não clicar em links ou compartilhar dados.";
  }
  if (score <= 75) {
    return "🚨 Mensagem apresenta forte indicação de golpe. NÃO clique em links, NÃO compartilhe dados, NÃO envie dinheiro.";
  }
  return "🚨 ALERTA: Esta mensagem é muito provavelmente um golpe. Bloqueie o contato e reporte para WhatsApp.";
};

// ===== OBTER NÍVEL DE RISCO =====
export const obterNivelRiscoMensagem = (score: number) => {
  if (score <= 25) return "Baixo";
  if (score <= 50) return "Médio";
  if (score <= 75) return "Alto";
  return "Crítico";
};

// ===== OBTER COR DO RISCO =====
export const obterCorRiscoMensagem = (score: number) => {
  if (score <= 25) return "#22c55e"; // Verde
  if (score <= 50) return "#f59e0b"; // Amarelo
  if (score <= 75) return "#ef4444"; // Vermelho
  return "#7c2d12"; // Vermelho escuro
};
