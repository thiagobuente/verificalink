import { describe, expect, it } from "vitest";
/**
 * Testes do Sistema de Scoring Profissional
 * Valida que domínios confiáveis não geram falsos positivos
 */

import { analisarRiscoURL, obterNivelRiscoProfissional } from "./riskScoring";
import { ehDominioConfiavel } from "./trustedDomains";

describe("Sistema de Scoring Profissional", () => {
  describe("Domínios Confiáveis", () => {
    test("Microsoft.com deve ser reconhecido como confiável", () => {
      expect(ehDominioConfiavel("microsoft.com")).toBe(true);
    });

    test("drive.google.com deve ser reconhecido como confiável", () => {
      expect(ehDominioConfiavel("drive.google.com")).toBe(true);
    });

    test("dropbox.com deve ser reconhecido como confiável", () => {
      expect(ehDominioConfiavel("dropbox.com")).toBe(true);
    });

    test("github.com deve ser reconhecido como confiável", () => {
      expect(ehDominioConfiavel("github.com")).toBe(true);
    });

    test("Domínio desconhecido não deve ser confiável", () => {
      expect(ehDominioConfiavel("exemplo-aleatorio.com")).toBe(false);
    });
  });

  describe("Análise de Risco - Casos Reais", () => {
    test("URL longa do Google Drive não deve ser Alto Risco", () => {
      const resultado = analisarRiscoURL(
        "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7/view?usp=sharing",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: false,
          urlLonga: true, // URL é longa
          muitosSubdominios: false,
          excessoNumeros: true, // Tem muitos números
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.nivelRisco).not.toBe("Alto Risco");
      expect(resultado.ehDominioConfiavel).toBe(true);
    });

    test("URL longa de domínio desconhecido deve ser Suspeito", () => {
      const resultado = analisarRiscoURL(
        "https://exemplo-aleatorio.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7/view?usp=sharing",
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

      expect(resultado.nivelRisco).toBe("Suspeito");
    });

    test("URL com typosquatting deve ser Alto Risco", () => {
      const resultado = analisarRiscoURL(
        "https://paypa1.com/login",
        {
          typosquatting: true, // Typosquatting é crítico
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

      expect(resultado.nivelRisco).toBe("Alto Risco");
    });

    test("URL encurtada deve ser Alto Risco", () => {
      const resultado = analisarRiscoURL(
        "https://bit.ly/abc123",
        {
          typosquatting: false,
          encurtador: true, // Encurtador é crítico
          dominioRecente: false,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: []
        }
      );

      expect(resultado.nivelRisco).toBe("Alto Risco");
    });

    test("URL segura do Microsoft Teams deve ser Seguro", () => {
      const resultado = analisarRiscoURL(
        "https://teams.microsoft.com",
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

      expect(resultado.nivelRisco).toBe("Seguro");
      expect(resultado.score).toBeLessThan(25);
    });

    test("URL com palavras suspeitas deve ser Suspeito", () => {
      const resultado = analisarRiscoURL(
        "https://exemplo.com/verify-account-pix",
        {
          typosquatting: false,
          encurtador: false,
          dominioRecente: false,
          urlLonga: false,
          muitosSubdominios: false,
          excessoNumeros: false,
          hostInterno: false,
          tldSuspeito: false,
          palavrasSuspeitas: ["verify", "pix"]
        }
      );

      expect(resultado.nivelRisco).toBe("Suspeito");
      expect(resultado.motivos.length).toBeGreaterThan(0);
    });
  });

  describe("Níveis de Risco", () => {
    test("Score 0-25 deve ser Seguro", () => {
      expect(obterNivelRiscoProfissional(10, false, false)).toBe("Seguro");
    });

    test("Score 26-60 deve ser Suspeito", () => {
      expect(obterNivelRiscoProfissional(40, false, false)).toBe("Suspeito");
    });

    test("Score 61+ deve ser Alto Risco", () => {
      expect(obterNivelRiscoProfissional(70, false, false)).toBe("Alto Risco");
    });

    test("Domínio confiável com score baixo deve ser Seguro", () => {
      expect(obterNivelRiscoProfissional(15, true, false)).toBe("Seguro");
    });

    test("Fatores críticos sempre resultam em Alto Risco", () => {
      expect(obterNivelRiscoProfissional(10, true, true)).toBe("Alto Risco");
    });
  });
});
