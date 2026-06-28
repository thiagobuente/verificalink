import { describe, it, expect } from "vitest";
import { calcularScoreInteligente } from "./intelligentScoring";

describe("Scoring Profissional - URLs Reais", () => {
  it("SharePoint legítimo com URL longa = 20-30% (Suspeito estruturalmente)", () => {
    const url = "https://u2ccustom-my.sharepoint.com/personal/user_domain_com/_layouts/15/onedrive.aspx?id=/personal/user_domain_com/Documents/file.pdf";
    const hostname = "u2ccustom-my.sharepoint.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      true, // urlLonga
      true, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeLessThan(35); // Deve estar entre 20-30
    expect(resultado.scoreTotal).toBeGreaterThan(15);
  });

  it("Microsoft 365 com URL normal = 0-10% (Seguro)", () => {
    const url = "https://outlook.office.com/mail/inbox";
    const hostname = "outlook.office.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      false, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeLessThan(15); // Deve estar entre 0-10
  });

  it("Google Drive com URL longa = 20-30% (Suspeito estruturalmente)", () => {
    const url = "https://drive.google.com/file/d/1234567890abcdefghijk/view?usp=sharing";
    const hostname = "drive.google.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      true, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeLessThan(35); // Deve estar entre 20-30
    expect(resultado.scoreTotal).toBeGreaterThan(15);
  });

  it("Domínio fake com typosquatting = 50-70% (Alto Risco)", () => {
    const url = "https://gogle-verify.com/account/login?verify=true";
    const hostname = "gogle-verify.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      true, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      ["login", "verify"], // palavrasSuspeitas
      false, // tldSuspeito
      true, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeGreaterThan(45); // Deve estar entre 50-70
  });

  it("URL encurtada = 20% (Suspeito)", () => {
    const url = "https://bit.ly/abc123xyz";
    const hostname = "bit.ly";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      false, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeLessThan(30); // Encurtador = 20%
  });

  it("Google Safe Browsing detecta malware = 100% (Malicioso)", () => {
    const url = "https://malicious-site.com/trojan";
    const hostname = "malicious-site.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      false, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      true, // googleDetected = TRUE
      ["MALWARE", "PHISHING"]
    );

    expect(resultado.scoreTotal).toBe(100); // Google detectou = 100%
    expect(resultado.fonteDeteccao).toBe("google-safe-browsing");
  });

  it("Dropbox com URL normal = 0-10% (Seguro)", () => {
    const url = "https://www.dropbox.com/s/abc123/file.pdf";
    const hostname = "www.dropbox.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      false, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeLessThan(15); // Deve estar entre 0-10
  });

  it("GitHub com URL normal = 0-10% (Seguro)", () => {
    const url = "https://github.com/user/repo";
    const hostname = "github.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      false, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeLessThan(15); // Deve estar entre 0-10
  });

  it("Domínio desconhecido com muitos parâmetros = 30-40% (Suspeito)", () => {
    const url = "https://example-site.com/login?token=abc123&session=xyz789&verify=true&confirm=1";
    const hostname = "example-site.com";
    
    const resultado = calcularScoreInteligente(
      url,
      hostname,
      false, // urlLonga
      false, // muitosSubdominios
      false, // excessoNumeros
      [], // palavrasSuspeitas
      false, // tldSuspeito
      false, // typosquatting
      true, // temHTTPS
      false, // googleDetected
      []
    );

    expect(resultado.scoreTotal).toBeGreaterThan(20); // Muitos parâmetros = suspeito
  });
});
