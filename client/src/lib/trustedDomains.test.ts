import { describe, it, expect } from "vitest";
import { calcularScoreInteligente } from "./intelligentScoring";

describe("Lógica Profissional de Domínios Confiáveis", () => {
  it("Google Drive com URL normal = Seguro (score baixo)", () => {
    const resultado = calcularScoreInteligente(
      "https://drive.google.com/file/d/1234567890/view",
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

    expect(resultado.scoreTotal).toBeLessThan(20); // Seguro
    expect(resultado.scoreReputacao).toBe(0); // Domínio confiável
  });

  it("Google Drive com URL estranha = Suspeito (score 20)", () => {
    const resultado = calcularScoreInteligente(
      "https://drive.google.com/file/d/1234567890/view?param=login&verify=account&confirm=password",
      {
        typosquatting: false,
        encurtador: false,
        dominioRecente: false,
        urlLonga: true, // URL estranha/longa
        muitosSubdominios: false,
        excessoNumeros: false,
        hostInterno: false,
        tldSuspeito: false,
        palavrasSuspeitas: ["login", "verify", "confirm"]
      }
    );

    expect(resultado.scoreTotal).toBeGreaterThanOrEqual(20); // Suspeito
    expect(resultado.scoreTotal).toBeLessThan(50); // Não é Alto Risco
  });

  it("Microsoft Office com URL normal = Seguro", () => {
    const resultado = calcularScoreInteligente(
      "https://office.com/launch/word",
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

    expect(resultado.scoreTotal).toBeLessThan(20); // Seguro
  });

  it("Domínio fake com padrões phishing = Alto Risco", () => {
    const resultado = calcularScoreInteligente(
      "https://gogle-verify.com/account/login?verify=true",
      {
        typosquatting: true, // Typosquatting detectado
        encurtador: false,
        dominioRecente: false,
        urlLonga: true,
        muitosSubdominios: false,
        excessoNumeros: false,
        hostInterno: false,
        tldSuspeito: false,
        palavrasSuspeitas: ["login", "verify", "account"]
      }
    );

    expect(resultado.scoreTotal).toBeGreaterThan(50); // Alto Risco
  });

  it("Encurtador em domínio confiável = Suspeito", () => {
    const resultado = calcularScoreInteligente(
      "https://bit.ly/abc123xyz",
      {
        typosquatting: false,
        encurtador: true, // Encurtador detectado
        dominioRecente: false,
        urlLonga: false,
        muitosSubdominios: false,
        excessoNumeros: false,
        hostInterno: false,
        tldSuspeito: false,
        palavrasSuspeitas: []
      }
    );

    expect(resultado.scoreTotal).toBeGreaterThan(10); // Suspeito
    expect(resultado.scoreTotal).toBeLessThan(60); // Não é Alto Risco
  });

  it("Dropbox com URL normal = Seguro", () => {
    const resultado = calcularScoreInteligente(
      "https://www.dropbox.com/s/abc123/file.pdf",
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

    expect(resultado.scoreTotal).toBeLessThan(20); // Seguro
  });
});
