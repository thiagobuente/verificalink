import React, { useState } from 'react';
import { BookOpen, AlertTriangle, Shield, TrendingUp, Users, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EducationArticle {
  id: string;
  title: string;
  category: string;
  difficulty: 'iniciante' | 'intermediário' | 'avançado';
  readTime: number;
  content: string;
  tips: string[];
}

interface EducationHubProps {
  isLoading?: boolean;
}

const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'phishing-101',
    title: 'O que é Phishing? Guia Completo',
    category: 'Fundamentos',
    difficulty: 'iniciante',
    readTime: 5,
    content: `Phishing é um tipo de golpe onde criminosos fingem ser uma empresa legítima para roubar suas informações pessoais.

**Como funciona:**
1. Você recebe um email ou mensagem que parece ser de um banco, rede social ou loja
2. O email diz que há um problema e pede para você "verificar" clicando em um link
3. Você é levado para um site falso que parece idêntico ao real
4. Você digita suas informações (login, senha, CPF)
5. Os criminosos usam essas informações para roubar seu dinheiro

**Exemplos de phishing:**
- "Sua conta foi bloqueada. Clique aqui para desbloquear"
- "Confirme seus dados para receber seu prêmio"
- "Atividade suspeita detectada. Verifique sua conta"

**Como se proteger:**
- Nunca clique em links de emails não solicitados
- Sempre acesse sites digitando o endereço na barra de endereço
- Verifique se o site tem HTTPS (cadeado)
- Bancos nunca pedem senha por email`,
    tips: [
      'Verifique o endereço de email do remetente com cuidado',
      'Passe o mouse sobre links para ver o endereço real',
      'Desconfie de emails com muitos erros de digitação',
      'Bancos legítimos NUNCA pedem dados por email',
    ],
  },
  {
    id: 'whatsapp-golpes',
    title: 'Golpes Comuns no WhatsApp',
    category: 'Redes Sociais',
    difficulty: 'iniciante',
    readTime: 4,
    content: `O WhatsApp é uma ferramenta comum para golpes porque as pessoas confiam mais em mensagens de contatos.

**Golpe do "Filho em Apuros":**
- Alguém entra em contato dizendo ser seu filho/filha
- Diz que foi preso e precisa de dinheiro para fiança
- Pede para não contar para ninguém
- Você envia dinheiro via Pix

**Golpe do "Código de Verificação":**
- Alguém pede seu código de verificação do WhatsApp
- Dizem que precisam para "confirmar algo"
- Eles usam esse código para acessar sua conta
- Seu WhatsApp é sequestrado

**Golpe do "Link Malicioso":**
- Você recebe um link de um "amigo"
- O link parece ser de um vídeo ou notícia viral
- Você clica e seu celular é infectado com malware

**Como se proteger:**
- SEMPRE ligue para verificar antes de enviar dinheiro
- Nunca compartilhe seu código de verificação
- Desconfie de links de pessoas desconhecidas
- Ative a verificação em duas etapas no WhatsApp`,
    tips: [
      'Salve o número de familiares para identificar melhor',
      'Quando em dúvida, ligue para a pessoa',
      'Pix é irreversível - sempre verifique antes de enviar',
      'Ative notificações de login no WhatsApp',
    ],
  },
  {
    id: 'fake-support',
    title: 'Golpes de "Suporte Técnico"',
    category: 'Computador',
    difficulty: 'intermediário',
    readTime: 6,
    content: `Criminosos fingem ser técnicos de suporte para ganhar acesso ao seu computador.

**Como funciona:**
1. Um pop-up assustador aparece na tela: "VÍRUS DETECTADO!"
2. O pop-up oferece um número de telefone para "suporte"
3. Você liga e a pessoa diz que seu PC está infectado
4. Ela pede para você instalar um programa de "acesso remoto"
5. Agora ela tem controle total do seu computador
6. Ela instala malware, rouba senhas e dados bancários

**Sinais de alerta:**
- Pop-ups que não deixam você fechar
- Números de telefone em pop-ups
- Pedidos para instalar programas desconhecidos
- Pessoas pedindo acesso remoto ao seu PC

**Como se proteger:**
- Nunca clique em pop-ups de antivírus
- Feche o navegador se aparecer um pop-up assustador
- NUNCA deixe estranhos acessarem seu PC remotamente
- Use um antivírus legítimo (Windows Defender, Kaspersky, etc)
- Se seu PC está lento, leve a um técnico de confiança`,
    tips: [
      'Empresas legítimas NUNCA ligam oferecendo suporte',
      'Antivírus real não faz pop-ups assustadores',
      'Se seu PC está lento, pode ser malware - desconecte da internet',
      'Faça backup de seus arquivos importantes regularmente',
    ],
  },
  {
    id: 'password-security',
    title: 'Criando Senhas Seguras',
    category: 'Segurança',
    difficulty: 'intermediário',
    readTime: 5,
    content: `Uma senha fraca é como deixar a porta de sua casa aberta.

**Características de uma senha FRACA:**
- Menos de 8 caracteres
- Apenas letras ou apenas números
- Seu nome, data de nascimento ou nome de pet
- Sequências óbvias (123456, abcdef)
- A mesma senha em vários sites

**Características de uma senha FORTE:**
- Mínimo 12 caracteres
- Mistura de maiúsculas, minúsculas, números e símbolos
- Sem informações pessoais
- Única para cada site
- Exemplo: "Gato#2024@Azul!"

**Dicas para criar senhas fortes:**
1. Use uma frase que você lembra (ex: "Meu gato é azul")
2. Pegue a primeira letra de cada palavra (MgéA)
3. Adicione números e símbolos (MgéA#2024@)

**Gerenciadores de Senhas:**
- Keepass, Bitwarden, 1Password
- Eles geram e armazenam senhas fortes
- Você só precisa lembrar de uma senha mestre

**Autenticação em Duas Etapas:**
- Ative sempre que possível
- Mesmo que alguém roube sua senha, não consegue acessar
- Use apps como Google Authenticator ou Authy`,
    tips: [
      'Nunca compartilhe sua senha com ninguém',
      'Mude suas senhas a cada 3-6 meses',
      'Se acha que sua senha foi comprometida, mude imediatamente',
      'Use autenticação biométrica (impressão digital) quando disponível',
    ],
  },
  {
    id: 'malware-protection',
    title: 'Proteção Contra Malware',
    category: 'Computador',
    difficulty: 'avançado',
    readTime: 7,
    content: `Malware é software malicioso que pode danificar seu computador ou roubar dados.

**Tipos de Malware:**
- Vírus: Se replica e infecta outros arquivos
- Worms: Se espalha pela rede
- Trojans: Parece inofensivo mas contém código malicioso
- Ransomware: Criptografa seus arquivos e pede resgate
- Spyware: Monitora suas atividades
- Adware: Mostra anúncios indesejados

**Sinais de que seu PC tem malware:**
- PC está muito lento
- Aparecem pop-ups estranhos
- Sua bateria descarrega rápido
- Você não consegue acessar certos sites
- Sua câmera ou microfone acendem sozinhos
- Você recebe muitos emails de erro

**Como se proteger:**
1. Use um antivírus confiável (Windows Defender é bom)
2. Mantenha seu sistema operacional atualizado
3. Não baixe arquivos de sites desconfiados
4. Não abra anexos de emails de desconhecidos
5. Use um firewall
6. Faça backup de seus arquivos

**Se você acha que tem malware:**
1. Desconecte da internet
2. Inicie em Modo de Segurança
3. Execute uma varredura completa do antivírus
4. Se não resolver, leve a um técnico`,
    tips: [
      'Atualizações de segurança são críticas - instale sempre',
      'Não confie em "antivírus" oferecidos em pop-ups',
      'Faça backup antes de instalar algo novo',
      'Considere usar Linux para maior segurança',
    ],
  },
];

