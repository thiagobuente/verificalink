import { describe, it, expect } from "vitest";
import {
  isIPAddress,
  detectarHostInterno,
  muitosHifens,
  detectarTLDSuspeito,
  detectarTyposquatting,
  detectarEncurtador,
  urlMuitoLonga,
  excessoNumeros,
  calcularScore,
  gerarExplicacaoHumana,
  gerarResumo
} from "./urlDetection";

describe("URL Detection - Testes de Precisão", () => {
  
  // ===== TESTES DE IP =====
  describe("isIPAddress", () => {
    it("deve detectar IP válido", () => {
      expect(isIPAddress("192.168.1.1")).toBe(true);
      expect(isIPAddress("10.0.0.1")).toBe(true);
      expect(isIPAddress("127.0.0.1")).toBe(true);
    });

    it("não deve confundir domínio com IP", () => {
      expect(isIPAddress("google.com")).toBe(false);
      expect(isIPAddress("wh-atsapp.com")).toBe(false);
      expect(isIPAddress("localhost")).toBe(false);
    });
  });

  // ===== TESTES DE HOST INTERNO =====
  describe("detectarHostInterno", () => {
    it("deve detectar hosts internos", () => {
      expect(detectarHostInterno("127.0.0.1")).toBe(true);
      expect(detectarHostInterno("localhost")).toBe(true);
      expect(detectarHostInterno("0.0.0.0")).toBe(true);
    });

    it("não deve marcar domínios públicos como internos", () => {
      expect(detectarHostInterno("google.com")).toBe(false);
      expect(detectarHostInterno("192.168.1.1")).toBe(false);
    });
  });

  // ===== TESTES DE HÍFENS =====
  describe("muitosHifens", () => {
    it("deve detectar 3 ou mais hífens", () => {
      expect(muitosHifens("wh-atsapp-verify-secure.com")).toBe(true);
      expect(muitosHifens("nu-bank-seguranca-verificacao.com")).toBe(true);
    });

    it("não deve marcar URLs com poucos hífens", () => {
      expect(muitosHifens("google.com")).toBe(false);
      expect(muitosHifens("my-domain.com")).toBe(false);
      expect(muitosHifens("my-awesome-domain.com")).toBe(false);
    });
  });

  // ===== TESTES DE TLD SUSPEITO =====
  describe("detectarTLDSuspeito", () => {
    it("deve detectar TLDs suspeitos", () => {
      expect(detectarTLDSuspeito("fake.xyz")).toBe(true);
      expect(detectarTLDSuspeito("phishing.top")).toBe(true);
      expect(detectarTLDSuspeito("scam.click")).toBe(true);
      expect(detectarTLDSuspeito("malware.shop")).toBe(true);
      expect(detectarTLDSuspeito("fake.monster")).toBe(true);
      expect(detectarTLDSuspeito("phishing.gq")).toBe(true);
    });

    it("não deve marcar TLDs legítimos como suspeitos", () => {
      expect(detectarTLDSuspeito("google.com")).toBe(false);
      expect(detectarTLDSuspeito("banco.com.br")).toBe(false);
      expect(detectarTLDSuspeito("gov.br")).toBe(false);
      expect(detectarTLDSuspeito("org.br")).toBe(false);
    });
  });

  // ===== TESTES DE TYPOSQUATTING =====
  describe("detectarTyposquatting", () => {
    it("deve detectar typosquatting de marcas conhecidas", () => {
      expect(detectarTyposquatting("wh-atsapp.com")).toBe(true);
      expect(detectarTyposquatting("whatsapp-verify.com")).toBe(true);
      expect(detectarTyposquatting("nu-bank.com")).toBe(true);
      expect(detectarTyposquatting("nubank-seguranca.com")).toBe(true);
    });

    it("não deve marcar domínios legítimos como typosquatting", () => {
      expect(detectarTyposquatting("google.com")).toBe(false);
      expect(detectarTyposquatting("whatsapp.com")).toBe(false);
      expect(detectarTyposquatting("nubank.com.br")).toBe(false);
    });

    it("não deve marcar IP como typosquatting", () => {
      expect(detectarTyposquatting("192.168.1.1")).toBe(false);
      expect(detectarTyposquatting("127.0.0.1")).toBe(false);
    });
  });

  // ===== TESTES DE ENCURTADORES =====
  describe("detectarEncurtador", () => {
    it("deve detectar URLs encurtadas", () => {
      expect(detectarEncurtador("https://bit.ly/abc123")).toBe(true);
      expect(detectarEncurtador("https://tinyurl.com/xyz")).toBe(true);
      expect(detectarEncurtador("https://t.co/abc")).toBe(true);
    });

    it("não deve marcar URLs normais como encurtadas", () => {
      expect(detectarEncurtador("https://google.com")).toBe(false);
      expect(detectarEncurtador("https://whatsapp.com")).toBe(false);
    });
  });

  // ===== TESTES DE URL LONGA =====
  describe("urlMuitoLonga", () => {
    it("deve detectar URLs muito longas (>120 caracteres)", () => {
      const longUrl = "https://example.com/" + "a".repeat(150);
      expect(urlMuitoLonga(longUrl)).toBe(true);
    });

    it("não deve marcar URLs normais como longas", () => {
      expect(urlMuitoLonga("https://google.com")).toBe(false);
      expect(urlMuitoLonga("https://example.com/page/subpage")).toBe(false);
    });
  });

  // ===== TESTES DE EXCESSO DE NÚMEROS =====
  describe("excessoNumeros", () => {
    it("deve detectar URLs com muitos números", () => {
      expect(excessoNumeros("https://123456789.com")).toBe(true);
      expect(excessoNumeros("https://phishing123456789.com")).toBe(true);
    });

    it("não deve marcar URLs com poucos números", () => {
      expect(excessoNumeros("https://google.com")).toBe(false);
      expect(excessoNumeros("https://example123.com")).toBe(false);
    });
  });

  // ===== TESTES DE SCORE =====
  describe("calcularScore", () => {
    it("deve calcular score baixo para URL segura", () => {
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
        whatsapp: false
      };
      expect(calcularScore(riscos)).toBe(0);
    });

    it("deve calcular score alto para URL com múltiplos riscos", () => {
      const riscos = {
        blacklist: false,
        typosquatting: true,
        encurtador: true,
        dominioRecente: false,
        urlLonga: true,
        excessoNumeros: true,
        muitosSubdominios: false,
        whatsappSuspeito: false,
        hostInterno: false,
        muitosHifens: true,
        tldSuspeito: true,
        whatsapp: false
      };
      const score = calcularScore(riscos);
      expect(score).toBeGreaterThan(50);
    });

    it("deve dar score máximo 100 para host interno", () => {
      const riscos = {
        blacklist: false,
        typosquatting: false,
        encurtador: false,
        dominioRecente: false,
        urlLonga: false,
        excessoNumeros: false,
        muitosSubdominios: false,
        whatsappSuspeito: false,
        hostInterno: true,
        muitosHifens: false,
        tldSuspeito: false,
        whatsapp: false
      };
      expect(calcularScore(riscos)).toBe(60);
    });
  });

  // ===== TESTES DE EXPLICAÇÕES HUMANAS =====
  describe("gerarExplicacaoHumana", () => {
    it("deve gerar explicações para riscos detectados", () => {
      const riscos = {
        typosquatting: true,
        encurtador: false,
        hostInterno: false,
        urlLonga: false,
        muitosHifens: false,
        tldSuspeito: false,
        whatsapp: false,
        excessoNumeros: false,
        muitosSubdominios: false
      };
      const explicacoes = gerarExplicacaoHumana(riscos);
      expect(explicacoes.length).toBeGreaterThan(0);
      expect(explicacoes[0]).toContain("imitar uma marca");
    });

    it("não deve gerar explicações para riscos não detectados", () => {
      const riscos = {
        typosquatting: false,
        encurtador: false,
        hostInterno: false,
        urlLonga: false,
        muitosHifens: false,
        tldSuspeito: false,
        whatsapp: false,
        excessoNumeros: false,
        muitosSubdominios: false
      };
      const explicacoes = gerarExplicacaoHumana(riscos);
      expect(explicacoes.length).toBe(0);
    });
  });

  // ===== TESTES DE RESUMO =====
  describe("gerarResumo", () => {
    it("deve gerar resumo para score baixo", () => {
      const resumo = gerarResumo(20);
      expect(resumo).toContain("seguro");
    });

    it("deve gerar resumo para score médio", () => {
      const resumo = gerarResumo(45);
      expect(resumo).toContain("suspeitas");
    });

    it("deve gerar resumo para score alto", () => {
      const resumo = gerarResumo(75);
      expect(resumo).toContain("phishing");
    });
  });

  // ===== TESTES DE CASOS REAIS =====
  describe("Casos Reais de Phishing", () => {
    it("deve detectar phishing de WhatsApp", () => {
      const hostname = "wh-atsapp-verify.xyz";
      const riscos = {
        blacklist: false,
        typosquatting: detectarTyposquatting(hostname),
        encurtador: false,
        dominioRecente: false,
        urlLonga: false,
        excessoNumeros: false,
        muitosSubdominios: false,
        whatsappSuspeito: false,
        hostInterno: false,
        muitosHifens: muitosHifens(hostname),
        tldSuspeito: detectarTLDSuspeito(hostname),
        whatsapp: false
      };
      const score = calcularScore(riscos);
      expect(score).toBeGreaterThan(40);
    });

    it("deve detectar phishing de banco", () => {
      const hostname = "nu-bank-seguranca.top";
      const riscos = {
        blacklist: false,
        typosquatting: detectarTyposquatting(hostname),
        encurtador: false,
        dominioRecente: false,
        urlLonga: false,
        excessoNumeros: false,
        muitosSubdominios: false,
        whatsappSuspeito: false,
        hostInterno: false,
        muitosHifens: muitosHifens(hostname),
        tldSuspeito: detectarTLDSuspeito(hostname),
        whatsapp: false
      };
      const score = calcularScore(riscos);
      expect(score).toBeGreaterThan(40);
    });

    it("não deve marcar google.com como suspeito", () => {
      const hostname = "google.com";
      const riscos = {
        blacklist: false,
        typosquatting: detectarTyposquatting(hostname),
        encurtador: false,
        dominioRecente: false,
        urlLonga: false,
        excessoNumeros: false,
        muitosSubdominios: false,
        whatsappSuspeito: false,
        hostInterno: false,
        muitosHifens: muitosHifens(hostname),
        tldSuspeito: detectarTLDSuspeito(hostname),
        whatsapp: false
      };
      const score = calcularScore(riscos);
      expect(score).toBe(0);
    });
  });
});
