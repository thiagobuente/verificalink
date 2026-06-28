import { describe, it, expect } from "vitest";
import { analisarReputacao } from "./reputationEngine";

describe("Reputation Engine - Motor de Reputação Híbrido", () => {
  it("deve analisar domínio confiável (Google)", async () => {
    const result = await analisarReputacao(
      "drive.google.com",
      "https://drive.google.com/file/d/123456"
    );

    expect(result.fontes).toHaveLength(5);
    expect(result.scoreGeral).toBeLessThan(30);
    expect(result.confiancaGeral).toBeGreaterThan(80);
    expect(result.resumo).toContain("✅");
  });

  it("deve analisar domínio confiável com URL longa (SharePoint)", async () => {
    const result = await analisarReputacao(
      "u2ccustom-my.sharepoint.com",
      "https://u2ccustom-my.sharepoint.com/personal/user_domain_com/_layouts/15/onedrive.aspx?id=/personal/user_domain_com/Documents/file.docx"
    );

    expect(result.scoreGeral).toBeLessThan(35);
    expect(result.resumo).toContain("⚠️");
  });

  it("deve detectar Google Safe Browsing malicioso", async () => {
    const result = await analisarReputacao(
      "malicious-site.com",
      "https://malicious-site.com/phishing",
      { ameacas: ["MALWARE", "PHISHING"] }
    );

    expect(result.scoreGeral).toBeGreaterThan(90);
    expect(result.resumo).toContain("❌");
  });

  it("deve analisar URL sem HTTPS", async () => {
    const result = await analisarReputacao(
      "example.com",
      "http://example.com/page"
    );

    const httpsSource = result.fontes.find(f => f.nome === "HTTPS");
    expect(httpsSource?.status).toBe("suspeito");
    expect(httpsSource?.confianca).toBeLessThan(85);
  });

  it("deve detectar padrões de phishing", async () => {
    const result = await analisarReputacao(
      "fake-bank.com",
      "https://fake-bank.com/login/verify/account/update"
    );

    const phishingSource = result.fontes.find(f => f.nome === "Padrões de Phishing");
    expect(phishingSource?.status).toBe("suspeito");
  });

  it("deve retornar todas as 5 fontes de análise", async () => {
    const result = await analisarReputacao(
      "example.com",
      "https://example.com/page"
    );

    const fonteNomes = result.fontes.map(f => f.nome);
    expect(fonteNomes).toContain("Google Safe Browsing");
    expect(fonteNomes).toContain("Whitelist");
    expect(fonteNomes).toContain("HTTPS");
    expect(fonteNomes).toContain("Idade do Domínio");
    expect(fonteNomes).toContain("Padrões de Phishing");
  });

  it("deve ter confiança geral entre 0-100", async () => {
    const result = await analisarReputacao(
      "test.com",
      "https://test.com"
    );

    expect(result.confiancaGeral).toBeGreaterThanOrEqual(0);
    expect(result.confiancaGeral).toBeLessThanOrEqual(100);
  });
});
