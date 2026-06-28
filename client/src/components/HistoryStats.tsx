import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: "link" | "message" | "qrcode" | "pdf";
  content: string;
  score: number;
  isScam: boolean;
  nivelRisco: string;
  risks: any[];
  detalhes?: any;
  timestamp?: number;
}

interface HistoryStatsProps {
  history: HistoryItem[];
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ history }) => {
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        totalAnalyzed: 0,
        scamsDetected: 0,
        safeItems: 0,
        averageScore: 0,
        riskDistribution: [],
        typeDistribution: [],
        patternFrequency: [],
        scoreTimeline: [],
      };
    }

    const totalAnalyzed = history.length;
    const scamsDetected = history.filter(h => h.isScam).length;
    const safeItems = history.filter(h => !h.isScam).length;
    const averageScore = Math.round(history.reduce((sum, h) => sum + h.score, 0) / totalAnalyzed);

    // Distribuição de risco
    const riskCounts = {
      Crítico: 0,
      Alto: 0,
      Médio: 0,
      Baixo: 0,
    };
    history.forEach(h => {
      const nivel = h.nivelRisco || 'Desconhecido';
      if (riskCounts[nivel as keyof typeof riskCounts] !== undefined) {
        riskCounts[nivel as keyof typeof riskCounts]++;
      }
    });

    const riskDistribution = Object.entries(riskCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: name === 'Crítico' ? '#dc2626' : name === 'Alto' ? '#f97316' : name === 'Médio' ? '#eab308' : '#22c55e',
      }));

    // Distribuição por tipo
    const typeCounts = {
      link: 0,
      message: 0,
      qrcode: 0,
      pdf: 0,
    };
    history.forEach(h => {
      typeCounts[h.type]++;
    });

    const typeDistribution = Object.entries(typeCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name: name === 'link' ? 'Links' : name === 'message' ? 'Mensagens' : name === 'qrcode' ? 'QR Codes' : 'PDFs',
        value,
      }));

    // Padrões mais frequentes
    const patternMap = new Map<string, number>();
    history.forEach(h => {
      if (h.risks && Array.isArray(h.risks)) {
        h.risks.forEach((risk: any) => {
          const key = risk.name || risk;
          patternMap.set(key, (patternMap.get(key) || 0) + 1);
        });
      }
    });

    const patternFrequency = Array.from(patternMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Timeline de scores (últimas 10 análises)
    const scoreTimeline = history
      .slice(-10)
      .map((h, idx) => ({
        index: idx + 1,
        score: h.score,
        tipo: h.type === 'link' ? 'Link' : h.type === 'message' ? 'Msg' : h.type === 'qrcode' ? 'QR' : 'PDF',
      }));

    return {
      totalAnalyzed,
      scamsDetected,
      safeItems,
      averageScore,
      riskDistribution,
      typeDistribution,
      patternFrequency,
      scoreTimeline,
    };
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-300">
        <CardContent className="pt-6 text-center text-blue-700 dark:text-blue-300">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma análise realizada ainda. Comece a analisar links e mensagens para ver as estatísticas!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">TOTAL</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalAnalyzed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Análises</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20">
          <CardContent className="pt-4">
            <div className="text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-600 dark:text-red-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">GOLPES</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.scamsDetected}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20">
          <CardContent className="pt-4">
            <div className="text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">SEGURO</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.safeItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/20">
          <CardContent className="pt-4">
            <div className="text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">SCORE MÉD</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.averageScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Risco */}
        {stats.riskDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Risco</CardTitle>
              <CardDescription>Análises por nível de risco</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribuição por Tipo */}
        {stats.typeDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análises por Tipo</CardTitle>
              <CardDescription>Links, Mensagens, QR Codes e PDFs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Timeline de Scores */}
        {stats.scoreTimeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline de Scores</CardTitle>
              <CardDescription>Últimas 10 análises</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.scoreTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#ef4444"
                    dot={{ fill: '#ef4444' }}
                    name="Score de Risco (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Padrões Mais Frequentes */}
        {stats.patternFrequency.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Padrões Mais Frequentes</CardTitle>
              <CardDescription>Top 8 sinais de golpe detectados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={stats.patternFrequency}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={190} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300">
        <CardHeader>
          <CardTitle className="text-lg">📊 Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Taxa de Golpes:</strong> {stats.totalAnalyzed > 0 ? Math.round((stats.scamsDetected / stats.totalAnalyzed) * 100) : 0}% das análises foram identificadas como golpes.
          </p>
          {stats.patternFrequency.length > 0 && (
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Padrão Mais Comum:</strong> {stats.patternFrequency[0].name} foi detectado {stats.patternFrequency[0].count} vezes.
            </p>
          )}
          {stats.riskDistribution.length > 0 && (
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Nível Predominante:</strong> Maioria das análises classificadas como {stats.riskDistribution[0].name}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
