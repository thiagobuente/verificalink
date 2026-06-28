import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Shield, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScamStep {
  step: number;
  title: string;
  description: string;
  whatHappens: string;
  redFlags: string[];
  defense: string;
  image?: string;
}

interface ScamSimulationProps {
  scamType?: 'phishing' | 'whatsapp' | 'fake-support' | 'fake-bank';
}

const SCAM_SCENARIOS: Record<string, ScamStep[]> = {
  phishing: [
    {
      step: 1,
      title: '📧 Você recebe um email "do seu banco"',
      description: 'Um email chega na sua caixa de entrada com o logo do seu banco, dizendo que sua conta foi bloqueada.',
      whatHappens: 'O email parece muito profissional e legítimo. Tem o logo, cores e fontes corretas do banco.',
      redFlags: [
        'Email vem de um endereço estranho (tipo: "banco-seguranca@gmail.com")',
        'Diz "Clique AGORA" ou "Sua conta será bloqueada"',
        'Pede para confirmar dados pessoais',
      ],
      defense: 'Nunca clique em links de emails não solicitados. Abra o navegador e acesse o site do banco diretamente.',
    },
    {
      step: 2,
      title: '🔗 Você clica no link "Verificar Conta"',
      description: 'O email tem um botão azul grande escrito "Verificar Conta Agora". Você clica.',
      whatHappens: 'Você é levado para um site que parece 100% igual ao site do seu banco. Tem o mesmo design, cores e layout.',
      redFlags: [
        'A URL da página é estranho (tipo: "banco-seguro.com.br.verificacao.tk")',
        'O site não tem cadeado de segurança (HTTPS)',
        'Alguns elementos estão um pouco fora do lugar',
      ],
      defense: 'Verifique a URL na barra de endereço. O site real do banco tem um domínio específico. Qualquer variação é suspeita.',
    },
    {
      step: 3,
      title: '📝 Você digita seu CPF e Senha',
      description: 'O site pede seu CPF, data de nascimento e senha. Você pensa que é necessário para desbloquear a conta.',
      whatHappens: 'Você digita suas informações e clica em "Entrar".',
      redFlags: [
        'Bancos NUNCA pedem senha por email',
        'Bancos NUNCA pedem CPF em popups',
        'A página diz "Carregando..." mas nada acontece',
      ],
      defense: 'Bancos legítimos NUNCA pedem senha, CPF ou dados bancários por email. Isso é sempre uma armadilha.',
    },
    {
      step: 4,
      title: '💰 Seus dados são roubados',
      description: 'Você vê uma mensagem de erro. Mas na verdade, seus dados foram enviados para os criminosos.',
      whatHappens: 'Os criminosos agora têm seu CPF e senha. Eles podem acessar sua conta, transferir dinheiro e fazer compras.',
      redFlags: [
        'Você recebe uma mensagem de erro',
        'Nada acontece quando você clica em "Entrar"',
        'Seu banco liga avisando sobre transações estranhas',
      ],
      defense: 'Se isso acontecer, ligue IMEDIATAMENTE para o banco (número oficial) e avise sobre o roubo de dados.',
    },
  ],
  whatsapp: [
    {
      step: 1,
      title: '💬 Você recebe uma mensagem no WhatsApp',
      description: 'Uma pessoa desconhecida envia: "Oi! Você é o João? Meu filho pediu sua ajuda com um problema urgente!"',
      whatHappens: 'A mensagem parece vir de alguém que conhece você. Pode ser um amigo ou parente.',
      redFlags: [
        'Você não reconhece o número',
        'A mensagem é vaga e genérica',
        'Pede para você não contar para ninguém',
      ],
      defense: 'Sempre verifique o número. Se não reconhecer, ignore ou pergunte detalhes que só seu amigo saberia.',
    },
    {
      step: 2,
      title: '🆘 "Meu filho está em apuros"',
      description: 'A pessoa diz: "Meu filho foi preso! Preciso de R$2.000 para a fiança. Por favor, me ajuda?"',
      whatHappens: 'Você fica assustado e quer ajudar. A pressão emocional faz você pensar menos claramente.',
      redFlags: [
        'Pede dinheiro com urgência',
        'Diz para não contar para ninguém',
        'Oferece desculpas para não ligar (bateria fraca, sem sinal)',
      ],
      defense: 'Quando alguém pede dinheiro com urgência, SEMPRE ligue para verificar. Criminosos contam com o pânico.',
    },
    {
      step: 3,
      title: '💳 Você envia o dinheiro via Pix',
      description: 'Você envia R$2.000 via Pix para a chave que a pessoa enviou.',
      whatHappens: 'O dinheiro é transferido instantaneamente. Não há volta.',
      redFlags: [
        'A chave Pix é de uma pessoa desconhecida',
        'O banco não avisa sobre nada suspeito',
        'A transação é feita rapidamente',
      ],
      defense: 'Nunca envie dinheiro para pessoas desconhecidas. Pix é irreversível. Se errar, o dinheiro se foi.',
    },
    {
      step: 4,
      title: '😱 Você descobre que foi enganado',
      description: 'Você liga para seu amigo de verdade. Ele diz que está tudo bem e que ninguém foi preso.',
      whatHappens: 'Você percebe que foi vítima de golpe. O dinheiro já foi sacado pelos criminosos.',
      redFlags: [
        'Seu amigo não sabe do que você está falando',
        'O número que recebeu a mensagem não existe mais',
        'A polícia não consegue recuperar o dinheiro',
      ],
      defense: 'Se isso acontecer, registre um BO na polícia e avise seu banco. Infelizmente, recuperar é difícil.',
    },
  ],
  'fake-support': [
    {
      step: 1,
      title: '🖥️ Você vê um pop-up na tela',
      description: 'Enquanto navega na internet, aparece um pop-up vermelho dizendo: "ALERTA! Seu computador foi infectado com VÍRUS!"',
      whatHappens: 'O pop-up é muito assustador. Tem um botão grande vermelho escrito "LIMPAR AGORA".',
      redFlags: [
        'O pop-up não deixa você fechar',
        'Faz barulhos de alerta',
        'Oferece para "limpar" o computador',
      ],
      defense: 'Pop-ups de antivírus legítimos NUNCA aparecem assim. Feche o navegador imediatamente.',
    },
    {
      step: 2,
      title: '☎️ Um número de telefone aparece',
      description: 'O pop-up diz: "Ligue para 0800-123-4567 para suporte técnico imediato"',
      whatHappens: 'Você liga para o número, assustado que seu computador está infectado.',
      redFlags: [
        'O número é de um call center, não de uma empresa real',
        'A pessoa atende muito rápido',
        'Pede para você instalar um programa de "acesso remoto"',
      ],
      defense: 'Nunca ligue para números de pop-ups. Se seu computador tem problema, ligue para a empresa oficial.',
    },
    {
      step: 3,
      title: '🔧 Você instala um programa de acesso remoto',
      description: 'A pessoa diz: "Preciso acessar seu computador para remover o vírus. Vou instalar um programa seguro."',
      whatHappens: 'Você instala o programa. Agora os criminosos têm acesso total ao seu computador.',
      redFlags: [
        'O programa permite que outro acesse seu PC',
        'Você não sabe o que está acontecendo na tela',
        'A pessoa pede para você sair da sala',
      ],
      defense: 'NUNCA deixe estranhos acessarem seu computador remotamente. Isso é sempre uma armadilha.',
    },
    {
      step: 4,
      title: '💰 Seus dados bancários são roubados',
      description: 'Os criminosos usam o acesso remoto para instalar um programa que rouba suas senhas bancárias.',
      whatHappens: 'Seu dinheiro desaparece. Seus dados pessoais são vendidos na dark web.',
      redFlags: [
        'Você recebe alertas de transações estranhas',
        'Sua senha não funciona mais',
        'Sua conta está vazia',
      ],
      defense: 'Se isso acontecer, mude todas as senhas imediatamente e contate seu banco.',
    },
  ],
  'fake-bank': [
    {
      step: 1,
      title: '📱 Você recebe um SMS do "seu banco"',
      description: 'SMS: "Seu cartão foi bloqueado por suspeita de fraude. Clique aqui para desbloquear: https://seu-banco.com.br/..."',
      whatHappens: 'O SMS parece vir do seu banco. O link parece oficial.',
      redFlags: [
        'O link é encurtado ou estranho',
        'O SMS pede para você clicar com urgência',
        'Bancos NUNCA enviam links por SMS',
      ],
      defense: 'Bancos legítimos NUNCA enviam links por SMS. Sempre abra o app do banco diretamente.',
    },
    {
      step: 2,
      title: '🔗 Você clica no link',
      description: 'Você clica no link e é levado para um site que parece ser seu banco.',
      whatHappens: 'O site pede seu login e senha para "desbloquear o cartão".',
      redFlags: [
        'A URL é um pouco diferente da real',
        'Não tem o cadeado de HTTPS',
        'Alguns elementos estão fora do lugar',
      ],
      defense: 'Verifique a URL com cuidado. A menor diferença (como "seu-banco.com.br.tk") é um golpe.',
    },
    {
      step: 3,
      title: '📝 Você digita suas credenciais',
      description: 'Você digita seu CPF, login e senha para "desbloquear o cartão".',
      whatHappens: 'Seus dados são capturados pelos criminosos.',
      redFlags: [
        'A página diz "Carregando..." indefinidamente',
        'Você recebe um erro',
        'Nada acontece após digitar',
      ],
      defense: 'Se a página não funciona, é porque é falsa. Saia imediatamente.',
    },
    {
      step: 4,
      title: '💸 Seu dinheiro desaparece',
      description: 'Os criminosos acessam sua conta e transferem todo o dinheiro.',
      whatHappens: 'Você descobre quando tenta fazer uma compra e o cartão não funciona.',
      redFlags: [
        'Seu saldo está zerado',
        'Você recebe alertas de transações que não fez',
        'Seu banco liga avisando sobre atividade suspeita',
      ],
      defense: 'Ligue IMEDIATAMENTE para seu banco. Quanto mais rápido, melhor a chance de recuperar o dinheiro.',
    },
  ],
};

