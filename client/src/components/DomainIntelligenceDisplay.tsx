import { Globe, Calendar, Server, Shield, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';

interface SSLCertificate {
  issuer: string;
  expiryDate: string;
  isValid: boolean;
  organization: string;
}

interface DomainIntelligenceData {
  domain: string;
  registrar: string;
  registrarCountry: string;
  createdDate: string;
  expiryDate: string;
  ageInDays: number;
  nameServers: string[];
  country: string;
  ipAddress: string;
  sslCertificate: SSLCertificate | null;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  reputation: Record<string, string>;
}

interface Props {
  data: DomainIntelligenceData;
  isLoading?: boolean;
}

export function DomainIntelligenceDisplay({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
          <span className="text-gray-300">Carregando informações do domínio...</span>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-green-500/10 border-green-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Unknown') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com Score de Risco */}
      <div className={`rounded-lg border-2 p-6 backdrop-blur ${getRiskBgColor(data.riskLevel)}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-cyan-400">
              <Globe className="w-5 h-5" />
              Domain Intelligence
            </h3>
            <p className="text-sm text-gray-400">
              Domínio: <span className="font-mono text-gray-200">{data.domain}</span>
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getRiskColor(data.riskLevel)}`}>
              {data.riskScore}
              <span className="text-sm text-gray-400">/100</span>
            </div>
            <p className={`text-sm font-semibold ${getRiskColor(data.riskLevel)}`}>
              {data.riskLevel === 'critical' && '🔴 Crítico'}
              {data.riskLevel === 'high' && '🟠 Alto Risco'}
              {data.riskLevel === 'medium' && '🟡 Médio Risco'}
              {data.riskLevel === 'low' && '🟢 Baixo Risco'}
            </p>
          </div>
        </div>
      </div>

      {/* Fatores de Risco */}
      {data.riskFactors.length > 0 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            Fatores de Risco Detectados
          </h4>
          <ul className="space-y-2">
            {data.riskFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 flex-shrink-0"></span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Informações de Registro */}
        <div className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-4 backdrop-blur">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-cyan-400">
            <Server className="w-4 h-4" />
            Informações de Registro
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-400">Registrador</p>
              <p className="font-mono text-gray-200">{data.registrar}</p>
            </div>
            <div>
              <p className="text-gray-400">País do Registrador</p>
              <p className="flex items-center gap-2 font-mono text-gray-200">
                <MapPin className="w-3 h-3" />
                {data.registrarCountry}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Criado em</p>
              <p className="font-mono text-gray-200">{formatDate(data.createdDate)}</p>
            </div>
            <div>
              <p className="text-gray-400">Expira em</p>
              <p className="font-mono text-gray-200">{formatDate(data.expiryDate)}</p>
            </div>
          </div>
        </div>

        {/* Idade e Localização */}
        <div className="rounded-lg border border-green-500/20 bg-slate-800/50 p-4 backdrop-blur">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-green-400">
            <Clock className="w-4 h-4" />
            Idade e Localização
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-400">Idade do Domínio</p>
              <p className="font-mono text-gray-200">
                {data.ageInDays} dias
                {data.ageInDays < 30 && ' ⚠️ Muito novo'}
                {data.ageInDays >= 30 && data.ageInDays < 90 && ' ⚠️ Relativamente novo'}
                {data.ageInDays >= 365 && ' ✓ Estabelecido'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">País</p>
              <p className="font-mono text-gray-200">{data.country}</p>
            </div>
            <div>
              <p className="text-gray-400">Endereço IP</p>
              <p className="font-mono text-gray-200">{data.ipAddress}</p>
            </div>
          </div>
        </div>

        {/* SSL/TLS */}
        <div className="rounded-lg border border-blue-500/20 bg-slate-800/50 p-4 backdrop-blur">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-blue-400">
            <Shield className="w-4 h-4" />
            Certificado SSL/TLS
          </h4>
          {data.sslCertificate ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {data.sslCertificate.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span className={data.sslCertificate.isValid ? 'text-green-400' : 'text-red-400'}>
                  {data.sslCertificate.isValid ? 'Válido' : 'Inválido'}
                </span>
              </div>
              <div>
                <p className="text-gray-400">Emissor</p>
                <p className="font-mono text-gray-200">{data.sslCertificate.issuer}</p>
              </div>
              <div>
                <p className="text-gray-400">Organização</p>
                <p className="font-mono text-gray-200">{data.sslCertificate.organization}</p>
              </div>
              <div>
                <p className="text-gray-400">Expira em</p>
                <p className="font-mono text-gray-200">{formatDate(data.sslCertificate.expiryDate)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-400">Nenhum certificado SSL encontrado</p>
          )}
        </div>

        {/* Reputação */}
        <div className="rounded-lg border border-purple-500/20 bg-slate-800/50 p-4 backdrop-blur">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-purple-400">
            <CheckCircle className="w-4 h-4" />
            Reputação
          </h4>
          <div className="space-y-2 text-sm">
            {Object.entries(data.reputation).length > 0 ? (
              Object.entries(data.reputation).map(([source, status]) => (
                <div key={source}>
                  <p className="text-gray-400 capitalize">{source}</p>
                  <p className="font-mono text-gray-200">{status}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Nenhuma informação de reputação disponível</p>
            )}
          </div>
        </div>

        {/* Nameservers */}
        {data.nameServers.length > 0 && (
          <div className="col-span-1 rounded-lg border border-indigo-500/20 bg-slate-800/50 p-4 backdrop-blur md:col-span-2">
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-indigo-400">
              <Server className="w-4 h-4" />
              Nameservers
            </h4>
            <div className="space-y-1">
              {data.nameServers.map((ns, idx) => (
                <p key={idx} className="font-mono text-sm text-gray-200">
                  {ns}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recomendações */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur">
        <h4 className="mb-2 font-semibold text-blue-400">💡 Recomendações</h4>
        <ul className="space-y-1 text-sm text-gray-300">
          {data.riskLevel === 'critical' && (
            <>
              <li>• Não clique neste link - risco crítico detectado</li>
              <li>• Reporte o domínio às autoridades competentes</li>
              <li>• Não forneça dados pessoais ou financeiros</li>
            </>
          )}
          {data.riskLevel === 'high' && (
            <>
              <li>• Tenha cautela ao acessar este domínio</li>
              <li>• Verifique a autenticidade através de canais oficiais</li>
              <li>• Não clique em links suspeitos dentro do site</li>
            </>
          )}
          {data.riskLevel === 'medium' && (
            <>
              <li>• Verifique a URL antes de clicar</li>
              <li>• Procure por sinais de phishing (URLs estranhas, erros de digitação)</li>
              <li>• Quando em dúvida, acesse o site diretamente</li>
            </>
          )}
          {data.riskLevel === 'low' && (
            <>
              <li>• Domínio aparenta ser legítimo</li>
              <li>• Mantenha-se atento a possíveis tentativas de phishing</li>
              <li>• Nenhuma solução é 100% segura - sempre verifique URLs</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
