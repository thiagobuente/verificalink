import { z } from "zod";
import axios from "axios";
import { checkSafeBrowsing } from "./safeBrowsing";
import {
  checkWhoisData,
  checkAlienVaultOTX,
  checkURLScan,
  checkHybridAnalysis,
  checkSpamhaus,
  checkDNSReputation,
  checkOpenPhish,
  checkPhishTankAPI,
  checkIPinfo,
  checkSecurityTrails,
  checkViewDNS,
  checkIPAPI,
  performComprehensiveSecurityAnalysis,
} from "./securityServices";

// Tipos de router tRPC - Estrutura básica para compatibilidade
export const publicProcedure = {
  input: (_schema: any) => ({
    mutation: (fn: any) => ({ mutation: fn }),
    query: (fn: any) => ({ query: fn }),
  }),
  query: (fn: any) => ({ query: fn }),
};

export const router = (routes: any) => routes;

// Tipos de resposta
interface MalwareAnalysisResult {
  isMalicious: boolean;
  riskLevel: number;
  sources: {
    urlhaus: boolean;
    phishtank: boolean;
    patternAnalysis: boolean;
  };
  details: string[];
}

// URLhaus API - Totalmente gratuita
async function checkURLhaus(url: string): Promise<boolean> {
  try {
    const response = await axios.post(
      "https://urlhaus-api.abuse.ch/v1/url/",
      { url },
      { timeout: 5000 }
    );

    return (
      response.data.query_status === "ok" &&
      response.data.result === "malicious"
    );
  } catch (error) {
    console.error("URLhaus error:", error);
    return false;
  }
}

// PhishTank API - Totalmente gratuita
async function checkPhishTank(url: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://checkurl.phishtank.com/checkurl/?url=${encodeURIComponent(url)}&format=json`,
      { timeout: 5000 }
    );

    return response.data.results && response.data.results.in_database === "yes";
  } catch (error) {
    console.error("PhishTank error:", error);
    return false;
  }
}

// Google Safe Browsing API - Verificação em tempo real
async function checkGoogleSafeBrowsing(url: string): Promise<{
  isMalicious: boolean;
  threatTypes: string[];
}> {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    if (!apiKey) {
      console.warn("GOOGLE_SAFE_BROWSING_API_KEY nao configurada; Safe Browsing foi ignorado.");
      return { isMalicious: false, threatTypes: [] };
    }

    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        client: {
          clientId: "shield-security",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
      { timeout: 5000 }
    );

    const isMalicious = response.data.matches && response.data.matches.length > 0;
    const threatTypes = isMalicious
      ? response.data.matches.map((match: { threatType: string }) => match.threatType)
      : [];

    return { isMalicious, threatTypes };
  } catch (error) {
    console.error("Google Safe Browsing error:", error);
    return { isMalicious: false, threatTypes: [] };
  }
}

// Análise de padrões de malware (sem API externa)
function analyzePatterns(url: string): boolean {
  const maliciousPatterns = [
    /bit\.ly|tinyurl|goo\.gl|short\.link|ow\.ly|is\.gd/i, // URLs encurtadas
    /confirm|verify|update|login|secure|validate/i, // Palavras de phishing
    /paypal|amazon|apple|microsoft|google|bank|caixa|itau|bradesco/i, // Imitação de marcas
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP em vez de domínio
    /\.tk|\.ml|\.ga|\.cf|\.gq/i, // Domínios gratuitos suspeitos
  ];

  return maliciousPatterns.some((pattern) => pattern.test(url));
}

