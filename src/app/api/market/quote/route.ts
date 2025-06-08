// ==========================================
// MARKET QUOTE API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import marketDataService from '@/lib/services/market-data';

export async function GET(request: NextRequest) {
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

    // Extrair parâmetros da query
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols');

    if (!symbol && !symbols) {
      return NextResponse.json(
        { error: 'Symbol or symbols parameter is required' },
        { status: 400 }
      );
    }

    // Se é uma única cotação
    if (symbol) {
      const response = await marketDataService.getQuote(symbol.toUpperCase());
      
      if (!response.success) {
        return NextResponse.json(
          { error: response.error },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: response.data,
        source: response.source,
        timestamp: response.timestamp
      });
    }

    // Se são múltiplas cotações
    if (symbols) {
      const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());
      const response = await marketDataService.getMultipleQuotes(symbolArray);

      return NextResponse.json({
        success: response.success,
        data: response.data,
        error: response.error,
        source: response.source,
        timestamp: response.timestamp
      });
    }

  } catch (error) {
    console.error('Market Quote API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { symbols, watchlist } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    // Obter cotações múltiplas
    const symbolArray = symbols.map((s: string) => s.trim().toUpperCase());
    const response = await marketDataService.getMultipleQuotes(symbolArray);

    // Se é uma watchlist, salvar no Supabase
    if (watchlist && response.success && response.data) {
      try {
        const watchlistToSave = response.data.map(quote => ({
          user_id: session.user.id,
          symbol: quote.symbol,
          name: quote.name,
          market: quote.source,
          created_at: new Date().toISOString()
        }));

        await supabase
          .from('watchlist')
          .upsert(watchlistToSave, { 
            onConflict: 'user_id,symbol',
            ignoreDuplicates: false 
          });

      } catch (dbError) {
        console.error('Error saving watchlist:', dbError);
        // Não falhar a requisição se não conseguir salvar
      }
    }

    return NextResponse.json({
      success: response.success,
      data: response.data,
      error: response.error,
      source: response.source,
      timestamp: response.timestamp
    });

  } catch (error) {
    console.error('Market Quote POST API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 