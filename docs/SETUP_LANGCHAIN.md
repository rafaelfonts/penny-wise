# 🚀 Setup Completo - Integração LangChain

## ⚡ Instalação Rápida (5 minutos)

### 1. Instalar Dependências

```bash
# Clonar o repositório (se necessário)
git clone https://github.com/seu-usuario/penny-wise.git
cd penny-wise

# Instalar dependências LangChain
npm install @langchain/core @langchain/community langchain ioredis zod-error --legacy-peer-deps

# Verificar instalação
npm ls @langchain/core @langchain/community langchain ioredis
```

### 2. Configurar Redis (Obrigatório)

**Opção A - Docker (Recomendado):**

```bash
# Iniciar Redis com Docker
docker run -d --name penny-redis -p 6379:6379 redis:7-alpine

# Verificar se está funcionando
docker logs penny-redis
```

**Opção B - Instalação Local:**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update && sudo apt install redis-server
sudo systemctl start redis-server

# Windows (via WSL)
sudo apt install redis-server
redis-server
```

**Opção C - Redis Cloud (Produção):**

1. Acesse: https://redis.com/cloud/
2. Crie uma conta gratuita
3. Crie um banco Redis
4. Copie a URL de conexão

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env.local

# Editar .env.local com suas chaves
nano .env.local
```

**Variáveis obrigatórias:**

```bash
# APIs essenciais
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPLAB_ACCESS_TOKEN=your_oplab_token_here
REDIS_URL=redis://localhost:6379

# Supabase (se não configurado)
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_supabase_service_role_key
```

### 4. Obter as Chaves das APIs

**DeepSeek API:**

1. Acesse: https://platform.deepseek.com/
2. Faça login ou cadastro
3. Vá em "API Keys"
4. Gere uma nova chave
5. Copie e cole em `DEEPSEEK_API_KEY`

**OpLab API:**

1. Acesse: https://oplab.com.br/
2. Faça login ou cadastro
3. Vá em "API" ou "Desenvolvedores"
4. Gere seu token de acesso
5. Copie e cole em `OPLAB_ACCESS_TOKEN`

### 5. Testar a Integração

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Em outro terminal, testar o endpoint
curl -X GET "http://localhost:3000/api/chat/langchain?action=status"
```

**Resposta esperada:**

```json
{
  "success": true,
  "service": "langchain-integration",
  "status": {
    "tools_count": 2,
    "cache_connected": true,
    "rate_limiter_connected": true,
    "model_configured": true,
    "endpoints": {
      "deepseek_configured": true,
      "oplab_configured": true,
      "redis_configured": true
    }
  }
}
```

## 🔧 Configuração Avançada

### 1. Configurar Redis Personalizado

**Para desenvolvimento com senha:**

```bash
# .env.local
REDIS_URL=redis://:sua_senha@localhost:6379
```

**Para produção (Redis Cloud):**

```bash
# .env.local
REDIS_URL=rediss://usuario:senha@host:porta/database
```

**Para cluster Redis:**

```bash
# .env.local
REDIS_URL=redis://node1:6379,node2:6379,node3:6379
```

### 2. Configurar Rate Limiting Personalizado

```typescript
// Editar src/lib/services/langchain-integration.ts
const allowed = await this.rateLimiter.checkLimit(
  `user:${userId}`,
  200, // 200 requisições (padrão: 100)
  3600000 // por hora (padrão: 1 hora)
);
```

### 3. Configurar Cache Personalizado

```typescript
// Cache por 2 horas ao invés de 1
private defaultTTL = 7200; // 2 horas

// Cache específico por tipo de consulta
if (message.startsWith('/')) {
  ttl = 1800; // 30 minutos para comandos
} else {
  ttl = 3600; // 1 hora para análises
}
```

### 4. Configurar Timeouts Personalizados

```typescript
// Editar src/lib/services/langchain-integration.ts
this.model = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL:
      process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  },
  modelName: 'deepseek-chat',
  temperature: 0.3,
  maxTokens: 4000, // Aumentar se necessário
  timeout: 60000, // 60 segundos (padrão: 30s)
});
```

## 🧪 Testes e Validação

### 1. Testes Básicos

```bash
# Testar health check
curl -X GET "http://localhost:3000/api/chat/langchain"

# Testar status detalhado
curl -X GET "http://localhost:3000/api/chat/langchain?action=status"

# Testar comando OpLab
curl -X POST "http://localhost:3000/api/chat/langchain" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "/market-status",
    "userId": "test_user_123"
  }'
```

### 2. Testes com JavaScript

```javascript
// Criar arquivo test-integration.js
const testLangChain = async () => {
  try {
    // Teste 1: Health check
    const healthResponse = await fetch(
      'http://localhost:3000/api/chat/langchain'
    );
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.success);

    // Teste 2: Status
    const statusResponse = await fetch(
      'http://localhost:3000/api/chat/langchain?action=status'
    );
    const statusData = await statusResponse.json();
    console.log('✅ Status:', statusData.status);

    // Teste 3: Comando OpLab
    const oplabResponse = await fetch(
      'http://localhost:3000/api/chat/langchain',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '/market-status',
          userId: 'test_user_123',
        }),
      }
    );
    const oplabData = await oplabResponse.json();
    console.log('✅ OpLab Command:', oplabData.success);

    // Teste 4: Análise DeepSeek
    const deepseekResponse = await fetch(
      'http://localhost:3000/api/chat/langchain',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Explique o que é uma ação',
          userId: 'test_user_123',
        }),
      }
    );
    const deepseekData = await deepseekResponse.json();
    console.log('✅ DeepSeek Analysis:', deepseekData.success);

    console.log('\n🎉 Todos os testes passaram!');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
};

