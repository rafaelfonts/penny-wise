# 🚀 Penny Wise - OpLab Integration

## 📋 Resumo

Integração completa com a API OpLab para dados do mercado brasileiro (B3), incluindo ações, opções, análises fundamentalistas e comandos de chat especializados.

## 🎯 Funcionalidades

### 📊 Dados de Mercado
- **Cotações em tempo real** - Preços atualizados da B3
- **Dados históricos** - Gráficos e análise técnica
- **Status do mercado** - Horário de funcionamento e pregão

### 🎯 Opções e Derivativos
- **Cadeia de opções** - Calls e puts disponíveis
- **Análise Black-Scholes** - Cálculos de precificação
- **Estratégias cobertas** - Covered calls e proteções
- **Rankings de opções** - Volume, lucro, variação

### 💼 Análise Fundamentalista
- **Dados empresariais** - Informações detalhadas
- **Indicadores financeiros** - P/L, ROE, ROCE, dividend yield
- **Rankings fundamentalistas** - Classificação por múltiplos
- **OpLab Score** - Pontuação proprietária

### 🤖 Comandos de Chat
- **17 comandos específicos** - Integrados ao chat IA
- **Detecção automática** - Parse inteligente de símbolos
- **Respostas formatadas** - Dados estruturados e legíveis

## 🔧 Configuração

### Variáveis de Ambiente

```env
# API OpLab
OPLAB_ACCESS_TOKEN=seu_token_aqui
OPLAB_BASE_URL=https://api.oplab.com.br/v3

# Cache (recomendado)
REDIS_URL=redis://localhost:6379
```

### Obter Token OpLab

1. Acesse [oplab.com.br](https://oplab.com.br)
2. Faça cadastro/login
3. Vá em "API" ou "Desenvolvedores"
4. Gere seu token de acesso
5. Configure no `.env.local`

## 💬 Comandos de Chat Disponíveis

### 📊 Status e Cotações
```bash
/market-status              # Status do mercado brasileiro
/current-quotes PETR4 VALE3 # Cotações em tempo real
/chart PETR4 1D             # Dados históricos do gráfico
/search petrobras           # Buscar instrumentos
```

### 🏢 Ações e Empresas
```bash
/stocks                     # Lista todas as ações
/stocks-with-options        # Ações que possuem opções
/companies                  # Lista de empresas
/company PETR4              # Informações da empresa
```

### 🎯 Opções e Derivativos
```bash
/options PETR4              # Cadeia de opções
/covered-options PETR4      # Opções para estratégias cobertas
/black-scholes PETR4C45     # Cálculo Black-Scholes
/top-options volume         # Rankings por volume/profit/variação
/ibov-correlation           # Opções por correlação IBOV
```

### 💼 Análise Fundamentalista
```bash
/fundamentals pl            # Ranking por P/L
/fundamentals roe           # Ranking por ROE
/fundamentals dividend_yield # Ranking por dividend yield
/oplab-score               # Ranking OpLab Score
```

### 🔧 Utilitários
```bash
/instruments               # Lista instrumentos disponíveis
/instrument PETR4          # Detalhes de instrumento específico
/help                      # Mostrar todos os comandos
```

## 📡 API Reference

### Endpoints Principais

```typescript
// Status do mercado
GET /api/market/oplab?action=market-status

// Cotações
GET /api/market/oplab?action=current-quotes&symbols=PETR4,VALE3

// Cadeia de opções
GET /api/market/oplab?action=options&symbol=PETR4

// Análise fundamentalista
GET /api/market/oplab?action=fundamentals&attribute=pl

// Black-Scholes
GET /api/market/oplab?action=black-scholes&option=PETR4C45
```

### Exemplo de Uso

```typescript
// Obter cotações
const response = await fetch('/api/market/oplab?action=current-quotes&symbols=PETR4');
const data = await response.json();

if (data.success) {
  console.log('Cotação PETR4:', data.data[0].price);
}
```

### Resposta Padrão

```json
{
  "success": true,
  "data": [
    {
      "symbol": "PETR4",
      "price": 42.50,
      "change": 1.25,
      "changePercent": 3.03,
      "volume": 1500000,
      "timestamp": "2025-01-31T18:00:00Z"
    }
  ],
  "source": "oplab",
  "timestamp": "2025-01-31T18:00:00Z"
}
```

## 🔄 Cache e Performance

### Estratégia de Cache

```typescript
// TTL por tipo de dados
const cacheTTL = {
  marketStatus: 60,      // 1 minuto
  quotes: 15,           // 15 segundos
  options: 300,         // 5 minutos
  fundamentals: 3600,   // 1 hora
  companies: 86400      // 24 horas
};
```

### Performance

- **Rate Limiting**: 100 req/min por usuário
- **Cache Redis**: Hit rate ~85%
- **Fallback**: Gracioso em caso de erro
- **Timeout**: 30s máximo por request

## 🛠️ Desenvolvimento

### Service Implementation

```typescript
// src/lib/services/oplab.ts
export class OpLabService {
  private baseURL = 'https://api.oplab.com.br/v3';
  private token = process.env.OPLAB_ACCESS_TOKEN;

  async getMarketStatus(): Promise<MarketStatus> {
    const response = await this.request('/market-status');
    return response.data;
  }

  async getCurrentQuotes(symbols: string[]): Promise<Quote[]> {
    const response = await this.request('/current-quotes', {
      symbols: symbols.join(',')
    });
    return response.data;
  }

  private async request(endpoint: string, params?: Record<string, any>) {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpLab API error: ${response.status}`);
    }

    return response.json();
  }
}
```

### Chat Integration

```typescript
// src/lib/services/chat-commands.ts
export const OPLAB_COMMANDS = {
  '/market-status': async () => {
    const oplab = new OpLabService();
    const status = await oplab.getMarketStatus();
    return formatMarketStatus(status);
  },

  '/options': async (args: string[]) => {
    if (!args[0]) return 'Uso: /options SYMBOL';
    
    const oplab = new OpLabService();
    const options = await oplab.getOptionsChain(args[0]);
    return formatOptionsChain(options);
  }
  // ... outros comandos
};
```

## 🧪 Testes

### Teste de Integração

```bash
# Testar conexão e integração OpLab
npm run test:integration

