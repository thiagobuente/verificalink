import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function AboutProject() {
  const section1 = useScrollAnimation();
  const section2 = useScrollAnimation();
  const section3 = useScrollAnimation();
  const section4 = useScrollAnimation();
  const section5 = useScrollAnimation();
  const section6 = useScrollAnimation();
  const section7 = useScrollAnimation();

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div style={{ width: 'min(100%, 920px)', marginLeft: 'auto', marginRight: 'auto', padding: '48px 24px' }} className="md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold">
            <span className="text-cyan-400">🛡️ Sobre o</span>
            <br />
            <span className="text-green-400">Shield Security Scanner</span>
          </h1>
          <p className="text-xl text-gray-300">Proteção contra golpes digitais com transparência total</p>
        </div>

        {/* 1. Sobre o Shield Security Scanner */}
        <div
          ref={section1.ref}
          className={`scroll-animate ${section1.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-cyan-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/15`}
        >
          <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">🛡️ Sobre o Shield Security Scanner</h2>
          <div style={{ maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', lineHeight: '1.7' }} className="text-gray-300">
            <p className="mb-3">
              O Shield Security Scanner é uma plataforma brasileira criada para auxiliar usuários na identificação de golpes digitais, phishing, engenharia social e outros indicadores de fraude online.
            </p>
            <p>
              Nosso objetivo é oferecer análises claras e acessíveis para ajudar pessoas e empresas a tomarem decisões mais seguras antes de clicar em links, abrir arquivos ou compartilhar informações.
            </p>
          </div>
        </div>

        {/* 2. Nossa Missão */}
        <div
          ref={section2.ref}
          className={`scroll-animate ${section2.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-cyan-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/15`}
        >
          <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">🛡️ Nossa Missão</h2>
          <div style={{ maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', lineHeight: '1.7' }} className="text-gray-300">
            <p className="mb-3">
              Acreditamos que informação é a principal ferramenta de defesa contra golpes digitais.
            </p>
            <p>
              Por isso, buscamos transformar conhecimento técnico em análises simples, compreensíveis e acessíveis para todos.
            </p>
          </div>
        </div>

        {/* 3. Privacidade e Transparência */}
        <div
          ref={section3.ref}
          className={`scroll-animate ${section3.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-purple-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/15`}
        >
          <h2 className="mb-4 text-center text-2xl font-bold text-purple-400">🔒 Privacidade e Transparência</h2>
          
          <div style={{ maxWidth: '520px', margin: '20px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className="w-full text-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-300">❌ Não coletamos senhas</div>
            <div className="w-full text-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-300">❌ Não coletamos tokens</div>
            <div className="w-full text-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-300">❌ Não coletamos dados bancários</div>
            <div className="w-full text-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-300">❌ Não coletamos chaves PIX</div>
            <div className="w-full text-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-300">❌ Não coletamos documentos pessoais</div>
            <div className="w-full text-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-300">❌ Não armazenamos histórico</div>
          </div>
          
          <p className="text-center text-sm italic text-purple-300">
            💡 Sempre que possível, as análises são executadas localmente no navegador do usuário.
          </p>
        </div>

        {/* 4. Como Funciona */}
        <div
          ref={section4.ref}
          className={`scroll-animate ${section4.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-green-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/15`}
        >
          <h2 className="mb-6 text-center text-2xl font-bold text-green-400">⚙️ Como Funciona</h2>
          
          <div style={{ maxWidth: '900px', margin: '30px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(10,15,40,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,211,238,0.18)', textAlign: 'center', transition: 'all 0.3s ease' }} className="hover:border-cyan-400/45 hover:shadow-lg hover:shadow-cyan-500/18 hover:-translate-y-1">
              <p className="mb-2 text-lg font-semibold text-cyan-300">🔍 Análise Técnica</p>
              <p className="text-sm text-gray-300 m-0">Detecção de phishing, typosquatting e domínios suspeitos.</p>
            </div>
            
            <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(10,15,40,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,211,238,0.18)', textAlign: 'center', transition: 'all 0.3s ease' }} className="hover:border-cyan-400/45 hover:shadow-lg hover:shadow-cyan-500/18 hover:-translate-y-1">
              <p className="mb-2 text-lg font-semibold text-cyan-300">📧 Email Security</p>
              <p className="text-sm text-gray-300 m-0">Validação SPF, DKIM, DMARC e indicadores de engenharia social.</p>
            </div>
            
            <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(10,15,40,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,211,238,0.18)', textAlign: 'center', transition: 'all 0.3s ease' }} className="hover:border-cyan-400/45 hover:shadow-lg hover:shadow-cyan-500/18 hover:-translate-y-1">
              <p className="mb-2 text-lg font-semibold text-cyan-300">📸 Screenshot Analyzer</p>
              <p className="text-sm text-gray-300 m-0">OCR inteligente para identificar URLs, QR Codes e sinais de fraude.</p>
            </div>
            
            <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(10,15,40,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,211,238,0.18)', textAlign: 'center', transition: 'all 0.3s ease' }} className="hover:border-cyan-400/45 hover:shadow-lg hover:shadow-cyan-500/18 hover:-translate-y-1">
              <p className="mb-2 text-lg font-semibold text-cyan-300">📊 Score Transparente</p>
              <p className="text-sm text-gray-300 m-0">Explicação clara dos fatores encontrados durante a análise.</p>
            </div>
            
            <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(10,15,40,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,211,238,0.18)', textAlign: 'center', transition: 'all 0.3s ease', gridColumn: 'span 1' }} className="md:col-span-2 hover:border-cyan-400/45 hover:shadow-lg hover:shadow-cyan-500/18 hover:-translate-y-1">
              <p className="mb-2 text-lg font-semibold text-cyan-300">⚡ Resultado Instantâneo</p>
              <p className="text-sm text-gray-300 m-0">Processamento rápido para auxiliar na tomada de decisão antes do clique.</p>
            </div>
          </div>
        </div>

        {/* 5. CYBERDIMENSION */}
        <div
          ref={section5.ref}
          className={`scroll-animate ${section5.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-blue-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/15`}
        >
          <h2 className="mb-4 text-center text-2xl font-bold text-blue-400">🤝 CYBERDIMENSION</h2>
          <div style={{ maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', lineHeight: '1.7' }} className="text-gray-300 mb-6">
            <p className="mb-3">
              A CYBERDIMENSION é uma comunidade dedicada ao compartilhamento de conhecimento, desenvolvimento profissional e conscientização em segurança digital.
            </p>
            <p>
              A iniciativa apoia estudantes, profissionais em transição de carreira e entusiastas da área de tecnologia e cibersegurança.
            </p>
          </div>
          
          {/* Social Links */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
            <a
              href="https://www.cyberdimension.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22d3ee', fontWeight: '600', textDecoration: 'none', padding: '10px 18px', borderRadius: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', transition: 'all 0.3s ease' }}
              className="hover:text-white hover:bg-cyan-500/18 hover:border-cyan-400/55 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              🌐 Site
            </a>
            <a
              href="https://chat.whatsapp.com/Dr13epp6K711j7NyYxSoZq"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22d3ee', fontWeight: '600', textDecoration: 'none', padding: '10px 18px', borderRadius: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', transition: 'all 0.3s ease' }}
              className="hover:text-white hover:bg-cyan-500/18 hover:border-cyan-400/55 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              💬 WhatsApp
            </a>
            <a
              href="https://www.youtube.com/@CYBERDIMENSIONÇ_Ç"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22d3ee', fontWeight: '600', textDecoration: 'none', padding: '10px 18px', borderRadius: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', transition: 'all 0.3s ease' }}
              className="hover:text-white hover:bg-cyan-500/18 hover:border-cyan-400/55 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              📺 YouTube
            </a>
            <a
              href="https://www.linkedin.com/company/cyberdimension"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22d3ee', fontWeight: '600', textDecoration: 'none', padding: '10px 18px', borderRadius: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', transition: 'all 0.3s ease' }}
              className="hover:text-white hover:bg-cyan-500/18 hover:border-cyan-400/55 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              💼 LinkedIn
            </a>
          </div>
        </div>

        {/* 6. Desenvolvedor */}
        <div
          ref={section6.ref}
          className={`scroll-animate ${section6.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-orange-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/15`}
        >
          <h2 className="mb-4 text-center text-2xl font-bold text-orange-400">👨‍💻 Desenvolvedor</h2>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', lineHeight: '1.7' }} className="text-gray-300">
            <p className="mb-3">
              <span className="font-semibold text-orange-300">Thiago Buente</span> é profissional da área de tecnologia, cibersegurança e segurança da informação, com atuação em projetos voltados à prevenção de golpes digitais, conscientização em segurança e análise de ameaças.
            </p>
            <p>
              Criou o Shield Security Scanner com o propósito de tornar ferramentas de análise de segurança mais acessíveis e contribuir para a educação digital de usuários, profissionais e empresas.
            </p>
          </div>
        </div>

        {/* 7. Fontes Oficiais Consultadas */}
        <div
          ref={section7.ref}
          className={`scroll-animate ${section7.isVisible ? 'visible' : ''} w-full max-w-3xl mx-auto rounded-2xl border border-indigo-500/20 bg-slate-800/50 p-7 backdrop-blur transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/15`}
        >
          <h2 className="mb-4 text-center text-2xl font-bold text-indigo-400">📚 Fontes Oficiais Consultadas</h2>
          
          <div style={{ maxWidth: '520px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }} className="md:grid-cols-2 grid-cols-1">
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> VirusTotal
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> Google Safe Browsing
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> AlienVault OTX
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> URLScan
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> Cisco Talos
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> WHOIS API
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> MaxMind
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> Censys
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> Shodan
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> MXToolbox
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> AbuseIPDB
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> URLhaus
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> Project Honey Pot
            </div>
            <div className="text-center text-sm text-gray-300">
              <span className="text-indigo-400">✓</span> Hybrid Analysis
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
