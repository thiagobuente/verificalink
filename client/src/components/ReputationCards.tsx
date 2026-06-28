import { ExternalLink, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

interface VirusTotalData {
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount: number;
  totalEngines: number;
  reputation: number;
  reportUrl: string;
}

interface AbuseIPDBData {
  abuseScore: number;
  totalReports: number;
  country: string;
  isp: string;
}

interface URLhausData {
  isInDatabase: boolean;
  threat: string | null;
  tags: string[];
}

interface HeuristicsData {
  isShortURL: boolean;
  suspiciousTLD: boolean;
  excessiveSubdomains: number;
  typosquatting: boolean;
  manyNumbers: boolean;
  suspiciousCharacters: boolean;
  hasHTTPS: boolean;
}

interface ReputationCardsProps {
  virusTotal?: VirusTotalData | null;
  abuseIPDB?: AbuseIPDBData | null;
  urlhaus?: URLhausData | null;
  heuristics?: HeuristicsData | null;
}

export function ReputationCards({
  virusTotal,
  abuseIPDB,
  urlhaus,
  heuristics,
}: ReputationCardsProps) {
  return (
    <div className="w-full">
      <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">Análise Detalhada por Fonte</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VirusTotal Card */}
        {virusTotal && (
          <div className="p-6 rounded-lg border border-orange-500/30 bg-orange-500/5 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-lg">🦠</span>
                </div>
                <div>
                  <p className="font-rajdhani font-bold text-orange-300">VirusTotal</p>
                  <p className="text-xs text-gray-400">90+ Antivírus</p>
                </div>
              </div>
              <a
                href={virusTotal.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-orange-500/20 rounded transition"
                title="Abrir relatório completo"
              >
                <ExternalLink className="w-4 h-4 text-orange-400" />
              </a>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Detecções Maliciosas</span>
                <span className={`font-rajdhani font-bold ${
                  virusTotal.maliciousCount > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {virusTotal.maliciousCount}/{virusTotal.totalEngines}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Suspeitas</span>
                <span className={`font-rajdhani font-bold ${
                  virusTotal.suspiciousCount > 0 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {virusTotal.suspiciousCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Limpas</span>
                <span className="font-rajdhani font-bold text-green-400">
                  {virusTotal.harmlessCount}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Reputação</span>
                  <span className={`font-rajdhani font-bold ${
                    virusTotal.reputation < 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {virusTotal.reputation > 0 ? '+' : ''}{virusTotal.reputation}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AbuseIPDB Card */}
        {abuseIPDB && (
          <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/5 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="text-lg">🚨</span>
              </div>
              <div>
                <p className="font-rajdhani font-bold text-red-300">AbuseIPDB</p>
                <p className="text-xs text-gray-400">Reputação de IP</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Abuse Score</span>
                <span className={`font-rajdhani font-bold text-lg ${
                  abuseIPDB.abuseScore >= 75 ? 'text-red-400' :
                  abuseIPDB.abuseScore >= 50 ? 'text-orange-400' :
                  abuseIPDB.abuseScore >= 25 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {abuseIPDB.abuseScore}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Reports</span>
                <span className={`font-rajdhani font-bold ${
                  abuseIPDB.totalReports > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {abuseIPDB.totalReports}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">País</span>
                  <span className="text-sm text-gray-300">{abuseIPDB.country}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">ISP</span>
                  <span className="text-sm text-gray-300 truncate">{abuseIPDB.isp}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URLhaus Card */}
        {urlhaus && (
          <div className="p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-lg">🚫</span>
              </div>
              <div>
                <p className="font-rajdhani font-bold text-yellow-300">URLhaus</p>
                <p className="text-xs text-gray-400">Banco de Malware</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`font-rajdhani font-bold ${
                  urlhaus.isInDatabase ? 'text-red-400' : 'text-green-400'
                }`}>
                  {urlhaus.isInDatabase ? 'Detectada' : 'Limpa'}
                </span>
              </div>

              {urlhaus.isInDatabase && urlhaus.threat && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Tipo de Ameaça</span>
                    <span className="text-sm text-red-400 font-rajdhani font-bold">
                      {urlhaus.threat.toUpperCase()}
                    </span>
                  </div>

                  {urlhaus.tags && urlhaus.tags.length > 0 && (
                    <div className="pt-2 border-t border-gray-500/20">
                      <p className="text-xs text-gray-400 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {urlhaus.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!urlhaus.isInDatabase && (
                <div className="pt-2 border-t border-gray-500/20">
                  <p className="text-xs text-green-400">✓ URL não encontrada em banco de dados</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Heurísticas Card */}
        {heuristics && (
          <div className="p-6 rounded-lg border border-green-500/30 bg-green-500/5 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-lg">🔍</span>
              </div>
              <div>
                <p className="font-rajdhani font-bold text-green-300">Heurísticas Locais</p>
                <p className="text-xs text-gray-400">Análise de Padrões</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {heuristics.isShortURL && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>URL Encurtada</span>
                </div>
              )}

              {heuristics.suspiciousTLD && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>TLD Suspeito</span>
                </div>
              )}

              {heuristics.excessiveSubdomains > 2 && (
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{heuristics.excessiveSubdomains} Subdomínios</span>
                </div>
              )}

              {heuristics.typosquatting && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Typosquatting Detectado</span>
                </div>
              )}

              {heuristics.manyNumbers && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Muitos Números</span>
                </div>
              )}

              {heuristics.suspiciousCharacters && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Caracteres Suspeitos</span>
                </div>
              )}

              {heuristics.hasHTTPS && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>HTTPS Válido</span>
                </div>
              )}

              {!heuristics.isShortURL &&
                !heuristics.suspiciousTLD &&
                heuristics.excessiveSubdomains <= 2 &&
                !heuristics.typosquatting &&
                !heuristics.manyNumbers &&
                !heuristics.suspiciousCharacters && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nenhum padrão suspeito detectado</span>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