# Testar comandos específicos
npm run test:unit

# Testar performance
npm run test:e2e
```

### Validação Manual

```bash
# Teste básico
curl -H "Authorization: Bearer $OPLAB_ACCESS_TOKEN" \
  https://api.oplab.com.br/v3/market-status

# Teste cotações
curl -H "Authorization: Bearer $OPLAB_ACCESS_TOKEN" \
  "https://api.oplab.com.br/v3/current-quotes?symbols=PETR4,VALE3"
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Token Inválido (403)
```bash
# Verificar token
echo $OPLAB_ACCESS_TOKEN

# Testar manualmente
curl -H "Authorization: Bearer $OPLAB_ACCESS_TOKEN" \
  https://api.oplab.com.br/v3/health
```

#### Rate Limit (429)
- Aguarde 1 minuto
- Implemente exponential backoff
- Use cache para reduzir requests

#### Dados Indisponíveis
- Verifique horário do mercado
- Confirme se símbolo existe
- Use símbolos alternativos

### Logs de Debug

```typescript
// Habilitar logs verbosos
process.env.OPLAB_DEBUG = 'true';

// Ver requests/responses
process.env.OPLAB_LOG_REQUESTS = 'true';
```

## 📊 Métricas e Monitoramento

### Métricas Disponíveis

```typescript
// Dashboard de métricas
const metrics = {
  requestsPerMinute: 45,
  cacheHitRate: 0.85,
  averageResponseTime: 250, // ms
  errorRate: 0.02,
  availableSymbols: 500+
};
```

### Alertas

- **Rate limit próximo**: >80 req/min
- **Error rate alto**: >5%
- **Response time alto**: >2s
- **Cache hit baixo**: <70%

## 🔮 Roadmap

### Próximas Features

- [ ] **WebSocket streaming** - Dados em tempo real
- [ ] **Alertas personalizados** - Baseados em preços/volumes
- [ ] **Backtesting** - Simulação de estratégias
- [ ] **Portfolio tracking** - Acompanhamento de carteira
- [ ] **Análise técnica** - Indicadores avançados

### Melhorias Planejadas

- [ ] **Cache distribuído** - Redis Cluster
- [ ] **Retry inteligente** - Exponential backoff
- [ ] **Circuit breaker** - Proteção contra falhas
- [ ] **Métricas avançadas** - Observabilidade completa

## 🔗 Links Relacionados

- [Chat System](./chat-system.md) - Sistema de chat integrado
- [Market Data](./market-data.md) - Outras fontes de dados
- [API Reference](../05-api-reference/market-data-api.md) - APIs completas
- [Troubleshooting](../07-operations/troubleshooting.md) - Resolução de problemas

---

*📅 Atualizado em: Janeiro 2025*  
*👤 Maintainer: Penny Wise Team* 