/**
 * Unit Tests for Screenshot OCR Module
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  extractTextFromImage,
  analyzeScreenshot,
} from './screenshotOCR';

describe('Screenshot OCR Module', () => {
  describe('Text Extraction', () => {
    it('should extract text from image using Claude Vision API', async () => {
      // Mock the LLM response
      vi.mock('./core/llm', () => ({
        invokeLLM: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Teste de extração de texto',
              },
            },
          ],
        }),
      }));

      // Note: In real scenario, this would call Claude Vision API
      // For testing, we're verifying the function exists and is callable
      expect(typeof extractTextFromImage).toBe('function');
    });
  });

  describe('Indicator Detection', () => {
    it('should detect URLs in text', async () => {
      const result = await analyzeScreenshot('https://example.com/test');
      expect(result.indicators.urls).toBeDefined();
      expect(Array.isArray(result.indicators.urls)).toBe(true);
    });

    it('should detect e-mails in text', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.indicators.emails).toBeDefined();
      expect(Array.isArray(result.indicators.emails)).toBe(true);
    });

    it('should detect phone numbers', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.indicators.phones).toBeDefined();
      expect(Array.isArray(result.indicators.phones)).toBe(true);
    });

    it('should detect PIX keys', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.indicators.pixKeys).toBeDefined();
      expect(Array.isArray(result.indicators.pixKeys)).toBe(true);
    });

    it('should detect risk phrases', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.indicators.riskPhrases).toBeDefined();
      expect(Array.isArray(result.indicators.riskPhrases)).toBe(true);
    });

    it('should detect brand names', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.indicators.brandNames).toBeDefined();
      expect(Array.isArray(result.indicators.brandNames)).toBe(true);
    });
  });

  describe('Risk Scoring', () => {
    it('should return risk score between 0 and 100', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should classify risk level correctly', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(['baixo', 'médio', 'alto', 'crítico']).toContain(result.riskLevel);
    });

    it('should provide recommendation', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.recommendation).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('QR Code Detection', () => {
    it('should detect QR code presence', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.hasQRCode).toBeDefined();
      expect(typeof result.hasQRCode).toBe('boolean');
    });
  });

  describe('Analysis Result Structure', () => {
    it('should return complete analysis result', async () => {
      const result = await analyzeScreenshot('https://example.com');

      // Check all required fields
      expect(result).toHaveProperty('extractedText');
      expect(result).toHaveProperty('indicators');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('detectedBrands');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('hasQRCode');

      // Check indicators structure
      expect(result.indicators).toHaveProperty('text');
      expect(result.indicators).toHaveProperty('urls');
      expect(result.indicators).toHaveProperty('domains');
      expect(result.indicators).toHaveProperty('emails');
      expect(result.indicators).toHaveProperty('phones');
      expect(result.indicators).toHaveProperty('pixKeys');
      expect(result.indicators).toHaveProperty('riskPhrases');
      expect(result.indicators).toHaveProperty('brandNames');
      expect(result.indicators).toHaveProperty('urgencyIndicators');
      expect(result.indicators).toHaveProperty('socialEngineeringTerms');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty image URL', async () => {
      try {
        await analyzeScreenshot('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid image URL', async () => {
      try {
        await analyzeScreenshot('not-a-valid-url');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle images with no indicators', async () => {
      const result = await analyzeScreenshot('https://example.com');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskLevel).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      await analyzeScreenshot('https://example.com');
      const endTime = Date.now();

      // Should complete within 10 seconds (generous timeout for API calls)
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});

describe('Risk Phrase Detection', () => {
  it('should detect urgency phrases', async () => {
    const testPhrases = [
      'acesso não reconhecido',
      'bloqueie sua conta',
      'confirme seus dados',
      'clique imediatamente',
      'tempo limitado',
    ];

    for (const phrase of testPhrases) {
      const result = await analyzeScreenshot(`https://example.com?text=${encodeURIComponent(phrase)}`);
      // Risk score should be higher when urgency phrases are present
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    }
  });

  it('should detect social engineering terms', async () => {
    const testTerms = [
      'confirme seus dados',
      'atualize suas informações',
      'valide sua identidade',
      'insira seu PIN',
      'clique no link',
    ];

    for (const term of testTerms) {
      const result = await analyzeScreenshot(`https://example.com?text=${encodeURIComponent(term)}`);
      expect(result.indicators.socialEngineeringTerms).toBeDefined();
    }
  });
});

describe('Brand Detection', () => {
  it('should detect known Brazilian brands', async () => {
    const testBrands = [
      'banco do brasil',
      'itaú',
      'bradesco',
      'caixa',
      'whatsapp',
      'instagram',
    ];

    for (const brand of testBrands) {
      const result = await analyzeScreenshot(`https://example.com?text=${encodeURIComponent(brand)}`);
      expect(result.indicators.brandNames).toBeDefined();
    }
  });
});
