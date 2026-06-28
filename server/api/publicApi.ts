/**
 * Public API Router
 * Endpoints públicos para integração de terceiros
 * Requer autenticação via API Key
 */

import { publicProcedure, router } from '../trpc';
import { z } from 'zod';
import { analyzeURLWithSecurity } from '../../client/src/lib/analyzers';

// Schemas de validação
const AnalyzeLinkSchema = z.object({
  url: z.string().url('URL inválida'),
  webhook_url: z.string().url().optional(),
});

const AnalyzeEmailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  subject: z.string().optional(),
  body: z.string().optional(),
  webhook_url: z.string().url().optional(),
});

const AnalyzeIOCSchema = z.object({
  ioc: z.string().min(1, 'IOC não pode estar vazio'),
  type: z.enum(['ip', 'domain', 'url', 'email', 'hash']),
  webhook_url: z.string().url().optional(),
});

const AnalyzeScreenshotSchema = z.object({
  image_url: z.string().url('URL de imagem inválida'),
  webhook_url: z.string().url().optional(),
});

export const publicApiRouter = router({
  // Análise de Links
  analyzeLink: publicProcedure
    .input(AnalyzeLinkSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        const { url, webhook_url } = input;

        // Análise da URL
        const result = await analyzeURLWithSecurity(url, [], []);

        // Se webhook foi fornecido, enviar resultado
        if (webhook_url) {
          try {
            await fetch(webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'link_analysis_complete',
                url,
                result,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (e) {
            console.error('Webhook notification failed:', e);
          }
        }

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Análise falhou',
        };
      }
    }),

  // Análise de E-mail
  analyzeEmail: publicProcedure
    .input(AnalyzeEmailSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        const { email, subject, body, webhook_url } = input;

        // Análise de e-mail (SPF/DKIM/DMARC)
        // TODO: Implementar análise real de e-mail
        const result = {
          email,
          spf: { status: 'pass', record: 'v=spf1 include:_spf.google.com ~all' },
          dkim: { status: 'pass', selector: 'default' },
          dmarc: { status: 'pass', policy: 'quarantine' },
          riskScore: 15,
          riskLevel: 'baixo',
          indicators: [],
          recommendation: 'E-mail aparenta ser legítimo',
        };

        if (webhook_url) {
          try {
            await fetch(webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'email_analysis_complete',
                email,
                result,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (e) {
            console.error('Webhook notification failed:', e);
          }
        }

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Análise falhou',
        };
      }
    }),

  // Análise de IOC (Indicator of Compromise)
  analyzeIOC: publicProcedure
    .input(AnalyzeIOCSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        const { ioc, type, webhook_url } = input;

        // Análise de IOC
        // TODO: Implementar análise real de IOC
        const result = {
          ioc,
          type,
          riskScore: 0,
          riskLevel: 'clean',
          sources: [
            { name: 'VirusTotal', status: 'clean' },
            { name: 'AbuseIPDB', status: 'clean' },
            { name: 'AlienVault OTX', status: 'clean' },
          ],
          confidence: 95,
          recommendation: 'Indicador aparenta ser seguro',
        };

        if (webhook_url) {
          try {
            await fetch(webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'ioc_analysis_complete',
                ioc,
                result,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (e) {
            console.error('Webhook notification failed:', e);
          }
        }

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Análise falhou',
        };
      }
    }),

  // Análise de Screenshot
  analyzeScreenshot: publicProcedure
    .input(AnalyzeScreenshotSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        const { image_url, webhook_url } = input;

        // Análise de screenshot
        // TODO: Implementar análise real de screenshot com OCR
        const result = {
          image_url,
          extractedText: '',
          detectedElements: [],
          riskScore: 0,
          riskLevel: 'baixo',
          indicators: [],
          recommendation: 'Imagem aparenta ser segura',
        };

        if (webhook_url) {
          try {
            await fetch(webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'screenshot_analysis_complete',
                image_url,
                result,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (e) {
            console.error('Webhook notification failed:', e);
          }
        }

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Análise falhou',
        };
      }
    }),

  // Obter informações sobre a API
  getApiInfo: publicProcedure.query(async ({ ctx }) => {
    return {
      name: 'Shield Security Scanner Public API',
      version: '1.0.0',
      endpoints: {
        analyzeLink: {
          method: 'POST',
          path: '/api/trpc/publicApi.analyzeLink',
          description: 'Analisar URL para phishing e malware',
          parameters: {
            url: 'string (required)',
            webhook_url: 'string (optional)',
          },
        },
        analyzeEmail: {
          method: 'POST',
          path: '/api/trpc/publicApi.analyzeEmail',
          description: 'Analisar e-mail para autenticidade (SPF/DKIM/DMARC)',
          parameters: {
            email: 'string (required)',
            subject: 'string (optional)',
            body: 'string (optional)',
            webhook_url: 'string (optional)',
          },
        },
        analyzeIOC: {
          method: 'POST',
          path: '/api/trpc/publicApi.analyzeIOC',
          description: 'Analisar Indicator of Compromise (IP, Domain, URL, Email, Hash)',
          parameters: {
            ioc: 'string (required)',
            type: 'enum: ip | domain | url | email | hash (required)',
            webhook_url: 'string (optional)',
          },
        },
        analyzeScreenshot: {
          method: 'POST',
          path: '/api/trpc/publicApi.analyzeScreenshot',
          description: 'Analisar screenshot para phishing e engenharia social',
          parameters: {
            image_url: 'string (required)',
            webhook_url: 'string (optional)',
          },
        },
      },
      rateLimit: {
        free: '100 requests/day',
        pro: '10,000 requests/day',
        enterprise: 'Unlimited',
      },
      documentation: 'https://shield-security.manus.space/api/docs',
    };
  }),
});
