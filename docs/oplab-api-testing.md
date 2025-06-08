# Oplab API Testing Guide

## Overview

A funcionalidade Oplab API foi implementada como um **serviço de demonstração mock** que simula dados de mercado brasileiro (B3) para fins de teste e desenvolvimento. Este serviço fornece dados realistas simulados para ações brasileiras, opções e informações de mercado.

> **⚠️ IMPORTANTE**: Esta é uma implementação mock/simulação - não acessa APIs externas reais. Os dados são gerados programaticamente para demonstração.

## Características do Serviço Mock

- **Dados Realistas**: Simula 10 ações brasileiras populares (PETR4, VALE3, ITUB4, etc.)
- **Volatilidade Simulada**: Gera variações de preço com volatilidade realista
- **Latência Simulada**: Inclui delays para simular chamadas de API reais
- **Dados Completos**: Inclui cotações, dados intraday/daily, opções e status de mercado

## Ações Disponíveis no Mock

O serviço simula dados para as seguintes ações:

| Símbolo | Nome da Empresa | Setor | Preço Base |
|---------|----------------|-------|------------|
| PETR4 | Petróleo Brasileiro S.A. - Petrobras | Energy | R$ 38.45 |
| VALE3 | Vale S.A. | Mining | R$ 61.23 |
| ITUB4 | Itaú Unibanco Holding S.A. | Banking | R$ 34.78 |
| BBDC4 | Banco Bradesco S.A. | Banking | R$ 15.67 |
| ABEV3 | Ambev S.A. | Beverages | R$ 17.89 |
| B3SA3 | B3 S.A. - Brasil, Bolsa, Balcão | Financial | R$ 16.45 |
| RENT3 | Localiza Rent a Car S.A. | Services | R$ 48.23 |
| WEGE3 | WEG S.A. | Industrial | R$ 42.56 |
| MGLU3 | Magazine Luiza S.A. | Retail | R$ 6.78 |
| LREN3 | Lojas Renner S.A. | Retail | R$ 25.34 |

## Como Testar

### 1. Interface Web (Recomendado)

Acesse a página de teste no navegador:
```
http://localhost:3000/test-oplab
```

A interface oferece:
- **Configuração**: Defina símbolos, intervalos e parâmetros
- **Testes Individuais**: Execute cada função separadamente
- **Visualização de Resultados**: JSON formatado com highlighting

### 2. API REST

#### URL Base
```
http://localhost:3000/api/market/oplab
```

#### Endpoints Disponíveis

**Health Check**
```bash
curl "http://localhost:3000/api/market/oplab?action=health"
```

**Cotação de Ação**
```bash
curl "http://localhost:3000/api/market/oplab?action=quote&symbol=PETR4"
```

**Dados Intraday**
```bash
curl "http://localhost:3000/api/market/oplab?action=intraday&symbol=PETR4&interval=5min"
```

**Dados Históricos Diários**
```bash
curl "http://localhost:3000/api/market/oplab?action=daily&symbol=PETR4&days=30"
```

**Cadeia de Opções**
```bash
curl "http://localhost:3000/api/market/oplab?action=options-chain&symbol=PETR4"
```

**Cotação de Opção**
```bash
curl "http://localhost:3000/api/market/oplab?action=option-quote&option_symbol=PETR4O120"
```

**Status do Mercado**
```bash
curl "http://localhost:3000/api/market/oplab?action=market-status"
```

**Top Ações**
```bash
curl "http://localhost:3000/api/market/oplab?action=top-stocks&limit=10"
```

**Validar Símbolo**
```bash
curl "http://localhost:3000/api/market/oplab?action=validate&symbol=PETR4"
```

## Estrutura das Respostas

Todas as respostas seguem o padrão:

```json
{
  "success": boolean,
  "data": object | null,
  "error": string | null,
  "timestamp": string
}
```

### Exemplo de Resposta - Cotação

```json
{
  "success": true,
  "data": {
    "symbol": "PETR4",
    "name": "Petróleo Brasileiro S.A. - Petrobras",
    "price": 38.92,
    "change": 0.47,
    "changePercent": 1.22,
    "volume": 15234567,
    "high": 39.15,
    "low": 38.45,
    "open": 38.78,
    "previousClose": 38.45,
    "marketCap": 125678900000,
    "pe": 18.45,
    "eps": 2.11,
    "dividend": 1.25,
    "lastUpdate": "2024-01-15T10:30:00.000Z",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "source": "oplab-mock"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Exemplo de Resposta - Dados Intraday

```json
{
  "success": true,
  "data": {
    "symbol": "PETR4",
    "interval": "5min",
    "data": [
      {
        "timestamp": "2024-01-15T09:00:00.000Z",
        "open": 38.45,
        "high": 38.67,
        "low": 38.32,
        "close": 38.55,
        "volume": 123456
      }
    ],
    "lastRefreshed": "2024-01-15T10:30:00.000Z",
    "source": "oplab-mock"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Intervalos Suportados

Para dados intraday:
- `1min` - 1 minuto
- `5min` - 5 minutos (padrão)
- `15min` - 15 minutos
- `30min` - 30 minutos
- `60min` - 60 minutos

## Status do Mercado Simulado

O mock simula diferentes status baseado no horário atual:
- **OPEN**: 09:00 - 18:00
- **PRE_MARKET**: 08:00 - 09:00
- **AFTER_HOURS**: 18:00 - 20:00
- **CLOSED**: Demais horários

## Tratamento de Erros

### Símbolos Inválidos
```json
{
  "success": false,
  "error": "Symbol INVALID not found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Parâmetros Faltando
```json
{
  "success": false,
  "error": "Symbol parameter is required",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Performance e Limitações

- **Latência Simulada**: 50ms - 600ms por requisição
- **Símbolos Limitados**: Apenas 10 ações brasileiras
- **Dados Simulados**: Não são dados reais de mercado
- **Rate Limiting**: Nenhum (por ser mock)

## Desenvolvimento e Customização

O serviço mock está localizado em:
```
src/lib/services/oplab.ts
```

Para adicionar novas ações ou modificar comportamentos:

1. Edite o objeto `BRAZILIAN_STOCKS`
2. Ajuste algoritmos de geração de dados
3. Modifique padrões de volatilidade

## Próximos Passos

Para usar dados reais:

1. **Integração com Providers Reais**: Alpha Vantage, Yahoo Finance, B3 APIs
2. **Autenticação**: Implementar chaves de API
3. **Cache**: Adicionar estratégias de cache para dados reais
4. **Rate Limiting**: Implementar controles de taxa
5. **Websockets**: Para dados em tempo real

## Conclusão

Este serviço mock fornece uma base sólida para desenvolvimento e testes da funcionalidade de dados de mercado. Permite validar a interface e fluxos de dados antes de integrar com provedores reais de dados financeiros. 