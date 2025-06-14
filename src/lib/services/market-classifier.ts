// ==========================================
// MARKET CLASSIFIER - Classificação Inteligente de Mercados
// ==========================================

export type MarketRegion = 'US' | 'BR' | 'UNKNOWN'
export type MarketExchange = 'NASDAQ' | 'NYSE' | 'B3' | 'UNKNOWN'

export interface MarketClassification {
  region: MarketRegion
  exchange: MarketExchange
  currency: string
  confidence: number // 0-1, quão confiante estamos na classificação
  reasons: string[]
  apiProvider: 'ALPHA_VANTAGE' | 'OPLAB'
}

export interface CompanyInfo {
  symbol: string
  name?: string
  classification: MarketClassification
}

class MarketClassifierService {
  // Padrões para empresas brasileiras
  private readonly BRAZILIAN_PATTERNS = [
    // Padrões B3 (4 letras + 1 número)
    /^[A-Z]{4}[0-9]$/,          // PETR4, VALE3, ITUB4
    /^[A-Z]{4}[0-9][0-9]$/,     // PETR11, VALE11 (Units)
    
    // Padrões específicos BR
    /^[A-Z]{4}3$/, // ON (Ordinárias)
    /^[A-Z]{4}4$/, // PN (Preferenciais)
    /^[A-Z]{4}5$/, // PNA
    /^[A-Z]{4}6$/, // PNB
    /^[A-Z]{4}11$/, // Units
  ]

  // Padrões para empresas americanas
  private readonly AMERICAN_PATTERNS = [
    /^[A-Z]{1,5}$/,              // AAPL, MSFT, TSLA, GOOGL
    /^[A-Z]+\.[A-Z]+$/,          // BRK.A, BRK.B
  ]

  // Lista de empresas brasileiras conhecidas
  private readonly KNOWN_BRAZILIAN_COMPANIES = new Set([
    'PETR3', 'PETR4', 'VALE3', 'ITUB3', 'ITUB4', 'BBDC3', 'BBDC4',
    'ABEV3', 'B3SA3', 'RENT3', 'LREN3', 'MGLU3', 'VIVT3', 'JBSS3',
    'WEGE3', 'SUZB3', 'RAIL3', 'CCRO3', 'GGBR4', 'USIM5', 'GOAU4',
    'CMIG4', 'ELETB4', 'BBSE3', 'SANB11', 'ITSA4', 'BEEF3', 'MRFG3',
    'RADL3', 'RAIA3', 'POMO4', 'FLRY3', 'QUAL3', 'HAPV3', 'KLBN11',
    'SUZN3', 'FIBR3', 'TIMS3', 'VIVR3', 'OIBR3', 'OIBR4', 'GOLL4',
    'AZUL4', 'CIEL3', 'PSSA3', 'MULT3', 'ALPA4', 'TEND3', 'YDUQ3',
    'COGN3', 'VBBR3', 'IRBR3', 'WSON33', 'EMBR3', 'EQTL3', 'CSMG3',
    'SBSP3', 'TAEE11', 'EGIE3', 'CPFE3', 'NEOE3', 'AURE3', 'CVCB3',
    'PETZ3', 'NTCO3', 'LWSA3', 'ARML3', 'MOVI3', 'ALSO3', 'SIMH3'
  ])

  // Lista de empresas americanas conhecidas
  private readonly KNOWN_AMERICAN_COMPANIES = new Set([
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA',
    'NFLX', 'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'UBER', 'LYFT',
    'SNAP', 'TWTR', 'FB', 'PYPL', 'SQ', 'SHOP', 'ZOOM', 'DOCU',
    'PLTR', 'SNOW', 'COIN', 'HOOD', 'RBLX', 'UNITY', 'DDOG', 'CRWD',
    'ZM', 'OKTA', 'SPLK', 'MDB', 'TEAM', 'ATLASSIAN', 'WORK', 'SLACK',
    'BRK.A', 'BRK.B', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C',
    'KO', 'PEP', 'JNJ', 'PG', 'UNH', 'V', 'MA', 'DIS', 'HD', 'MCD',
    'WMT', 'CVS', 'PFE', 'ABBV', 'TMO', 'ABT', 'LLY', 'MRK', 'BMY'
  ])

