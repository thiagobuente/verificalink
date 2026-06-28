import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScoreFactor {
  label: string;
  points: number;
  type: "positive" | "negative" | "neutral";
  details?: string;
}

interface ScoreBreakdownProps {
  factors: ScoreFactor[];
  finalScore: number;
  classification: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  factors,
  finalScore,
  classification,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getPointColor = (points: number) => {
    if (points < 0) return "text-green-400";
    if (points > 0) return "text-red-400";
    return "text-slate-400";
  };

  const getPointSign = (points: number) => {
    if (points < 0) return "−";
    if (points > 0) return "+";
    return "";
  };

  return (
    <div
      className="border-2 border-purple-500/30 rounded-xl overflow-hidden backdrop-blur bg-slate-800/50"
      onClick={() => setExpanded(!expanded)}
    >
      <button className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
        <div className="text-left">
          <h3 className="text-lg font-bold text-purple-300 mb-1">
            Como o Score foi Calculado
          </h3>
          <p className="text-sm text-gray-400">
            Visualize os fatores que contribuíram para a pontuação
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-6 h-6 text-purple-400" />
        ) : (
          <ChevronDown className="w-6 h-6 text-purple-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-purple-500/20 p-6 space-y-3">
          {factors.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum fator detectado</p>
          ) : (
            <>
              {factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">
                      {factor.type === "positive" ? "✓" : "⚠"} {factor.label}
                    </p>
                    {factor.details && (
                      <p className="text-xs text-slate-400 mt-1">{factor.details}</p>
                    )}
                  </div>
                  <div className={`text-sm font-bold ml-4 ${getPointColor(factor.points)}`}>
                    {getPointSign(factor.points)}{Math.abs(factor.points)}
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-purple-500/30 my-4" />

              {/* Final Score */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-900/30 border border-purple-600/30">
                <div>
                  <p className="text-sm text-slate-300">Pontuação Final:</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Classificação: <span className="text-purple-300">{classification}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-300">{finalScore}</p>
                  <p className="text-xs text-slate-400">pontos</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
