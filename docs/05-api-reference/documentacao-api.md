# 📚 Documentação da API - Penny Wise

## Visão Geral

A API do Penny Wise fornece acesso programático a dados de mercado financeiro, informações de portfólio e capacidades de assistente IA. Esta documentação descreve todos os endpoints disponíveis, métodos de autenticação e exemplos de uso.

## 🔐 Autenticação

### Visão Geral da Autenticação
A API do Penny Wise usa autenticação baseada em JWT através do Supabase Auth.

### Obtendo um Token de Acesso
```javascript
// Usando SDK do Supabase
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Token está em data.session.access_token
```

### Usando Tokens
Inclua o token de acesso no header Authorization:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 Endpoints de Dados de Mercado

### Obter Cotação de Ação
```http
GET /api/market/quote/{symbol}
```

**Parâmetros:**
- `symbol` (obrigatório): Símbolo da ação (ex: AAPL, MSFT)

**Resposta:**
```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "change": 2.50,
  "changePercent": 1.69,
  "volume": 1250000,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Obter Dados Históricos
```http
GET /api/market/historical/{symbol}
```

**Parâmetros de Query:**
- `period`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
- `interval`: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo

**Resposta:**
```json
{
  "symbol": "AAPL",
  "data": [
    {
      "date": "2025-01-15",
      "open": 148.50,
      "high": 151.20,
      "low": 147.80,
      "close": 150.25,
      "volume": 1250000
    }
  ]
}
```

### Buscar Ações
```http
GET /api/market/search
```

**Parâmetros de Query:**
- `q`: Termo de busca (nome da empresa ou símbolo)
- `limit`: Número de resultados (padrão: 10)

**Resposta:**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "type": "stock",
      "region": "US",
      "marketOpen": "09:30",
      "marketClose": "16:00",
      "timezone": "UTC-05"
    }
  ]
}
```

## 💼 Endpoints de Portfólio

### Obter Portfólio do Usuário
```http
GET /api/portfolio
```

**Headers:**
- `Authorization`: Bearer token obrigatório

**Resposta:**
```json
{
  "totalValue": 25000.50,
  "totalChange": 1250.25,
  "totalChangePercent": 5.25,
  "holdings": [
    {
      "id": "uuid",
      "symbol": "AAPL",
      "quantity": 10,
      "avgCost": 140.00,
      "currentPrice": 150.25,
      "value": 1502.50,
      "gain": 102.50,
      "gainPercent": 7.32
    }
  ]
}
```

### Adicionar Posição
```http
POST /api/portfolio/positions
```

**Corpo da Requisição:**
```json
{
  "symbol": "AAPL",
  "quantity": 10,
  "price": 150.25,
  "date": "2025-01-15",
  "type": "buy"
}
```

**Resposta:**
```json
{
  "id": "uuid",
  "message": "Posição adicionada com sucesso",
  "position": {
    "symbol": "AAPL",
    "quantity": 10,
    "avgCost": 150.25,
    "totalValue": 1502.50
  }
}
```

### Atualizar Posição
```http
PUT /api/portfolio/positions/{id}
```

**Parâmetros:**
- `id`: ID da posição

**Corpo da Requisição:**
```json
{
  "quantity": 15,
  "price": 148.00
}
```

### Excluir Posição
```http
DELETE /api/portfolio/positions/{id}
```

**Resposta:**
```json
{
  "message": "Posição excluída com sucesso"
}
```

## 🤖 Endpoints do Chat IA

### Enviar Mensagem para o Chat
```http
POST /api/chat
```

**Headers:**
- `Authorization`: Bearer token obrigatório

**Corpo da Requisição:**
```json
{
  "message": "Devo comprar ações da Apple agora?",
  "context": {
    "portfolio": true,
    "marketData": true
  }
}
```

**Resposta:**
```json
{
  "response": "Com base na análise atual da Apple...",
  "sources": [
    {
      "type": "market_data",
      "data": "AAPL current price: $150.25"
    }
  ],
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Obter Histórico do Chat
```http
GET /api/chat/history
```

**Parâmetros de Query:**
- `limit`: Número de mensagens (padrão: 50)
- `offset`: Offset para paginação

**Resposta:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "message": "Pergunta do usuário",
      "response": "Resposta da IA",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

## 📈 Endpoints de Analytics

### Obter Performance do Portfólio
```http
GET /api/analytics/performance
```

**Parâmetros de Query:**
- `period`: 1d, 1w, 1m, 3m, 6m, 1y, ytd, all

**Resposta:**
```json
{
  "period": "1m",
  "startValue": 20000.00,
  "endValue": 25000.50,
  "gain": 5000.50,
  "gainPercent": 25.00,
  "dailyReturns": [
    {
      "date": "2025-01-15",
      "value": 25000.50,
      "change": 250.25,
      "changePercent": 1.01
    }
  ]
}
```

### Obter Alocação de Ativos
```http
GET /api/analytics/allocation
```

**Resposta:**
```json
{
  "sectors": [
    {
      "name": "Tecnologia",
      "value": 15000.00,
      "percent": 60.0,
      "change": 750.00,
      "changePercent": 5.26
    }
  ],
  "assets": [
    {
      "symbol": "AAPL",
      "value": 1502.50,
      "percent": 6.01,
      "sector": "Tecnologia"
    }
  ]
}
```

## 🔔 Endpoints de Alertas

### Obter Alertas do Usuário
```http
GET /api/alerts
```

**Resposta:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "symbol": "AAPL",
      "type": "price_above",
      "threshold": 155.00,
      "currentPrice": 150.25,
      "active": true,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Criar Alerta
```http
POST /api/alerts
```

**Corpo da Requisição:**
```json
{
  "symbol": "AAPL",
  "type": "price_above",
  "threshold": 155.00,
  "message": "Apple atingiu $155!"
}
```

### Atualizar Alerta
```http
PUT /api/alerts/{id}
```

### Excluir Alerta
```http
DELETE /api/alerts/{id}
```

## 🌐 WebSocket API

### Conexão WebSocket
```javascript
const ws = new WebSocket('wss://api.pennywise.com/ws');

