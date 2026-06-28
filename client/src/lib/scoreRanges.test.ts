import { describe, it, expect } from "vitest";
import {
  getRiskLevel,
  getRiskPercentage,
  getScoreDescription,
  SCORE_RANGES
} from "./scoreRanges";

describe("Score Ranges - Faixas de Score Humanas", () => {
  it("deve classificar score 0-20 como Seguro", () => {
    const level = getRiskLevel(10);
    expect(level.level).toBe("seguro");
    expect(level.label).toBe("Seguro");
    expect(level.emoji).toBe("✅");
  });

  it("deve classificar score 21-45 como Suspeito", () => {
    const level = getRiskLevel(35);
    expect(level.level).toBe("suspeito");
    expect(level.label).toBe("Suspeito");
    expect(level.emoji).toBe("⚠️");
  });

  it("deve classificar score 46-70 como Alto Risco", () => {
    const level = getRiskLevel(60);
    expect(level.level).toBe("alto_risco");
    expect(level.label).toBe("Alto Risco");
    expect(level.emoji).toBe("🔴");
  });

  it("deve classificar score 71+ como Malicioso", () => {
    const level = getRiskLevel(85);
    expect(level.level).toBe("malicioso");
    expect(level.label).toBe("Malicioso");
    expect(level.emoji).toBe("❌");
  });

  it("deve retornar porcentagem correta", () => {
    expect(getRiskPercentage(50)).toBe(50);
    expect(getRiskPercentage(-10)).toBe(0);
    expect(getRiskPercentage(150)).toBe(100);
  });

  it("deve gerar descrição humanizada", () => {
    const desc1 = getScoreDescription(15);
    expect(desc1).toContain("✅");
    expect(desc1).toContain("Seguro");

    const desc2 = getScoreDescription(80);
    expect(desc2).toContain("❌");
    expect(desc2).toContain("Malicioso");
  });

  it("deve ter recomendações para cada nível", () => {
    Object.values(SCORE_RANGES).forEach(range => {
      expect(range.recomendacao).toBeTruthy();
      expect(range.recomendacao.length).toBeGreaterThan(0);
    });
  });
});
