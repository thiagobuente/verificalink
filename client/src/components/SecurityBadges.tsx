import { Shield, CheckCircle, AlertCircle, Lock, Zap } from 'lucide-react';

interface SecurityBadgesProps {
  showVirusTotal?: boolean;
  showURLhaus?: boolean;
  showAbuseIPDB?: boolean;
  showGoogleSafeBrowsing?: boolean;
  showManusSecurity?: boolean;
}

export function SecurityBadges({
  showVirusTotal = true,
  showURLhaus = true,
  showAbuseIPDB = true,
  showGoogleSafeBrowsing = true,
  showManusSecurity = true,
}: SecurityBadgesProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center items-center py-6">
      {/* VirusTotal Badge */}
      {showVirusTotal && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/60 transition">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-rajdhani text-cyan-300">Verificado VirusTotal</span>
        </div>
      )}

      {/* URLhaus Badge */}
      {showURLhaus && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 transition">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-rajdhani text-orange-300">URLhaus Verificado</span>
        </div>
      )}

      {/* AbuseIPDB Badge */}
      {showAbuseIPDB && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-500/10 border border-red-500/30 hover:border-red-500/60 transition">
          <Zap className="w-4 h-4 text-red-400" />
          <span className="text-xs font-rajdhani text-red-300">IP Verificado</span>
        </div>
      )}

      {/* Google Safe Browsing Badge */}
      {showGoogleSafeBrowsing && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 border border-green-500/30 hover:border-green-500/60 transition">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs font-rajdhani text-green-300">Google Safe Browsing</span>
        </div>
      )}

      {/* Manus Security Badge */}
      {showManusSecurity && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/60 transition">
          <Lock className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-rajdhani text-purple-300">Manus Security</span>
        </div>
      )}

      {/* Trust Badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-500/30 hover:border-cyan-500/60 transition">
        <Shield className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-rajdhani text-cyan-300 font-semibold">Proteção Multicamadas</span>
      </div>
    </div>
  );
}
