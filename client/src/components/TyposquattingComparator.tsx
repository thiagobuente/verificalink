import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DomainComparison {
  original: string;
  suspicious: string;
  similarity: number;
  differences: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

interface TyposquattingComparatorProps {
  suspiciousDomain: string;
  similarDomains?: string[];
  isLoading?: boolean;
}

export const TyposquattingComparator: React.FC<TyposquattingComparatorProps> = ({
  suspiciousDomain,
  similarDomains = ['google.com', 'microsoft.com', 'amazon.com', 'facebook.com', 'apple.com'],
  isLoading = false,
}) => {
  const [comparisons, setComparisons] = useState<DomainComparison[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<DomainComparison | null>(null);

  // Função para calcular similaridade entre domínios
  const calculateSimilarity = (domain1: string, domain2: string): number => {
    const shorter = domain1.length < domain2.length ? domain1 : domain2;
    const longer = domain1.length >= domain2.length ? domain1 : domain2;
    const matches = Array.from(shorter).filter((char, idx) => char === longer[idx]).length;
    return Math.round((matches / longer.length) * 100);
  };

  // Função para detectar diferenças
  const detectDifferences = (original: string, suspicious: string): string[] => {
    const differences: string[] = [];

    // Verificar caracteres similares
    if (original.includes('o') && suspicious.includes('0')) differences.push('O (letra) substituído por 0 (zero)');
    if (original.includes('l') && suspicious.includes('1')) differences.push('L (letra) substituído por 1 (número)');
    if (original.includes('i') && suspicious.includes('!')) differences.push('I (letra) substituído por ! (exclamação)');
    if (original.includes('a') && suspicious.includes('4')) differences.push('A (letra) substituído por 4 (número)');
    if (original.includes('s') && suspicious.includes('5')) differences.push('S (letra) substituído por 5 (número)');
    if (original.includes('e') && suspicious.includes('3')) differences.push('E (letra) substituído por 3 (número)');

    // Verificar letras adicionadas
    if (suspicious.length > original.length) {
      differences.push(`${suspicious.length - original.length} caractere(s) adicional(is)`);
    }

    // Verificar ordem diferente
    if (original !== suspicious && !differences.length) {
      differences.push('Ordem ou estrutura diferente');
    }

    return differences.length > 0 ? differences : ['Estrutura similar ao domínio original'];
  };

  React.useEffect(() => {
    if (suspiciousDomain && similarDomains.length > 0) {
      const newComparisons = similarDomains.map((original) => {
        const similarity = calculateSimilarity(original, suspiciousDomain);
        const differences = detectDifferences(original, suspiciousDomain);
        const riskLevel: DomainComparison['riskLevel'] = similarity > 80 ? 'high' : similarity > 60 ? 'medium' : 'low';

        return {
          original,
          suspicious: suspiciousDomain,
          similarity,
          differences,
          riskLevel,
        };
      });

      setComparisons(newComparisons.sort((a, b) => b.similarity - a.similarity));
      if (newComparisons.length > 0) {
        setSelectedComparison(newComparisons[0]);
      }
    }
  }, [suspiciousDomain, similarDomains]);

  if (isLoading) {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-600 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <h4 className="text-lg font-bold text-cyan-400 mb-4">🎭 Comparador de Typosquatting</h4>

      {comparisons.length > 0 ? (
        <div className="space-y-3">
          {/* Lista de comparações */}
          <div className="space-y-2">
            {comparisons.map((comp, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedComparison(comp)}
                className={`w-full text-left p-3 rounded border-l-4 transition-all ${
                  selectedComparison?.original === comp.original
                    ? 'bg-slate-600/50 border-cyan-500'
                    : 'bg-slate-800/30 border-slate-600 hover:bg-slate-700/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-semibold text-sm">{comp.original}</p>
                    <p className="text-slate-500 text-xs">vs. {comp.suspicious}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        comp.riskLevel === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : comp.riskLevel === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {comp.similarity}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detalhes da comparação selecionada */}
          {selectedComparison && (
            <div className="mt-4 pt-4 border-t border-slate-600">
              <div className="space-y-3">
                {/* Comparação visual */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500 rounded p-3">
                    <p className="text-green-400 text-xs font-semibold mb-1">Original (Legítimo)</p>
                    <p className="text-green-300 font-mono text-sm break-all">{selectedComparison.original}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500 rounded p-3">
                    <p className="text-red-400 text-xs font-semibold mb-1">Suspeito</p>
                    <p className="text-red-300 font-mono text-sm break-all">{selectedComparison.suspicious}</p>
                  </div>
                </div>

                {/* Similaridade */}
                <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                  <p className="text-slate-400 text-xs font-semibold mb-2">Nível de Similaridade</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        selectedComparison.riskLevel === 'high'
                          ? 'bg-red-500'
                          : selectedComparison.riskLevel === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedComparison.similarity}%` }}
                    />
                  </div>
                  <p className="text-slate-300 text-sm font-bold mt-2">{selectedComparison.similarity}% de similaridade</p>
                </div>

                {/* Diferenças detectadas */}
                <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                  <p className="text-slate-400 text-xs font-semibold mb-2">Diferenças Detectadas</p>
                  <ul className="space-y-1">
                    {selectedComparison.differences.map((diff, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-yellow-400 flex-shrink-0">•</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alerta */}
                {selectedComparison.riskLevel === 'high' && (
                  <div className="bg-red-500/10 border border-red-500 rounded p-3 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-bold text-sm">⚠️ Alto Risco de Typosquatting</p>
                      <p className="text-red-300 text-xs mt-1">
                        Este domínio é muito similar ao original. Pode ser uma tentativa de phishing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-slate-400">Nenhuma comparação disponível.</p>
        </div>
      )}
    </div>
  );
};

export default TyposquattingComparator;
