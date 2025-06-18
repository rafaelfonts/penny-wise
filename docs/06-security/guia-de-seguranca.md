# 🔒 Guia de Segurança - Penny Wise

## 📋 Resumo

Guia completo de segurança do Penny Wise, incluindo configurações, melhores práticas, checklist de deploy e diretrizes para desenvolvimento seguro.

## 🎯 Níveis de Segurança

### 🔴 Crítico - Nunca Expor
- `SUPABASE_SERVICE_ROLE_KEY` - Acesso total ao banco
- `DEEPSEEK_API_KEY` - Chaves de IA com billing
- Dados pessoais de usuários
- Tokens de sessão ativos

### 🟡 Sensível - Proteger
- `OPLAB_ACCESS_TOKEN` - API de market data
- `ALPHA_VANTAGE_API_KEY` - API keys de terceiros
- Logs com informações pessoais
- Configuration secrets

### 🟢 Público - Pode Expor
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Configurações de UI/UX
- Documentação pública

## 🛡️ Configurações de Segurança

### Variáveis de Ambiente

```env
# ✅ Configuração Segura
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # CRÍTICO - Nunca committar
DEEPSEEK_API_KEY=sk-...          # ALTO - Billing sensível
OPLAB_ACCESS_TOKEN=abc123...     # MÉDIO - Rate limits
REDIS_URL=redis://user:pass@host # MÉDIO - Cache interno

# ✅ Configuração Pública
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Headers de Segurança

```typescript
// middleware.ts - Headers obrigatórios
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

### Limitação de Taxa (Rate Limiting)

```typescript
// Sistema de rate limiting por IP e usuário
const rateLimits = {
  api: { requests: 1000, window: '15m' },      // APIs gerais
  chat: { requests: 60, window: '1m' },        // Mensagens de chat
  auth: { requests: 5, window: '15m' },        // Tentativas de login
  market: { requests: 100, window: '1m' }      // Dados de mercado
};
```

## 🔧 Validação de Entrada

### Validação de Schema (Zod)

```typescript
// src/lib/utils/api-validation.ts
import { z } from 'zod';

export const apiSchemas = {
  // Chat API
  chat: z.object({
    message: z.string().min(1).max(2000),
    userId: z.string().uuid().optional(),
    sessionId: z.string().min(1).max(100)
  }),

  // API de Dados de Mercado
  market: z.object({
    symbol: z.string().regex(/^[A-Z]{1,5}$/),
    timeframe: z.enum(['1m', '5m', '15m', '1h', '1d'])
  }),

  // API de Autenticação
  auth: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100)
  })
};

// Função de validação
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new ValidationError('Dados de entrada inválidos', error);
  }
}
```

### Sanitização de Dados

```typescript
// Sistema de sanitização automática
export class SecureSanitizer {
  private static sensitiveFields = [
    'password', 'token', 'key', 'secret', 'apikey',
    'authorization', 'auth', 'credential', 'jwt',
    'session', 'cookie', 'access_token'
  ];

  static sanitizeForLogs(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const sanitized = { ...data };
    
    for (const field of this.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

## 🚨 Checklist de Segurança

### ✅ Checklist Pré-Deploy

#### Configurações Críticas
- [ ] Todas as chaves em variáveis de ambiente
- [ ] Arquivos `.env` não commitados
- [ ] Service role key limitado por IP
- [ ] Rate limiting ativo
- [ ] Headers de segurança configurados

#### Validação e Sanitização
- [ ] Todas as entradas validadas com Zod
- [ ] Logs sanitizados (dados sensíveis removidos)
- [ ] Proteção XSS ativa
- [ ] Injeção SQL prevenida (via Supabase)

#### Monitoramento
- [ ] Rastreamento de erros configurado
- [ ] Logs de auditoria ativos
- [ ] Alertas de segurança funcionando
- [ ] Health checks implementados

### 🔍 Comandos de Verificação

```bash
# Verificar exposição de chaves
find . -name "*.md" -o -name "*.ts" -o -name "*.js" | \
  xargs grep -l "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

# Verificar arquivos .env
find . -name ".env*" ! -name ".env.example"

# Verificar tokens no código
grep -r "sk-" src/ --exclude-dir=node_modules
grep -r "Bearer " src/ --exclude-dir=node_modules
```

## 🔒 Autenticação e Autorização

### Supabase Auth

```typescript
// Configuração segura
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
```

## 🚨 Incidentes de Segurança

### Procedimento de Resposta
1. **Identificação** - Detectar o incidente
2. **Contenção** - Isolar o problema
3. **Erradicação** - Remover a causa
4. **Recuperação** - Restaurar serviços
5. **Lições Aprendidas** - Documentar e melhorar

### Contatos de Emergência
- **Security Lead**: security@pennywise.com.br
- **CTO**: cto@pennywise.com.br
- **Equipe DevOps**: devops@pennywise.com.br

## 📊 Auditoria e Compliance

### Logs de Auditoria
- Todas as operações sensíveis registradas
- Retenção de logs por 12 meses
- Acesso aos logs restrito
- Monitoramento de acessos anômalos

### Revisões de Segurança
- **Semanal**: Verificação de vulnerabilidades
- **Mensal**: Auditoria de acessos
- **Trimestral**: Pentesting
- **Anual**: Revisão completa de segurança

## 🔧 Ferramentas de Segurança

### Análise Estática
```bash
# ESLint Security Plugin
npm install --save-dev eslint-plugin-security

# Snyk para vulnerabilidades
npm install -g snyk
snyk test

# Audit do npm
npm audit --audit-level high
```

### Monitoramento
- **Sentry** - Rastreamento de erros
- **Vercel Analytics** - Monitoramento de performance
- **Supabase Logs** - Logs de banco de dados
- **Custom Alerts** - Alertas customizados

---

## 📚 Recursos Adicionais

### Documentação
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

### Ferramentas
- [Security Headers](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

---

*📅 Atualizado em: Janeiro 2025*  
*👤 Maintainer: Equipe de Segurança Penny Wise*  
*🔄 Próxima Revisão: Fevereiro 2025* 