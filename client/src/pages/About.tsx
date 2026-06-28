import { Zap, Brain, Shield, Code2, Users, Award, ArrowRight, CheckCircle2 } from "lucide-react";

export function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-300 to-cyan-400 bg-clip-text text-transparent">
              Sobre Shield Security Scanner
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Tecnologia profissional de análise de segurança combinando heurística avançada com inteligência em tempo real
          </p>
        </div>

        {/* Missão */}
        <section className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Nossa Missão</h2>
              <p className="text-gray-300 leading-relaxed">
                Proteger famílias brasileiras contra golpes digitais, phishing e malware através de uma ferramenta 
                <strong> gratuita, local e transparente</strong>. Acreditamos que segurança digital não deve ser privilégio 
                de poucos, mas direito de todos.
              </p>
            </div>
          </div>
        </section>

        {/* Tecnologia - Duas Colunas */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Análise Heurística */}
          <section className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Brain className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Análise Heurística</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  Sistema inteligente que analisa características técnicas de URLs, mensagens e arquivos para identificar padrões suspeitos.
                </p>
                <div className="space-y-2">
                  <h4 className="text-white font-semibold text-sm">Fatores Analisados:</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Estrutura de domínio (typosquatting, subdomínios)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Comprimento e complexidade da URL</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Presença de HTTPS e certificados válidos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Encurtadores de URL e redirecionamentos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Idade do domínio e histórico</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Padrões de linguagem suspeita</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Google Safe Browsing */}
          <section className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Code2 className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Google Safe Browsing</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  Integração com banco de dados em tempo real do Google para detecção de ameaças confirmadas.
                </p>
                <div className="space-y-2">
                  <h4 className="text-white font-semibold text-sm">Detecta:</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>Malware e software malicioso</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>Phishing e engenharia social</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>Software indesejado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>URLs maliciosas conhecidas</span>
                    </li>
                  </ul>
                  <p className="text-gray-400 text-xs mt-3">
                    Usado por 4+ bilhões de dispositivos globalmente
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Como Funciona */}
        <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Como Funciona</h2>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Você cola um link</h3>
                <p className="text-gray-300 text-sm">
                  Cole a URL, mensagem ou arquivo que deseja verificar. Tudo permanece no seu dispositivo.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-500 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Análise Heurística Local</h3>
                <p className="text-gray-300 text-sm">
                  Nosso motor analisa características técnicas em tempo real, sem enviar dados para servidores.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-500 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Verificação Google Safe Browsing</h3>
                <p className="text-gray-300 text-sm">
                  Consultamos banco de dados do Google para detectar ameaças conhecidas (malware, phishing, etc).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-cyan-500 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Resultado Detalhado</h3>
                <p className="text-gray-300 text-sm">
                  Você recebe score (0-100), motivos categorizados (✔/⚠/❌) e recomendações claras.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Aviso Legal */}
        <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-2xl flex-shrink-0">⚠️</div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">Aviso Legal Importante</h2>
              <p className="text-gray-300 leading-relaxed">
                Esta análise é baseada em <strong>heurísticas</strong> e <strong>inteligência automatizada</strong>. Não é uma garantia absoluta. 
                Sempre verifique a origem de mensagens e links com pessoas conhecidas por chamada telefônica antes de clicar ou enviar dinheiro.
              </p>
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Por Que Somos Diferentes</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">100% Local</h3>
                <p className="text-gray-300 text-sm">Análise no seu navegador, sem envio de dados</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">Gratuito</h3>
                <p className="text-gray-300 text-sm">Sem planos premium ou publicidade</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">Transparente</h3>
                <p className="text-gray-300 text-sm">Explica cada motivo de risco detectado</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">Offline</h3>
                <p className="text-gray-300 text-sm">Funciona sem internet após carregamento</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">Profissional</h3>
                <p className="text-gray-300 text-sm">Integração com Google Safe Browsing</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">Responsável</h3>
                <p className="text-gray-300 text-sm">Não promete 100% de precisão</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stack Técnico */}
        <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Stack Técnico</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-cyan-400 font-semibold mb-3">Frontend</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• React 19</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS 4</li>
                <li>• Vite</li>
              </ul>
            </div>

            <div>
              <h3 className="text-cyan-400 font-semibold mb-3">Backend</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Express.js</li>
                <li>• tRPC</li>
                <li>• Node.js</li>
                <li>• TypeScript</li>
              </ul>
            </div>

            <div>
              <h3 className="text-cyan-400 font-semibold mb-3">Integrações</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Google Safe Browsing API</li>
                <li>• HTTPS Validation</li>
                <li>• URL Parsing</li>
                <li>• Pattern Recognition</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Equipe */}
        <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <Users className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Desenvolvido com ❤️</h2>
              <p className="text-gray-300 leading-relaxed">
                Shield Security Scanner é um projeto voluntário desenvolvido por especialistas em cibersegurança com objetivo 
                de proteger famílias brasileiras. Não somos financiados por publicidade ou venda de dados.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Pronto para proteger sua família?</h2>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-3 rounded-lg transition-all"
          >
            Começar Análise <ArrowRight className="w-5 h-5" />
          </a>
        </section>
      </div>
    </div>
  );
}
