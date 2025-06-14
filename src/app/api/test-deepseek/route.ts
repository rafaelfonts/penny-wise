import { NextRequest, NextResponse } from 'next/server'
import deepSeekService from '@/lib/services/deepseek'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testando DeepSeek com mensagem:', message)

    // Teste direto do serviço DeepSeek
    const response = await deepSeekService.processChatMessage(
      message,
      [], // Sem histórico para teste
      '', // Sem contexto de mercado
      '' // Sem contexto de comandos
    )

    console.log('✅ Resposta do DeepSeek:', response)

    return NextResponse.json({
      response: response.response,
      metadata: response.metadata,
      test: true
    })

  } catch (error) {
    console.error('❌ Erro no teste DeepSeek:', error)
    
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      test: true
    }, { status: 500 })
  }
}

// Health check
export async function GET() {
  try {
    // Teste básico de conectividade
    const healthCheck = await deepSeekService.healthCheck()
    
    return NextResponse.json({
      status: healthCheck ? 'healthy' : 'unhealthy',
      service: 'deepseek',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 