export const appRouter = router({
  // Análise de URL para malware
  malware: router({
    analyzeUrl: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }: { input: { url: string } }): Promise<MalwareAnalysisResult> => {
        const { url } = input;
        const details: string[] = [];

        // Executar análises em paralelo
        const [urlhausResult, phishtankResult, patternResult] =
          await Promise.all([
            checkURLhaus(url),
            checkPhishTank(url),
            Promise.resolve(analyzePatterns(url)),
          ]);

        if (urlhausResult) {
          details.push("🚨 Detectado no URLhaus (banco de URLs maliciosas)");
        }
        if (phishtankResult) {
          details.push("🚨 Detectado no PhishTank (banco de phishing)");
        }
        if (patternResult) {
          details.push("⚠️ Padrões suspeitos detectados na URL");
        }

        const isMalicious = urlhausResult || phishtankResult || patternResult;
        const riskLevel = [urlhausResult, phishtankResult, patternResult].filter(
          Boolean
        ).length;

        return {
          isMalicious,
          riskLevel: isMalicious ? (riskLevel / 3) * 100 : 0,
          sources: {
            urlhaus: urlhausResult,
            phishtank: phishtankResult,
            patternAnalysis: patternResult,
          },
          details,
        };
      }),
  }),

  // Análise Completa com Todas as APIs
  security: router({
    comprehensiveAnalysis: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }: { input: { url: string } }) => {
        return await performComprehensiveSecurityAnalysis(input.url);
      }),

    // WHOIS Lookup
    whois: publicProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }: { input: { domain: string } }) => {
        return await checkWhoisData(input.domain);
      }),

    // AlienVault OTX
    alienVault: publicProcedure
      .input(z.object({ indicator: z.string(), type: z.enum(["url", "ip", "domain"]).optional() }))
      .query(async ({ input }: { input: { indicator: string; type?: "url" | "ip" | "domain" } }) => {
        return await checkAlienVaultOTX(input.indicator, input.type || "url");
      }),

    // URLScan.io
    urlScan: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }: { input: { url: string } }) => {
        return await checkURLScan(input.url);
      }),

    // Hybrid Analysis
    hybridAnalysis: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }: { input: { url: string } }) => {
        return await checkHybridAnalysis(input.url);
      }),

    // Spamhaus
    spamhaus: publicProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }: { input: { ip: string } }) => {
        return await checkSpamhaus(input.ip);
      }),

    // DNS Reputation
    dnsReputation: publicProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }: { input: { domain: string } }) => {
        return await checkDNSReputation(input.domain);
      }),

    // OpenPhish
    openPhish: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }: { input: { url: string } }) => {
        return await checkOpenPhish(input.url);
      }),

    // PhishTank
    phishTank: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }: { input: { url: string } }) => {
        return await checkPhishTankAPI(input.url);
      }),

    // IPinfo
    ipinfo: publicProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }: { input: { ip: string } }) => {
        return await checkIPinfo(input.ip);
      }),

    // SecurityTrails
    securityTrails: publicProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }: { input: { domain: string } }) => {
        return await checkSecurityTrails(input.domain);
      }),

    // ViewDNS
    viewDNS: publicProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }: { input: { domain: string } }) => {
        return await checkViewDNS(input.domain);
      }),

    // IP-API
    ipAPI: publicProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }: { input: { ip: string } }) => {
        return await checkIPAPI(input.ip);
      }),


  }),
});

export type AppRouter = typeof appRouter;


// ============================================
// PROCEDURES PARA ESTATÍSTICAS EM TEMPO REAL
// ============================================

/**
 * Procedure tRPC para obter estatísticas gerais
 */
