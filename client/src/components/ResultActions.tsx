import React, { useState } from 'react';
import { Copy, Download, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultActionsProps {
  url: string;
  score: number;
  riskLevel: string;
  onShare?: () => void;
}

export function ResultActions({ url, score, riskLevel, onShare }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleDownloadPDF = () => {
    // Implementar download de PDF
    const content = `
      Shield Security Scanner - Relatório de Análise
      =============================================
      
      URL Analisada: ${url}
      Score de Risco: ${score}/100
      Nível de Risco: ${riskLevel}
      Data: ${new Date().toLocaleString('pt-BR')}
      
      Recomendação: Verifique o link com cuidado antes de clicar.
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `analise-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `🛡️ Shield Security Scanner\n\nAnalisei este link para você:\n${url}\n\nScore de Risco: ${score}/100\nNível: ${riskLevel}\n\nAcesse: https://shield-security.manus.space`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6">
      <Button
        onClick={handleCopy}
        variant="outline"
        className="flex-1 gap-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/20"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copiar URL
          </>
        )}
      </Button>

      <Button
        onClick={handleDownloadPDF}
        variant="outline"
        className="flex-1 gap-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/20"
      >
        <Download className="w-4 h-4" />
        Baixar Relatório
      </Button>

      <Button
        onClick={handleShareWhatsApp}
        className="flex-1 gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </Button>
    </div>
  );
}

export default ResultActions;
