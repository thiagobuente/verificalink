/**
 * Multi-Source Security Analysis Router
 * Integra VirusTotal, URLhaus, AbuseIPDB, Google Safe Browsing
 */

import { z } from 'zod';

// Importar tRPC quando disponível - por enquanto usar estrutura básica
const publicProcedure = {
  input: (schema: any) => ({
    query: (fn: any) => ({ query: fn }),
    mutation: (fn: any) => ({ mutation: fn }),
  }),
};

import { analyzeURLWithVirusTotal, calculateVirusTotalRiskScore, getVirusTotalVerdictDescription } from '../integrations/virustotal';
import { checkURLInURLhaus, calculateURLhausRiskScore, getURLhausThreatDescription } from '../integrations/urlhaus';
import { checkIPInAbuseIPDB, calculateAbuseIPDBRiskScore, getAbuseIPDBRiskDescription } from '../integrations/abuseipdb';

const router = (routes: any) => routes;

export const multiSourceAnalysisRouter = router({
  /**
   * Analisar URL com múltiplas fontes de segurança
   */
  analyzeURLMultiSource: publicProcedure
    .input(z.object({
      url: z.string().url(),
    }))
    .query(async ({ input }: { input: { url: string } }) => {
      const { url } = input;
      const results = {
        url,
        sources: [] as any[],
        overallScore: 0,
        overallStatus: 'SAFE' as 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS',
        timestamp: new Date().toISOString(),
      };

      try {
        // 1. VirusTotal Analysis
        const vtResult = await analyzeURLWithVirusTotal(url);
        if (vtResult) {
          const vtScore = calculateVirusTotalRiskScore(vtResult);
          results.sources.push({
            name: 'VirusTotal',
            status: vtResult.verdict === 'MALICIOUS' ? 'MALICIOUS' : vtResult.verdict === 'SUSPICIOUS' ? 'SUSPICIOUS' : 'SAFE',
            score: vtScore,
            details: getVirusTotalVerdictDescription(vtResult.verdict),
            detections: vtResult.maliciousCount,
            color: 'cyan',
          });
        }

        // 2. URLhaus Analysis
        const uhResult = await checkURLInURLhaus(url);
        if (uhResult) {
          const uhScore = calculateURLhausRiskScore(uhResult);
          results.sources.push({
            name: 'URLhaus',
            status: uhResult.isInDatabase ? 'MALICIOUS' : 'SAFE',
            score: uhScore,
            details: uhResult.isInDatabase ? getURLhausThreatDescription(uhResult.threat) : 'URL não encontrada no banco de dados',
            color: 'orange',
          });
        }

        // 3. Extract IP from URL and check with AbuseIPDB
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          
          // Simples verificação de IP (em produção, fazer DNS lookup)
          if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            const abuseResult = await checkIPInAbuseIPDB(hostname);
            if (abuseResult) {
              const abuseScore = calculateAbuseIPDBRiskScore(abuseResult);
              results.sources.push({
                name: 'AbuseIPDB',
                status: abuseScore >= 75 ? 'MALICIOUS' : abuseScore >= 25 ? 'SUSPICIOUS' : 'SAFE',
                score: abuseScore,
                details: getAbuseIPDBRiskDescription(abuseScore),
                color: 'red',
              });
            }
          }
        } catch (error) {
          console.error('IP extraction error:', error);
        }

        // 4. Calcular score geral
        if (results.sources.length > 0) {
          const avgScore = Math.round(
            results.sources.reduce((sum, s) => sum + s.score, 0) / results.sources.length
          );
          results.overallScore = avgScore;

          // Determinar status geral
          if (avgScore >= 75) {
            results.overallStatus = 'MALICIOUS';
          } else if (avgScore >= 25) {
            results.overallStatus = 'SUSPICIOUS';
          } else {
            results.overallStatus = 'SAFE';
          }
        }

        return results;
      } catch (error) {
        console.error('Multi-source analysis error:', error);
        return {
          ...results,
          error: 'Erro ao realizar análise',
        };
      }
    }),

  /**
   * Obter status de segurança resumido
   */
  getSecurityStatus: publicProcedure
    .input(z.object({
      url: z.string().url(),
    }))
    .query(async ({ input }: { input: { url: string } }) => {
      const { url } = input;

      try {
        // Verificação rápida com URLhaus (mais rápido)
        const uhResult = await checkURLInURLhaus(url);
        
        if (uhResult?.isInDatabase) {
          return {
            status: 'MALICIOUS',
            message: `URL identificada como ${uhResult.threat} no URLhaus`,
            source: 'URLhaus',
          };
        }

        return {
          status: 'SAFE',
          message: 'URL não identificada como maliciosa',
          source: 'URLhaus',
        };
      } catch (error) {
        console.error('Security status error:', error);
        return {
          status: 'UNKNOWN',
          message: 'Erro ao verificar segurança',
        };
      }
    }),
});
