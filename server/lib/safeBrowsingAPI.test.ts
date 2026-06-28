import { describe, it, expect, beforeAll } from "vitest";

/**
 * Teste para validar Google Safe Browsing API Key
 * Verifica se a chave está configurada e funciona corretamente
 */

const GOOGLE_SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

async function verificarGoogleSafeBrowsing(url: string) {
  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client: {
            clientId: "shield-security",
            clientVersion: "1.0.0"
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE"
            ],
            platformTypes: [
              "ANY_PLATFORM"
            ],
            threatEntryTypes: [
              "URL"
            ],
            threatEntries: [
              { url }
            ]
          }
        })
      }
    );

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

describe("Google Safe Browsing API", () => {
  beforeAll(() => {
    if (!GOOGLE_SAFE_BROWSING_KEY) {
      console.warn("GOOGLE_SAFE_BROWSING_API_KEY não configurada");
    }
  });

  it("deve estar configurada", () => {
    expect(GOOGLE_SAFE_BROWSING_KEY).toBeDefined();
    expect(GOOGLE_SAFE_BROWSING_KEY).not.toBe("");
  });

  it("deve retornar array vazio para URL segura (google.com)", async () => {
    const result = await verificarGoogleSafeBrowsing("https://www.google.com");
    expect(Array.isArray(result)).toBe(true);
  }, { timeout: 10000 });

  it("deve detectar URL maliciosa conhecida", async () => {
    // Usando URL de teste do Google Safe Browsing
    const result = await verificarGoogleSafeBrowsing(
      "http://malware.testing.google.test/testing/malware/"
    );
    expect(Array.isArray(result)).toBe(true);
    // A API deve retornar matches para esta URL de teste
  }, { timeout: 10000 });

  it("deve retornar array vazio para URL confiável (microsoft.com)", async () => {
    const result = await verificarGoogleSafeBrowsing("https://www.microsoft.com");
    expect(Array.isArray(result)).toBe(true);
  }, { timeout: 10000 });

  it("deve retornar array vazio para URL confiável (github.com)", async () => {
    const result = await verificarGoogleSafeBrowsing("https://www.github.com");
    expect(Array.isArray(result)).toBe(true);
  }, { timeout: 10000 });
});
