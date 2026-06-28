import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import { analyzeEmailAuthentication, validateEmailDomain, isDomainTrusted } from './dnsAnalysis';
import { mapAnalysisResultsToMITRE } from './mitreMapping';
import { getURLSandboxScreenshot, isValidURLForSandbox } from './urlSandbox';
import { generateDomainTimeline } from './domainTimeline';
import { getDomainIntelligence } from './domainIntelligence';
import { checkURLhaus } from './urlhausService';
import { analyzeEmailURLs } from './emailURLAnalysis';
import { analyzeScreenshotURLs } from './screenshotURLAnalysis';
import { analyzePDFURLs } from './pdfURLAnalysis';
import { iocAggregator } from './providers';

// Criar instância tRPC
const t = initTRPC.create({ transformer: superjson });

// Definir procedimentos públicos
export const publicProcedure = t.procedure;
export const router = t.router;

// Definir rotas
export const appRouter = router({
  providers: router({
    health: publicProcedure.query(() => ({
      success: true,
      data: iocAggregator.getHealth(),
      timestamp: new Date().toISOString(),
    })),
  }),
  ioc: router({
    aggregate: publicProcedure
      .input(z.object({
        ioc: z.string().min(1, 'IOC obrigatorio'),
        type: z.enum(['ip', 'domain', 'url', 'hash', 'email', 'unknown']).optional(),
      }))
      .query(async ({ input }) => {
        try {
          return {
            success: true,
            data: await iocAggregator.analyze({ value: input.ioc, type: input.type }),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao agregar IOC',
          };
        }
      }),
  }),
  email: router({
    analyzeDNS: publicProcedure
      .input(z.object({
        email: z.string().email('Email inválido'),
        dkimSelector: z.string().optional().default('default'),
      }))
      .mutation(async ({ input }) => {
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
            input.dkimSelector
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
      }),
  }),
  
  // MITRE ATT&CK Mapping
  mitre: router({
    mapThreats: publicProcedure
      .input(z.object({
        threatTypes: z.array(z.string()).optional(),
        analysisResult: z.record(z.string(), z.any()).optional(),
      }))
      .query(async ({ input }) => {
        try {
          let techniques: any[] = [];
          
          if (input.analysisResult) {
            techniques = mapAnalysisResultsToMITRE(input.analysisResult);
          } else if (input.threatTypes && input.threatTypes.length > 0) {
            const { mapThreatsToMITRE } = await import('./mitreMapping');
            techniques = mapThreatsToMITRE(input.threatTypes);
          }
          
          return {
            success: true,
            data: {
              techniques,
              count: techniques.length,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (error) {
          console.error('Erro ao mapear MITRE:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao mapear MITRE',
            data: { techniques: [], count: 0 },
          };
        }
      }),
  }),
  
  // URL Sandbox
  sandbox: router({
    getScreenshot: publicProcedure
      .input(z.object({
        url: z.string().url('URL inválida'),
      }))
      .query(async ({ input }) => {
        try {
          // Validar URL
          if (!isValidURLForSandbox(input.url)) {
            return {
              success: false,
              error: 'URL não pode ser analisada (URL local ou privada)',
            };
          }
          
          const result = await getURLSandboxScreenshot(input.url);
          
          return {
            success: true,
            data: result,
          };
        } catch (error) {
          console.error('Erro ao capturar screenshot:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao capturar screenshot',
          };
        }
      }),
  }),
  
  // Domain Timeline
  timeline: router({
    getDomainTimeline: publicProcedure
      .input(z.object({
        domain: z.string().min(1, 'Domínio inválido'),
      }))
      .query(async ({ input }) => {
        try {
          const timeline = await generateDomainTimeline(input.domain);
          
          return {
            success: true,
            data: timeline,
          };
        } catch (error) {
          console.error('Erro ao gerar timeline:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao gerar timeline',
          };
        }
      }),
  }),
  
  domainIntel: router({
    getDomainIntelligence: publicProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .query(async ({ input }) => {
        try {
          const intelligence = await getDomainIntelligence(input.url);
          return {
            success: true,
            data: intelligence,
          };
        } catch (error) {
          console.error('Domain Intelligence error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error fetching domain intelligence',
          };
        }
      }),
  }),
  urlhaus: router({
    checkURL: publicProcedure
      .input(z.object({
        url: z.string().url('URL inválida'),
      }))
      .query(async ({ input }) => {
        try {
          const analysis = await checkURLhaus(input.url);
          return {
            success: true,
            data: analysis,
          };
        } catch (error) {
          console.error('URLhaus error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error checking URLhaus',
          };
        }
      }),
  }),
  emailURLs: router({
    analyzeURLs: publicProcedure
      .input(z.object({
        emailBody: z.string().min(1, 'Email body is required'),
      }))
      .query(async ({ input }) => {
        try {
          const analysis = await analyzeEmailURLs(input.emailBody);
          return {
            success: true,
            data: analysis,
          };
        } catch (error) {
          console.error('Email URL analysis error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error analyzing email URLs',
          };
        }
      }),
  }),
  screenshotURLs: router({
    analyzeURLs: publicProcedure
      .input(z.object({
        ocrText: z.string().min(1, 'OCR text is required'),
      }))
      .query(async ({ input }) => {
        try {
          const analysis = await analyzeScreenshotURLs(input.ocrText);
          return {
            success: true,
            data: analysis,
          };
        } catch (error) {
          console.error('Screenshot URL analysis error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error analyzing screenshot URLs',
          };
        }
      }),
  }),
  pdfURLs: router({
    analyzeURLs: publicProcedure
      .input(z.object({
        pdfText: z.string().min(1, 'PDF text is required'),
        totalPages: z.number().optional().default(1),
      }))
      .query(async ({ input }) => {
        try {
          const analysis = await analyzePDFURLs(input.pdfText, input.totalPages);
          return {
            success: true,
            data: analysis,
          };
        } catch (error) {
          console.error('PDF URL analysis error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error analyzing PDF URLs',
          };
        }
      }),
  }),
});

// Exportar tipo do router
export type AppRouter = typeof appRouter;
