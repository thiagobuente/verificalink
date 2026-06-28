import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Users, Zap, Target, MessageCircle, Linkedin, Github } from "lucide-react";

export default function AboutCyberDimension() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          className="mb-6 bg-green-600 hover:bg-green-700 text-white border-green-500"
        >
          ← Voltar
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-400 mb-4">CyberDimension</h1>
          <p className="text-2xl text-green-300 mb-2">Somos a revolução da Dimensão Cibernética!</p>
          <p className="text-lg text-gray-300">Capacitando pessoas e fortalecendo empresas por meio da cibersegurança na prática</p>
        </div>

        {/* CEO Info */}
        <Card className="border-2 border-green-500 bg-slate-900 mb-8">
          <CardHeader className="bg-green-900/50">
            <CardTitle className="text-green-400">Liderança</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg text-gray-200 mb-2">
              <strong className="text-green-400">CEO:</strong> Saulo L
            </p>
            <p className="text-gray-300">
              Visionário na área de cibersegurança, liderando a CyberDimension em sua missão de proteger e capacitar a sociedade brasileira.
            </p>
          </CardContent>
        </Card>

        {/* Missão */}
        <Card className="border-2 border-green-500 bg-slate-900 mb-8">
          <CardHeader className="bg-green-900/50">
            <CardTitle className="text-green-400">Missão</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-200">
              Dominar a cibersegurança na prática, capacitando pessoas e fortalecendo empresas contra ameaças digitais.
            </p>
            <p className="text-gray-200">
              Criar uma comunidade de profissionais éticos dedicados a proteger o Brasil contra golpes, fraudes e ataques cibernéticos.
            </p>
          </CardContent>
        </Card>

        {/* Pilares */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-green-500 bg-slate-900">
            <CardHeader className="bg-green-900/50">
              <Shield className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-green-400">Segurança Ofensiva</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-300">
                Identificação de vulnerabilidades e simulação de ataques em ambientes reais.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500 bg-slate-900">
            <CardHeader className="bg-green-900/50">
              <Zap className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-green-400">Inteligência & Pesquisa</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-300">
                Estudos, análise de ameaças e produção de conhecimento em cibersegurança.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500 bg-slate-900">
            <CardHeader className="bg-green-900/50">
              <Target className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-green-400">Segurança Defensiva</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-300">
                Monitoramento contínuo, detecção de ameaças e fortalecimento de sistemas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comunidade */}
        <Card className="border-2 border-green-500 bg-slate-900 mb-8">
          <CardHeader className="bg-green-900/50">
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Conecte-se com a CyberDimension
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="https://chat.whatsapp.com/Dr13epp6K711j7NyYxSoZq"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Community
                </Button>
              </a>
              <a 
                href="https://discord.gg/KmtfGmrdEu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <Github className="w-5 h-5" />
                  Discord Server
                </Button>
              </a>
              <a 
                href="https://www.linkedin.com/company/cyberdimension"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Créditos */}
        <Card className="border-2 border-green-500 bg-slate-900">
          <CardHeader className="bg-green-900/50">
            <CardTitle className="text-green-400">Créditos - Pare Antes do Pix</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <p className="text-gray-200">
              <strong className="text-green-400">Desenvolvido pela:</strong> CyberDimension
            </p>
            <p className="text-gray-200">
              <strong className="text-green-400">CEO:</strong> Saulo L
            </p>
            <p className="text-gray-200">
              <strong className="text-green-400">Analista de Cibersegurança:</strong> Thiago Buente | Viber Coding
            </p>
            <p className="text-gray-300 mt-4">
              Uma ferramenta educativa desenvolvida para proteger brasileiros contra golpes digitais, phishing e sequestro de WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
