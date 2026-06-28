/**
 * IOC Analyzer Endpoint
 * Express endpoint para análise de indicadores de comprometimento
 */

import { Request, Response } from 'express';
import { IOCAnalyzerEngine, IOCDetector } from './iocAnalyzer';

export class IOCEndpoint {
  private engine: IOCAnalyzerEngine;

  constructor() {
    this.engine = new IOCAnalyzerEngine();
  }

  async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { ioc } = req.body;

      if (!ioc || typeof ioc !== 'string') {
        res.status(400).json({
          error: 'Invalid input',
          message: 'IOC value must be a non-empty string',
        });
        return;
      }

      // Detectar tipo de IOC
      const detected = IOCDetector.detect(ioc);
      if (!detected) {
        res.status(400).json({
          error: 'Invalid IOC',
          message: 'Could not detect IOC type. Supported types: IP, Domain, URL, MD5, SHA1, SHA256, Email',
        });
        return;
      }

      // Analisar IOC
      const result = await this.engine.analyze(ioc);
      if (!result) {
        res.status(500).json({
          error: 'Analysis failed',
          message: 'Could not analyze IOC',
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('IOC Analysis Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: String(error),
      });
    }
  }

  async detectType(req: Request, res: Response): Promise<void> {
    try {
      const { ioc } = req.body;

      if (!ioc || typeof ioc !== 'string') {
        res.status(400).json({
          error: 'Invalid input',
          message: 'IOC value must be a non-empty string',
        });
        return;
      }

      const detected = IOCDetector.detect(ioc);
      if (!detected) {
        res.status(400).json({
          error: 'Invalid IOC',
          message: 'Could not detect IOC type',
        });
        return;
      }

      res.status(200).json(detected);
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: String(error),
      });
    }
  }

  async batch(req: Request, res: Response): Promise<void> {
    try {
      const { iocs } = req.body;

      if (!Array.isArray(iocs) || iocs.length === 0) {
        res.status(400).json({
          error: 'Invalid input',
          message: 'iocs must be a non-empty array',
        });
        return;
      }

      if (iocs.length > 50) {
        res.status(400).json({
          error: 'Too many IOCs',
          message: 'Maximum 50 IOCs per request',
        });
        return;
      }

      const results = await Promise.all(
        iocs.map(ioc => this.engine.analyze(ioc))
      );

      res.status(200).json({
        total: iocs.length,
        analyzed: results.filter(r => r !== null).length,
        results: results.filter(r => r !== null),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: String(error),
      });
    }
  }
}

// Export factory function
export function createIOCEndpoint(): IOCEndpoint {
  return new IOCEndpoint();
}
