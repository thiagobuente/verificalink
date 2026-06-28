import { describe, it, expect } from "vitest";
import { classificarURL } from "./classificationLogic";

describe("Lógica de Classificação Profissional", () => {
  it("Google Safe Browsing detecta malware = Malicioso", () => {
    const resultado = classificarURL(
      "https://malicious-site.com/trojan",
      80,
      true,
      true, // googleDetected
      ["MALWARE", "PHISHING"]
    );

    expect(resultado.nivel).toBe("Malicioso");
    expect(resultado.ehAmeacaConfirmada).toBe(true);
    expect(resultado.fonte).toBe("Google Safe Browsing");
    expect(resultado.mensagem).toContain("Google Safe Browsing");
  });

  it("Google Drive + URL estranha = Suspeito (não Alto Risco)", () => {
    const resultado = classificarURL(
      "https://drive.google.com/file/d/1234567890/view?param=login&verify=account",
      25,
      true, // temCaracteristicasSuspeitas
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Suspeito");
    expect(resultado.ehAmeacaConfirmada).toBe(false);
    expect(resultado.fonte).toBe("Análise Heurística");
    expect(resultado.mensagem).toContain("domínio conhecido");
  });

  it("Domínio fake + características suspeitas = Alto Risco", () => {
    const resultado = classificarURL(
      "https://gogle-verify.com/account/login?verify=true",
      65,
      true, // temCaracteristicasSuspeitas
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Alto Risco");
    expect(resultado.ehAmeacaConfirmada).toBe(false);
    expect(resultado.mensagem).toContain("padrões comuns de phishing");
  });

  it("Microsoft Office + URL normal = Seguro", () => {
    const resultado = classificarURL(
      "https://office.com/launch/word",
      10,
      false, // temCaracteristicasSuspeitas
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Seguro");
    expect(resultado.ehAmeacaConfirmada).toBe(false);
    expect(resultado.mensagem).toContain("Domínio confiável");
  });

  it("URL desconhecida sem características suspeitas = Seguro", () => {
    const resultado = classificarURL(
      "https://example-blog.com/article",
      5,
      false, // temCaracteristicasSuspeitas
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Seguro");
    expect(resultado.ehAmeacaConfirmada).toBe(false);
  });

  it("Dropbox + URL normal = Seguro", () => {
    const resultado = classificarURL(
      "https://www.dropbox.com/s/abc123/file.pdf",
      8,
      false, // temCaracteristicasSuspeitas
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Seguro");
    expect(resultado.mensagem).toContain("Domínio confiável");
  });

  it("Encurtador com URL suspeita = Alto Risco", () => {
    const resultado = classificarURL(
      "https://bit.ly/abc123xyz",
      55,
      true, // temCaracteristicasSuspeitas (encurtador)
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Alto Risco");
    expect(resultado.mensagem).toContain("padrões comuns de phishing");
  });

  it("GitHub + URL normal = Seguro", () => {
    const resultado = classificarURL(
      "https://github.com/user/repo",
      5,
      false, // temCaracteristicasSuspeitas
      false // googleDetected
    );

    expect(resultado.nivel).toBe("Seguro");
    expect(resultado.ehAmeacaConfirmada).toBe(false);
  });
});
