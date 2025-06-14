// ==========================================
// OPLAB API ROUTE - Penny Wise
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createOplabService, getOplabService } from '@/lib/services/oplab';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Check if service is configured
  try {
    getOplabService();
  } catch {
    // Initialize service with environment variables
    const accessToken = process.env.OPLAB_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Oplab access token not configured. Set OPLAB_ACCESS_TOKEN environment variable.' 
        }, 
        { status: 500 }
      );
    }
    
    const baseUrl = process.env.OPLAB_BASE_URL;
    createOplabService({ accessToken, baseUrl });
  }

  const oplab = getOplabService();

  try {
    switch (action) {
      case 'health': {
        const result = await oplab.healthCheck();
        return NextResponse.json(result);
      }

      case 'diagnose': {
        // Endpoint de diagnóstico para troubleshooting
        const symbol = searchParams.get('symbol') || 'PETR4';
        
        try {
          const result = await oplab.getStock(symbol);
          return NextResponse.json({
            success: true,
            diagnosis: {
              token_configured: !!process.env.OPLAB_ACCESS_TOKEN,
              api_response: result,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            diagnosis: {
              token_configured: !!process.env.OPLAB_ACCESS_TOKEN,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      case 'authorize': {
        const context = searchParams.get('context') as 'default' | 'chart' || 'default';
        const result = await oplab.authorize(context);
        return NextResponse.json(result);
      }

      // ==========================================
      // CHARTS & MARKET DATA ENDPOINTS
      // ==========================================

      case 'market-data-info': {
        const result = await oplab.getMarketDataInfo();
        return NextResponse.json(result);
      }

      case 'server-time': {
        const result = await oplab.getServerTime();
        return NextResponse.json(result);
      }

      case 'chart-data': {
        const symbol = searchParams.get('symbol');
        const resolution = searchParams.get('resolution');
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        
        if (!symbol || !resolution) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol and resolution parameters are required' 
          }, { status: 400 });
        }
        
        const from = fromParam ? parseInt(fromParam, 10) : undefined;
        const to = toParam ? parseInt(toParam, 10) : undefined;
        
        const result = await oplab.getChartData(symbol, resolution, from, to);
        return NextResponse.json(result);
      }

      case 'search-instruments': {
        const expr = searchParams.get('expr');
        if (!expr) {
          return NextResponse.json({ 
            success: false, 
            error: 'Expression parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.searchInstruments(expr);
        return NextResponse.json(result);
      }

      case 'current-quotes': {
        const symbolsParam = searchParams.get('symbols');
        if (!symbolsParam) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbols parameter is required' 
          }, { status: 400 });
        }
        
        const symbols = symbolsParam.split(',');
        const result = await oplab.getCurrentQuotes(symbols);
        return NextResponse.json(result);
      }

      // ==========================================
      // INSTRUMENTOS & SÉRIES
      // ==========================================

      case 'instruments': {
        const result = await oplab.getInstruments();
        return NextResponse.json(result);
      }

      case 'instrument': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getInstrument(symbol);
        return NextResponse.json(result);
      }

      case 'instrument-option-series': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getInstrumentOptionSeries(symbol);
        return NextResponse.json(result);
      }

      // ==========================================
      // AÇÕES E DERIVATIVOS (OPÇÕES)
      // ==========================================

      case 'market-status': {
        const result = await oplab.getMarketStatus();
        return NextResponse.json(result);
      }

      case 'stocks': {
        const result = await oplab.getStocks();
        return NextResponse.json(result);
      }

      case 'stock': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getStock(symbol);
        return NextResponse.json(result);
      }

      case 'stocks-with-options': {
        const result = await oplab.getStocksWithOptions();
        return NextResponse.json(result);
      }

      case 'options': {
        const underlyingSymbol = searchParams.get('symbol');
        if (!underlyingSymbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getOptions(underlyingSymbol);
        return NextResponse.json(result);
      }

      case 'option': {
        const optionSymbol = searchParams.get('symbol');
        if (!optionSymbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getOption(optionSymbol);
        return NextResponse.json(result);
      }

      case 'covered-options': {
        const underlyingSymbol = searchParams.get('symbol');
        if (!underlyingSymbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const strategy = searchParams.get('strategy') || undefined;
        const result = await oplab.getCoveredOptions(underlyingSymbol, strategy);
        return NextResponse.json(result);
      }

      case 'option-black-scholes': {
        const optionSymbol = searchParams.get('symbol');
        if (!optionSymbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getOptionBlackScholes(optionSymbol);
        return NextResponse.json(result);
      }

      case 'top-options': {
        const result = await oplab.getTopOptions();
        return NextResponse.json(result);
      }

      // ==========================================
      // RANKINGS COMPLETOS
      // ==========================================

      case 'top-volume-options': {
        const result = await oplab.getTopVolumeOptions();
        return NextResponse.json(result);
      }

      case 'highest-profit-options': {
        const result = await oplab.getHighestProfitOptions();
        return NextResponse.json(result);
      }

      case 'biggest-variation-options': {
        const result = await oplab.getBiggestVariationOptions();
        return NextResponse.json(result);
      }

      case 'trending-options': {
        const direction = searchParams.get('direction') as 'up' | 'down' | undefined;
        const result = await oplab.getTrendingOptions(direction);
        return NextResponse.json(result);
      }

      case 'ibov-correlation-options': {
        const result = await oplab.getIbovCorrelationOptions();
        return NextResponse.json(result);
      }

      case 'fundamentalist-companies': {
        const attribute = searchParams.get('attribute');
        if (!attribute) {
          return NextResponse.json({ 
            success: false, 
            error: 'Attribute parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getFundamentalistCompanies(attribute);
        return NextResponse.json(result);
      }

      case 'oplab-score-stocks': {
        const result = await oplab.getOplabScoreStocks();
        return NextResponse.json(result);
      }

      // ==========================================
      // STATUS DE MERCADO E COMPANHIAS
      // ==========================================

      case 'companies': {
        const result = await oplab.getCompanies();
        return NextResponse.json(result);
      }

      case 'company': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getCompany(symbol);
        return NextResponse.json(result);
      }

      // ==========================================
      // ENDPOINTS EXISTENTES (mantidos)
      // ==========================================

      case 'instrument-quotes': {
        const instrumentsParam = searchParams.get('instruments');
        if (!instrumentsParam) {
          return NextResponse.json({ 
            success: false, 
            error: 'Instruments parameter is required' 
          }, { status: 400 });
        }
        
        try {
          const instruments = JSON.parse(instrumentsParam);
          if (!Array.isArray(instruments)) {
            throw new Error('Instruments must be an array');
          }
          
          const result = await oplab.getInstrumentQuotes(instruments);
          return NextResponse.json(result);
        } catch {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid instruments parameter. Must be a JSON array.' 
          }, { status: 400 });
        }
      }

      case 'portfolios': {
        const result = await oplab.getPortfolios();
        return NextResponse.json(result);
      }

      case 'portfolio': {
        const portfolioIdParam = searchParams.get('portfolioId');
        if (!portfolioIdParam) {
          return NextResponse.json({ 
            success: false, 
            error: 'Portfolio ID parameter is required' 
          }, { status: 400 });
        }
        
        const portfolioId = parseInt(portfolioIdParam, 10);
        if (isNaN(portfolioId)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Portfolio ID must be a valid number' 
          }, { status: 400 });
        }
        
        const result = await oplab.getPortfolio(portfolioId);
        return NextResponse.json(result);
      }

      case 'interest-rates': {
        const result = await oplab.getInterestRates();
        return NextResponse.json(result);
      }

      case 'interest-rate': {
        const rateId = searchParams.get('rateId');
        if (!rateId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Rate ID parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getInterestRate(rateId);
        return NextResponse.json(result);
      }

      case 'exchanges': {
        const result = await oplab.getExchanges();
        return NextResponse.json(result);
      }

      case 'exchange': {
        const exchangeId = searchParams.get('exchangeId');
        if (!exchangeId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Exchange ID parameter is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getExchange(exchangeId);
        return NextResponse.json(result);
      }

      case 'historical': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const from = searchParams.get('from') || undefined;
        const to = searchParams.get('to') || undefined;
        
        const result = await oplab.getHistoricalData(symbol, from, to);
        return NextResponse.json(result);
      }

      case 'options-history': {
        const underlyingSymbol = searchParams.get('symbol');
        if (!underlyingSymbol) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbol parameter is required' 
          }, { status: 400 });
        }
        
        const date = searchParams.get('date') || undefined;
        
        const result = await oplab.getOptionsHistory(underlyingSymbol, date);
        return NextResponse.json(result);
      }

      case 'user-settings': {
        const group = searchParams.get('group') || undefined;
        const result = await oplab.getUserSettings(group);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}. Available actions: health, authorize, market-data-info, server-time, chart-data, search-instruments, current-quotes, instruments, instrument, instrument-option-series, market-status, stocks, stock, stocks-with-options, options, option, covered-options, option-black-scholes, top-options, top-volume-options, highest-profit-options, biggest-variation-options, trending-options, ibov-correlation-options, fundamentalist-companies, oplab-score-stocks, companies, company, instrument-quotes, portfolios, portfolio, interest-rates, interest-rate, exchanges, exchange, historical, options-history, user-settings` 
          }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Oplab API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Check if service is configured
  try {
    getOplabService();
  } catch {
    const accessToken = process.env.OPLAB_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Oplab access token not configured. Set OPLAB_ACCESS_TOKEN environment variable.' 
        }, 
        { status: 500 }
      );
    }
    
    const baseUrl = process.env.OPLAB_BASE_URL;
    createOplabService({ accessToken, baseUrl });
  }

  const oplab = getOplabService();

  try {
    switch (action) {
      case 'authenticate': {
        const body = await request.json();
        const { email, password } = body;
        
        if (!email || !password) {
          return NextResponse.json({ 
            success: false, 
            error: 'Email and password are required' 
          }, { status: 400 });
        }
        
        const result = await oplab.authenticate(email, password);
        return NextResponse.json(result);
      }

      case 'create-portfolio': {
        const body = await request.json();
        const { name, active = true } = body;
        
        if (!name) {
          return NextResponse.json({ 
            success: false, 
            error: 'Portfolio name is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.createPortfolio(name, active);
        return NextResponse.json(result);
      }

      case 'update-portfolio': {
        const body = await request.json();
        const { portfolioId, ...updateData } = body;
        
        if (!portfolioId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Portfolio ID is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.updatePortfolio(portfolioId, updateData);
        return NextResponse.json(result);
      }

      case 'instrument-quotes': {
        const body = await request.json();
        const { instruments } = body;
        
        if (!instruments || !Array.isArray(instruments)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Instruments array is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getInstrumentQuotes(instruments);
        return NextResponse.json(result);
      }

      case 'instrument-details': {
        const body = await request.json();
        const { symbols } = body;
        
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Symbols array is required' 
          }, { status: 400 });
        }
        
        const result = await oplab.getInstrumentDetails(symbols);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown POST action: ${action}. Available POST actions: authenticate, create-portfolio, update-portfolio, instrument-quotes, instrument-details` 
          }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Oplab API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Check if service is configured
  try {
    getOplabService();
  } catch {
    const accessToken = process.env.OPLAB_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Oplab access token not configured. Set OPLAB_ACCESS_TOKEN environment variable.' 
        }, 
        { status: 500 }
      );
    }
    
    const baseUrl = process.env.OPLAB_BASE_URL;
    createOplabService({ accessToken, baseUrl });
  }

  const oplab = getOplabService();

  try {
    switch (action) {
      case 'delete-portfolio': {
        const portfolioIdParam = searchParams.get('portfolioId');
        if (!portfolioIdParam) {
          return NextResponse.json({ 
            success: false, 
            error: 'Portfolio ID parameter is required' 
          }, { status: 400 });
        }
        
        const portfolioId = parseInt(portfolioIdParam, 10);
        if (isNaN(portfolioId)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Portfolio ID must be a valid number' 
          }, { status: 400 });
        }
        
        const result = await oplab.deletePortfolio(portfolioId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown DELETE action: ${action}. Available DELETE actions: delete-portfolio` 
          }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Oplab API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
} 