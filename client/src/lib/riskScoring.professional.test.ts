import { describe, expect, it } from "vitest";
/**
 * Testes do Sistema de Resultado Profissional
 * Valida score, motivos categorizados e classificação precisa
 */

import { analisarRiscoURL, gerarClassificacao } from "./riskScoring";

describe("Sistema de Resultado Profissional", () => {
  describe("Score e Classificação", () => {
    test("Google Drive com URL longa deve ter score baixo", () => {
      const resultado = analisarRiscoURL(
        "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7/view?usp=sharing",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: false,
          urlLonga: true,
          muitosSubdominios: false,
          excessoNumeros: true,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.score).toBeLessThan(25);
      expect(resultado.nivelRisco).toBe("Seguro");
      expect(resultado.classificacao).toContain("Seguro");
      expect(resultado.ehAmeacaConfirmada).toBe(false);
    });

    test("URL com typosquatting deve ter score alto e ser ameaça confirmada", () => {
      const resultado = analisarRiscoURL(
        "https://paypa1.com/login",
        {
          typosquatting: true,
          encurtador: false,
          dominioRecente: false,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.score).toBeGreaterThanOrEqual(35);
      expect(resultado.nivelRisco).toBe("Alto Risco");
      expect(resultado.ehAmeacaConfirmada).toBe(true);
      expect(resultado.classificacao).toContain("Ameaça confirmada");
    });

    test("URL encurtada deve ser Alto Risco", () => {
      const resultado = analisarRiscoURL(
        "https://bit.ly/abc123",
        {
          typosquatting: false,
          encurtador: true,
          dominioRecente: false,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.score).toBeGreaterThanOrEqual(30);
      expect(resultado.nivelRisco).toBe("Alto Risco");
      expect(resultado.ehAmeacaConfirmada).toBe(true);
    });

    test("URL suspeita sem fatores críticos deve ser Suspeito", () => {
      const resultado = analisarRiscoURL(
        "https://exemplo.com/verify-account-pix",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: true,
          urlLonga: true,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: ["verify", "pix"]
        }
      );

      expect(resultado.nivelRisco).toBe("Suspeito");
      expect(resultado.ehAmeacaConfirmada).toBe(false);
      expect(resultado.classificacao).toContain("Suspeito estruturalmente");
    });
  });

  describe("Motivos Categorizados", () => {
    test("Motivos devem estar categorizados (positivo, suspeito, critico)", () => {
      const resultado = analisarRiscoURL(
        "https://paypa1.com/verify-pix",
        {
          typosquatting: true,
          encurtador: false,
          dominioRecente: false,
          urlLonga: true,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: ["verify", "pix"]
        }
      );

      const tiposEncontrados = resultado.motivos.map(m => m.tipo);
      
      // Deve ter fatores críticos
      expect(tiposEncontrados).toContain("critico");
      
      // Cada motivo deve ter texto e tipo válido
      resultado.motivos.forEach(motivo => {
        expect(["positivo", "suspeito", "critico"]).toContain(motivo.tipo);
        expect(motivo.texto).toBeTruthy();
      });
    });

    test("Domínio confiável deve ter motivo positivo", () => {
      const resultado = analisarRiscoURL(
        "https://microsoft.com",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: false,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      const motivosPositivos = resultado.motivos.filter(m => m.tipo === "positivo");
      expect(motivosPositivos.length).toBeGreaterThan(0);
      expect(motivosPositivos[0].texto).toContain("Domínio confiável");
    });
  });

  describe("Distinção Heurística vs Ameaça Confirmada", () => {
    test("Heurística = fatores suspeitos sem críticos", () => {
      const resultado = analisarRiscoURL(
        "https://exemplo.com/very-long-url-with-many-parameters-and-suspicious-words",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: true,
          urlLonga: true,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.ehAmeacaConfirmada).toBe(false);
      expect(resultado.classificacao).toContain("Suspeito estruturalmente");
    });

    test("Ameaça Confirmada = fatores críticos + score alto", () => {
      const resultado = analisarRiscoURL(
        "https://bit.ly/phishing-paypa1",
        {
          typosquatting: true,
          encurtador: true,
          dominioRecente: false,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.ehAmeacaConfirmada).toBe(true);
      expect(resultado.classificacao).toContain("Ameaça confirmada");
    });
  });

  describe("Casos Reais de Uso", () => {
    test("Microsoft Teams URL deve ser Seguro", () => {
      const resultado = analisarRiscoURL(
        "https://teams.microsoft.com/l/channel/19%3a123456789%40thread.skype/General",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: false,
          urlLonga: true,
          muitosSubdominios: false,
          excessoNumeros: true,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.nivelRisco).toBe("Seguro");
      expect(resultado.score).toBeLessThan(25);
    });

    test("Dropbox compartilhado deve ser Seguro", () => {
      const resultado = analisarRiscoURL(
        "https://www.dropbox.com/s/abc123def456/documento.pdf?dl=0",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: false,
          urlLonga: true,
          muitosSubdominios: false,
          excessoNumeros: true,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.nivelRisco).toBe("Seguro");
    });

    test("Phishing clássico deve ser Alto Risco", () => {
      const resultado = analisarRiscoURL(
        "https://paypa1-verify.com/confirm-account",
        {
          typosquatting: true,
          encurtador: false,
          dominioRecente: true,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: true,
          palavrasSuspeitas: ["verify", "confirm"]
        }
      );

      expect(resultado.nivelRisco).toBe("Alto Risco");
      expect(resultado.ehAmeacaConfirmada).toBe(true);
    });
  });
});
