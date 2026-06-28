import { describe, it, expect } from "vitest";
import { calcularScoreInteligente } from "./intelligentScoring";

describe("Scoring Profissional - Fluxo Correto", () => {
  // ========================================
  // DOMÍNIOS CONFIÁVEIS - NUNCA PHISHING
  // ========================================

  it("SharePoint legítimo com URL longa = Suspeito (nunca Alto Risco)", () => {
    const url = "https://u2ccustom-my.sharepoint.com/personal/user_company_com/_layouts/15/onedrive.aspx?id=/personal/user_company_com/Documents/Arquivo.pdf";
    const result = calcularScoreInteligente(
      url,
      "u2ccustom-my.sharepoint.com",
      false, // Não detectado por Google
      [],
      true, // URL longa
      false,
      false,
      [],
      true // HTTPS
    );

    expect(result.scoreTotal).toBeLessThan(30); // Máximo 30 = Suspeito
    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
  });

  it("Google Drive com muitos parâmetros = Seguro ou Suspeito leve", () => {
    const url = "https://drive.google.com/file/d/1234567890/view?usp=sharing&token=abc123";
    const result = calcularScoreInteligente(
      url,
      "drive.google.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeLessThan(25); // Muito baixo
  });

  it("Microsoft Office 365 = Seguro", () => {
    const url = "https://outlook.office.com/mail/inbox";
    const result = calcularScoreInteligente(
      url,
      "outlook.office.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeLessThan(20);
  });

  it("GitHub com URL longa = Seguro", () => {
    const url = "https://github.com/user/repo/blob/main/src/components/VeryLongComponentName.tsx";
    const result = calcularScoreInteligente(
      url,
      "github.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeLessThan(20);
  });

  // ========================================
  // DOMÍNIOS DESCONHECIDOS - APLICAR HEURÍSTICA
  // ========================================

  it("Domínio desconhecido com typosquatting = Alto Risco", () => {
    const url = "https://micr0soft-update.com/login";
    const result = calcularScoreInteligente(
      url,
      "micr0soft-update.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeGreaterThan(40);
  });

  it("Domínio desconhecido com URL encurtada = Alto Risco", () => {
    const url = "https://bit.ly/abc123";
    const result = calcularScoreInteligente(
      url,
      "bit.ly",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeGreaterThan(30);
  });

  it("Domínio desconhecido com múltiplas características suspeitas = Alto Risco", () => {
    const url = "https://suspicious-domain.com/login?token=abc123&id=user&code=xyz&verify=true";
    const result = calcularScoreInteligente(
      url,
      "suspicious-domain.com",
      false,
      [],
      true, // URL longa
      true, // Muitos subdomínios
      true, // Excesso de números
      ["login", "verify"],
      true
    );

    expect(result.scoreTotal).toBeGreaterThan(50);
  });

  // ========================================
  // GOOGLE SAFE BROWSING - AMEAÇA CONFIRMADA
  // ========================================

  it("Google Safe Browsing detectou = Malicioso (100)", () => {
    const url = "https://malicious-site.com/malware";
    const result = calcularScoreInteligente(
      url,
      "malicious-site.com",
      true, // Detectado por Google
      ["MALWARE", "PHISHING"],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBe(100);
    expect(result.ameacasDetectadas).toContain("MALWARE");
  });

  // ========================================
  // ENCURTADORES - VALIDAÇÃO EXATA
  // ========================================

  it("Encurtador reconhecido (bit.ly) = Alto Risco", () => {
    const url = "https://bit.ly/abc123";
    const result = calcularScoreInteligente(
      url,
      "bit.ly",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeGreaterThan(25);
  });

  it("Encurtador reconhecido (tinyurl.com) = Alto Risco", () => {
    const url = "https://tinyurl.com/abc123";
    const result = calcularScoreInteligente(
      url,
      "tinyurl.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeGreaterThan(25);
  });

  it("Encurtador reconhecido (t.co) = Alto Risco", () => {
    const url = "https://t.co/abc123";
    const result = calcularScoreInteligente(
      url,
      "t.co",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeGreaterThan(25);
  });

  // ========================================
  // FALSOS POSITIVOS - NÃO DEVEM ACONTECER
  // ========================================

  it("Dropbox legítimo = Seguro", () => {
    const url = "https://www.dropbox.com/s/abc123/file.pdf";
    const result = calcularScoreInteligente(
      url,
      "dropbox.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeLessThan(25);
  });

  it("iCloud legítimo = Seguro", () => {
    const url = "https://www.icloud.com/";
    const result = calcularScoreInteligente(
      url,
      "icloud.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    expect(result.scoreTotal).toBeLessThan(20);
  });
});
