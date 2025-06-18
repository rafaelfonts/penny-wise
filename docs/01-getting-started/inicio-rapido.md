# 🚀 Penny Wise - Guia de Início Rápido

## 📋 Resumo

Configure e execute o Penny Wise em menos de 5 minutos. Este guia consolida os passos essenciais para ter a aplicação funcionando rapidamente.

## 🎯 Pré-requisitos

- **Node.js 18+** 
- **npm ou yarn**
- **Git**
- **Redis** (local ou cloud)

## ⚡ Instalação Rápida

### 1. Clone o Repositório

```bash
git clone https://github.com/penny-wise/penny-wise.git
cd penny-wise
```

### 2. Instale Dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite com suas chaves (obrigatórias)
nano .env.local
```

**Variáveis essenciais:**
```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=sua_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key

# IA (obrigatório)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cache (obrigatório)
REDIS_URL=redis://localhost:6379

# Dados de Mercado (opcional para teste)
ALPHA_VANTAGE_API_KEY=sua_alpha_vantage_key
OPLAB_ACCESS_TOKEN=seu_oplab_token
```

### 4. Configure Redis

**Opção A - Docker (recomendado):**
```bash
docker run -d --name penny-redis -p 6379:6379 redis:7-alpine
```

**Opção B - Local:**
```bash
# macOS
brew install redis && brew services start redis

# Ubuntu
sudo apt install redis-server && sudo systemctl start redis
```

### 5. Execute a Aplicação

```bash
npm run dev
```

Acesse: http://localhost:3000

## ✅ Verificação Rápida

### Teste o Sistema

1. **Verificação de Saúde**: http://localhost:3000/api/health
2. **Teste de Chat**: Envie mensagem no chat
3. **Dados de Mercado**: Teste comando `/market-status`

### Resposta Esperada
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai": "configured"
  }
}
```

## 🔑 Obtendo as Chaves de API

### Supabase (Obrigatório)
1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto
3. Copie URL e ANON_KEY de Settings > API

### DeepSeek (Obrigatório)
1. Acesse [platform.deepseek.com](https://platform.deepseek.com)
2. Faça login/cadastro
3. Gere API Key em "API Keys"

### Redis Cloud (Produção)
1. Acesse [redis.com/cloud](https://redis.com/cloud)
2. Crie database gratuito
3. Copie a connection string

## 🚨 Resolução de Problemas

### Redis não conecta
```bash
# Verificar se está rodando
redis-cli ping
# Deve retornar: PONG
```

### Erro de autenticação Supabase
- Verifique se as URLs estão corretas
- Confirme se o projeto Supabase está ativo

### Erro da API DeepSeek
```bash
# Testar chave
curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  https://api.deepseek.com/v1/models
```

## 📚 Próximos Passos

### Para Usuários
- 📖 [Manual do Usuário](../02-user-guides/manual-do-usuario.md) - Como usar as funcionalidades
- ⚙️ [Configuração](../02-user-guides/configuracao.md) - Configurações avançadas

### Para Desenvolvedores
- 🏗️ [Arquitetura](./visao-geral-arquitetura.md) - Entenda a arquitetura
- 🛠️ [Ambiente de Desenvolvimento](./ambiente-desenvolvimento.md) - Setup completo de dev
- 🤝 [Contribuindo](../03-developer-guides/guia-contribuicao.md) - Como contribuir

## 🔗 Links Relacionados

- [Guia de Setup Completo](./guia-de-setup.md) - Instalação detalhada
- [Solução de Problemas](../07-operations/solucao-problemas.md) - Problemas comuns
- [FAQ](../09-resources/perguntas-frequentes.md) - Perguntas frequentes

---

*📅 Atualizado em: Janeiro 2025*  
*👤 Maintainer: Equipe Penny Wise* 