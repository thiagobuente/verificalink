import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Terms() {
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

        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader className="bg-amber-50 dark:bg-amber-950">
            <CardTitle className="text-3xl">Termos de Uso</CardTitle>
            <CardDescription>Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Análise Indicativa</h2>
              <p className="text-gray-700 dark:text-gray-300">
                O sistema fornece apenas análise indicativa de risco. Nenhuma análise garante total segurança de um link, email ou mensagem.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Responsabilidade do Usuário</h2>
              <p className="text-gray-700 dark:text-gray-300">
                O usuário é responsável pela decisão final de acessar ou não um endereço. Use seu bom senso e sempre confirme com o contato direto antes de fazer transferências.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Limitações</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Este site não:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Garante 100% de precisão</li>
                <li>Substitui análise profissional de segurança</li>
                <li>Protege contra todos os tipos de golpes</li>
                <li>Oferece suporte técnico profissional</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Uso Permitido</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Este site é para fins educacionais e de proteção pessoal. É proibido usar para fins comerciais, de spam ou para contornar segurança de terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Isenção de Responsabilidade</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Não nos responsabilizamos por perdas financeiras ou danos resultantes do uso ou não uso deste site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Mudanças nos Termos</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Reservamos o direito de modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
