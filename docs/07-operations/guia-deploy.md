# 🚀 Guia de Deploy e Operações

## Visão Geral

Este guia fornece instruções detalhadas para deploy, configuração e operação do Penny Wise em ambientes de produção.

## 🏗️ Visão Geral da Infraestrutura

### Stack de Produção
- **Frontend**: Vercel (Next.js)
- **Backend**: Vercel Functions (API Routes)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Cache**: Redis (Upstash)
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

#### Ambiente de Produção (.env.production)
```bash
# Aplicação
NEXT_PUBLIC_APP_URL=https://pennywise.com
NEXT_PUBLIC_API_URL=https://pennywise.com/api
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico_supabase

# APIs Externas
ALPHA_VANTAGE_API_KEY=sua_chave_alpha_vantage
OPLAB_ACCESS_TOKEN=sua_chave_oplab
DEEPSEEK_API_KEY=sua_chave_deepseek

# Redis
REDIS_URL=sua_url_redis
REDIS_TOKEN=seu_token_redis

# Monitoramento
SENTRY_DSN=sua_dsn_sentry
SENTRY_AUTH_TOKEN=seu_token_sentry
```

## 🚀 Deploy Automatizado

### GitHub Actions Workflow

#### Deploy de Produção
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📊 Configuração de Cache

### Redis (Upstash)
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

export const cacheKeys = {
  quote: (symbol: string) => `quote:${symbol}`,
  portfolio: (userId: string) => `portfolio:${userId}`,
  market: (symbol: string) => `market:${symbol}`,
} as const

export const cacheTTL = {
  quote: 60, // 1 minuto
  portfolio: 300, // 5 minutos
  market: 3600, // 1 hora
} as const
```

## 🔍 Monitoramento e Observabilidade

### Health Checks
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {} as Record<string, string>
  }

  try {
    // Verificar banco de dados
    checks.services.database = 'healthy'
  } catch (error) {
    checks.services.database = 'unhealthy'
    checks.status = 'degraded'
  }

  return NextResponse.json(checks)
}
```

## 🔒 Configuração de Segurança

### Headers de Segurança
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}
```

## 🚨 Procedimentos de Incidente

### Escalation Matrix
| Severidade | Tempo de Resposta | Escalation |
|------------|-------------------|------------|
| Critical   | 15 minutos        | CTO        |
| High       | 1 hora            | Lead Dev   |
| Medium     | 4 horas           | Dev Team   |
| Low        | 24 horas          | Dev Team   |

### Runbook de Incidentes

#### 1. Aplicação Indisponível
```bash
# Verificar status
curl -f https://pennywise.com/api/health

# Verificar logs
vercel logs --app penny-wise

# Rollback se necessário
vercel rollback penny-wise
```

## 📊 Métricas e Alertas

### Métricas-Chave
- **Disponibilidade**: >99.9%
- **Tempo de Resposta**: <500ms (p95)
- **Taxa de Erro**: <0.1%
- **Tempo de Build**: <5 minutos

## 🔧 Manutenção

### Checklist de Manutenção Mensal
- [ ] Revisar logs de erro
- [ ] Otimizar queries lentas
- [ ] Limpar dados antigos
- [ ] Atualizar documentação
- [ ] Revisar métricas de performance
- [ ] Testar procedimentos de backup

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Testes passando
- [ ] Code review aprovado
- [ ] Migrations testadas
- [ ] Variáveis de ambiente configuradas

### Deploy
- [ ] Deploy em staging
- [ ] Testes E2E em staging
- [ ] Deploy em produção
- [ ] Health check após deploy

### Pós-Deploy
- [ ] Monitorar logs por 30 minutos
- [ ] Verificar métricas
- [ ] Comunicar stakeholders

## 🆘 Contatos de Emergência

### Equipe Técnica
- **CTO**: cto@pennywise.com.br
- **Lead Developer**: lead@pennywise.com.br
- **DevOps**: devops@pennywise.com.br

---

*📅 Atualizado em: Janeiro 2025*  
*👤 Maintainer: Equipe DevOps Penny Wise* 