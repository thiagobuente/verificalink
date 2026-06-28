/**
 * Gerador de Relatórios Visuais para Compartilhamento
 * Cria mensagens formatadas para WhatsApp com detalhes da análise
 */

export const generateLinkReport = (linkResult: any) => {
  const emoji = linkResult.isScam ? "🚨" : "✅";
  const status = linkResult.nivelRisco;
  const score = linkResult.score;
  const url = linkResult.url;

  let report = `${emoji} *ANÁLISE DE LINK - PARE ANTES DO PIX*\n\n`;
  report += `*Status:* ${status}\n`;
  report += `*Pontuação de Risco:* ${score}%\n`;
  report += `*URL:* ${url}\n\n`;

  if (linkResult.risks && linkResult.risks.length > 0) {
    report += `*⚠️ Sinais Detectados:*\n`;
    linkResult.risks.forEach((risk: string) => {
      report += `• ${risk}\n`;
    });
    report += "\n";
  }

  report += `*📊 Análise Detalhada:*\n`;

  if (linkResult.detalhes) {
    if (linkResult.detalhes.whatsapp) {
      report += `• 📱 WhatsApp Suspeito - URL contém padrão wa.me ou api.whatsapp.com\n`;
    }
    if (linkResult.detalhes.encurtador) {
      report += `• 🔗 URL Encurtada - Golpistas usam para esconder destino real\n`;
    }
    if (linkResult.detalhes.urlLonga) {
      report += `• 📏 URL Muito Longa - Comprimento superior a 120 caracteres\n`;
    }
    if (linkResult.detalhes.excessoNumeros) {
      report += `• 🔢 Excesso de Números - Mais de 8 dígitos na URL\n`;
    }
    if (linkResult.detalhes.subdominio) {
      report += `• 🏢 Muitos Subdomínios - Mais de 4 níveis de domínio\n`;
    }
    if (linkResult.detalhes.typosquatting) {
      report += `• 🎭 Typosquatting - Imita marca conhecida (0=O, 4=A, 1=I)\n`;
    }
  }

  report += `\n*🛡️ Dica de Segurança:*\n`;
  if (linkResult.isScam) {
    report += `NÃO clique neste link! Pode ser um golpe. Se recebeu de alguém conhecido, ligue para confirmar se foi realmente ela que enviou.\n`;
  } else {
    report += `Este link apresenta baixo risco, mas sempre verifique a origem antes de clicar.\n`;
  }

  report += `\n*Analisado em:* ${new Date().toLocaleString("pt-BR")}\n`;
  report += `*Ferramenta:* Pare Antes do Pix\n`;
  report += `*Link:* https://whatsappbr-cu3bdafs.manus.space`;

  return report;
};

export const generateMessageReport = (messageResult: any) => {
  const emoji = messageResult.isScam ? "🚨" : "✅";
  const status = messageResult.isScam ? "ALTO RISCO" : "BAIXO RISCO";
  const score = messageResult.score;

  let report = `${emoji} *ANÁLISE DE MENSAGEM - PARE ANTES DO PIX*\n\n`;
  report += `*Status:* ${status}\n`;
  report += `*Pontuação de Risco:* ${score}%\n\n`;

  if (messageResult.risks && messageResult.risks.length > 0) {
    report += `*⚠️ Padrões de Golpe Detectados:*\n`;
    messageResult.risks.forEach((risk: any) => {
      report += `• ${risk.name} - ${risk.reason}\n`;
    });
    report += "\n";
  }

  if (messageResult.extractedLinks && messageResult.extractedLinks.length > 0) {
    report += `*🔗 Links Encontrados:*\n`;
    messageResult.extractedLinks.forEach((link: string) => {
      report += `• ${link}\n`;
    });
    report += "\n";
  }

  report += `*🛡️ Dica de Segurança:*\n`;
  if (messageResult.isScam) {
    report += `Esta mensagem apresenta SINAIS DE GOLPE! Não clique em links, não envie dinheiro e não compartilhe dados pessoais. Se recebeu de alguém conhecido, ligue para confirmar.\n`;
  } else {
    report += `Esta mensagem apresenta baixo risco, mas sempre verifique a origem antes de clicar em links.\n`;
  }

  report += `\n*Analisado em:* ${new Date().toLocaleString("pt-BR")}\n`;
  report += `*Ferramenta:* Pare Antes do Pix\n`;
  report += `*Link:* https://whatsappbr-cu3bdafs.manus.space`;

  return report;
};

