# Oplab API Testing Guide

## Overview

A integração Oplab API foi implementada para conectar diretamente com a **API real do Oplab** conforme a documentação oficial em https://apidocs.oplab.com.br/. Esta implementação fornece acesso completo aos dados de mercado brasileiro, opções, portfólios e análises fundamentalistas.

> **⚠️ IMPORTANTE**: Esta é uma implementação REAL que conecta com a API oficial do Oplab. Você precisará de um token de acesso válido para utilizar os endpoints.

## Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu arquivo `.env.local`:

```bash
# Token de acesso da API Oplab (obrigatório)
OPLAB_ACCESS_TOKEN=seu_token_de_acesso_aqui

# URL base da API (opcional - padrão: https://api.oplab.com.br/v3)
OPLAB_BASE_URL=https://api.oplab.com.br/v3
```

### Obtendo um Token de Acesso

1. Acesse [oplab.com.br](https://oplab.com.br) e crie uma conta
2. Faça login na sua conta
3. Acesse as configurações da API ou entre em contato com o suporte para obter seu token
4. Configure o token na variável de ambiente `OPLAB_ACCESS_TOKEN`

## Endpoints Disponíveis

A API está organizada nos seguintes grupos:

### 🔧 Sistema
- **Health Check**: `GET /api/market/oplab?action=health`
- **Autorização**: `GET /api/market/oplab?action=authorize&context={default|chart}`
- **Configurações do Usuário**: `GET /api/market/oplab?action=user-settings&group={optional}`

### 🔐 Autenticação
- **Autenticar**: `POST /api/market/oplab?action=authenticate`
  ```json
  {
    "email": "user@example.com",
    "password": "password",
    "context": "default"
  }
  ```

### 📈 Ações
- **Todas as Ações**: `GET /api/market/oplab?action=stocks`
- **Ação Específica**: `GET /api/market/oplab?action=stock&symbol=PETR4`
- **Ações com Opções**: `GET /api/market/oplab?action=stocks-with-options`

### 📊 Opções
- **Cadeia de Opções**: `GET /api/market/oplab?action=options&symbol=PETR4`
- **Opção Específica**: `GET /api/market/oplab?action=option&symbol=PETR4C2800`
- **Histórico de Opções**: `GET /api/market/oplab?action=options-history&symbol=PETR4&date=2024-01-15`

### 🎯 Portfólios
- **Todos os Portfólios**: `GET /api/market/oplab?action=portfolios`
- **Portfólio Específico**: `GET /api/market/oplab?action=portfolio&portfolioId=123`
- **Criar Portfólio**: `POST /api/market/oplab?action=create-portfolio`
  ```json
  {
    "name": "Meu Portfólio",
    "active": true
  }
  ```
- **Atualizar Portfólio**: `POST /api/market/oplab?action=update-portfolio`
  ```json
  {
    "portfolioId": 123,
    "name": "Novo Nome",
    "active": false
  }
  ```
- **Excluir Portfólio**: `DELETE /api/market/oplab?action=delete-portfolio&portfolioId=123`

### 💰 Dados de Mercado
- **Status do Mercado**: `GET /api/market/oplab?action=market-status`
- **Taxas de Juros**: `GET /api/market/oplab?action=interest-rates`
- **Taxa Específica**: `GET /api/market/oplab?action=interest-rate&rateId=SELIC`
- **Bolsas de Valores**: `GET /api/market/oplab?action=exchanges`
- **Bolsa Específica**: `GET /api/market/oplab?action=exchange&exchangeId=BOVESPA`
- **Dados Históricos**: `GET /api/market/oplab?action=historical&symbol=PETR4&from=2024-01-01&to=2024-12-31`

### 🏆 Rankings
- **Opções por Volume**: `GET /api/market/oplab?action=top-volume-options`
- **Opções com Maior Lucro**: `GET /api/market/oplab?action=highest-profit-options`
- **Maior Variação**: `GET /api/market/oplab?action=biggest-variation-options`
- **Correlação com Ibovespa**: `GET /api/market/oplab?action=ibov-correlation-options`
- **Score Oplab**: `GET /api/market/oplab?action=oplab-score-stocks`
- **Análise Fundamentalista**: `GET /api/market/oplab?action=fundamentalist-companies&attribute=market-cap`

### 📋 Instrumentos
- **Instrumento Específico**: `GET /api/market/oplab?action=instrument&symbol=PETR4`
- **Cotações de Instrumentos**: `POST /api/market/oplab?action=instrument-quotes`
  ```json
  {
    "instruments": ["PETR4", "VALE3", "ITUB4"]
  }
  ```

## Métodos de Teste

### 1. Interface Web (Recomendado)

Acesse a página de teste em desenvolvimento:
```
http://localhost:3000/test-oplab
```

A interface oferece:
- **Aba Configuration**: Configure parâmetros de teste
- **Aba Individual Tests**: Execute testes específicos por categoria
- **Aba Results**: Visualize resultados detalhados com timing e dados

### 2. API REST Direta

#### Health Check
```bash
curl "http://localhost:3000/api/market/oplab?action=health"
```

#### Obter Ações
```bash
curl "http://localhost:3000/api/market/oplab?action=stocks"
```

#### Cotação de Ação
```bash
curl "http://localhost:3000/api/market/oplab?action=stock&symbol=PETR4"
```

#### Autenticação
```bash
curl -X POST "http://localhost:3000/api/market/oplab?action=authenticate" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password",
    "context": "default"
  }'
```

### 3. Ferramentas HTTP

Use Postman, Insomnia ou Thunder Client com os exemplos acima.

## Estrutura de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "data": {
    // Dados específicos do endpoint
  },
  "status": 200
}
```

Em caso de erro:

```json
{
  "success": false,
  "error": "Descrição do erro",
  "status": 400
}
```

## Exemplos de Resposta

### Cotação de Ação (Stock)
```json
{
  "success": true,
  "data": {
    "symbol": "PETR4",
    "name": "PETROBRAS PN",
    "market": {
      "open": 28.50,
      "high": 29.10,
      "low": 28.20,
      "close": 28.85,
      "vol": 45678900,
      "fin_volume": 1316445.65,
      "trades": 12456,
      "bid": 28.84,
      "ask": 28.86,
      "variation": 1.23,
      "previous_close": 28.50
    },
    "info": {
      "category": "ON/PN",
      "contract_size": 1,
      "has_options": true
    },
    "staged": false
  },
  "status": 200
}
```

### Opção
```json
{
  "success": true,
  "data": {
    "symbol": "PETR4C2800",
    "name": "PETR CALL 28,00",
    "market": {
      "open": 1.45,
      "high": 1.67,
      "low": 1.42,
      "close": 1.58,
      "vol": 345600,
      "fin_volume": 546048.00,
      "trades": 890,
      "bid": 1.57,
      "ask": 1.59,
      "variation": 8.97,
      "previous_close": 1.45
    },
    "info": {
      "maturity_type": "AMERICAN",
      "days_to_maturity": 15,
      "due_date": "2024-02-16",
      "strike": 28.00,
      "category": "CALL",
      "contract_size": 100,
      "spot_price": 28.85
    },
    "underlying_asset": {
      // Dados da ação subjacente
    }
  },
  "status": 200
}
```

## Tratamento de Erros

### Erros Comuns

- **401 Unauthorized**: Token de acesso inválido ou expirado
- **400 Bad Request**: Parâmetros obrigatórios em falta
- **404 Not Found**: Símbolo ou recurso não encontrado
- **429 Too Many Requests**: Limite de requisições excedido
- **500 Internal Server Error**: Erro interno da API

### Debugging

1. **Verificar Token**: Confirme se `OPLAB_ACCESS_TOKEN` está configurado
2. **Logs da API**: Verifique os logs do servidor para detalhes do erro
3. **Status da API**: Teste o endpoint `/health` primeiro
4. **Documentação Oficial**: Consulte https://apidocs.oplab.com.br/

## Performance e Limites

- **Rate Limiting**: Respeite os limites de requisições da API
- **Timeout**: Requests têm timeout de 30 segundos
- **Caching**: Implemente cache local para dados que não mudam frequentemente
- **Retry Logic**: Implemente retry para errors temporários (5xx)

## Checklist de Teste

### ✅ Testes Básicos
- [ ] Health check respondendo
- [ ] Autorização funcionando
- [ ] Status do mercado

### ✅ Testes de Ações
- [ ] Listar todas as ações
- [ ] Obter ação específica (PETR4)
- [ ] Ações com opções disponíveis

### ✅ Testes de Opções
- [ ] Cadeia de opções para PETR4
- [ ] Opção específica
- [ ] Histórico de opções

### ✅ Testes de Portfólio
- [ ] Listar portfólios
- [ ] Criar novo portfólio
- [ ] Obter portfólio específico

### ✅ Testes de Dados de Mercado
- [ ] Taxas de juros
- [ ] Bolsas de valores
- [ ] Dados históricos

### ✅ Testes de Rankings
- [ ] Top volume opções
- [ ] Score Oplab
- [ ] Análise fundamentalista

## Próximos Passos

1. **Implementar Cache**: Redis ou cache em memória para melhor performance
2. **Monitoramento**: Logs e métricas de uso da API
3. **Websockets**: Para dados em tempo real
4. **Rate Limiting**: Controle de limite de requisições
5. **Documentação Swagger**: API docs interativa

## Suporte

- **Documentação Oficial**: https://apidocs.oplab.com.br/
- **Suporte Oplab**: Entre em contato através do site oficial
- **Issues do Projeto**: Use o sistema de issues do GitHub para reportar problemas

---

**Nota**: Esta implementação conecta com a API real do Oplab e requer autenticação adequada. Certifique-se de ter as credenciais corretas antes de executar os testes. 