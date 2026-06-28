import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SSLCertificateInfo {
  isValid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
  isExpired: boolean;
  isSelfSigned: boolean;
}

interface SSLCertificateAnalysisProps {
  url: string;
  sslInfo?: SSLCertificateInfo;
}

export default function SSLCertificateAnalysis({ url, sslInfo }: SSLCertificateAnalysisProps) {
  const [expanded, setExpanded] = useState(false);

  // Dados de exemplo para demonstração
  const mockSSLInfo: SSLCertificateInfo = sslInfo || {
    isValid: true,
    issuer: "Let's Encrypt Authority X3",
    subject: 'example.com',
    validFrom: '2024-01-15',
    validTo: '2025-04-15',
    daysUntilExpiry: 130,
    protocol: 'TLS 1.3',
    cipher: 'TLS_AES_256_GCM_SHA384',
    isExpired: false,
    isSelfSigned: false,
  };

  const getSSLStatusColor = () => {
    if (mockSSLInfo.isExpired) return 'from-red-900/20 to-red-800/10 border-red-500/30';
    if (mockSSLInfo.isSelfSigned) return 'from-orange-900/20 to-orange-800/10 border-orange-500/30';
    if (mockSSLInfo.daysUntilExpiry < 30) return 'from-yellow-900/20 to-yellow-800/10 border-yellow-500/30';
    return 'from-green-900/20 to-green-800/10 border-green-500/30';
  };

  const getSSLStatusTextColor = () => {
    if (mockSSLInfo.isExpired) return 'text-red-400';
    if (mockSSLInfo.isSelfSigned) return 'text-orange-400';
    if (mockSSLInfo.daysUntilExpiry < 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSSLStatusLabel = () => {
    if (mockSSLInfo.isExpired) return '🔴 Certificado Expirado';
    if (mockSSLInfo.isSelfSigned) return '⚠️ Certificado Auto-Assinado';
    if (mockSSLInfo.daysUntilExpiry < 30) return '🟡 Certificado Próximo do Vencimento';
    return '🟢 Certificado Válido';
  };

  const getExpiryWarning = () => {
    if (mockSSLInfo.isExpired) {
      return 'Este certificado expirou. O site pode não ser seguro. Evite compartilhar dados pessoais.';
    }
    if (mockSSLInfo.isSelfSigned) {
      return 'Este é um certificado auto-assinado. Pode indicar falta de legitimidade ou ser usado em phishing.';
    }
    if (mockSSLInfo.daysUntilExpiry < 30) {
      return `Este certificado vencerá em ${mockSSLInfo.daysUntilExpiry} dias. O site pode ficar indisponível.`;
    }
    return 'Este certificado é válido e emitido por uma autoridade confiável.';
  };

  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 p-6 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-emerald-400" />
          <h3 className="text-lg font-bold text-emerald-400 leading-tight">🔐 Análise de Certificado SSL/TLS</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-emerald-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-emerald-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-emerald-500/20">
          {/* STATUS DO CERTIFICADO */}
          <div className={`rounded-lg p-4 md:p-5 border-2 bg-gradient-to-br ${getSSLStatusColor()}`}>
            <div className="flex items-center gap-3 mb-3">
              {mockSSLInfo.isValid && !mockSSLInfo.isExpired && !mockSSLInfo.isSelfSigned ? (
                <CheckCircle2 className={`w-6 h-6 ${getSSLStatusTextColor()}`} />
              ) : (
                <AlertTriangle className={`w-6 h-6 ${getSSLStatusTextColor()}`} />
              )}
              <span className={`text-sm font-bold ${getSSLStatusTextColor()} leading-tight`}>
                {getSSLStatusLabel()}
              </span>
            </div>
            <p className="text-emerald-300 text-sm leading-relaxed">{getExpiryWarning()}</p>
          </div>

          {/* INFORMAÇÕES DO CERTIFICADO */}
          <div className="space-y-3">
            {/* Protocolo e Cifra */}
            <div className="bg-emerald-500/10 rounded-lg p-4 md:p-5 border border-emerald-500/20">
              <p className="text-emerald-300 text-sm font-semibold mb-2 leading-relaxed">🔒 Protocolo de Segurança</p>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-emerald-400 text-xs font-medium">Versão TLS:</span>
                  <span className="text-emerald-300 text-xs leading-relaxed">{mockSSLInfo.protocol}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-emerald-400 text-xs font-medium">Cifra:</span>
                  <span className="text-emerald-300 text-xs leading-relaxed font-mono break-all">{mockSSLInfo.cipher}</span>
                </div>
              </div>
            </div>

            {/* Informações do Emissor */}
            <div className="bg-emerald-500/10 rounded-lg p-4 md:p-5 border border-emerald-500/20">
              <p className="text-emerald-300 text-sm font-semibold mb-2 leading-relaxed">🏢 Emissor do Certificado</p>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-emerald-400 text-xs font-medium">Autoridade:</span>
                  <span className="text-emerald-300 text-xs leading-relaxed">{mockSSLInfo.issuer}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-emerald-400 text-xs font-medium">Domínio:</span>
                  <span className="text-emerald-300 text-xs leading-relaxed break-all">{mockSSLInfo.subject}</span>
                </div>
              </div>
            </div>

            {/* Datas de Validade */}
            <div className="bg-emerald-500/10 rounded-lg p-4 md:p-5 border border-emerald-500/20">
              <p className="text-emerald-300 text-sm font-semibold mb-2 leading-relaxed">📅 Período de Validade</p>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-emerald-400 text-xs font-medium">Válido de:</span>
                  <span className="text-emerald-300 text-xs leading-relaxed">{mockSSLInfo.validFrom}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-emerald-400 text-xs font-medium">Válido até:</span>
                  <span className={`text-xs leading-relaxed ${mockSSLInfo.isExpired ? 'text-red-400' : 'text-emerald-300'}`}>
                    {mockSSLInfo.validTo}
                  </span>
                </div>
                <div className="flex justify-between items-start pt-2 border-t border-emerald-500/20">
                  <span className="text-emerald-400 text-xs font-medium">Dias até vencimento:</span>
                  <span className={`text-xs font-bold leading-relaxed ${
                    mockSSLInfo.daysUntilExpiry < 0 ? 'text-red-400' :
                    mockSSLInfo.daysUntilExpiry < 30 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {mockSSLInfo.daysUntilExpiry < 0 ? 'Expirado' : mockSSLInfo.daysUntilExpiry}
                  </span>
                </div>
              </div>
            </div>

            {/* Recomendações de Segurança */}
            <div className="bg-emerald-500/5 rounded-lg p-4 md:p-5 border border-emerald-500/20">
              <p className="text-emerald-300 text-sm font-semibold mb-3 leading-relaxed">💡 Recomendações de Segurança</p>
              <ul className="space-y-2">
                <li className="text-emerald-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  <span>Sempre procure pelo cadeado 🔒 na barra de endereço antes de inserir dados pessoais.</span>
                </li>
                <li className="text-emerald-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  <span>Certificados válidos indicam que a conexão é criptografada, mas não garantem que o site é legítimo.</span>
                </li>
                <li className="text-emerald-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  <span>Sites de phishing podem ter certificados SSL válidos. Verifique a URL e o domínio com cuidado.</span>
                </li>
                <li className="text-emerald-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  <span>Certificados auto-assinados são comuns em ataques de phishing e roubo de dados.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