export const getStatistics = publicProcedure.query(async () => {
  try {
    const result = await (global as any).db.query(
      `SELECT 
        total_analyses,
        total_threats_detected,
        total_malicious_urls,
        total_link_analyses,
        total_message_analyses,
        total_pdf_analyses,
        high_risk_detected,
        critical_risk_detected,
        last_updated
       FROM platform_statistics 
       WHERE id = 1`
    );

    if (result && result.length > 0) {
      return result[0];
    }

    return {
      total_analyses: 0,
      total_threats_detected: 0,
      total_malicious_urls: 0,
      total_link_analyses: 0,
      total_message_analyses: 0,
      total_pdf_analyses: 0,
      high_risk_detected: 0,
      critical_risk_detected: 0,
      last_updated: new Date()
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
});

/**
 * Procedure tRPC para registrar uma análise
 */
export const recordAnalysisStats = publicProcedure
  .input((schema: any) => ({
    mutation: (fn: any) => ({ mutation: fn }),
  }))
  .mutation(async (opts: any) => {
    const { analysisType, riskLevel, threatDetected } = opts.input;
    
    try {
      // Inserir no histórico de análises
      await (global as any).db.query(
        `INSERT INTO analysis_history_stats (analysis_type, risk_level, threat_detected) 
         VALUES (?, ?, ?)`,
        [analysisType, riskLevel, threatDetected]
      );

      // Atualizar estatísticas gerais
      let updateQuery = `UPDATE platform_statistics SET total_analyses = total_analyses + 1`;
      
      if (analysisType === 'link') {
        updateQuery += `, total_link_analyses = total_link_analyses + 1`;
      } else if (analysisType === 'message') {
        updateQuery += `, total_message_analyses = total_message_analyses + 1`;
      } else if (analysisType === 'pdf') {
        updateQuery += `, total_pdf_analyses = total_pdf_analyses + 1`;
      }

      if (threatDetected) {
        updateQuery += `, total_threats_detected = total_threats_detected + 1`;
        
        if (riskLevel === 'Alto') {
          updateQuery += `, high_risk_detected = high_risk_detected + 1`;
        } else if (riskLevel === 'Crítico') {
          updateQuery += `, critical_risk_detected = critical_risk_detected + 1`;
        }

        // Se for URL maliciosa (apenas para links)
        if (analysisType === 'link' && (riskLevel === 'Alto' || riskLevel === 'Crítico')) {
          updateQuery += `, total_malicious_urls = total_malicious_urls + 1`;
        }
      }

      updateQuery += ` WHERE id = 1`;
      await (global as any).db.query(updateQuery);

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar análise:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  });


// ============================================================================
// EMAIL SECURITY - DNS ANALYSIS
// ============================================================================

// Importar módulo de análise DNS
import { analyzeEmailAuthentication, validateEmailDomain, isDomainTrusted } from './dnsAnalysis';

// Importar módulo de OCR e análise de screenshot
import { analyzeScreenshot } from './screenshotOCR';

// Endpoint para análise de autenticação de email (SPF/DKIM/DMARC)
const analyzeDNSAuthentication = publicProcedure
  .input((schema: any) => ({
    mutation: (fn: any) => ({
      mutation: async (input: { email: string; dkimSelector?: string }) => {
        try {
          // Validar domínio do email
          const validation = validateEmailDomain(input.email);
          if (!validation.valid) {
            return {
              success: false,
              error: `Email inválido: ${validation.issues.join(', ')}`,
            };
          }

          // Executar análise DNS
          const result = await analyzeEmailAuthentication(
            validation.domain,
            input.dkimSelector || 'default'
          );

          // Verificar se domínio é confiável
          const trusted = isDomainTrusted(validation.domain);

          return {
            success: true,
            data: {
              ...result,
              isTrustedDomain: trusted,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (error) {
          console.error('Erro ao analisar DNS:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao analisar DNS',
          };
        }
      },
    }),
  }));

// Exportar endpoints
export const emailRoutes = {
  analyzeDNS: analyzeDNSAuthentication.mutation,
};

// ============================================================================
// SCREENSHOT OCR & INDICATOR EXTRACTION
// ============================================================================

const screenshotAnalyzeOCR = publicProcedure
  .input((schema: any) => ({
    mutation: (fn: any) => ({
      mutation: async (input: { imageUrl: string; imageData?: string }) => {
        try {
          const result = await analyzeScreenshot(input.imageUrl);
          return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error('Erro ao analisar screenshot:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString(),
          };
        }
      },
    }),
  }));

const screenshotAnalyzeBatch = publicProcedure
  .input((schema: any) => ({
    mutation: (fn: any) => ({
      mutation: async (input: { imageUrls: string[] }) => {
        try {
          const results = await Promise.all(
            input.imageUrls.map(async (url) => {
              try {
                const result = await analyzeScreenshot(url);
                return {
                  url,
                  success: true,
                  data: result,
                };
              } catch (error) {
                return {
                  url,
                  success: false,
                  error: error instanceof Error ? error.message : 'Erro desconhecido',
                };
              }
            })
          );

          return {
            success: true,
            results,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error('Erro ao analisar batch de screenshots:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString(),
          };
        }
      },
    }),
  }));

export const screenshotRoutes = {
  analyzeOCR: screenshotAnalyzeOCR.mutation,
  analyzeBatch: screenshotAnalyzeBatch.mutation,
};


// VirusTotal API - Verificação de hash de arquivo
import { queryVirusTotal, analyzeVirusTotalResult } from './virusTotalService';

const virusTotalCheckHash = publicProcedure
  .input((schema: any) => ({
    mutation: (fn: any) => ({
      mutation: async (input: { fileHash: string }) => {
        try {
          if (!input.fileHash || input.fileHash.length !== 64) {
            return {
              success: false,
              error: 'Hash inválido. SHA-256 deve ter 64 caracteres hexadecimais',
              timestamp: new Date().toISOString(),
            };
          }

          const result = await queryVirusTotal(input.fileHash);
          const analysis = analyzeVirusTotalResult(result);

          return {
            success: true,
            data: result,
            analysis,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error('Erro ao verificar VirusTotal:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao verificar VirusTotal',
            timestamp: new Date().toISOString(),
          };
        }
      },
    }),
  }));

export const virusTotalRoutes = {
  checkHash: virusTotalCheckHash.mutation,
};
