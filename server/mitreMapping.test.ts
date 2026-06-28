import { describe, it, expect } from 'vitest';
import {
  mapThreatToMITRE,
  mapThreatsToMITRE,
  mapAnalysisResultsToMITRE,
  generateMITREDescription,
} from './mitreMapping';

describe('MITRE ATT&CK Mapping', () => {
  describe('mapThreatToMITRE', () => {
    it('deve mapear phishing para técnicas MITRE', () => {
      const techniques = mapThreatToMITRE('phishing');
      expect(techniques.length).toBeGreaterThan(0);
      expect(techniques[0].id).toBe('T1566');
      expect(techniques[0].name).toBe('Phishing');
    });

    it('deve mapear malware para técnicas MITRE', () => {
      const techniques = mapThreatToMITRE('malware');
      expect(techniques.length).toBeGreaterThan(0);
      expect(techniques[0].id).toBe('T1189');
      expect(techniques[0].name).toBe('Drive-by Compromise');
    });

    it('deve retornar array vazio para tipo de ameaça desconhecido', () => {
      const techniques = mapThreatToMITRE('tipo-desconhecido');
      expect(techniques).toEqual([]);
    });

    it('deve ser case-insensitive', () => {
      const techniques1 = mapThreatToMITRE('PHISHING');
      const techniques2 = mapThreatToMITRE('phishing');
      expect(techniques1.length).toBe(techniques2.length);
      expect(techniques1[0].id).toBe(techniques2[0].id);
    });
  });

  describe('mapThreatsToMITRE', () => {
    it('deve mapear múltiplas ameaças sem duplicatas', () => {
      const techniques = mapThreatsToMITRE(['phishing', 'phishing', 'malware']);
      expect(techniques.length).toBe(3); // T1566, T1598 do phishing + T1189 do malware
      
      const ids = techniques.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length); // Sem duplicatas
    });

    it('deve ordenar por confiança decrescente', () => {
      const techniques = mapThreatsToMITRE(['phishing', 'malware']);
      for (let i = 0; i < techniques.length - 1; i++) {
        expect(techniques[i].confidence).toBeGreaterThanOrEqual(techniques[i + 1].confidence);
      }
    });

    it('deve retornar array vazio para lista vazia', () => {
      const techniques = mapThreatsToMITRE([]);
      expect(techniques).toEqual([]);
    });
  });

  describe('mapAnalysisResultsToMITRE', () => {
    it('deve mapear resultado de análise com phishing', () => {
      const result = {
        hasPhishing: true,
        isScam: false,
      };
      const techniques = mapAnalysisResultsToMITRE(result);
      expect(techniques.length).toBeGreaterThan(0);
      expect(techniques.some(t => t.id === 'T1566')).toBe(true);
    });

    it('deve mapear resultado com múltiplos indicadores', () => {
      const result = {
        hasPhishing: true,
        hasMalware: true,
        hasRedirects: true,
        isNewDomain: true,
      };
      const techniques = mapAnalysisResultsToMITRE(result);
      expect(techniques.length).toBeGreaterThan(1);
    });

    it('deve retornar array vazio para análise limpa', () => {
      const result = {
        hasPhishing: false,
        hasMalware: false,
        isScam: false,
      };
      const techniques = mapAnalysisResultsToMITRE(result);
      expect(techniques).toEqual([]);
    });

    it('deve respeitar threatTypes fornecidos', () => {
      const result = {
        threatTypes: ['phishing', 'malware'],
      };
      const techniques = mapAnalysisResultsToMITRE(result);
      expect(techniques.length).toBeGreaterThan(0);
    });
  });

  describe('generateMITREDescription', () => {
    it('deve gerar descrição para técnicas vazias', () => {
      const description = generateMITREDescription([]);
      expect(description).toContain('Nenhuma técnica');
    });

    it('deve gerar descrição com contagem de técnicas', () => {
      const techniques = mapThreatToMITRE('phishing');
      const description = generateMITREDescription(techniques);
      expect(description).toContain(String(techniques.length));
    });

    it('deve incluir táticas na descrição', () => {
      const techniques = mapThreatsToMITRE(['phishing', 'malware']);
      const description = generateMITREDescription(techniques);
      expect(description).toContain('tática');
    });
  });

  describe('Validação de estrutura de técnicas', () => {
    it('todas as técnicas devem ter campos obrigatórios', () => {
      const techniques = mapThreatsToMITRE(['phishing', 'malware', 'social-engineering']);
      
      techniques.forEach(tech => {
        expect(tech.id).toBeDefined();
        expect(tech.name).toBeDefined();
        expect(tech.tactic).toBeDefined();
        expect(tech.description).toBeDefined();
        expect(tech.url).toBeDefined();
        expect(tech.confidence).toBeDefined();
        
        // Validar tipos
        expect(typeof tech.id).toBe('string');
        expect(typeof tech.name).toBe('string');
        expect(typeof tech.tactic).toBe('string');
        expect(typeof tech.description).toBe('string');
        expect(typeof tech.url).toBe('string');
        expect(typeof tech.confidence).toBe('number');
        
        // Validar ranges
        expect(tech.confidence).toBeGreaterThanOrEqual(0);
        expect(tech.confidence).toBeLessThanOrEqual(100);
        expect(tech.url).toMatch(/^https:\/\/attack\.mitre\.org/);
      });
    });
  });
});
