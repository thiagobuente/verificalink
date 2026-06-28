/**
 * Gerenciador de Histórico de Análises
 * Armazena e recupera análises anteriores do localStorage
 */

export interface AnalysisRecord {
  id: string;
  type: "link" | "message" | "qrcode" | "pdf";
  timestamp: number;
  content: string;
  score: number;
  isScam: boolean;
  nivelRisco: string;
  risks: string[];
  detalhes?: any;
}

const HISTORY_KEY = "pare_antes_do_pix_history";
const MAX_HISTORY_ITEMS = 50;

export const addToHistory = (record: Omit<AnalysisRecord, "id" | "timestamp">) => {
  try {
    const history = getHistory();
    
    const newRecord: AnalysisRecord = {
      ...record,
      id: `${record.type}_${Date.now()}`,
      timestamp: Date.now()
    };

    // Adicionar novo registro no início
    history.unshift(newRecord);

    // Manter apenas os últimos MAX_HISTORY_ITEMS
    if (history.length > MAX_HISTORY_ITEMS) {
      history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return newRecord;
  } catch (error) {
    console.error("Erro ao adicionar ao histórico:", error);
    return null;
  }
};

export const getHistory = (): AnalysisRecord[] => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Erro ao recuperar histórico:", error);
    return [];
  }
};

export const getHistoryByType = (type: "link" | "message" | "qrcode" | "pdf"): AnalysisRecord[] => {
  try {
    const history = getHistory();
    return history.filter(record => record.type === type);
  } catch (error) {
    console.error("Erro ao filtrar histórico:", error);
    return [];
  }
};

export const getHistoryItem = (id: string): AnalysisRecord | null => {
  try {
    const history = getHistory();
    return history.find(record => record.id === id) || null;
  } catch (error) {
    console.error("Erro ao recuperar item do histórico:", error);
    return null;
  }
};

export const deleteHistoryItem = (id: string) => {
  try {
    const history = getHistory();
    const filtered = history.filter(record => record.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Erro ao deletar item do histórico:", error);
    return false;
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error("Erro ao limpar histórico:", error);
    return false;
  }
};

export const deleteOldHistory = (daysOld: number = 30) => {
  try {
    const history = getHistory();
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const filtered = history.filter(record => record.timestamp > cutoffTime);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return filtered.length;
  } catch (error) {
    console.error("Erro ao deletar histórico antigo:", error);
    return 0;
  }
};

export const getHistoryStats = () => {
  try {
    const history = getHistory();
    const stats = {
      total: history.length,
      links: history.filter(r => r.type === "link").length,
      messages: history.filter(r => r.type === "message").length,
      qrcodes: history.filter(r => r.type === "qrcode").length,
      pdfs: history.filter(r => r.type === "pdf").length,
      scamsDetected: history.filter(r => r.isScam).length,
      safeItems: history.filter(r => !r.isScam).length,
      averageScore: history.length > 0 
        ? Math.round(history.reduce((sum, r) => sum + r.score, 0) / history.length)
        : 0
    };
    return stats;
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    return null;
  }
};

export const searchHistory = (query: string): AnalysisRecord[] => {
  try {
    const history = getHistory();
    const lowerQuery = query.toLowerCase();
    return history.filter(record => 
      record.content.toLowerCase().includes(lowerQuery) ||
      record.risks.some(risk => risk.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error("Erro ao buscar no histórico:", error);
    return [];
  }
};

export const exportHistory = (): string => {
  try {
    const history = getHistory();
    const stats = getHistoryStats();
    
    let exportData = "HISTÓRICO DE ANÁLISES - PARE ANTES DO PIX\n";
    exportData += `Exportado em: ${new Date().toLocaleString("pt-BR")}\n`;
    exportData += `Total de análises: ${stats?.total || 0}\n`;
    exportData += `Golpes detectados: ${stats?.scamsDetected || 0}\n`;
    exportData += `Itens seguros: ${stats?.safeItems || 0}\n`;
    exportData += `Pontuação média de risco: ${stats?.averageScore || 0}%\n\n`;
    exportData += "=".repeat(80) + "\n\n";

    history.forEach((record, index) => {
      exportData += `[${index + 1}] ${record.type.toUpperCase()}\n`;
      exportData += `Data: ${new Date(record.timestamp).toLocaleString("pt-BR")}\n`;
      exportData += `Status: ${record.nivelRisco}\n`;
      exportData += `Risco: ${record.score}%\n`;
      exportData += `Conteúdo: ${record.content.substring(0, 100)}${record.content.length > 100 ? "..." : ""}\n`;
      if (record.risks.length > 0) {
        exportData += `Sinais: ${record.risks.join(", ")}\n`;
      }
      exportData += "-".repeat(80) + "\n\n";
    });

    return exportData;
  } catch (error) {
    console.error("Erro ao exportar histórico:", error);
    return "";
  }
};

export const importHistory = (jsonData: string): boolean => {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) {
      throw new Error("Formato inválido");
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(imported));
    return true;
  } catch (error) {
    console.error("Erro ao importar histórico:", error);
    return false;
  }
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  
  return date.toLocaleDateString("pt-BR");
};

export const formatContent = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};
