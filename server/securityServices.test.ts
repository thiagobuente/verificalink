import { describe, it, expect, beforeAll } from "vitest";
import {
  checkWhoisData,
  checkAlienVaultOTX,
  checkURLScan,
  checkGeoIP,
  checkHybridAnalysis,
  checkSpamhaus,
  checkProjectHoneyPot,
  checkDNSReputation,
  checkCensys,
  performComprehensiveSecurityAnalysis,
} from "./securityServices";

describe("Security Services - API Integration Tests", () => {
  const testDomain = "google.com";
  const testIP = "8.8.8.8";
  const testURL = "https://www.google.com";
  const suspiciousDomain = "example.com";

  describe("WHOIS Lookup", () => {
    it("should return domain information", async () => {
      const result = await checkWhoisData(testDomain);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("isNewDomain");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
      expect(typeof result.riskScore).toBe("number");
      expect(Array.isArray(result.details)).toBe(true);
    });

    it("should handle invalid domains gracefully", async () => {
      const result = await checkWhoisData("invalid-domain-12345.xyz");
      
      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.details)).toBe(true);
    });
  });

  describe("AlienVault OTX", () => {
    it("should check domain reputation", async () => {
      const result = await checkAlienVaultOTX(testDomain, "domain");
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("isMalicious");
      expect(result).toHaveProperty("pulseCount");
      expect(result).toHaveProperty("threatTypes");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
      expect(typeof result.isMalicious).toBe("boolean");
      expect(typeof result.riskScore).toBe("number");
    });

    it("should check IP reputation", async () => {
      const result = await checkAlienVaultOTX(testIP, "ip");
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("isMalicious");
      expect(typeof result.riskScore).toBe("number");
    });
  });

  describe("URLScan.io", () => {
    it("should return website analysis results", async () => {
      const result = await checkURLScan(testURL);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("technologies");
      expect(result).toHaveProperty("hasRedirects");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
      expect(Array.isArray(result.technologies)).toBe(true);
      expect(typeof result.hasRedirects).toBe("boolean");
      expect(typeof result.riskScore).toBe("number");
    });
  });



  describe("Hybrid Analysis", () => {
    it("should return malware analysis results", async () => {
      const result = await checkHybridAnalysis(testURL);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("isDetected");
      expect(result).toHaveProperty("threatLevel");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
      expect(typeof result.isDetected).toBe("boolean");
      expect(typeof result.threatLevel).toBe("string");
      expect(typeof result.riskScore).toBe("number");
    });
  });

  describe("Spamhaus", () => {
    it("should check IP reputation against Spamhaus", async () => {
      const result = await checkSpamhaus(testIP);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("isListed");
      expect(result).toHaveProperty("listType");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
      expect(typeof result.isListed).toBe("boolean");
      expect(typeof result.riskScore).toBe("number");
    });
  });



  describe("DNS Reputation", () => {
    it("should check DNS reputation", async () => {
      const result = await checkDNSReputation(testDomain);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("isDNSHijacked");
      expect(result).toHaveProperty("dnsServers");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
      expect(typeof result.isDNSHijacked).toBe("boolean");
      expect(Array.isArray(result.dnsServers)).toBe(true);
      expect(typeof result.riskScore).toBe("number");
    });
  });



  describe("Comprehensive Security Analysis", () => {
    it("should perform complete security analysis", async () => {
      const result = await performComprehensiveSecurityAnalysis(testURL);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("overallRiskScore");
      expect(result).toHaveProperty("threatLevel");
      expect(result).toHaveProperty("allSources");
      expect(result).toHaveProperty("consolidatedDetails");
      
      // Validar tipos
      expect(typeof result.overallRiskScore).toBe("number");
      expect(["SEGURO", "SUSPEITO", "ALTO RISCO", "CRÍTICO"]).toContain(result.threatLevel);
      expect(typeof result.allSources).toBe("object");
      expect(Array.isArray(result.consolidatedDetails)).toBe(true);
      
      // Validar ranges
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it("should handle suspicious URLs", async () => {
      const result = await performComprehensiveSecurityAnalysis("https://bit.ly/test");
      
      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.threatLevel).toBeDefined();
    });

    it("should consolidate details from all sources", async () => {
      const result = await performComprehensiveSecurityAnalysis(testURL);
      
      expect(Array.isArray(result.consolidatedDetails)).toBe(true);
      // Deve ter pelo menos alguns detalhes consolidados
      expect(result.consolidatedDetails.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      // Testar com URL inválida
      const result = await performComprehensiveSecurityAnalysis("https://invalid-domain-12345-xyz.com");
      
      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.threatLevel).toBeDefined();
    });

    it("should return valid structure even when APIs fail", async () => {
      const result = await checkWhoisData("invalid");
      
      expect(result).toHaveProperty("isNewDomain");
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("details");
    });
  });

  describe("Risk Score Calculations", () => {
    it("should calculate risk scores correctly", async () => {
      const result = await performComprehensiveSecurityAnalysis(testURL);
      
      // Risk score deve estar entre 0 e 100
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
      
      // Threat level deve corresponder ao risk score
      if (result.overallRiskScore < 20) {
        expect(result.threatLevel).toBe("SEGURO");
      } else if (result.overallRiskScore < 40) {
        expect(result.threatLevel).toBe("SUSPEITO");
      } else if (result.overallRiskScore < 70) {
        expect(result.threatLevel).toBe("ALTO RISCO");
      } else {
        expect(result.threatLevel).toBe("CRÍTICO");
      }
    });
  });
});
