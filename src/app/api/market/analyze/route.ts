// ==========================================
// MARKET ANALYSIS API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import marketDataService from '@/lib/services/market-data';
import { StockQuote, CompanyOverview, NewsItem, TechnicalIndicator } from '@/lib/types/market';

type AnalysisData = {
  quote: StockQuote | null;
  overview: CompanyOverview | null;
  news: NewsItem[] | null;
  technicals: {
    rsi: TechnicalIndicator | null;
    macd: TechnicalIndicator | null;
  };
};

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse do body
    const body = await request.json();
    const { symbol, saveAnalysis = false } = body;

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Executar análise completa
    const analysis = await marketDataService.analyzeSymbol(symbol.toUpperCase());

    // Preparar resposta estruturada
    const analysisResponse = {
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      quote: analysis.quote,
      overview: analysis.overview,
      news: analysis.news,
      technicals: analysis.technicals,
      analysis: {
        summary: generateAnalysisSummary(analysis),
        signals: generateTradingSignals(analysis),
        risks: generateRiskAnalysis(analysis),
        recommendations: generateRecommendations(analysis)
      }
    };

    // Salvar análise se solicitado
    if (saveAnalysis && analysis.quote) {
      try {
        await supabase
          .from('saved_analysis')
          .insert({
            symbol: symbol.toUpperCase(),
            market: analysis.quote.source,
            title: `Análise de ${symbol.toUpperCase()}`,
            analysis_type: 'complete',
            data: JSON.parse(JSON.stringify(analysisResponse)),
            user_id: session.user.id
          });
      } catch (dbError) {
        console.error('Error saving analysis:', dbError);
        // Não falhar a requisição se não conseguir salvar
      }
    }

    return NextResponse.json({
      success: true,
      data: analysisResponse
    });

  } catch (error) {
    console.error('Market Analysis API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateAnalysisSummary(analysis: AnalysisData): string {
  const { quote, overview } = analysis;
  
  if (!quote) return 'Não foi possível obter dados de cotação para análise.';

  const changeDirection = quote.change >= 0 ? 'alta' : 'baixa';
  const changePercent = Math.abs(quote.changePercent).toFixed(2);
  
  let summary = `${quote.symbol} está cotada a $${quote.price.toFixed(2)}, `;
  summary += `com ${changeDirection} de ${changePercent}% no dia. `;

  if (overview) {
    summary += `A empresa atua no setor de ${overview.sector || 'N/A'} `;
    summary += `e possui P/E de ${overview.peRatio?.toFixed(2) || 'N/A'}. `;
  }

  return summary;
}

function generateTradingSignals(analysis: AnalysisData): Array<{ 
  type: 'buy' | 'sell' | 'hold'; 
  strength: 'weak' | 'moderate' | 'strong'; 
  reason: string 
}> {
  const signals: Array<{ type: 'buy' | 'sell' | 'hold'; strength: 'weak' | 'moderate' | 'strong'; reason: string }> = [];
  const { quote, technicals } = analysis;

  if (!quote) return signals;

  // Sinal baseado na variação do dia
  if (quote.changePercent > 5) {
    signals.push({
      type: 'buy',
      strength: 'moderate',
      reason: `Alta significativa de ${quote.changePercent.toFixed(2)}% no dia`
    });
  } else if (quote.changePercent < -5) {
    signals.push({
      type: 'sell',
      strength: 'moderate',
      reason: `Queda significativa de ${Math.abs(quote.changePercent).toFixed(2)}% no dia`
    });
  }

  // Sinais baseados em RSI
  if (technicals.rsi?.data && technicals.rsi.data.length > 0) {
    const latestRSI = technicals.rsi.data[0].value;
    
    if (latestRSI > 70) {
      signals.push({
        type: 'sell',
        strength: 'strong',
        reason: `RSI em sobrecompra (${latestRSI.toFixed(1)})`
      });
    } else if (latestRSI < 30) {
      signals.push({
        type: 'buy',
        strength: 'strong',
        reason: `RSI em sobrevenda (${latestRSI.toFixed(1)})`
      });
    }
  }

  // Se não há sinais claros
  if (signals.length === 0) {
    signals.push({
      type: 'hold',
      strength: 'moderate',
      reason: 'Sem sinais técnicos claros no momento'
    });
  }

  return signals;
}

function generateRiskAnalysis(analysis: AnalysisData): string[] {
  const risks: string[] = [];
  const { quote, overview, news } = analysis;

  // Risco de volatilidade
  if (quote && Math.abs(quote.changePercent) > 10) {
    risks.push(`Alta volatilidade detectada (${Math.abs(quote.changePercent).toFixed(2)}% no dia)`);
  }

  // Risco de valuation
  if (overview && overview.peRatio && overview.peRatio > 30) {
    risks.push(`P/E elevado (${overview.peRatio.toFixed(1)}) pode indicar sobrevaloração`);
  }

  // Risco baseado em sentimento das notícias
  if (news && Array.isArray(news)) {
    const negativeNews = news.filter(item => 
      item.overallSentimentLabel === 'Bearish' || 
      item.overallSentimentLabel === 'Somewhat-Bearish'
    ).length;
    
    if (negativeNews > news.length / 2) {
      risks.push('Sentimento negativo predominante nas notícias recentes');
    }
  }

  if (risks.length === 0) {
    risks.push('Nenhum risco significativo identificado no momento');
  }

  return risks;
}

function generateRecommendations(analysis: AnalysisData): string[] {
  const recommendations: string[] = [];
  const { quote, overview } = analysis;

  if (!quote) {
    recommendations.push('Monitorar dados de cotação quando disponíveis');
    return recommendations;
  }

  // Recomendações baseadas em volume
  if (quote.volume && overview?.sharesOutstanding) {
    const volumePercent = (quote.volume / overview.sharesOutstanding) * 100;
    if (volumePercent > 5) {
      recommendations.push('Volume elevado - monitorar movimentações significativas');
    }
  }

  // Recomendações gerais
  recommendations.push('Diversificar investimentos para reduzir riscos');
  recommendations.push('Acompanhar relatórios trimestrais da empresa');
  recommendations.push('Monitorar indicadores macroeconômicos do setor');

  return recommendations;
}