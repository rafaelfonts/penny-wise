// ==========================================
// ALPHA VANTAGE PROXY API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const func = searchParams.get('function');
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const outputsize = searchParams.get('outputsize');
    const adjusted = searchParams.get('adjusted');

    if (!func) {
      return NextResponse.json(
        { error: 'Function parameter is required' },
        { status: 400 }
      );
    }

    // Construir URL da API do Alpha Vantage
    const alphaParams = new URLSearchParams({
      function: func,
      apikey: process.env.ALPHA_VANTAGE_API_KEY || 'demo'
    });

    // Adicionar parâmetros opcionais
    if (symbol) alphaParams.append('symbol', symbol);
    if (interval) alphaParams.append('interval', interval);
    if (outputsize) alphaParams.append('outputsize', outputsize);
    if (adjusted) alphaParams.append('adjusted', adjusted);

    const alphaUrl = `https://www.alphavantage.co/query?${alphaParams.toString()}`;

    // Fazer requisição para o Alpha Vantage (server-side)
    const response = await fetch(alphaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PennyWise/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Alpha Vantage API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Verificar se há erros na resposta do Alpha Vantage
    if (data.Note) {
      return NextResponse.json(
        { error: `Alpha Vantage API: ${data.Note}` },
        { status: 429 } // Rate limit exceeded
      );
    }

    if (data.Information) {
      return NextResponse.json(
        { error: `Alpha Vantage API: ${data.Information}` },
        { status: 400 }
      );
    }

    if (data['Error Message']) {
      return NextResponse.json(
        { error: `Alpha Vantage API: ${data['Error Message']}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'alpha_vantage',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Alpha Vantage Proxy Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 