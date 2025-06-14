import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, TestTube, User, Bot } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💰 Penny Wise
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Análise Financeira com IA
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Chat Principal */}
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-semibold mb-4">Chat Principal</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Chat completo com autenticação, histórico e integração com dados de mercado
            </p>
            <Link href="/chat">
              <Button size="lg" className="w-full">
                <User className="h-5 w-5 mr-2" />
                Acessar Chat (Requer Login)
              </Button>
            </Link>
          </Card>

          {/* Teste do Chat */}
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <TestTube className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-semibold mb-4">Teste da IA</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Teste direto da integração com DeepSeek AI sem necessidade de login
            </p>
            <Link href="/test-chat">
              <Button size="lg" variant="outline" className="w-full">
                <Bot className="h-5 w-5 mr-2" />
                Testar IA (Sem Login)
              </Button>
            </Link>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-3">🚀 Status da Implementação</h3>
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
