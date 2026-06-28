import React, { useState } from 'react';
import { LinkIcon, ArrowRight, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShortenedURLAnalyzerProps {
  shortenedUrl: string;
  isLoading?: boolean;
}

interface URLRedirectChain {
  step: number;
  url: string;
  statusCode?: number;
  redirectType?: string;
}

export const ShortenedURLAnalyzer: React.FC<ShortenedURLAnalyzerProps> = ({
  shortenedUrl,
  isLoading = false,
}) => {
  const [redirectChain, setRedirectChain] = useState<URLRedirectChain[]>([]);
  const [finalUrl, setFinalUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');

  const analyzeShortenedURL = async () => {
    setIsAnalyzing(true);
    setError('');
    setRedirectChain([]);
    setFinalUrl('');

    try {
      // Simulação - em produção, chamar API backend
      const mockChain: URLRedirectChain[] = [
        { step: 1, url: shortenedUrl, statusCode: 301, redirectType: 'Permanent Redirect' },
        { step: 2, url: 'https://tracking.example.com/track?id=abc123', statusCode: 302, redirectType: 'Temporary Redirect' },
        { step: 3, url: 'https://malicious-site.com/phishing-page', statusCode: 200, redirectType: 'Final Destination' },
      ];

      setRedirectChain(mockChain);
      setFinalUrl(mockChain[mockChain.length - 1].url);
    } catch (err) {
      setError('Erro ao analisar URL encurtada. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse">
        <div className="h-32 bg-slate-600 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="w-5 h-5 text-cyan-400" />
        <h4 className="text-lg font-bold text-cyan-400">🔗 Análise de URL Encurtada</h4>
      </div>

      <div className="mb-4">
        <p className="text-slate-400 text-sm mb-2">URL Encurtada:</p>
        <div className="bg-slate-800/50 border border-slate-600 rounded p-3 mb-3">
          <p className="text-cyan-400 font-mono text-sm break-all">{shortenedUrl}</p>
        </div>

        <Button
          onClick={analyzeShortenedURL}
          disabled={isAnalyzing}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
        >
          {isAnalyzing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4 mr-2" />
              Revelar Destino Real
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {redirectChain.length > 0 && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm font-semibold">Cadeia de Redirecionamentos:</p>

          {redirectChain.map((redirect, idx) => (
            <div key={idx} className="space-y-2">
              <div className="bg-slate-800/50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 text-xs font-semibold mb-1">
                      Passo {redirect.step}
                      {redirect.redirectType && ` - ${redirect.redirectType}`}
                    </p>
                    <p className="text-cyan-400 font-mono text-sm break-all">{redirect.url}</p>
                  </div>
                  {redirect.statusCode && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                        redirect.statusCode === 200
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {redirect.statusCode}
                    </span>
                  )}
                </div>
              </div>

              {idx < redirectChain.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-slate-500 rotate-90" />
                </div>
              )}
            </div>
          ))}

          {finalUrl && (
            <div className="mt-4 pt-4 border-t border-slate-600">
              <p className="text-slate-400 text-sm font-semibold mb-2">Destino Final:</p>
              <div className="bg-red-500/10 border border-red-500 rounded p-3">
                <p className="text-red-400 font-mono text-sm break-all">{finalUrl}</p>
                <p className="text-red-300 text-xs mt-2">
                  ⚠️ Sempre verifique o destino final antes de clicar em URLs encurtadas!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShortenedURLAnalyzer;