export const generateQRReport = (qrResult: any) => {
  const emoji = qrResult.isScam ? "🚨" : "✅";
  const status = qrResult.isScam ? "ALTO RISCO" : "BAIXO RISCO";
  const score = qrResult.score;
  const decodedUrl = qrResult.decodedUrl;

  let report = `${emoji} *ANÁLISE DE QR CODE - PARE ANTES DO PIX*\n\n`;
  report += `*Status:* ${status}\n`;
  report += `*Pontuação de Risco:* ${score}%\n`;
  report += `*URL Decodificada:* ${decodedUrl}\n\n`;

  if (qrResult.risks && qrResult.risks.length > 0) {
    report += `*⚠️ Sinais Detectados:*\n`;
    qrResult.risks.forEach((risk: any) => {
      report += `• ${risk.name} - ${risk.reason}\n`;
    });
    report += "\n";
  }

  report += `*🛡️ Dica de Segurança:*\n`;
  if (qrResult.isScam) {
    report += `Este QR Code pode levar a um golpe! NÃO escaneie se não tiver certeza da origem. Se recebeu de alguém, ligue para confirmar.\n`;
  } else {
    report += `Este QR Code apresenta baixo risco, mas sempre verifique a origem antes de escanear.\n`;
  }

  report += `\n*Analisado em:* ${new Date().toLocaleString("pt-BR")}\n`;
  report += `*Ferramenta:* Pare Antes do Pix\n`;
  report += `*Link:* https://whatsappbr-cu3bdafs.manus.space`;

  return report;
};

export const generatePDFReport = (pdfResult: any) => {
  const emoji = pdfResult.isScam ? "🚨" : "✅";
  const status = pdfResult.isScam ? "ALTO RISCO" : "BAIXO RISCO";
  const score = pdfResult.score;
  const fileName = pdfResult.fileName;

  let report = `${emoji} *ANÁLISE DE ARQUIVO PDF - PARE ANTES DO PIX*\n\n`;
  report += `*Status:* ${status}\n`;
  report += `*Pontuação de Risco:* ${score}%\n`;
  report += `*Arquivo:* ${fileName}\n\n`;

  if (pdfResult.risks && pdfResult.risks.length > 0) {
    report += `*⚠️ Sinais Detectados:*\n`;
    pdfResult.risks.forEach((risk: any) => {
      report += `• ${risk.name} - ${risk.reason}\n`;
    });
    report += "\n";
  }

  report += `*🛡️ Dica de Segurança:*\n`;
  if (pdfResult.isScam) {
    report += `Este PDF pode conter malware ou ser um golpe! NÃO abra se não tiver certeza da origem. Desconfie de PDFs de pessoas desconhecidas.\n`;
  } else {
    report += `Este PDF apresenta baixo risco, mas sempre verifique a origem antes de abrir.\n`;
  }

  report += `\n*Analisado em:* ${new Date().toLocaleString("pt-BR")}\n`;
  report += `*Ferramenta:* Pare Antes do Pix\n`;
  report += `*Link:* https://whatsappbr-cu3bdafs.manus.space`;

  return report;
};

export const shareToWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const downloadReportAsText = (report: string, fileName: string) => {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
  element.setAttribute("download", fileName);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const generateShareMessage = (type: string, result: any) => {
  switch (type) {
    case "link":
      return generateLinkReport(result);
    case "message":
      return generateMessageReport(result);
    case "qrcode":
      return generateQRReport(result);
    case "pdf":
      return generatePDFReport(result);
    default:
      return "";
  }
};