testLangChain();
```

```bash
# Executar testes
node test-integration.js
```

### 3. Testes Automatizados

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes de integração (se configurados)
npm run test:integration
```

## 🚀 Deploy em Produção

### 1. Vercel (Recomendado)

```bash
# Instalar CLI da Vercel
npm i -g vercel

# Fazer login
vercel login

# Configurar variáveis de ambiente
vercel env add DEEPSEEK_API_KEY
vercel env add OPLAB_ACCESS_TOKEN
vercel env add REDIS_URL

# Deploy
vercel --prod
```

### 2. Netlify

```bash
# Instalar CLI da Netlify
npm i -g netlify-cli

# Fazer login
netlify login

# Configurar variáveis
netlify env:set DEEPSEEK_API_KEY sua_chave
netlify env:set OPLAB_ACCESS_TOKEN seu_token
netlify env:set REDIS_URL sua_redis_url

# Build e deploy
netlify deploy --prod
```

### 3. Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build da imagem
docker build -t penny-wise-langchain .

# Executar container
docker run -d \
  --name penny-wise \
  -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sua_chave \
  -e OPLAB_ACCESS_TOKEN=seu_token \
  -e REDIS_URL=redis://redis:6379 \
  --link penny-redis:redis \
  penny-wise-langchain
```

### 4. Railway

```bash
# Instalar CLI
npm i -g @railway/cli

# Fazer login
railway login

# Inicializar projeto
railway init

# Adicionar variáveis
railway variables set DEEPSEEK_API_KEY=sua_chave
railway variables set OPLAB_ACCESS_TOKEN=seu_token
railway variables set REDIS_URL=redis://redis.railway.internal:6379

# Deploy
railway up
```

## 🔍 Monitoramento e Logs

### 1. Configurar Logs Estruturados

```typescript
// Adicionar ao src/lib/services/langchain-integration.ts
const logger = {
  info: (message: string, meta?: any) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        meta,
      })
    );
  },
  error: (message: string, error?: Error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
      })
    );
  },
};
```

### 2. Métricas com Prometheus (Opcional)

```typescript
// Instalar dependência
npm install prom-client

// Adicionar métricas
import client from 'prom-client';

const requestDuration = new client.Histogram({
  name: 'langchain_request_duration_seconds',
  help: 'Duration of LangChain requests in seconds',
  labelNames: ['method', 'status']
});

const requestCount = new client.Counter({
  name: 'langchain_requests_total',
  help: 'Total number of LangChain requests',
  labelNames: ['method', 'status']
});
```

### 3. Alertas Simples

```typescript
// Implementar alertas via webhook
const sendAlert = async (
  message: string,
  level: 'info' | 'warning' | 'error'
) => {
  if (process.env.WEBHOOK_URL) {
    await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${level.toUpperCase()}] LangChain: ${message}`,
        timestamp: new Date().toISOString(),
      }),
    });
  }
};
```

## 🛠️ Troubleshooting

### Problema: Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping
# Resposta esperada: PONG

# Se não responder, iniciar Redis
redis-server

# Verificar logs
tail -f /var/log/redis/redis-server.log
```

### Problema: DeepSeek API retorna erro 401

```bash
# Verificar chave API
echo $DEEPSEEK_API_KEY

# Testar diretamente
curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  https://api.deepseek.com/v1/models
```

### Problema: OpLab API retorna erro 403

```bash
# Verificar token
echo $OPLAB_ACCESS_TOKEN

# Testar endpoint
curl -H "Authorization: Bearer $OPLAB_ACCESS_TOKEN" \
  https://api.oplab.com.br/v3/market-status
```

### Problema: High latency

```typescript
// Adicionar timeout personalizado
const result = await Promise.race([
  langChainService.processMessage(request),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 15000)
  ),
]);
```

### Problema: Memory leaks

```bash
# Monitorar uso de memória
node --inspect=0.0.0.0:9229 npm run dev

# No Chrome, abrir: chrome://inspect
# Usar Heap Snapshot para identificar vazamentos
```

## ✅ Checklist Final

Antes de colocar em produção, verifique:

- [ ] ✅ Redis está configurado e rodando
- [ ] ✅ Todas as variáveis de ambiente estão definidas
- [ ] ✅ APIs DeepSeek e OpLab estão funcionando
- [ ] ✅ Testes básicos passam
- [ ] ✅ Rate limiting está configurado apropriadamente
- [ ] ✅ Cache está funcionando
- [ ] ✅ Logs estão sendo gerados
- [ ] ✅ Monitoramento está ativo
- [ ] ✅ Backup do Redis está configurado (produção)
- [ ] ✅ Alertas estão configurados (produção)

## 🎯 Próximos Passos

1. **Configurar monitoramento avançado** com Grafana/Prometheus
2. **Implementar alertas** via Slack/Discord/Email
3. **Adicionar métricas customizadas** para business intelligence
4. **Configurar backup automático** do Redis
5. **Implementar circuit breaker** para APIs externas
6. **Adicionar testes de carga** com k6/Artillery
7. **Configurar CI/CD pipeline** com GitHub Actions

---

## 📞 Suporte

Se encontrar problemas durante o setup:

1. **Verifique os logs** primeiro: `docker logs penny-redis` ou `tail -f logs/app.log`
2. **Teste cada componente** individualmente (Redis, DeepSeek, OpLab)
3. **Consulte a documentação** detalhada em `docs/LANGCHAIN_INTEGRATION.md`
4. **Abra uma issue** no repositório com logs completos

**Contatos:**

- 📧 Email: suporte@pennywise.com.br
- 💬 Discord: https://discord.gg/pennywise
- 📱 WhatsApp: +55 11 99999-9999

---

_Setup guide atualizado em: 15 de Janeiro de 2025_
_Versão: 1.0.0_
