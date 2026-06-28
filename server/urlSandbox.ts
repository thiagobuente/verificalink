/**
 * URL Sandbox Service
 * Captura screenshots de URLs de forma segura usando URLScan.io
 */

import axios from 'axios';

export interface URLSandboxResult {
  url: string;
  screenshotUrl?: string;
  technologies: string[];
  hasRedirects: boolean;
  riskScore: number;
  verdicts: {
    malware: boolean;
    phishing: boolean;
    suspicious: boolean;
  };
  details: string[];
  timestamp: string;
}

/**
 * Busca screenshot de uma URL via URLScan.io
 * Retorna URL da imagem e análise da página
 */
export async function getURLSandboxScreenshot(url: string): Promise<URLSandboxResult> {
  try {
    const apiKey = process.env.URLSCAN_API_KEY || '';
    
    if (!apiKey) {
      return {
        url,
        technologies: [],
        hasRedirects: false,
        riskScore: 0,
        verdicts: {
          malware: false,
          phishing: false,
          suspicious: false,
        },
        details: ['URLScan.io não configurado. Configure URLSCAN_API_KEY.'],
        timestamp: new Date().toISOString(),
      };
    }

    // Submeter URL para análise
    const submitResponse = await axios.post(
      'https://urlscan.io/api/v1/scan/',
      { url },
      {
        headers: { 'API-Key': apiKey },
        timeout: 10000,
      }
    );

    const uuid = submitResponse.data.uuid;
    const details: string[] = [];
    let riskScore = 0;

    // Aguardar resultado (URLScan leva alguns segundos)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Buscar resultado da análise
    const resultResponse = await axios.get(
      `https://urlscan.io/api/v1/result/${uuid}/`,
      {
        headers: { 'API-Key': apiKey },
        timeout: 10000,
      }
    );

    const result = resultResponse.data;

    // Extrair tecnologias
    const technologies: string[] = [];
    if (result.technologies) {
      result.technologies.forEach((tech: any) => {
        if (tech.name) {
          technologies.push(tech.name);
        }
      });
    }

    // Verificar redirecionamentos
    const hasRedirects = result.chains && result.chains.length > 1;
    if (hasRedirects) {
      details.push('⚠️ Website possui redirecionamentos');
      riskScore += 20;
    }

    // Verificar verdicts (malware, phishing, etc)
    const verdicts = {
      malware: false,
      phishing: false,
      suspicious: false,
    };

    if (result.verdicts) {
      if (result.verdicts.malware) {
        verdicts.malware = true;
        details.push('🚨 Malware detectado');
        riskScore += 50;
      }

      if (result.verdicts.phishing) {
        verdicts.phishing = true;
        details.push('🚨 Características de phishing detectadas');
        riskScore += 40;
      }

      if (result.verdicts.suspicious) {
        verdicts.suspicious = true;
        details.push('⚠️ Atividade suspeita detectada');
        riskScore += 25;
      }
    }

    // Construir URL do screenshot
    const screenshotUrl = `https://urlscan.io/screenshots/${uuid}.png`;

    return {
      url,
      screenshotUrl,
      technologies,
      hasRedirects,
      riskScore: Math.min(riskScore, 100),
      verdicts,
      details,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('URLScan.io error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao consultar URLScan.io';
    
    return {
      url,
      technologies: [],
      hasRedirects: false,
      riskScore: 0,
      verdicts: {
        malware: false,
        phishing: false,
        suspicious: false,
      },
      details: [`Erro ao capturar screenshot: ${errorMessage}`],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Busca screenshot com retry automático
 * Útil para URLs que podem estar temporariamente indisponíveis
 */
export async function getURLSandboxScreenshotWithRetry(
  url: string,
  maxRetries: number = 2
): Promise<URLSandboxResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await getURLSandboxScreenshot(url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        // Aguardar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // Se todas as tentativas falharem
  return {
    url,
    technologies: [],
    hasRedirects: false,
    riskScore: 0,
    verdicts: {
      malware: false,
      phishing: false,
      suspicious: false,
    },
    details: [`Erro ao capturar screenshot após ${maxRetries + 1} tentativas: ${lastError?.message || 'Desconhecido'}`],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Valida se uma URL pode ser analisada no sandbox
 * Retorna true se a URL é válida e acessível
 */
export function isValidURLForSandbox(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Rejeitar URLs locais
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      return false;
    }

    // Rejeitar URLs privadas
    if (urlObj.hostname.match(/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))/)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
