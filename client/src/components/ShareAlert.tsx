import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareAlertProps {
  url: string;
  riskScore: number;
  threats: string[];
  riskLevel: 'safe' | 'warning' | 'danger';
}

export const ShareAlert: React.FC<ShareAlertProps> = ({ url, riskScore, threats, riskLevel }) => {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const generateMessage = () => {
    const riskLabel = riskLevel === 'danger' ? '🚨 PERIGOSO' : riskLevel === 'warning' ? '⚠️ ATENÇÃO' : '✅ SEGURO';
    const threatsList = threats.length > 0 ? `\n\nAmeaças: ${threats.join(', ')}` : '';

    return `🛡️ Shield Security Scanner\n\nAnalisei este link e encontrei:\n\n🔗 URL: ${url}\n📊 Risco: ${riskScore}%\n🏷️ Status: ${riskLabel}${threatsList}\n\n⚠️ Nunca clique em links suspeitos!\n\nUse o Shield para proteger você e sua família!\nhttps://shield-security.manus.space`;
  };

  const message = generateMessage();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('https://shield-security.manus.space')}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleShareEmail = () => {
    const emailSubject = `🛡️ Alerta de Segurança: ${url}`;
    const emailBody = message.replace(/\n/g, '%0D%0A');
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${emailBody}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=https://shield-security.manus.space&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, '_blank');
  };

  return (
    <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4'>
      <div className='flex items-center gap-2 mb-4'>
        <Share2 className='w-5 h-5 text-cyan-400' />
        <h4 className='text-lg font-bold text-cyan-400'>📤 Compartilhar Alerta</h4>
      </div>

      {/* Preview da mensagem */}
      <div className='bg-slate-800/50 border border-slate-600 rounded p-3 mb-4'>
        <p className='text-slate-400 text-xs font-semibold mb-2'>Prévia da Mensagem:</p>
        <div className='bg-slate-900 rounded p-2 text-slate-300 text-xs whitespace-pre-wrap font-mono max-h-32 overflow-y-auto'>
          {message}
        </div>
      </div>

      {/* Botões de compartilhamento */}
      <div className='space-y-2'>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
          <button
            onClick={handleShareWhatsApp}
            className='flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded transition-colors'
          >
            <MessageCircle className='w-4 h-4' />
            WhatsApp
          </button>

          <button
            onClick={handleShareTelegram}
            className='flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors'
          >
            <Send className='w-4 h-4' />
            Telegram
          </button>

          <button
            onClick={handleShareEmail}
            className='flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded transition-colors'
          >
            <Mail className='w-4 h-4' />
            Email
          </button>

          <button
            onClick={handleShareTwitter}
            className='flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded transition-colors'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7' />
            </svg>
            Twitter
          </button>

          <button
            onClick={handleShareFacebook}
            className='flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded transition-colors'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z' />
            </svg>
            Facebook
          </button>
        </div>

        {/* Copiar para clipboard */}
        <button
          onClick={handleCopyToClipboard}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold rounded transition-colors ${
            copied
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {copied ? (
            <>
              <Check className='w-4 h-4' />
              Copiado!
            </>
          ) : (
            <>
              <Copy className='w-4 h-4' />
              Copiar Mensagem
            </>
          )}
        </button>
      </div>

      {/* Dica */}
      <div className='mt-4 bg-blue-500/10 border border-blue-500 rounded p-3'>
        <p className='text-blue-400 font-bold text-sm mb-1'>💡 Dica:</p>
        <p className='text-blue-300 text-xs'>
          Compartilhe este alerta com seus amigos e familiares para ajudá-los a se proteger de golpes e ameaças online!
        </p>
      </div>
    </div>
  );
};

export default ShareAlert;
