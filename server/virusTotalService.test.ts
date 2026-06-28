/**
 * Tests for VirusTotal Service
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeVirusTotalResult,
  getVirusTotalRiskColor,
  getVirusTotalRiskIcon,
  getVirusTotalRiskLabel,
  VirusTotalResult,
} from './virusTotalService';

describe('VirusTotal Service', () => {
  describe('analyzeVirusTotalResult', () => {
    it('should handle clean file', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: true,
        detections: 0,
        vendors: 70,
        malwareNames: [],
        threatCategories: [],
        riskLevel: 'clean',
        vendors_detected: [],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.shouldBlock).toBe(false);
      expect(analysis.recommendations.some((r) => r.includes('não detectado'))).toBe(true);
    });

    it('should handle suspicious file', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: true,
        detections: 3,
        vendors: 70,
        malwareNames: ['Trojan.Generic', 'Win32.Malware'],
        threatCategories: ['trojan'],
        riskLevel: 'suspicious',
        vendors_detected: [
          {
            vendor: 'Avast',
            category: 'trojan',
            engine_name: 'Avast',
          },
        ],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.shouldBlock).toBe(true);
      expect(analysis.recommendations.some((r) => r.includes('ATENÇÃO'))).toBe(true);
    });

    it('should handle malicious file', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: true,
        detections: 10,
        vendors: 70,
        malwareNames: ['Ransomware.Crypto', 'Trojan.Downloader'],
        threatCategories: ['ransom', 'trojan'],
        riskLevel: 'malicious',
        vendors_detected: [
          {
            vendor: 'Avast',
            category: 'ransom',
            engine_name: 'Avast',
          },
        ],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.shouldBlock).toBe(true);
      expect(analysis.recommendations.some((r) => r.includes('CRÍTICO'))).toBe(true);
      expect(analysis.recommendations.some((r) => r.includes('Ransomware'))).toBe(true);
    });

    it('should handle unknown file', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: false,
        detections: 0,
        vendors: 0,
        malwareNames: [],
        threatCategories: [],
        riskLevel: 'unknown',
        vendors_detected: [],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.shouldBlock).toBe(false);
      expect(analysis.recommendations.some((r) => r.includes('não encontrado'))).toBe(true);
    });

    it('should detect trojan threat', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: true,
        detections: 5,
        vendors: 70,
        malwareNames: ['Trojan.Generic'],
        threatCategories: ['trojan'],
        riskLevel: 'suspicious',
        vendors_detected: [],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.recommendations.some((r) => r.includes('Trojan'))).toBe(true);
      expect(analysis.recommendations.some((r) => r.includes('roubar dados'))).toBe(true);
    });

    it('should detect ransomware threat', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: true,
        detections: 8,
        vendors: 70,
        malwareNames: ['Ransomware.Crypto'],
        threatCategories: ['ransom'],
        riskLevel: 'malicious',
        vendors_detected: [],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.recommendations.some((r) => r.includes('Ransomware'))).toBe(true);
      expect(analysis.recommendations.some((r) => r.includes('criptografar'))).toBe(true);
    });

    it('should detect spyware threat', () => {
      const result: VirusTotalResult = {
        hash: 'abc123',
        found: true,
        detections: 4,
        vendors: 70,
        malwareNames: ['Spyware.Generic'],
        threatCategories: ['spyware'],
        riskLevel: 'suspicious',
        vendors_detected: [],
      };

      const analysis = analyzeVirusTotalResult(result);
      expect(analysis.recommendations.some((r) => r.includes('Spyware'))).toBe(true);
      expect(analysis.recommendations.some((r) => r.includes('monitorar'))).toBe(true);
    });
  });

  describe('getVirusTotalRiskColor', () => {
    it('should return red for malicious', () => {
      const color = getVirusTotalRiskColor('malicious');
      expect(color).toContain('red');
    });

    it('should return orange for suspicious', () => {
      const color = getVirusTotalRiskColor('suspicious');
      expect(color).toContain('orange');
    });

    it('should return green for clean', () => {
      const color = getVirusTotalRiskColor('clean');
      expect(color).toContain('green');
    });

    it('should return yellow for unknown', () => {
      const color = getVirusTotalRiskColor('unknown');
      expect(color).toContain('yellow');
    });
  });

  describe('getVirusTotalRiskIcon', () => {
    it('should return alarm icon for malicious', () => {
      const icon = getVirusTotalRiskIcon('malicious');
      expect(icon).toBe('🚨');
    });

    it('should return warning icon for suspicious', () => {
      const icon = getVirusTotalRiskIcon('suspicious');
      expect(icon).toBe('⚠️');
    });

    it('should return checkmark for clean', () => {
      const icon = getVirusTotalRiskIcon('clean');
      expect(icon).toBe('✅');
    });

    it('should return question mark for unknown', () => {
      const icon = getVirusTotalRiskIcon('unknown');
      expect(icon).toBe('❓');
    });
  });

  describe('getVirusTotalRiskLabel', () => {
    it('should return correct label for malicious', () => {
      const label = getVirusTotalRiskLabel('malicious');
      expect(label).toBe('MALICIOSO');
    });

    it('should return correct label for suspicious', () => {
      const label = getVirusTotalRiskLabel('suspicious');
      expect(label).toBe('SUSPEITO');
    });

    it('should return correct label for clean', () => {
      const label = getVirusTotalRiskLabel('clean');
      expect(label).toBe('LIMPO');
    });

    it('should return correct label for unknown', () => {
      const label = getVirusTotalRiskLabel('unknown');
      expect(label).toBe('DESCONHECIDO');
    });
  });
});