export const ScamSimulation: React.FC<ScamSimulationProps> = ({ scamType = 'phishing' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = SCAM_SCENARIOS[scamType] || SCAM_SCENARIOS.phishing;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setExpandedStep(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setExpandedStep(null);
    }
  };

  return (
    <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4'>
      <div className='flex items-center gap-2 mb-6'>
        <AlertTriangle className='w-5 h-5 text-red-400' />
        <h4 className='text-lg font-bold text-red-400'>🎭 Simulação de Golpe: Passo a Passo</h4>
      </div>

      {/* Progresso */}
      <div className='mb-6'>
        <div className='flex justify-between items-center mb-2'>
          <p className='text-slate-400 text-sm font-semibold'>Passo {currentStep + 1} de {steps.length}</p>
          <p className='text-slate-500 text-xs'>{Math.round(((currentStep + 1) / steps.length) * 100)}%</p>
        </div>
        <div className='w-full bg-slate-700 rounded-full h-2 overflow-hidden'>
          <div
            className='h-full bg-red-500 transition-all'
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Conteúdo do passo */}
      <div className='space-y-4 mb-6'>
        <div className='bg-red-500/10 border border-red-500 rounded-lg p-4'>
          <h5 className='text-red-400 font-bold text-lg mb-2'>{step.title}</h5>
          <p className='text-slate-300 text-sm'>{step.description}</p>
        </div>

        <div className='bg-slate-800/50 border border-slate-600 rounded-lg p-4'>
          <p className='text-slate-400 text-sm font-semibold mb-2'>O que acontece:</p>
          <p className='text-slate-300 text-sm'>{step.whatHappens}</p>
        </div>

        {/* Red Flags */}
        <div className='bg-yellow-500/10 border border-yellow-500 rounded-lg p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Shield className='w-4 h-4 text-yellow-400' />
            <p className='text-yellow-400 font-bold text-sm'>Sinais de Alerta (Red Flags):</p>
          </div>
          <ul className='space-y-1'>
            {step.redFlags.map((flag, idx) => (
              <li key={idx} className='text-yellow-300 text-sm flex items-start gap-2'>
                <span className='flex-shrink-0'>⚠️</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Defesa */}
        <div className='bg-green-500/10 border border-green-500 rounded-lg p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Lightbulb className='w-4 h-4 text-green-400' />
            <p className='text-green-400 font-bold text-sm'>Como se Defender:</p>
          </div>
          <p className='text-green-300 text-sm'>{step.defense}</p>
        </div>
      </div>

      {/* Navegação */}
      <div className='flex gap-2'>
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className='flex-1 bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
        >
          ← Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className='flex-1 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          Próximo <ChevronRight className='w-4 h-4' />
        </Button>
      </div>

      {currentStep === steps.length - 1 && (
        <div className='mt-4 bg-red-500/10 border border-red-500 rounded p-3'>
          <p className='text-red-400 font-bold text-sm mb-1'>🚨 Fim da Simulação</p>
          <p className='text-red-300 text-xs'>
            Agora você conhece como este golpe funciona. Compartilhe este conhecimento com seus amigos e familiares para protegê-los!
          </p>
        </div>
      )}
    </div>
  );
};

export default ScamSimulation;