  /**
   * Classifica um símbolo de empresa
   */
  classify(symbol: string): MarketClassification {
    const upperSymbol = symbol.toUpperCase().trim()
    
    // 1. Verificar em listas conhecidas primeiro (alta confiança)
    if (this.KNOWN_BRAZILIAN_COMPANIES.has(upperSymbol)) {
      return {
        region: 'BR',
        exchange: 'B3',
        currency: 'BRL',
        confidence: 0.95,
        reasons: ['Empresa brasileira conhecida na lista'],
        apiProvider: 'OPLAB'
      }
    }

    if (this.KNOWN_AMERICAN_COMPANIES.has(upperSymbol)) {
      return {
        region: 'US',
        exchange: this.guessAmericanExchange(upperSymbol),
        currency: 'USD',
        confidence: 0.95,
        reasons: ['Empresa americana conhecida na lista'],
        apiProvider: 'ALPHA_VANTAGE'
      }
    }

    // 2. Verificar padrões brasileiros
    const isBrazilianPattern = this.BRAZILIAN_PATTERNS.some(pattern => 
      pattern.test(upperSymbol)
    )

    if (isBrazilianPattern) {
      return {
        region: 'BR',
        exchange: 'B3',
        currency: 'BRL',
        confidence: 0.85,
        reasons: ['Padrão de nomenclatura brasileiro (4 letras + dígito)'],
        apiProvider: 'OPLAB'
      }
    }

    // 3. Verificar padrões americanos
    const isAmericanPattern = this.AMERICAN_PATTERNS.some(pattern => 
      pattern.test(upperSymbol)
    )

    if (isAmericanPattern) {
      return {
        region: 'US',
        exchange: this.guessAmericanExchange(upperSymbol),
        currency: 'USD',
        confidence: 0.75,
        reasons: ['Padrão de nomenclatura americana (1-5 letras)'],
        apiProvider: 'ALPHA_VANTAGE'
      }
    }

    // 4. Heurísticas adicionais
    const reasons: string[] = []
    let confidence = 0.5
    let region: MarketRegion = 'UNKNOWN'
    let apiProvider: 'ALPHA_VANTAGE' | 'OPLAB' = 'ALPHA_VANTAGE'

    // Se tem sufixo numérico, provavelmente é brasileiro
    if (/[0-9]$/.test(upperSymbol)) {
      region = 'BR'
      apiProvider = 'OPLAB'
      confidence = 0.7
      reasons.push('Sufixo numérico indica empresa brasileira')
    }
    // Se é muito curto e só letras, provavelmente é americano
    else if (upperSymbol.length <= 5 && /^[A-Z]+$/.test(upperSymbol)) {
      region = 'US'
      apiProvider = 'ALPHA_VANTAGE'
      confidence = 0.6
      reasons.push('Símbolo curto só com letras indica empresa americana')
    }

    return {
      region,
      exchange: region === 'BR' ? 'B3' : (region === 'US' ? this.guessAmericanExchange(upperSymbol) : 'UNKNOWN'),
      currency: region === 'BR' ? 'BRL' : (region === 'US' ? 'USD' : 'USD'),
      confidence,
      reasons: reasons.length > 0 ? reasons : ['Classificação incerta'],
      apiProvider
    }
  }

  /**
   * Tenta adivinhar a exchange americana baseada no símbolo
   */
  private guessAmericanExchange(symbol: string): MarketExchange {
    // Alguns padrões conhecidos
    const nasdaqPatterns = [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA',
      'NFLX', 'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD'
    ]

    if (nasdaqPatterns.includes(symbol)) {
      return 'NASDAQ'
    }

    // Se contém ponto, provavelmente NYSE (BRK.A, BRK.B)
    if (symbol.includes('.')) {
      return 'NYSE'
    }

    // Default para NASDAQ para símbolos tech
    return 'NASDAQ'
  }

  /**
   * Analisa múltiplos símbolos
   */
  classifyMultiple(symbols: string[]): CompanyInfo[] {
    return symbols.map(symbol => ({
      symbol,
      classification: this.classify(symbol)
    }))
  }

  /**
   * Retorna sugestões baseadas na classificação
   */
  getSuggestions(classification: MarketClassification): string[] {
    const suggestions: string[] = []

    if (classification.region === 'BR') {
      suggestions.push('💡 Para empresas brasileiras, use símbolos como PETR4, VALE3, ITUB4')
      suggestions.push('💡 Adicione o dígito ao final (3 para ON, 4 para PN, 11 para Units)')
    } else if (classification.region === 'US') {
      suggestions.push('💡 Para empresas americanas, use símbolos como AAPL, MSFT, TSLA')
      suggestions.push('💡 Símbolos americanos são normalmente 1-5 letras sem números')
    }

    if (classification.confidence < 0.7) {
      suggestions.push('⚠️ Classificação incerta - verifique se o símbolo está correto')
    }

    return suggestions
  }

  /**
   * Retorna informações sobre cobertura da API
   */
  getApiCoverage(region: MarketRegion): string {
    switch (region) {
      case 'BR':
        return '🇧🇷 Dados fornecidos pela OpLab - Mercado Brasileiro (B3)'
      case 'US':
        return '🇺🇸 Dados fornecidos pela Alpha Vantage - Mercado Americano'
      default:
        return '🌍 Tentaremos identificar automaticamente o mercado'
    }
  }
}

// Singleton
export const marketClassifier = new MarketClassifierService()

// Helper functions
export const classifySymbol = (symbol: string) => marketClassifier.classify(symbol)
export const classifySymbols = (symbols: string[]) => marketClassifier.classifyMultiple(symbols)
export const getApiProvider = (symbol: string) => marketClassifier.classify(symbol).apiProvider
export const isAmericanStock = (symbol: string) => marketClassifier.classify(symbol).region === 'US'
export const isBrazilianStock = (symbol: string) => marketClassifier.classify(symbol).region === 'BR' 