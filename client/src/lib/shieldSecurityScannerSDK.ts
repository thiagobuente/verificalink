/**
 * Shield Security Scanner SDK
 * Cliente JavaScript para integração fácil da API Shield Security Scanner
 */

export interface AnalyzeLinkOptions {
  url: string;
  webhook_url?: string;
}

export interface AnalyzeEmailOptions {
  email: string;
  subject?: string;
  body?: string;
  webhook_url?: string;
}

export interface AnalyzeIOCOptions {
  ioc: string;
  type: 'ip' | 'domain' | 'url' | 'email' | 'hash';
  webhook_url?: string;
}

export interface AnalyzeScreenshotOptions {
  image_url: string;
  webhook_url?: string;
}

export interface AnalysisResult<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  timestamp?: string;
}

type RequestPayload = object;

interface ApiErrorResponse {
  error?: string;
}

export class ShieldSecurityScannerSDK {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(apiKey: string, options?: { baseUrl?: string; timeout?: number }) {
    if (!apiKey) {
      throw new Error('API key é obrigatório');
    }

    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || 'https://shield-security.manus.space';
    this.timeout = options?.timeout || 30000;
  }

  /**
   * Fazer requisição para a API
   */
  private async request<T>(endpoint: string, data: RequestPayload): Promise<T> {
    const url = `${this.baseUrl}/api/trpc/${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Analisar Link
   */
  async analyzeLink(options: AnalyzeLinkOptions): Promise<AnalysisResult> {
    try {
      const result = await this.request<AnalysisResult>('publicApi.analyzeLink', options);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Analisar E-mail
   */
  async analyzeEmail(options: AnalyzeEmailOptions): Promise<AnalysisResult> {
    try {
      const result = await this.request<AnalysisResult>('publicApi.analyzeEmail', options);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Analisar IOC
   */
  async analyzeIOC(options: AnalyzeIOCOptions): Promise<AnalysisResult> {
    try {
      const result = await this.request<AnalysisResult>('publicApi.analyzeIOC', options);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Analisar Screenshot
   */
  async analyzeScreenshot(options: AnalyzeScreenshotOptions): Promise<AnalysisResult> {
    try {
      const result = await this.request<AnalysisResult>('publicApi.analyzeScreenshot', options);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Obter informações da API
   */
  async getApiInfo(): Promise<unknown> {
    try {
      const result = await this.request('publicApi.getApiInfo', {});
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validar chave de API
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getApiInfo();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory para criar instância do SDK
 */
export function createShieldSecurityScannerClient(
  apiKey: string,
  options?: { baseUrl?: string; timeout?: number }
): ShieldSecurityScannerSDK {
  return new ShieldSecurityScannerSDK(apiKey, options);
}

/**
 * Hook React para usar Shield Security Scanner SDK
 */
export function useShieldSecurityScanner(apiKey: string) {
  const client = new ShieldSecurityScannerSDK(apiKey);

  return {
    analyzeLink: (url: string, webhook_url?: string) =>
      client.analyzeLink({ url, webhook_url }),
    analyzeEmail: (email: string, subject?: string, body?: string, webhook_url?: string) =>
      client.analyzeEmail({ email, subject, body, webhook_url }),
    analyzeIOC: (ioc: string, type: 'ip' | 'domain' | 'url' | 'email' | 'hash', webhook_url?: string) =>
      client.analyzeIOC({ ioc, type, webhook_url }),
    analyzeScreenshot: (image_url: string, webhook_url?: string) =>
      client.analyzeScreenshot({ image_url, webhook_url }),
    getApiInfo: () => client.getApiInfo(),
    validateApiKey: () => client.validateApiKey(),
  };
}
