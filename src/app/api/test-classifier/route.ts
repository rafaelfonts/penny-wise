import { NextRequest, NextResponse } from 'next/server'
import { classifySymbol, classifySymbols, marketClassifier } from '@/lib/services/market-classifier'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const symbols = searchParams.get('symbols')

  try {
    if (symbols) {
      // Classificar múltiplos símbolos
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase())
      const results = classifySymbols(symbolList)
      
      return NextResponse.json({
        success: true,
        type: 'multiple',
        results: results.map(result => ({
          symbol: result.symbol,
          region: result.classification.region,
          exchange: result.classification.exchange,
          currency: result.classification.currency,
          confidence: result.classification.confidence,
          reasons: result.classification.reasons,
          apiProvider: result.classification.apiProvider,
          suggestions: marketClassifier.getSuggestions(result.classification),
          coverage: marketClassifier.getApiCoverage(result.classification.region)
        }))
      })
    }

    if (symbol) {
      // Classificar um símbolo
      const classification = classifySymbol(symbol)
      
      return NextResponse.json({
        success: true,
        type: 'single',
        symbol: symbol.toUpperCase(),
        region: classification.region,
        exchange: classification.exchange,
        currency: classification.currency,
        confidence: classification.confidence,
        reasons: classification.reasons,
        apiProvider: classification.apiProvider,
        suggestions: marketClassifier.getSuggestions(classification),
        coverage: marketClassifier.getApiCoverage(classification.region)
      })
    }

    // Demonstração com símbolos de exemplo
    const demoSymbols = ['AAPL', 'PETR4', 'MSFT', 'VALE3', 'TSLA', 'ITUB4', 'GOOGL', 'BBDC4']
    const demoResults = classifySymbols(demoSymbols)

    return NextResponse.json({
      success: true,
      type: 'demo',
      message: 'Classificador de Mercado - Demonstração',
      usage: {
        single: '/api/test-classifier?symbol=AAPL',
        multiple: '/api/test-classifier?symbols=AAPL,PETR4,MSFT'
      },
      demo: demoResults.map(result => ({
        symbol: result.symbol,
        region: result.classification.region,
        exchange: result.classification.exchange,
        currency: result.classification.currency,
        confidence: result.classification.confidence,
        apiProvider: result.classification.apiProvider,
        coverage: marketClassifier.getApiCoverage(result.classification.region)
      }))
    })

  } catch (error) {
    console.error('Error in classifier test:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Body deve conter um array de símbolos' 
        },
        { status: 400 }
      )
    }

    const results = classifySymbols(symbols)
    
    return NextResponse.json({
      success: true,
      count: symbols.length,
      results: results.map(result => ({
        symbol: result.symbol,
        classification: result.classification,
        suggestions: marketClassifier.getSuggestions(result.classification),
        coverage: marketClassifier.getApiCoverage(result.classification.region)
      }))
    })

  } catch (error) {
    console.error('Error in classifier POST:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 