import { describe, it, expect } from "vitest";
import {
  detectarTLDAltoRisco,
  detectarPalavrasGolpeTarefa,
  detectarRedirecionamentoSuspeito,
  obterNivelRiscoNovo,
  obterClassificacaoReputacao,
  calcularScore,
} from "./urlDetection";

describe("CORREÇÃO CRÍTICA: Motor de Risco - TLDs de Alto Risco", () => {
  it("deve detectar .sbs como TLD de alto risco com 25 pontos", () => {
    const result = detectarTLDAltoRisco("li2k.sbs");
    expect(result.isAltoRisco).toBe(true);
    expect(result.pontos).toBe(25);
  });

  it("deve detectar .top como TLD de alto risco com 20 pontos", () => {
    const result = detectarTLDAltoRisco("example.top");
    expect(result.isAltoRisco).toBe(true);
    expect(result.pontos).toBe(20);
  });

  it("deve detectar .click como TLD de alto risco com 22 pontos", () => {
    const result = detectarTLDAltoRisco("phishing.click");
    expect(result.isAltoRisco).toBe(true);
    expect(result.pontos).toBe(22);
  });

  it("deve retornar false para TLDs legítimos como .com", () => {
    const result = detectarTLDAltoRisco("google.com");
    expect(result.isAltoRisco).toBe(false);
    expect(result.pontos).toBe(0);
  });

  it("deve detectar palavras de golpe de tarefa", () => {
    const palavras1 = detectarPalavrasGolpeTarefa("https://ganhe-dinheiro.com");
    expect(palavras1.length).toBeGreaterThan(0);
    expect(palavras1).toContain("ganhe dinheiro");

    const palavras2 = detectarPalavrasGolpeTarefa("https://renda-extra-youtube.com");
    expect(palavras2.length).toBeGreaterThan(0);
    expect(palavras2.some(p => p.includes("renda") || p.includes("youtube"))).toBe(true);
  });

  it("deve detectar redirecionamentos suspeitos", () => {
    expect(detectarRedirecionamentoSuspeito("https://example.com/wa.me/5511999999999")).toBe(true);
    expect(detectarRedirecionamentoSuspeito("https://example.com/t.me/grupo")).toBe(true);
    expect(detectarRedirecionamentoSuspeito("https://example.com/investimento")).toBe(true);
    expect(detectarRedirecionamentoSuspeito("https://google.com")).toBe(false);
  });

  it("deve usar nova escala de risco (0-20 Baixo, 21-50 Moderado, 51-80 Alto, 81-100 Crítico)", () => {
    expect(obterNivelRiscoNovo(10)).toBe("Baixo");
    expect(obterNivelRiscoNovo(20)).toBe("Baixo");
    expect(obterNivelRiscoNovo(21)).toBe("Moderado");
    expect(obterNivelRiscoNovo(50)).toBe("Moderado");
    expect(obterNivelRiscoNovo(51)).toBe("Alto");
    expect(obterNivelRiscoNovo(80)).toBe("Alto");
    expect(obterNivelRiscoNovo(81)).toBe("Crítico");
    expect(obterNivelRiscoNovo(100)).toBe("Crítico");
  });

  it("deve classificar reputação como 'Desconhecida' para domínios não confiáveis com score baixo", () => {
    const riscos = {
      trustedDomain: false,
      blacklist: false,
      virusTotalMalicious: false,
      urlhausMalware: false,
    };
    const reputacao = obterClassificacaoReputacao(riscos, 30);
    expect(reputacao).toBe("Reputação Desconhecida");
  });

  it("deve classificar reputação como 'Positiva' para domínios confiáveis com score baixo", () => {
    const riscos = {
      trustedDomain: true,
      blacklist: false,
      virusTotalMalicious: false,
      urlhausMalware: false,
    };
    const reputacao = obterClassificacaoReputacao(riscos, 10);
    expect(reputacao).toBe("Reputação Positiva");
  });

  it("deve classificar reputação como 'Negativa' para domínios com malware confirmado", () => {
    const riscos = {
      trustedDomain: false,
      blacklist: true,
      virusTotalMalicious: false,
      urlhausMalware: false,
    };
    const reputacao = obterClassificacaoReputacao(riscos, 50);
    expect(reputacao).toBe("Reputação Negativa");
  });

  it("CASO CRÍTICO: li2k.sbs/pr12 deve ter score >= 25 (TLD .sbs = +25 pontos)", () => {
    const riscos = {
      blacklist: false,
      typosquatting: false,
      encurtador: false,
      dominioRecente: false,
      urlLonga: false,
      excessoNumeros: false,
      muitosSubdominios: false,
      whatsappSuspeito: false,
      hostInterno: false,
      muitosHifens: false,
      tldSuspeito: false,
      tldAltoRisco: true,
      tldAltoRiscoPontos: 25, // .sbs = +25
      palavrasGolpeTarefa: false,
      redirecionamentoSuspeito: false,
      whatsapp: false,
      trustedDomain: false,
      virusTotalMalicious: false,
      abuseIPDBScore: false,
      urlhausMalware: false,
    };

    const score = calcularScore(riscos);
    expect(score).toBeGreaterThanOrEqual(25);
    
    const nivelRisco = obterNivelRiscoNovo(score);
    expect(nivelRisco).not.toBe("Baixo");
    expect(["Moderado", "Alto", "Crítico"]).toContain(nivelRisco);
  });

  it("CASO CRÍTICO: li2k.sbs NÃO pode ser classificado como 'Seguro'", () => {
    const riscos = {
      blacklist: false,
      typosquatting: false,
      encurtador: false,
      dominioRecente: false,
      urlLonga: false,
      excessoNumeros: false,
      muitosSubdominios: false,
      whatsappSuspeito: false,
      hostInterno: false,
      muitosHifens: false,
      tldSuspeito: false,
      tldAltoRisco: true,
      tldAltoRiscoPontos: 25, // .sbs = +25
      palavrasGolpeTarefa: false,
      redirecionamentoSuspeito: false,
      whatsapp: false,
      trustedDomain: false,
      virusTotalMalicious: false,
      abuseIPDBScore: false,
      urlhausMalware: false,
    };

    const score = calcularScore(riscos);
    const nivelRisco = obterNivelRiscoNovo(score);
    const reputacao = obterClassificacaoReputacao(riscos, score);

    // Não pode ser "Seguro"
    expect(nivelRisco).not.toBe("Baixo");
    
    // Reputação deve ser "Desconhecida" ou "Suspeita"
    expect(["Reputação Desconhecida", "Reputação Suspeita"]).toContain(reputacao);
  });
});
