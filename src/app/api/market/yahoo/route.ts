// ==========================================
// YAHOO FINANCE PROXY API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair parâmetros da query
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1d';
    const range = searchParams.get('range') || '1y';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Construir URL da API do Yahoo Finance
    const yahooParams = new URLSearchParams({
      interval,
      range,
    });

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?${yahooParams.toString()}`;

    // Fazer requisição para o Yahoo Finance (server-side)
    const response = await fetch(yahooUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PennyWise/1.0)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Yahoo Finance API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Verificar se há erros na resposta do Yahoo
    if (data.chart?.error) {
      return NextResponse.json(
        { error: `Yahoo Finance API: ${data.chart.error.description}` },
        { status: 400 }
      );
    }

    if (!data.chart?.result?.[0]) {
      return NextResponse.json(
        { error: 'Yahoo Finance API: No data returned' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'yahoo_finance',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Yahoo Finance Proxy Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
