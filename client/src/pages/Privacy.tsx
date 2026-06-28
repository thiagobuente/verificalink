import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          ← Voltar
        </Button>

        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-950">
            <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
            <CardDescription>Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Objetivo</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Este site foi desenvolvido com objetivo educativo para ajudar usuários a identificar possíveis golpes digitais. Não somos afiliados ao WhatsApp, Meta, bancos ou instituições financeiras.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Dados Coletados</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Não solicitamos:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Senhas</li>
                <li>Dados bancários</li>
                <li>Códigos de autenticação</li>
                <li>Informações pessoais identificáveis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Análise de Links</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Os links analisados podem ser utilizados anonimamente para melhorar a detecção de ameaças. Nenhuma informação pessoal é armazenada ou comercializada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Análise Local</h2>
              <p className="text-gray-700 dark:text-gray-300">
                A maioria das análises acontece no seu navegador (análise local). Seus dados não saem do seu computador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Cookies</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Usamos apenas cookies essenciais para funcionalidade do site (tema escuro/claro, histórico local).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Contato</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Para dúvidas sobre privacidade, entre em contato através do formulário no site.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
