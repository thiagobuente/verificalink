import React from 'react';
import { Calendar, Globe, Server, Lock } from 'lucide-react';

interface DomainMetadataProps {
  domainAge?: string;
  country?: string;
  asn?: string;
  sslIssueDate?: string;
  sslExpiryDate?: string;
  isLoading?: boolean;
}

export const DomainMetadata: React.FC<DomainMetadataProps> = ({
  domainAge,
  country,
  asn,
  sslIssueDate,
  sslExpiryDate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-slate-600 rounded w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  const metadata = [
    {
      icon: Calendar,
      label: 'Idade do Domínio',
      value: domainAge || 'Não disponível',
      color: 'text-blue-400',
    },
    {
      icon: Globe,
      label: 'País de Registro',
      value: country || 'Não disponível',
      color: 'text-green-400',
    },
    {
      icon: Server,
      label: 'ASN (Provedor)',
      value: asn || 'Não disponível',
      color: 'text-purple-400',
    },
    {
      icon: Lock,
      label: 'Certificado SSL',
      value: sslIssueDate ? `Emitido: ${sslIssueDate}` : 'Não disponível',
      subValue: sslExpiryDate ? `Expira: ${sslExpiryDate}` : undefined,
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <h4 className="text-lg font-bold text-cyan-400 mb-4">📋 Metadados do Domínio</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {metadata.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-slate-800/50 border-l-4 border-slate-500 p-3 rounded flex items-start gap-3"
            >
              <Icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs font-semibold">{item.label}</p>
                <p className={`${item.color} text-sm font-mono break-all`}>{item.value}</p>
                {item.subValue && (
                  <p className={`${item.color} text-xs font-mono break-all mt-1`}>{item.subValue}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DomainMetadata;
