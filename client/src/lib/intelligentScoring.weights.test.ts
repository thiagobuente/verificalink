import { describe, it, expect } from "vitest";
import { calcularScoreInteligente } from "./intelligentScoring";

describe("Scoring com Pesos Reduzidos - Teste Definitivo", () => {
  // ========================================
  // SHAREPOINT LEGÍTIMO (O TESTE CRÍTICO)
  // ========================================
  it("SharePoint legítimo = 22% (Suspeito estruturalmente)", () => {
    // URL real do SharePoint: u2ccustom-my.sharepoint.com
    const result = calcularScoreInteligente(
      "https://u2ccustom-my.sharepoint.com/personal/user_company_com/_layouts/15/onedrive.aspx?id=/personal/user_company_com/Documents/Arquivo.pdf",
      "u2ccustom-my.sharepoint.com",
      false, // Não detectado por Google
      [],
      true, // URL longa
      false,
      false,
      [],
      true // HTTPS
    );

    console.log("SharePoint Score:", result.scoreTotal);
    console.log("Componentes:", result.componentes);

    // Esperado: -35 (reputação) + 0 (HTTPS) + 8 (URL longa) = -27 → 0 (mínimo)
    // Mas como é domínio confiável, não aplica heurística completa
    expect(result.scoreTotal).toBeLessThan(30);
    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
  });

  // ========================================
  // GOOGLE DRIVE LEGÍTIMO
  // ========================================
  it("Google Drive legítimo = Seguro", () => {
    const result = calcularScoreInteligente(
      "https://drive.google.com/file/d/1234567890/view?usp=sharing",
      "drive.google.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      [],
      true
    );

    console.log("Google Drive Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeLessThan(20);
  });

  // ========================================
  // MICROSOFT OFFICE 365
  // ========================================
  it("Microsoft Office 365 = Seguro", () => {
    const result = calcularScoreInteligente(
      "https://outlook.office.com/mail/inbox",
      "outlook.office.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    console.log("Microsoft Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeLessThan(20);
  });

  // ========================================
  // GITHUB LEGÍTIMO
  // ========================================
  it("GitHub legítimo = Seguro", () => {
    const result = calcularScoreInteligente(
      "https://github.com/user/repo/blob/main/src/components/VeryLongComponentName.tsx",
      "github.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      [],
      true
    );

    console.log("GitHub Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeLessThan(20);
  });

  // ========================================
  // DROPBOX LEGÍTIMO
  // ========================================
  it("Dropbox legítimo = Seguro", () => {
    const result = calcularScoreInteligente(
      "https://www.dropbox.com/s/abc123def456/arquivo.pdf?dl=0",
      "dropbox.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      [],
      true
    );

    console.log("Dropbox Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeLessThan(20);
  });

  // ========================================
  // DOMÍNIO DESCONHECIDO COM TYPOSQUATTING
  // ========================================
  it("Typosquatting (micr0soft-update.com) = Alto Risco", () => {
    const result = calcularScoreInteligente(
      "https://micr0soft-update.com/login",
      "micr0soft-update.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    console.log("Typosquatting Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeGreaterThan(30);
  });

  // ========================================
  // ENCURTADOR (bit.ly)
  // ========================================
  it("Encurtador bit.ly = Alto Risco", () => {
    const result = calcularScoreInteligente(
      "https://bit.ly/abc123",
      "bit.ly",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    console.log("Bit.ly Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeGreaterThan(25);
  });

  // ========================================
  // GOOGLE SAFE BROWSING DETECTOU
  // ========================================
  it("Google Safe Browsing detectou = Malicioso (100)", () => {
    const result = calcularScoreInteligente(
      "https://malicious-site.com/malware",
      "malicious-site.com",
      true, // Detectado por Google
      ["MALWARE", "PHISHING"],
      false,
      false,
      false,
      [],
      true
    );

    console.log("Google Safe Browsing Score:", result.scoreTotal);
    expect(result.scoreTotal).toBe(100);
  });

  // ========================================
  // DOMÍNIO DESCONHECIDO COM MÚLTIPLAS CARACTERÍSTICAS
  // ========================================
  it("Domínio desconhecido + URL longa + muitos parâmetros = Alto Risco", () => {
    const result = calcularScoreInteligente(
      "https://suspicious-domain.com/login?token=abc123&id=user&code=xyz&verify=true",
      "suspicious-domain.com",
      false,
      [],
      true, // URL longa
      false,
      false,
      ["login", "verify"],
      true
    );

    console.log("Suspicious Domain Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeGreaterThan(40);
  });

  // ========================================
  // HTTP (Sem HTTPS)
  // ========================================
  it("Domínio desconhecido sem HTTPS = Alto Risco", () => {
    const result = calcularScoreInteligente(
      "http://suspicious-domain.com/login",
      "suspicious-domain.com",
      false,
      [],
      false,
      false,
      false,
      [],
      false // Sem HTTPS
    );

    console.log("HTTP Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeGreaterThan(30);
  });

  // ========================================
  // ICLOUD LEGÍTIMO
  // ========================================
  it("iCloud legítimo = Seguro", () => {
    const result = calcularScoreInteligente(
      "https://www.icloud.com/",
      "icloud.com",
      false,
      [],
      false,
      false,
      false,
      [],
      true
    );

    console.log("iCloud Score:", result.scoreTotal);
    expect(result.scoreTotal).toBeLessThan(20);
  });
});
