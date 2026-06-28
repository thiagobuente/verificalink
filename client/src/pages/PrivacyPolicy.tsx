import { Shield, Lock, Eye, Server, Database, CheckCircle2 } from "lucide-react";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-300 to-cyan-400 bg-clip-text text-transparent">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Transparência total sobre como protegemos seus dados
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Análise Local Section */}
          <section className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Server className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  ✓ Análise 100% Local
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Toda análise de links, mensagens e arquivos é realizada <strong>diretamente no seu navegador</strong>. 
                  Nenhum dado é enviado para servidores externos para processamento.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Processamento acontece no seu dispositivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Funciona offline (após carregamento inicial)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Nenhum histórico enviado a servidores</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Zero Data Collection */}
          <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Database className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  ✓ Zero Coleta de Dados
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong>Não coletamos, armazenamos ou compartilhamos nenhuma informação pessoal.</strong>
                </p>
                <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                  <h3 className="text-white font-semibold mb-3">Não coletamos:</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>✗ URLs analisadas</li>
                    <li>✗ Mensagens verificadas</li>
                    <li>✗ Dados pessoais ou identificadores</li>
                    <li>✗ Histórico de navegação</li>
                    <li>✗ Informações de localização</li>
                    <li>✗ Cookies de rastreamento</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Google Safe Browsing */}
          <section className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Eye className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  ℹ Google Safe Browsing API
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Para análise profissional, utilizamos a <strong>Google Safe Browsing API</strong> que:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <span>Verifica URLs contra banco de dados de malware conhecido</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <span>Segue política de privacidade do Google</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <span>Não armazena histórico de consultas</span>
                  </li>
                </ul>
                <p className="text-gray-400 text-sm mt-4">
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    Saiba mais sobre a política de privacidade do Google →
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              Usamos apenas <strong>cookies essenciais</strong> para:
            </p>
            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• Manter sua sessão de login (se aplicável)</li>
              <li>• Armazenar preferências de tema (claro/escuro)</li>
              <li>• Histórico local de análises (armazenado apenas no seu dispositivo)</li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Não usamos</strong> cookies de rastreamento, publicidade ou análise.
            </p>
          </section>

          {/* Direitos do Usuário */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Seus Direitos</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Como não coletamos dados pessoais, você tem garantido:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Direito ao anonimato completo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Nenhum rastreamento de atividades</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Controle total sobre dados locais</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Liberdade para limpar histórico local a qualquer momento</span>
              </li>
            </ul>
          </section>

          {/* Segurança */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔒 Segurança</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>Conexão HTTPS criptografada</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>Código-fonte aberto para auditoria</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>Sem dependências de rastreamento</span>
              </li>
            </ul>
          </section>

          {/* Contato */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Dúvidas?</h2>
            <p className="text-gray-300 leading-relaxed">
              Se tiver dúvidas sobre esta política de privacidade ou sobre como protegemos seus dados, 
              entre em contato através do email ou GitHub.
            </p>
            <div className="mt-4 flex gap-4">
              <a href="mailto:contato@shield-security.com" className="text-blue-400 hover:text-blue-300">
                Email →
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                GitHub →
              </a>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-gray-700">
            <p>Última atualização: Maio de 2026</p>
            <p className="mt-2">Shield Security Scanner - Proteção Local, Privacidade Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
