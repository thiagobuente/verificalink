'use client';

import { useState } from 'react';
import { Copy, Check, Code, BookOpen, Zap } from 'lucide-react';

export default function ApiDocs() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const codeExamples = {
    curl: `curl -X POST https://shield-security.manus.space/api/trpc/publicApi.analyzeLink \\
  -H "Authorization: Bearer vl_sua_chave" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`,

    javascript: `const Shield Security Scanner = require('@shield-security/sdk');
const client = new Shield Security Scanner('vl_sua_chave');

const result = await client.analyzeLink('https://example.com');
console.log(result);`,

    python: `import requests

headers = {
    'Authorization': 'Bearer vl_sua_chave',
    'Content-Type': 'application/json'
}

data = {'url': 'https://example.com'}

response = requests.post(
    'https://shield-security.manus.space/api/trpc/publicApi.analyzeLink',
    json=data,
    headers=headers
)

print(response.json())`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Code className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">API Documentation</h1>
              <p className="text-slate-400">Integre o Shield Security Scanner em seus aplicativos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Quick Start */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">Quick Start</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Obter Chave */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">1. Obter Chave de API</h3>
              <ol className="space-y-3 text-sm text-slate-300">
                <li>1. Acesse seu <a href="/dashboard" className="text-cyan-400 hover:underline">Dashboard</a></li>
                <li>2. Vá para "Configurações" → "API Keys"</li>
                <li>3. Clique em "Gerar Nova Chave"</li>
                <li>4. Copie e armazene com segurança</li>
              </ol>
            </div>

            {/* Rate Limits */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Rate Limits</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Free:</span>
                  <span className="text-yellow-400">100 req/dia</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro:</span>
                  <span className="text-blue-400">10.000 req/dia</span>
                </div>
                <div className="flex justify-between">
                  <span>Enterprise:</span>
                  <span className="text-green-400">Ilimitado</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Exemplos de Código</h2>
          </div>

          <div className="space-y-6">
            {/* cURL */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700/50">
                <h3 className="font-semibold text-cyan-400">cURL</h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                >
                  {copied === 'curl' ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="px-6 py-4 overflow-x-auto text-sm text-slate-300 font-mono">
                <code>{codeExamples.curl}</code>
              </pre>
            </div>

            {/* JavaScript */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700/50">
                <h3 className="font-semibold text-yellow-400">JavaScript</h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.javascript, 'js')}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                >
                  {copied === 'js' ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="px-6 py-4 overflow-x-auto text-sm text-slate-300 font-mono">
                <code>{codeExamples.javascript}</code>
              </pre>
            </div>

            {/* Python */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700/50">
                <h3 className="font-semibold text-green-400">Python</h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.python, 'python')}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                >
                  {copied === 'python' ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="px-6 py-4 overflow-x-auto text-sm text-slate-300 font-mono">
                <code>{codeExamples.python}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Endpoints</h2>

          <div className="space-y-6">
            {/* Analyze Link */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/publicApi.analyzeLink</h3>
              </div>
              <p className="text-slate-400 mb-4">Analisar URL para phishing e malware</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-cyan-400 mb-2">Parâmetros:</div>
                <div>• url (string, obrigatório)</div>
                <div>• webhook_url (string, opcional)</div>
              </div>
            </div>

            {/* Analyze Email */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/publicApi.analyzeEmail</h3>
              </div>
              <p className="text-slate-400 mb-4">Verificar autenticidade de e-mail (SPF/DKIM/DMARC)</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-cyan-400 mb-2">Parâmetros:</div>
                <div>• email (string, obrigatório)</div>
                <div>• subject (string, opcional)</div>
                <div>• body (string, opcional)</div>
                <div>• webhook_url (string, opcional)</div>
              </div>
            </div>

            {/* Analyze IOC */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/publicApi.analyzeIOC</h3>
              </div>
              <p className="text-slate-400 mb-4">Analisar Indicator of Compromise (IP, Domain, URL, Email, Hash)</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-cyan-400 mb-2">Parâmetros:</div>
                <div>• ioc (string, obrigatório)</div>
                <div>• type (enum: ip | domain | url | email | hash, obrigatório)</div>
                <div>• webhook_url (string, opcional)</div>
              </div>
            </div>

            {/* Analyze Screenshot */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/publicApi.analyzeScreenshot</h3>
              </div>
              <p className="text-slate-400 mb-4">Analisar screenshot para phishing e engenharia social</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-cyan-400 mb-2">Parametros:</div>
                <div>• image_url (string, obrigatorio)</div>
                <div>• webhook_url (string, opcional)</div>
              </div>
            </div>

            {/* MITRE ATT&CK Mapping */}
            <div className="bg-slate-800/50 rounded-lg border border-purple-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/mitre.mapThreats</h3>
              </div>
              <p className="text-slate-400 mb-4">Mapear ameacas detectadas para tecnicas MITRE ATT&CK</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-purple-400 mb-2">Parametros:</div>
                <div>• threatTypes (array: phishing | malware | social-engineering | redirects | new-domain)</div>
              </div>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono mt-2">
                <div className="text-purple-400 mb-2">Resposta:</div>
                <div>• id (string): ID da tecnica (ex: T1566)</div>
                <div>• name (string): Nome da tecnica</div>
                <div>• tactic (string): Tatica MITRE</div>
                <div>• confidence (number): Confianca 0-100</div>
                <div>• url (string): Link para documentacao MITRE</div>
              </div>
            </div>

            {/* URL Sandbox */}
            <div className="bg-slate-800/50 rounded-lg border border-cyan-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/sandbox.getScreenshot</h3>
              </div>
              <p className="text-slate-400 mb-4">Capturar screenshot de URL em sandbox isolado (URLScan)</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-cyan-400 mb-2">Parametros:</div>
                <div>• url (string, obrigatorio): URL para capturar</div>
              </div>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono mt-2">
                <div className="text-cyan-400 mb-2">Resposta:</div>
                <div>• screenshotUrl (string): URL da imagem capturada</div>
                <div>• technologies (array): Tecnologias detectadas</div>
                <div>• verdicts (object): malware, phishing, suspicious</div>
                <div>• riskScore (number): Score de risco 0-100</div>
                <div>• hasRedirects (boolean): Presenca de redirecionamentos</div>
              </div>
            </div>

            {/* Domain Timeline */}
            <div className="bg-slate-800/50 rounded-lg border border-pink-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded bg-pink-500/20 text-pink-400 text-xs font-semibold">POST</span>
                <h3 className="text-lg font-semibold">/api/trpc/timeline.getDomainTimeline</h3>
              </div>
              <p className="text-slate-400 mb-4">Obter timeline de historico do dominio com eventos e recomendacoes</p>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono">
                <div className="text-pink-400 mb-2">Parametros:</div>
                <div>• domain (string, obrigatorio): Dominio para analisar</div>
              </div>
              <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-300 font-mono mt-2">
                <div className="text-pink-400 mb-2">Resposta:</div>
                <div>• age (number): Idade do dominio em dias</div>
                <div>• registrar (string): Nome do registrador</div>
                <div>• registrarCountry (string): Pais de origem</div>
                <div>• events (array): Eventos de timeline</div>
                <div>• riskScore (number): Score de risco 0-100</div>
                <div>• recommendations (array): Recomendacoes de seguranca</div>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4">Suporte</h2>
          <div className="space-y-2 text-slate-300">
            <p>📧 Email: <a href="mailto:api-support@shield-security.manus.space" className="text-cyan-400 hover:underline">api-support@shield-security.manus.space</a></p>
            <p>📚 Documentação: <a href="/docs/API.md" className="text-cyan-400 hover:underline">Guia Completo</a></p>
            <p>🔗 Status: <a href="https://status.shield-security.manus.space" className="text-cyan-400 hover:underline">status.shield-security.manus.space</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
