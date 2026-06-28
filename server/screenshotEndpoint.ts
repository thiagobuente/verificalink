/**
 * Screenshot Analysis Endpoint
 * Integra OCR e extração de indicadores com tRPC
 */

import { z } from 'zod';
import { publicProcedure } from './routers';
import { analyzeScreenshot } from './screenshotOCR';

export const screenshotAnalyzeOCR = publicProcedure
  .input(
    z.object({
      imageUrl: z.string().url('URL inválida'),
      imageData: z.string().optional().describe('Base64 encoded image data'),
    })
  )
  .mutation(async ({ input }: { input: any }) => {
    try {
      // Se imageData for fornecido, converter para URL (ou usar diretamente)
      const urlToAnalyze = input.imageUrl;

      // Analisar screenshot
      const result = await analyzeScreenshot(urlToAnalyze);

      return {
        success: true,
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Erro ao analisar screenshot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  });

export const screenshotAnalyzeBatch = publicProcedure
  .input(
    z.object({
      imageUrls: z.array(z.string().url()),
    })
  )
  .mutation(async ({ input }: { input: any }) => {
    try {
      const results = await Promise.all(
        input.imageUrls.map(async (url: string) => {
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
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Erro ao analisar batch de screenshots:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  });
