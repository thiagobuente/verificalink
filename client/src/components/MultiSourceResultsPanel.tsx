import { Shield, AlertTriangle, CheckCircle, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface SourceResult {
  name: string;
  status: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
  score: number;
  details: string;
  detections?: number;
  icon: React.ReactNode;
  color: string;
}

interface MultiSourceResultsPanelProps {
  url: string;
  overallScore: number;
  overallStatus: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';
  sources: SourceResult[];
}

export function MultiSourceResultsPanel({
  url,
  overallScore,
  overallStatus,
  sources,
}: MultiSourceResultsPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'SUSPICIOUS':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'MALICIOUS':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SAFE':
        return <CheckCircle className="w-5 h-5" />;
      case 'SUSPICIOUS':
        return <AlertCircle className="w-5 h-5" />;
      case 'MALICIOUS':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'Seguro';
      case 'SUSPICIOUS':
        return 'Suspeito';
      case 'MALICIOUS':
        return 'Malicioso';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className={`p-6 rounded-lg border ${getStatusColor(overallStatus)} backdrop-blur`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(overallStatus)}
            <div>
              <h3 className="text-lg font-bold">Análise Geral</h3>
              <p className="text-sm opacity-75">{url}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{overallScore}</div>
            <div className="text-xs opacity-75">Score de Risco</div>
          </div>
        </div>
        <div className="text-sm">
          <strong>Status:</strong> {getStatusLabel(overallStatus)}
        </div>
      </div>

      {/* Individual Sources */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Verificação por Fonte</h4>
        
        {sources.map((source, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(source.status)} backdrop-blur transition hover:border-opacity-100`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">{source.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold">{source.name}</h5>
                    <span className="text-xs px-2 py-1 rounded-full bg-black/30">
                      {getStatusLabel(source.status)}
                    </span>
                  </div>
                  <p className="text-sm opacity-75">{source.details}</p>
                  {source.detections !== undefined && (
                    <p className="text-xs opacity-60 mt-1">
                      Detecções: {source.detections}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{source.score}</div>
                <div className="text-xs opacity-75">Score</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 backdrop-blur">
        <h4 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Recomendações
        </h4>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>Sempre verifique por ligação antes de clicar em links desconhecidos</li>
          <li>Não compartilhe dados pessoais ou financeiros por link</li>
          <li>Se suspeitar de golpe, denuncie às autoridades competentes</li>
          <li>Mantenha seu antivírus e navegador atualizados</li>
        </ul>
      </div>
    </div>
  );
}