const DIFFICULTY_COLORS = {
  iniciante: 'bg-green-500/10 text-green-400 border-green-500',
  intermediário: 'bg-yellow-500/10 text-yellow-400 border-yellow-500',
  avançado: 'bg-red-500/10 text-red-400 border-red-500',
};

export const EducationHub: React.FC<EducationHubProps> = ({ isLoading = false }) => {
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(EDUCATION_ARTICLES[0]);

  if (isLoading) {
    return (
      <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse'>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-24 bg-slate-600 rounded' />
          ))}
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(EDUCATION_ARTICLES.map((a) => a.category)));

  return (
    <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4'>
      <div className='flex items-center gap-2 mb-6'>
        <BookOpen className='w-5 h-5 text-cyan-400' />
        <h4 className='text-lg font-bold text-cyan-400'>📚 Centro Educativo</h4>
      </div>

      <Tabs defaultValue='articles' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 bg-slate-800 mb-4'>
          <TabsTrigger value='articles'>📖 Artigos</TabsTrigger>
          <TabsTrigger value='tips'>💡 Dicas Rápidas</TabsTrigger>
        </TabsList>

        <TabsContent value='articles' className='space-y-4'>
          {/* Lista de artigos */}
          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {EDUCATION_ARTICLES.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`w-full text-left p-3 rounded border transition-all ${
                  selectedArticle?.id === article.id
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-slate-800/50 border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1'>
                    <p className='text-slate-300 font-bold text-sm'>{article.title}</p>
                    <p className='text-slate-500 text-xs mt-1'>{article.category}</p>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${DIFFICULTY_COLORS[article.difficulty]}`}>
                      {article.difficulty}
                    </span>
                    <span className='text-slate-500 text-xs'>{article.readTime} min</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Conteúdo do artigo */}
          {selectedArticle && (
            <div className='bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-4'>
              <div>
                <h5 className='text-cyan-400 font-bold text-lg mb-2'>{selectedArticle.title}</h5>
                <div className='flex items-center gap-2 text-slate-400 text-sm mb-4'>
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span>{selectedArticle.readTime} min de leitura</span>
                </div>
              </div>

              <div className='text-slate-300 text-sm whitespace-pre-wrap leading-relaxed'>
                {selectedArticle.content}
              </div>

              {/* Dicas */}
              <div className='bg-blue-500/10 border border-blue-500 rounded p-3'>
                <p className='text-blue-400 font-bold text-sm mb-2'>💡 Dicas Importantes:</p>
                <ul className='space-y-1'>
                  {selectedArticle.tips.map((tip, idx) => (
                    <li key={idx} className='text-blue-300 text-xs flex items-start gap-2'>
                      <span className='flex-shrink-0'>✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value='tips' className='space-y-3'>
          <div className='space-y-3'>
            {[
              '🔐 Senhas fortes têm 12+ caracteres com maiúsculas, minúsculas, números e símbolos',
              '🚫 Nunca clique em links de emails não solicitados - sempre acesse o site diretamente',
              '☎️ Quando alguém pede dinheiro com urgência, SEMPRE ligue para verificar',
              '🔒 Ative autenticação em duas etapas em todas suas contas importantes',
              '⚠️ Se algo parece estranho, provavelmente é um golpe - confie no seu instinto',
              '📱 Nunca compartilhe seu código de verificação do WhatsApp com ninguém',
              '💳 Pix é irreversível - sempre verifique o destinatário antes de enviar',
              '🖥️ Nunca deixe estranhos acessarem seu computador remotamente',
              '📧 Bancos legítimos NUNCA pedem senha, CPF ou dados bancários por email',
              '🛡️ Mantenha seu antivírus e sistema operacional sempre atualizados',
            ].map((tip, idx) => (
              <div key={idx} className='bg-slate-800/50 border border-slate-600 rounded p-3'>
                <p className='text-slate-300 text-sm'>{tip}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationHub;
