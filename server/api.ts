/**
 * Shield Security Scanner - API Pública
 * 
 * Endpoints REST para integração com terceiros (navegadores, plugins, apps)
 * Autenticação: API Key via header X-Shield-API-Key
 */

import { Router, Request, Response, NextFunction } from 'express';
import { analyzeURLWithSecurity } from '../client/src/lib/analyzers';
import { 
  detectarWhatsApp, 
  calcularScore, 
  obterNivelRisco, 
  gerarResumo 
} from '../client/src/lib/urlDetection';

const router = Router();

// Middleware de autenticação
const authenticateAPI = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-shield-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key não fornecida. Use header X-Shield-API-Key',
      code: 'MISSING_API_KEY'
    });
  }

  // Validar API Key (implementar com banco de dados em produção)
  if (apiKey !== process.env.SHIELD_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'API Key inválida',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

/**
 * POST /api/shield/analyze-url
 * Analisa uma URL para detectar ameaças
 * 
 * Request:
 * {
 *   "url": "https://example.com",
 *   "includeMetadata": true
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "url": "https://example.com",
 *     "riskScore": 15,
 *     "riskLevel": "baixo",
 *     "riskColor": "#10b981",
 *     "threats": [],
 *     "summary": "Este domínio aparenta ser seguro.",
 *     "metadata": { ... }
 *   }
 * }
 */
router.post('/analyze-url', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const { url, includeMetadata } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL não fornecida',
        code: 'MISSING_URL'
      });
    }

    // Análise da URL
    const analysis = analyzeURLWithSecurity(url, [], []);
    const score = analysis.score || calcularScore(analysis);
    const riskLevel = obterNivelRisco(score);
    const summary = gerarResumo(riskLevel, false, analysis);

    const response = {
      success: true,
      data: {
        url,
        riskScore: score,
        riskLevel,
        riskColor: getRiskColor(riskLevel),
        threats: analysis.risks || [],
        summary,
        timestamp: new Date().toISOString(),
        ...(includeMetadata && { metadata: analysis })
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao analisar URL',
      code: 'ANALYSIS_ERROR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/shield/analyze-message
 * Analisa uma mensagem para detectar padrões de phishing
 * 
 * Request:
 * {
 *   "message": "Clique aqui para confirmar sua conta",
 *   "source": "whatsapp"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "...",
 *     "riskScore": 75,
 *     "riskLevel": "alto",
 *     "patterns": [ ... ],
 *     "summary": "..."
 *   }
 * }
 */
router.post('/analyze-message', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const { message, source } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Mensagem não fornecida',
        code: 'MISSING_MESSAGE'
      });
    }

    // Análise da mensagem (implementar lógica de análise)
    const patterns = detectMessagePatterns(message);
    const riskScore = calculateMessageRisk(patterns);
    const riskLevel = getRiskLevel(riskScore);

    const response = {
      success: true,
      data: {
        message,
        source: source || 'unknown',
        riskScore,
        riskLevel,
        riskColor: getRiskColor(riskLevel),
        patterns,
        summary: generateMessageSummary(patterns, riskLevel),
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao analisar mensagem',
      code: 'ANALYSIS_ERROR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/shield/batch-analyze
 * Analisa múltiplas URLs em uma única requisição
 * 
 * Request:
 * {
 *   "urls": ["https://example1.com", "https://example2.com"]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     { "url": "...", "riskScore": ..., ... },
 *     { "url": "...", "riskScore": ..., ... }
 *   ]
 * }
 */
router.post('/batch-analyze', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array de URLs não fornecido',
        code: 'INVALID_URLS'
      });
    }

    if (urls.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Máximo de 100 URLs por requisição',
        code: 'TOO_MANY_URLS'
      });
    }

    const results = urls.map((url: string) => {
      const analysis = analyzeURLWithSecurity(url, [], []);
      const score = analysis.score || calcularScore(analysis);
      const riskLevel = obterNivelRisco(score);

      return {
        url,
        riskScore: score,
        riskLevel,
        riskColor: getRiskColor(riskLevel),
        threats: analysis.risks || []
      };
    });

    res.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao analisar URLs',
      code: 'BATCH_ANALYSIS_ERROR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/shield/health
 * Verifica a saúde da API
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/shield/docs
 * Retorna documentação da API
 */
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    name: 'Shield Security Scanner API',
    version: '1.0.0',
    description: 'API pública para análise de segurança de URLs, mensagens e arquivos',
    baseUrl: 'https://api.shield-scanner.com/api/shield',
    authentication: 'Header X-Shield-API-Key',
    endpoints: [
      {
        method: 'POST',
        path: '/analyze-url',
        description: 'Analisa uma URL para detectar ameaças',
        params: {
          url: 'string (obrigatório)',
          includeMetadata: 'boolean (opcional)'
        }
      },
      {
        method: 'POST',
        path: '/analyze-message',
        description: 'Analisa uma mensagem para detectar phishing',
        params: {
          message: 'string (obrigatório)',
          source: 'string (opcional): whatsapp, email, sms'
        }
      },
      {
        method: 'POST',
        path: '/batch-analyze',
        description: 'Analisa múltiplas URLs',
        params: {
          urls: 'array de strings (máximo 100)'
        }
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Verifica saúde da API'
      },
      {
        method: 'GET',
        path: '/docs',
        description: 'Retorna documentação da API'
      }
    ]
  });
});

// Helper functions
function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'baixo':
      return '#10b981';
    case 'moderado':
      return '#f59e0b';
    case 'alto':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function getRiskLevel(score: number): string {
  if (score < 30) return 'baixo';
  if (score < 70) return 'moderado';
  return 'alto';
}

function detectMessagePatterns(message: string): string[] {
  const patterns = [];

  if (/clique|click|toque|tap/i.test(message)) patterns.push('Chamada para ação');
  if (/urgente|imediato|agora|rápido/i.test(message)) patterns.push('Urgência');
  if (/confirme|verifique|valide/i.test(message)) patterns.push('Verificação falsa');
  if (/senha|pin|código/i.test(message)) patterns.push('Solicitação de credenciais');
  if (/ganhe|prêmio|sorteio|dinheiro/i.test(message)) patterns.push('Promessa falsa');

  return patterns;
}

function calculateMessageRisk(patterns: string[]): number {
  const baseScore = 20;
  const patternScore = patterns.length * 15;
  return Math.min(baseScore + patternScore, 100);
}

function generateMessageSummary(patterns: string[], riskLevel: string): string {
  if (patterns.length === 0) {
    return 'Esta mensagem não apresenta padrões suspeitos detectados.';
  }

  const patternText = patterns.join(', ');
  return `Detectados padrões de ${patternText}. Nível de risco: ${riskLevel}.`;
}

export default router;
