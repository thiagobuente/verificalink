import React from 'react';
import { Shield, CheckCircle2, Sparkles } from 'lucide-react';

interface ShieldVerifiedBadgeProps {
  riskScore: number;
  domain: string;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export const ShieldVerifiedBadge: React.FC<ShieldVerifiedBadgeProps> = ({
  riskScore,
  domain,
  size = 'medium',
  showDetails = true,
}) => {
  // Apenas domínios com risco 0-25% recebem o selo
  const isVerified = riskScore <= 25;

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  if (!isVerified) {
    return null;
  }

  return (
    <div className='flex flex-col items-center gap-3'>
      {/* Selo Principal */}
      <div className='relative'>
        {/* Glow animado */}
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 opacity-50 blur-lg animate-pulse`}
        />

        {/* Selo com efeito 3D */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-400 via-cyan-400 to-green-500 p-1 shadow-lg`}
        >
          {/* Borda interna */}
          <div className='w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-green-300'>
            {/* Ícone com animação */}
            <div className='relative'>
              <Shield className='w-1/2 h-1/2 text-green-400 animate-bounce' style={{ animationDuration: '2s' }} />
              <CheckCircle2 className='w-1/3 h-1/3 text-cyan-300 absolute bottom-0 right-0 animate-pulse' />
            </div>
          </div>
        </div>

        {/* Estrelas animadas ao redor */}
        <div className='absolute -top-2 -left-2'>
          <Sparkles className='w-4 h-4 text-yellow-300 animate-spin' style={{ animationDuration: '3s' }} />
        </div>
        <div className='absolute -bottom-2 -right-2'>
          <Sparkles className='w-4 h-4 text-yellow-300 animate-spin' style={{ animationDuration: '4s' }} />
        </div>
      </div>

      {/* Detalhes */}
      {showDetails && (
        <div className='text-center'>
          <p className={`font-bold text-green-400 ${textSizeClasses[size]}`}>🛡️ Shield Verified</p>
          <p className='text-xs text-slate-400 mt-1'>Domínio Seguro Certificado</p>
          <p className='text-xs text-green-400 font-semibold mt-1'>Risco: {riskScore}%</p>
        </div>
      )}
    </div>
  );
};

// Componente para exibir o selo em linha
export const ShieldVerifiedInline: React.FC<{ riskScore: number; domain: string }> = ({
  riskScore,
  domain,
}) => {
  const isVerified = riskScore <= 25;

  if (!isVerified) {
    return null;
  }

  return (
    <div className='inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/50 rounded-full'>
      <div className='relative'>
        <Shield className='w-4 h-4 text-green-400' />
        <CheckCircle2 className='w-2 h-2 text-cyan-300 absolute -bottom-1 -right-1' />
      </div>
      <span className='text-sm font-bold text-green-400'>Shield Verified</span>
      <Sparkles className='w-3 h-3 text-yellow-300 animate-pulse' />
    </div>
  );
};

// Componente para exibir na página de resultado
export const ShieldVerifiedResult: React.FC<{ riskScore: number; domain: string }> = ({
  riskScore,
  domain,
}) => {
  const isVerified = riskScore <= 25;

  if (!isVerified) {
    return null;
  }

  return (
    <div className='bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-2 border-green-500 rounded-lg p-6 text-center'>
      {/* Selo Grande */}
      <div className='flex justify-center mb-4'>
        <div className='relative'>
          {/* Glow */}
          <div className='absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 opacity-30 blur-xl' />

          {/* Selo */}
          <div className='relative w-32 h-32 rounded-full bg-gradient-to-br from-green-400 via-cyan-400 to-green-500 p-2 shadow-2xl'>
            <div className='w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-3 border-green-300'>
              <div className='text-center'>
                <Shield className='w-12 h-12 text-green-400 mx-auto mb-1 animate-bounce' />
                <CheckCircle2 className='w-6 h-6 text-cyan-300 mx-auto' />
              </div>
            </div>
          </div>

          {/* Estrelas */}
          <div className='absolute -top-3 -left-3'>
            <Sparkles className='w-6 h-6 text-yellow-300 animate-spin' style={{ animationDuration: '3s' }} />
          </div>
          <div className='absolute -bottom-3 -right-3'>
            <Sparkles className='w-6 h-6 text-yellow-300 animate-spin' style={{ animationDuration: '4s' }} />
          </div>
          <div className='absolute top-1/2 -right-6'>
            <Sparkles className='w-5 h-5 text-cyan-300 animate-pulse' />
          </div>
        </div>
      </div>

      {/* Texto */}
      <h3 className='text-2xl font-bold text-green-400 mb-2'>🛡️ Shield Verified</h3>
      <p className='text-lg text-green-300 font-semibold mb-3'>Domínio Seguro Certificado</p>

      {/* Informações */}
      <div className='space-y-2 mb-4'>
        <p className='text-slate-300 text-sm'>
          Este domínio foi verificado e certificado como seguro pelo Shield Security Scanner.
        </p>
        <p className='text-green-400 font-bold text-sm'>Risco: {riskScore}% (Muito Baixo)</p>
        <p className='text-slate-400 text-xs'>Domínio: <span className='text-cyan-400 font-mono'>{domain}</span></p>
      </div>

      {/* Checkmarks */}
      <div className='grid grid-cols-2 gap-2 mb-4'>
        <div className='bg-green-500/20 border border-green-500 rounded p-2'>
          <p className='text-green-400 font-bold text-xs'>✓ SSL Válido</p>
        </div>
        <div className='bg-green-500/20 border border-green-500 rounded p-2'>
          <p className='text-green-400 font-bold text-xs'>✓ Reputação Alta</p>
        </div>
        <div className='bg-green-500/20 border border-green-500 rounded p-2'>
          <p className='text-green-400 font-bold text-xs'>✓ Sem Malware</p>
        </div>
        <div className='bg-green-500/20 border border-green-500 rounded p-2'>
          <p className='text-green-400 font-bold text-xs'>✓ Confiável</p>
        </div>
      </div>

      {/* Recomendação */}
      <div className='bg-blue-500/10 border border-blue-500 rounded p-3'>
        <p className='text-blue-300 text-sm'>
          ✓ Este é um domínio seguro. Você pode navegar com confiança e compartilhar dados com segurança.
        </p>
      </div>
    </div>
  );
};

export default ShieldVerifiedBadge;
