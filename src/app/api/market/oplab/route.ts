// ==========================================
// OPLAB API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { OplabService } from '@/lib/services/oplab';

const oplab = OplabService.getInstance();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'quote': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
        }
        
        const result = await oplab.getQuote(symbol);
        return NextResponse.json(result);
      }

      case 'intraday': {
        const symbol = searchParams.get('symbol');
        const intervalParam = searchParams.get('interval') || '5min';
        
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
        }

        // Validate interval
        const validIntervals = ['1min', '5min', '15min', '30min', '60min'] as const;
        const interval = validIntervals.includes(intervalParam as typeof validIntervals[number]) 
          ? intervalParam as typeof validIntervals[number]
          : '5min';
        
        const result = await oplab.getIntradayData(symbol, interval);
        return NextResponse.json(result);
      }

      case 'daily': {
        const symbol = searchParams.get('symbol');
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
        }
        
        const result = await oplab.getDailyData(symbol, days);
        return NextResponse.json(result);
      }

      case 'options-chain': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
        }
        
        const result = await oplab.getOptionsChain(symbol);
        return NextResponse.json(result);
      }

      case 'option-quote': {
        const optionSymbol = searchParams.get('option_symbol');
        if (!optionSymbol) {
          return NextResponse.json({ error: 'Option symbol parameter is required' }, { status: 400 });
        }
        
        const result = await oplab.getOptionQuote(optionSymbol);
        return NextResponse.json(result);
      }

      case 'market-status': {
        const result = await oplab.getMarketStatus();
        return NextResponse.json(result);
      }

      case 'top-stocks': {
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 10;
        
        const result = await oplab.getTopStocks(limit);
        return NextResponse.json(result);
      }

      case 'health': {
        const result = await oplab.healthCheck();
        return NextResponse.json(result);
      }

      case 'validate': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
        }
        
        const result = await oplab.validateSymbol(symbol);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Available actions: quote, intraday, daily, options-chain, option-quote, market-status, top-stocks, health, validate',
            timestamp: new Date().toISOString()
          }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Oplab API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 