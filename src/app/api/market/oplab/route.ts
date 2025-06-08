// ==========================================
// OPLAB API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import oplabService from '@/lib/services/oplab';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const symbol = searchParams.get('symbol');

    switch (action) {
      case 'quote':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required for quote action' },
            { status: 400 }
          );
        }
        
        const quoteResponse = await oplabService.getQuote(symbol);
        return NextResponse.json(quoteResponse);

      case 'intraday':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required for intraday action' },
            { status: 400 }
          );
        }

        const interval = searchParams.get('interval') as '1min' | '5min' | '15min' | '30min' | '60min' || '5min';
        const intradayResponse = await oplabService.getIntradayData(symbol, interval);
        return NextResponse.json(intradayResponse);

      case 'daily':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required for daily action' },
            { status: 400 }
          );
        }

        const days = parseInt(searchParams.get('days') || '100');
        const dailyResponse = await oplabService.getDailyData(symbol, days);
        return NextResponse.json(dailyResponse);

      case 'options-chain':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required for options-chain action' },
            { status: 400 }
          );
        }

        const expiryDate = searchParams.get('expiry') || undefined;
        const optionsResponse = await oplabService.getOptionsChain(symbol, expiryDate);
        return NextResponse.json(optionsResponse);

      case 'option-quote':
        const optionSymbol = searchParams.get('option_symbol');
        if (!optionSymbol) {
          return NextResponse.json(
            { error: 'Option symbol parameter is required for option-quote action' },
            { status: 400 }
          );
        }

        const optionQuoteResponse = await oplabService.getOptionQuote(optionSymbol);
        return NextResponse.json(optionQuoteResponse);

      case 'market-status':
        const marketStatusResponse = await oplabService.getMarketStatus();
        return NextResponse.json(marketStatusResponse);

      case 'top-stocks':
        const limit = parseInt(searchParams.get('limit') || '10');
        const topStocksResponse = await oplabService.getTopStocks(limit);
        return NextResponse.json(topStocksResponse);

      case 'health':
        const healthResponse = await oplabService.healthCheck();
        return NextResponse.json(healthResponse);

      case 'validate':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required for validate action' },
            { status: 400 }
          );
        }

        const isValid = await oplabService.validateSymbol(symbol);
        return NextResponse.json({
          data: { symbol, isValid },
          error: null,
          success: true,
          source: 'oplab',
          timestamp: new Date().toISOString(),
          cached: false
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action parameter. Available actions: quote, intraday, daily, options-chain, option-quote, market-status, top-stocks, health, validate',
            availableActions: [
              'quote - Get stock quote (requires symbol)',
              'intraday - Get intraday data (requires symbol, optional interval)',
              'daily - Get daily data (requires symbol, optional days)',
              'options-chain - Get options chain (requires symbol, optional expiry)',
              'option-quote - Get option quote (requires option_symbol)',
              'market-status - Get market status',
              'top-stocks - Get top stocks (optional limit)',
              'health - Health check',
              'validate - Validate symbol (requires symbol)'
            ]
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Oplab API Route Error:', error);
    
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
        source: 'oplab',
        timestamp: new Date().toISOString(),
        cached: false
      },
      { status: 500 }
    );
  }
} 