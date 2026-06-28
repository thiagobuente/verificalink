import { describe, expect, it } from "vitest";
import { PhishingHeuristicsProvider } from "../../providers/PhishingHeuristicsProvider";

function signal(): AbortSignal {
  return new AbortController().signal;
}

describe("PhishingHeuristicsProvider", () => {
  it("detects brand impersonation with numeric substitution and phishing URL signals", async () => {
    const provider = new PhishingHeuristicsProvider();
    const result = await provider.analyze({
      tenantId: "test",
      value: "https://paypa1-security.example.com/redirect?token=abc&return=https://evil.test&urgent=true",
      type: "url",
    }, signal());

    expect(result.providerId).toBe("phishing-heuristics");
    expect(result.riskScore).toBeGreaterThanOrEqual(60);
    expect(result.tags).toContain("typosquatting");
    expect(result.tags).toContain("sensitive-params");
  });

  it("keeps trusted domains low risk", async () => {
    const provider = new PhishingHeuristicsProvider();
    const result = await provider.analyze({ tenantId: "test", value: "https://github.com/login?return=/settings", type: "url" }, signal());

    expect(result.riskScore).toBe(0);
    expect(result.reputation).toBe("trusted");
    expect(result.tags).toEqual([]);
  });
});
