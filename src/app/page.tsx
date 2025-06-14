import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, TestTube, User, Bot } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            💰 Penny Wise
          </h1>
          <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
            Análise Financeira com IA
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Chat Principal */}
          <Card className="p-8 text-center transition-shadow hover:shadow-lg">
            <MessageSquare className="mx-auto mb-4 h-16 w-16 text-blue-600" />
            <h2 className="mb-4 text-2xl font-semibold">Chat Principal</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Chat completo com autenticação, histórico e integração com dados
              de mercado
            </p>
            <Link href="/chat">
              <Button size="lg" className="w-full">
                <User className="mr-2 h-5 w-5" />
                Acessar Chat (Requer Login)
              </Button>
            </Link>
          </Card>

          {/* Teste do Chat */}
          <Card className="p-8 text-center transition-shadow hover:shadow-lg">
            <TestTube className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-4 text-2xl font-semibold">Teste da IA</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Teste direto da integração com DeepSeek AI sem necessidade de
              login
            </p>
            <Link href="/test-chat">
              <Button size="lg" variant="outline" className="w-full">
                <Bot className="mr-2 h-5 w-5" />
                Testar IA (Sem Login)
              </Button>
            </Link>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="mx-auto max-w-2xl p-6">
            <h3 className="mb-3 text-lg font-semibold">
              🚀 Status da Implementação
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>✅ Interface do Chat</span>
                <span className="text-green-600">Completo</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✅ Integração DeepSeek AI</span>
                <span className="text-green-600">Funcionando</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✅ APIs de Chat</span>
                <span className="text-green-600">Implementadas</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✅ Persistência (Supabase)</span>
                <span className="text-green-600">Configurada</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✅ Streaming de Respostas</span>
                <span className="text-green-600">Disponível</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
