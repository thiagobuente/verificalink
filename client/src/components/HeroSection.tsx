import { Shield, Lock, Radar } from "lucide-react";

interface HeroSectionProps {
  onAnalyzeClick: () => void;
}

export function HeroSection({ onAnalyzeClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Animated Background Elements with Parallax */}
      <div className="absolute inset-0 opacity-30 parallax-container">
        <div className="parallax-orb parallax-orb-1 absolute top-20 left-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="parallax-orb parallax-orb-2 absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title - Simplificado */}
          <h1 className="hero-title text-5xl md:text-6xl font-orbitron font-bold mb-4 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400">
              Shield Security Scanner
            </span>
          </h1>

          {/* Description - Persuasiva */}
          <p className="text-lg md:text-xl text-cyan-300 font-rajdhani mb-8 tracking-wide text-center leading-relaxed">
            Analise links, e-mails, QR Codes, PDFs e capturas de tela utilizando múltiplas fontes de Threat Intelligence.
          </p>




        </div>
      </div>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
    </section>
  );
}
