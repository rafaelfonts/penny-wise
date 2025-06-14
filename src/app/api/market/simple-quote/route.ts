import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Tentar Alpha Vantage primeiro
    try {
      const alphaUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

      const alphaResponse = await fetch(alphaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PennyWise/1.0)',
        },
      });

      if (alphaResponse.ok) {
        const alphaData = await alphaResponse.json();

        if (alphaData['Global Quote'] && !alphaData['Error Message']) {
          const quote = alphaData['Global Quote'];

          return NextResponse.json({
            success: true,
            data: {
              symbol: quote['01. symbol'],
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: quote['10. change percent'],
              volume: parseInt(quote['06. volume']),
              high: parseFloat(quote['03. high']),
              low: parseFloat(quote['04. low']),
              open: parseFloat(quote['02. open']),
              previousClose: parseFloat(quote['08. previous close']),
              timestamp: quote['07. latest trading day'],
              source: 'alpha_vantage',
            },
            source: 'alpha_vantage',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (alphaError) {
      console.log(
        'Alpha Vantage failed, trying Yahoo Finance...',
        alphaError instanceof Error ? alphaError.message : 'Unknown error'
      );
    }

    // Fallback para Yahoo Finance
    try {
      // Para símbolos brasileiros, adicionar .SA se não tiver
      const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.SA`;
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;

      const yahooResponse = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PennyWise/1.0)',
        },
      });

      if (yahooResponse.ok) {
        const yahooData = await yahooResponse.json();

        if (
          yahooData.chart &&
          yahooData.chart.result &&
          yahooData.chart.result.length > 0
        ) {
          const result = yahooData.chart.result[0];
          const meta = result.meta;

          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = currentPrice - previousClose;
          const changePercent =
            ((change / previousClose) * 100).toFixed(2) + '%';

          return NextResponse.json({
            success: true,
            data: {
              symbol: meta.symbol,
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              volume: meta.regularMarketVolume,
              high: meta.regularMarketDayHigh,
              low: meta.regularMarketDayLow,
              open: meta.regularMarketOpen,
              previousClose: previousClose,
              timestamp: new Date().toISOString(),
              source: 'yahoo_finance',
            },
            source: 'yahoo_finance',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (yahooError) {
      console.log(
        'Yahoo Finance also failed',
        yahooError instanceof Error ? yahooError.message : 'Unknown error'
      );
    }

    // Se ambos falharam, retornar dados mock para demonstração
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol,
        price: 25.5 + Math.random() * 10,
        change: -0.5 + Math.random() * 2,
        changePercent: (Math.random() * 6 - 3).toFixed(2) + '%',
        volume: Math.floor(Math.random() * 10000000),
        high: 26.0 + Math.random() * 5,
        low: 24.0 + Math.random() * 3,
        open: 25.0 + Math.random() * 2,
        previousClose: 25.75 + Math.random() * 2,
        timestamp: new Date().toISOString(),
        source: 'mock_data',
      },
      source: 'mock_data',
      timestamp: new Date().toISOString(),
      note: 'Using mock data for demonstration',
    });
  } catch (error) {
    console.error('Simple quote API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quote data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
