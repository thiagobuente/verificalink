import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
}

export function FAQAccordion({
  items,
  title = "Perguntas Frequentes",
  subtitle = "Tire suas dúvidas sobre análise de segurança",
}: FAQAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="faq-container w-full">
      {/* Header */}
      <div className="faq-header text-center mb-8">
        <h2 className="faq-title text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="faq-subtitle text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Accordion Items */}
      <div className="faq-items space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`faq-item border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
              expandedId === item.id
                ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                : "bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
            }`}
            style={{
              animation:
                expandedId === null
                  ? `slideIn 0.4s ease-out ${index * 0.05}s backwards`
                  : "none",
            }}
          >
            {/* Question Button */}
            <button
              onClick={() => toggleItem(item.id)}
              className="faq-question-button w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Question Number */}
                <span className="faq-number flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Question Text */}
                <span
                  className={`faq-question-text font-semibold transition-colors duration-200 ${
                    expandedId === item.id
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {item.question}
                </span>
              </div>

              {/* Chevron Icon */}
              <ChevronDown
                className={`faq-chevron flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
                  expandedId === item.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Answer Content */}
            {expandedId === item.id && (
              <div className="faq-answer border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-800 px-6 py-4">
                <div className="faq-answer-text text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.answer}
                </div>

                {/* Category Badge */}
                {item.category && (
                  <div className="faq-category mt-3 inline-block">
                    <span className="inline-block px-3 py-1 bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="faq-footer mt-8 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <strong>💡 Dica:</strong> Se sua dúvida não foi respondida, entre em
          contato através do formulário de suporte ou consulte a documentação
          completa.
        </p>
      </div>
    </div>
  );
}

/**
 * FAQ Items padrão para Shield Security Scanner
 */
export const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "O Shield Security Scanner garante 100% de segurança?",
    answer:
      "Não. Nenhuma ferramenta consegue garantir segurança absoluta. O Shield Security Scanner utiliza múltiplas fontes de inteligência de ameaças para detectar links suspeitos, mas novos golpes surgem constantemente e podem não ser detectados. Sempre verifique a origem de mensagens e links com pessoas conhecidas por chamada telefônica antes de clicar ou enviar dinheiro.",
    category: "Segurança",
  },
  {
    id: "faq-2",
    question: "Por que um link encurtado é considerado suspeito?",
    answer:
      "Porque ele oculta o destino real do usuário. Links encurtados (bit.ly, tinyurl, etc) são frequentemente usados em golpes para disfarçar URLs maliciosas. Você não consegue ver para onde o link realmente leva antes de clicar. Sempre expanda links encurtados ou verifique o destino antes de acessar.",
    category: "Análise de Links",
  },
  {
    id: "faq-3",
    question: "O que é typosquatting?",
    answer:
      "É a criação de domínios semelhantes a marcas conhecidas para enganar usuários. Por exemplo, 'amaz0n.com' em vez de 'amazon.com' (usando zero em vez de letra O). Esses domínios falsos são usados para phishing, roubo de credenciais e distribuição de malware. Sempre verifique cuidadosamente o domínio antes de fazer login ou inserir informações sensíveis.",
    category: "Técnicas de Golpe",
  },
  {
    id: "faq-4",
    question: "Posso confiar em um site com HTTPS?",
    answer:
      "Não necessariamente. HTTPS apenas protege a conexão entre você e o servidor - criptografa os dados em trânsito. Um site malicioso pode ter HTTPS válido. O certificado SSL apenas garante que você está conectado ao servidor correto, não que o site é legítimo. Sempre verifique a reputação do site e o domínio com cuidado.",
    category: "Segurança Web",
  },
  {
    id: "faq-5",
    question: "Como confirmar se uma mensagem é legítima?",
    answer:
      "Ligue para o número oficial da empresa ou da pessoa. Se receber uma mensagem suspeita de um banco, empresa ou amigo pedindo informações sensíveis ou dinheiro, não clique em links. Procure o número oficial no site oficial da empresa (não use número da mensagem) e ligue para confirmar. Empresas legítimas nunca pedem senhas, dados bancários ou códigos de autenticação por mensagem.",
    category: "Verificação",
  },
];
