import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

interface StatisticsCardProps {
  urlsAnalyzed: number;
  threatsDetected: number;
  domainsVerified: number;
  reportsGenerated: number;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  urlsAnalyzed,
  threatsDetected,
  domainsVerified,
  reportsGenerated
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* URLs Analisadas */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-blue-300 font-semibold">URLs Analisadas</h3>
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-3xl font-bold text-blue-100">{urlsAnalyzed}</p>
        <p className="text-blue-400 text-sm mt-2">Análises realizadas</p>
      </div>

      {/* Ameaças Detectadas */}
      <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-red-300 font-semibold">Ameaças Detectadas</h3>
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-3xl font-bold text-red-100">{threatsDetected}</p>
        <p className="text-red-400 text-sm mt-2">Riscos identificados</p>
      </div>

      {/* Domínios Verificados */}
      <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-green-300 font-semibold">Domínios Verificados</h3>
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        <p className="text-3xl font-bold text-green-100">{domainsVerified}</p>
        <p className="text-green-400 text-sm mt-2">Domínios únicos</p>
      </div>

      {/* Relatórios Gerados */}
      <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-purple-300 font-semibold">Relatórios Gerados</h3>
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <p className="text-3xl font-bold text-purple-100">{reportsGenerated}</p>
        <p className="text-purple-400 text-sm mt-2">Documentos exportados</p>
      </div>
    </div>
  );
};