// Autenticação via WebSocket
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));

// Inscrever-se em atualizações de preço
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'quotes',
  symbols: ['AAPL', 'MSFT', 'GOOGL']
}));
```

### Mensagens WebSocket

**Atualização de Preço:**
```json
{
  "type": "quote_update",
  "data": {
    "symbol": "AAPL",
    "price": 150.30,
    "change": 0.05,
    "timestamp": "2025-01-15T10:30:15Z"
  }
}
```

**Atualização de Portfólio:**
```json
{
  "type": "portfolio_update",
  "data": {
    "totalValue": 25005.00,
    "totalChange": 1255.75,
    "changedPositions": ["AAPL"]
  }
}
```

## ❌ Tratamento de Erros

### Códigos de Status HTTP
- `200` - Sucesso
- `201` - Criado
- `400` - Requisição Inválida
- `401` - Não Autorizado
- `403` - Proibido
- `404` - Não Encontrado
- `429` - Muitas Requisições
- `500` - Erro Interno do Servidor

### Formato de Erro
```json
{
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Símbolo da ação não encontrado",
    "details": {
      "symbol": "INVALID",
      "suggestions": ["AAPL", "MSFT"]
    }
  }
}
```

### Códigos de Erro Comuns
- `INVALID_SYMBOL` - Símbolo de ação inválido
- `INSUFFICIENT_PERMISSIONS` - Permissões insuficientes
- `RATE_LIMIT_EXCEEDED` - Limite de taxa excedido
- `INVALID_TOKEN` - Token de autenticação inválido
- `MARKET_CLOSED` - Mercado fechado para operação solicitada

## ⚡ Rate Limiting

### Limites
- **Usuários Gratuitos**: 100 requisições/hora
- **Usuários Premium**: 1000 requisições/hora
- **WebSocket**: 50 mensagens/minuto

### Headers de Rate Limit
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## 🧪 SDK e Exemplos

### SDK JavaScript
```bash
npm install @penny-wise/api-client
```

```javascript
import { PennyWiseClient } from '@penny-wise/api-client';

const client = new PennyWiseClient({
  apiKey: 'your-api-key'
});

// Obter cotação
const quote = await client.getQuote('AAPL');

// Obter portfólio
const portfolio = await client.getPortfolio();

// Enviar mensagem para chat
const response = await client.sendChatMessage('Como está meu portfólio?');
```

### SDK Python
```bash
pip install penny-wise-api
```

```python
from penny_wise import PennyWiseClient

client = PennyWiseClient(api_key='your-api-key')

# Obter cotação
quote = client.get_quote('AAPL')

# Obter portfólio
portfolio = client.get_portfolio()

# Enviar mensagem para chat
response = client.send_chat_message('Como está meu portfólio?')
```

## 🔧 Ambiente de Teste

### URLs Base
- **Produção**: `https://api.pennywise.com`
- **Staging**: `https://staging-api.pennywise.com`
- **Desenvolvimento**: `http://localhost:3000/api`

### Dados de Teste
Para desenvolvimento, use estes símbolos de teste:
- `TEST_STOCK` - Ação de teste com dados fictícios
- `TEST_ETF` - ETF de teste
- `TEST_CRYPTO` - Criptomoeda de teste

### Contas de Teste
```
Email: test@pennywise.com
Senha: TestPassword123
```

## 📱 Versionamento da API

### Versão Atual
`v1` - Versão estável atual

### Controle de Versão
- URLs incluem prefixo de versão: `/api/v1/`
- Versionamento semântico para mudanças breaking
- Suporte para versões antigas por 12 meses

### Migração de Versão
```javascript
// v1 (atual)
const response = await fetch('/api/v1/portfolio');

// v2 (futura)
const response = await fetch('/api/v2/portfolio');
```

## 🔍 Monitoramento e Observabilidade

### Status da API
```http
GET /api/health
```

**Resposta:**
```json
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "external_apis": "healthy"
  }
}
```

### Métricas
- Tempo de resposta médio: <200ms
- Disponibilidade: 99.9%
- Taxa de erro: <0.1%

## 🆘 Suporte

### Recursos de Ajuda
- **Documentação**: Esta documentação
- **Exemplos**: `/examples` no GitHub
- **Status**: [status.pennywise.com](https://status.pennywise.com)

### Contato
- **E-mail**: api-support@pennywise.com.br
- **Discord**: [Servidor da Comunidade](https://discord.gg/pennywise)
- **GitHub**: [Issues](https://github.com/pennywise/api/issues)

### SLA
- **Tempo de Resposta**: 24 horas para questões gerais
- **Tempo de Resposta Crítico**: 2 horas para problemas de produção
- **Disponibilidade**: 99.9% uptime garantido

---

## 📝 Changelog

### v1.2.3 (2025-01-15)
- ✅ Adicionada autenticação OAuth2
- ✅ Melhoradas mensagens de erro
- ✅ Novos endpoints de analytics

### v1.2.2 (2025-01-10)
- ✅ Suporte a WebSocket para atualizações em tempo real
- ✅ Otimizações de performance
- 🐛 Correções de bugs menores

### v1.2.1 (2025-01-05)
- ✅ Novos endpoints de alertas
- ✅ SDK Python adicionado
- 📚 Documentação melhorada

---

*📅 Atualizado em: Janeiro 2025*  
*👤 Maintainer: Equipe API Penny Wise*  
*📄 Versão da API: v1.2.3* 