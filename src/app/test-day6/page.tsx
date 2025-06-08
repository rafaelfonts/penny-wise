'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface MarketContext {
  symbols: string[];
  source: string;
  [key: string]: unknown;
}

interface ExecutedCommand {
  type: string;
  result: unknown;
  [key: string]: unknown;
}

interface ApiResponse {
  response?: string;
  marketContext?: MarketContext;
  executedCommands?: ExecutedCommand[];
  metadata?: Record<string, unknown>;
  error?: string;
}

export default function TestDay6Page() {
  const [testMessage, setTestMessage] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const testEnhancedChat = async () => {
    if (!testMessage.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          conversationId: crypto.randomUUID(),
          includeMarketData: true,
          executeCommands: true
        })
      })
      
      const data = await response.json()
      setResponse(data)
    } catch (error) {
      console.error('Error:', error)
      setResponse({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const testCommands = [
    'Analise a PETR4',
    'criar alerta AAPL quando preço acima 150',
    'analise meu portfólio',
    'Como está a Apple hoje?',
    '/analyze MSFT',
    'performance do portfólio'
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Day 6 Priority 1 - Test Page</h1>
        <p className="text-gray-600">Teste da implementação do Chat Integration Enhancement</p>
        <Badge variant="outline" className="mt-2">
          Status: Enhanced Chat API + Portfolio Analysis + Alert Integration
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Input */}
        <Card>
          <CardHeader>
            <CardTitle>Test Enhanced Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem de Teste</Label>
              <Textarea
                id="message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite uma mensagem para testar o chat enhanced..."
                rows={3}
              />
            </div>
            
            <Button onClick={testEnhancedChat} disabled={loading || !testMessage.trim()}>
              {loading ? 'Testando...' : 'Testar Enhanced Chat'}
            </Button>

            <div className="space-y-2">
              <Label>Comandos de Exemplo:</Label>
              <div className="grid grid-cols-1 gap-2">
                {testCommands.map((cmd, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setTestMessage(cmd)}
                    className="justify-start text-left"
                  >
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
            
            {response && !loading && (
              <div className="space-y-4">
                {response.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 font-medium">Erro:</p>
                    <p className="text-red-800">{response.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Enhanced Response */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Resposta do Chat:</h4>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm">
                          {response.response}
                        </pre>
                      </div>
                    </div>

                    {/* Market Context */}
                    {response.marketContext && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📊 Contexto de Mercado:</h4>
                        <div className="space-y-2">
                          <p><strong>Símbolos:</strong> {response.marketContext.symbols.join(', ')}</p>
                          <p><strong>Fonte:</strong> {response.marketContext.source}</p>
                          <div className="bg-white p-2 rounded border text-xs">
                            <pre>{JSON.stringify(response.marketContext, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Executed Commands */}
                    {response.executedCommands && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">⚙️ Comandos Executados:</h4>
                        <div className="bg-white p-2 rounded border text-xs">
                          <pre>{JSON.stringify(response.executedCommands, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">🔧 Metadata:</h4>
                      <div className="bg-white p-2 rounded border text-xs">
                        <pre>{JSON.stringify(response.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Funcionalidades - Day 6 Priority 1</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">✅ Market Data Integration (100%)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Detecção automática de símbolos</li>
                <li>• Integração com APIs de mercado</li>
                <li>• Formatação de contexto</li>
                <li>• UI Components criados</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">✅ Alert Creation Commands (100%)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Parsing de comandos naturais</li>
                <li>• Validação de comandos</li>
                <li>• Integração com sistema de alertas</li>
                <li>• Criação via chat funcional</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">✅ Portfolio Analysis (100%)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Análise completa implementada</li>
                <li>• Métricas de risco calculadas</li>
                <li>• Recomendações de IA</li>
                <li>• Integração com chat</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              🎉 Day 6 Priority 1 - Chat Integration Enhancement: 100% CONCLUÍDO!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 