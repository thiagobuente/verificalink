/**
 * Gerador de Relatório PDF Profissional
 * Cria relatórios exportáveis com logo Shield, score visual, resultados de cada fonte
 */

export interface PDFReportData {
  url: string;
  score: number;
  classification: string;
  timestamp: Date;
  summary: string;
  signals: string[];
  recommendations: string[];
  sources: {
    virusTotal?: { detections: number; total: number; reputation: string };
    abuseIPDB?: { score: number; reports: number; country: string };
    urlhaus?: { status: string; threatType: string };
    heuristics?: string[];
  };
}

export const generatePDFReport = (data: PDFReportData): void => {
  // Criar conteúdo HTML para PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Shield Security Scanner - Relatório de Análise</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #0f172a;
          color: #1e293b;
          line-height: 1.6;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
        }
        
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0ea5e9;
          padding-bottom: 20px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0ea5e9;
          margin-right: 15px;
        }
        
        .title {
          flex: 1;
        }
        
        .title h1 {
          font-size: 28px;
          color: #0f172a;
          margin-bottom: 5px;
        }
        
        .title p {
          color: #64748b;
          font-size: 14px;
        }
        
        .timestamp {
          color: #94a3b8;
          font-size: 12px;
          text-align: right;
        }
        
        .score-section {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .score-value {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .classification {
          font-size: 20px;
          margin-bottom: 10px;
        }
        
        .url-section {
          margin-bottom: 30px;
        }
        
        .url-section h2 {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .url-value {
          background: #f1f5f9;
          padding: 12px;
          border-radius: 4px;
          word-break: break-all;
          font-family: monospace;
          font-size: 12px;
          color: #0f172a;
        }
        
        .summary-section {
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          padding: 15px;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        
        .summary-section h3 {
          color: #0ea5e9;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .summary-section p {
          color: #1e293b;
          font-size: 13px;
        }
        
        .signals-section {
          margin-bottom: 30px;
        }
        
        .signals-section h3 {
          color: #0f172a;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .signal-item {
          background: #f8fafc;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
          border-left: 3px solid #0ea5e9;
          font-size: 13px;
          color: #1e293b;
        }
        
        .sources-section {
          margin-bottom: 30px;
        }
        
        .sources-section h3 {
          color: #0f172a;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .source-item {
          background: #f8fafc;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          color: #1e293b;
        }
        
        .source-name {
          font-weight: 600;
          color: #0ea5e9;
          margin-bottom: 5px;
        }
        
        .recommendations-section {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          padding: 15px;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        
        .recommendations-section h3 {
          color: #22c55e;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .recommendation-item {
          margin-bottom: 8px;
          font-size: 13px;
          color: #1e293b;
        }
        
        .recommendation-item:before {
          content: "✓ ";
          color: #22c55e;
          font-weight: bold;
          margin-right: 5px;
        }
        
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          margin-top: 30px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        
        .legal-warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #92400e;
        }
        
        @media print {
          body {
            background: white;
          }
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">🛡️</div>
          <div class="title">
            <h1>Shield Security Scanner</h1>
            <p>Relatório de Análise de Segurança</p>
          </div>
          <div class="timestamp">
            ${new Date(data.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
        
        <!-- Score Section -->
        <div class="score-section">
          <div class="score-value">${data.score}%</div>
          <div class="classification">Classificação: ${data.classification}</div>
        </div>
        
        <!-- URL Section -->
        <div class="url-section">
          <h2>URL Analisada</h2>
          <div class="url-value">${data.url}</div>
        </div>
        
        <!-- Summary -->
        <div class="summary-section">
          <h3>📋 Resumo</h3>
          <p>${data.summary}</p>
        </div>
        
        <!-- Signals -->
        ${data.signals.length > 0 ? `
          <div class="signals-section">
            <h3>🎯 Sinais Detectados</h3>
            ${data.signals.map(signal => `<div class="signal-item">${signal}</div>`).join('')}
          </div>
        ` : ''}
        
        <!-- Sources -->
        <div class="sources-section">
          <h3>📊 Fontes Consultadas</h3>
          ${data.sources.virusTotal ? `
            <div class="source-item">
              <div class="source-name">VirusTotal</div>
              Detecções: ${data.sources.virusTotal.detections}/${data.sources.virusTotal.total}<br>
              Reputação: ${data.sources.virusTotal.reputation}
            </div>
          ` : ''}
          ${data.sources.abuseIPDB ? `
            <div class="source-item">
              <div class="source-name">AbuseIPDB</div>
              Score: ${data.sources.abuseIPDB.score}%<br>
              Reports: ${data.sources.abuseIPDB.reports}<br>
              País: ${data.sources.abuseIPDB.country}
            </div>
          ` : ''}
          ${data.sources.urlhaus ? `
            <div class="source-item">
              <div class="source-name">URLhaus</div>
              Status: ${data.sources.urlhaus.status}<br>
              Tipo: ${data.sources.urlhaus.threatType}
            </div>
          ` : ''}
          ${data.sources.heuristics && data.sources.heuristics.length > 0 ? `
            <div class="source-item">
              <div class="source-name">Análise Heurística Local</div>
              ${data.sources.heuristics.join('<br>')}
            </div>
          ` : ''}
        </div>
        
        <!-- Recommendations -->
        ${data.recommendations.length > 0 ? `
          <div class="recommendations-section">
            <h3>💡 Recomendações</h3>
            ${data.recommendations.map(rec => `<div class="recommendation-item">${rec}</div>`).join('')}
          </div>
        ` : ''}
        
        <!-- Legal Warning -->
        <div class="legal-warning">
          ⚠️ <strong>Aviso Legal:</strong> Este relatório é fornecido apenas para fins informativos. 
          Shield Security Scanner não garante 100% de precisão. Sempre verifique links suspeitos 
          antes de clicar. Use com responsabilidade.
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Shield Security Scanner - Proteção Inteligente contra Golpes Digitais</p>
          <p>Análise realizada em ${new Date(data.timestamp).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Abrir em nova aba para impressão/salvamento
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar carregamento e abrir diálogo de impressão
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const downloadPDFReport = (data: PDFReportData, filename: string = 'shield-report.pdf'): void => {
  // Implementação futura com biblioteca como jsPDF
  // Por enquanto, usar generatePDFReport para impressão
  generatePDFReport(data);
};


/**
 * Exporta resultado de análise como PDF usando jsPDF
 * Cria um documento profissional com todos os detalhes
 */
export const exportAnalysisAsPDF = async (data: PDFReportData): Promise<void> => {
  try {
    // Importar jsPDF dinamicamente
    const { default: jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Cores baseadas na classificação
    const classificationColors: Record<string, [number, number, number]> = {
      'SEGURO': [16, 185, 129],      // Verde
      'BAIXO RISCO': [59, 130, 246],       // Azul
      'MÉDIO RISCO': [251, 146, 60],       // Laranja
      'ALTO RISCO': [239, 68, 68],         // Vermelho
      'CRÍTICO': [127, 29, 29],      // Vermelho escuro
    };

    // Header com logo/título
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Shield Security Scanner', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Relatório de Análise de Segurança', margin, yPosition);
    yPosition += 8;

    // Linha divisória
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Seção de Resultado
    const [rColor, gColor, bColor] = classificationColors[data.classification] || [0, 0, 0];
    pdf.setFillColor(rColor, gColor, bColor);
    pdf.rect(margin, yPosition, contentWidth, 12, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.classification, margin + 5, yPosition + 8);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    yPosition += 16;

    // Score
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Score de Risco:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${data.score}/100`, margin + 50, yPosition);
    yPosition += 8;

    // URL
    pdf.setFont('helvetica', 'bold');
    pdf.text('URL Analisada:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    
    const urlLines = pdf.splitTextToSize(data.url, contentWidth - 50);
    pdf.text(urlLines, margin + 50, yPosition);
    yPosition += (urlLines.length * 5) + 3;

    // Data e hora
    pdf.setFont('helvetica', 'bold');
    pdf.text('Data da Análise:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(data.timestamp).toLocaleString('pt-BR'), margin + 50, yPosition);
    yPosition += 10;

    // Linha divisória
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Resumo
    if (data.summary) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo:', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(data.summary, contentWidth);
      pdf.text(summaryLines, margin, yPosition);
      yPosition += (summaryLines.length * 4) + 5;
    }

    // Sinais Detectados
    if (data.signals && data.signals.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sinais Detectados:', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      data.signals.forEach((signal) => {
        const signalLines = pdf.splitTextToSize(`• ${signal}`, contentWidth - 5);
        pdf.text(signalLines, margin + 3, yPosition);
        yPosition += (signalLines.length * 4) + 2;
      });
      yPosition += 3;
    }

    // Fontes Consultadas
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    if (data.sources) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fontes Consultadas:', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      if (data.sources.virusTotal) {
        pdf.text(`• VirusTotal: ${data.sources.virusTotal.detections}/${data.sources.virusTotal.total} deteccoes`, margin + 3, yPosition);
        yPosition += 4;
      }
      if (data.sources.abuseIPDB) {
        pdf.text(`• AbuseIPDB: Score ${data.sources.abuseIPDB.score}%`, margin + 3, yPosition);
        yPosition += 4;
      }
      if (data.sources.urlhaus) {
        pdf.text(`• URLhaus: ${data.sources.urlhaus.status}`, margin + 3, yPosition);
        yPosition += 4;
      }
      if (data.sources.heuristics && data.sources.heuristics.length > 0) {
        pdf.text('• Analise Heuristica Local:', margin + 3, yPosition);
        yPosition += 4;
        data.sources.heuristics.forEach((heuristic) => {
          pdf.text(`  - ${heuristic}`, margin + 5, yPosition);
          yPosition += 3;
        });
      }
      yPosition += 3;
    }

    // Recomendações
    if (data.recommendations && data.recommendations.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recomendacoes:', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      data.recommendations.forEach((rec) => {
        const recLines = pdf.splitTextToSize(`✓ ${rec}`, contentWidth - 5);
        pdf.text(recLines, margin + 3, yPosition);
        yPosition += (recLines.length * 4) + 2;
      });
      yPosition += 3;
    }

    // Aviso Legal
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Aviso Legal Importante:', margin, yPosition);
    yPosition += 5;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const disclaimerText = 'Esta analise eh baseada em heuristicas e inteligencia automatizada. Nao eh uma garantia absoluta. Sempre verifique a origem de mensagens e links com pessoas conhecidas por chamada telefonica antes de clicar ou enviar dinheiro.';
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentWidth);
    pdf.text(disclaimerLines, margin, yPosition);

    // Footer com número de página
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Pagina ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10
      );
    }

    // Salvar PDF
    const filename = `analise-seguranca-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Falha ao exportar PDF. Tente novamente.');
  }
};
