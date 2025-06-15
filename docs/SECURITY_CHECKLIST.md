# 🔒 **PENNY WISE - SECURITY CHECKLIST**

_Última atualização: 31 de Janeiro de 2025_

## ⚠️ **CONFIGURAÇÕES CRÍTICAS - NUNCA EXPOR**

### 🚨 **ANTES DE CADA COMMIT**

```bash
# ✅ Verificar se não há chaves expostas
grep -r "SUPABASE_SERVICE_ROLE_KEY.*=.*eyJ" . --exclude-dir=node_modules
grep -r "DEEPSEEK_API_KEY.*=.*sk-" . --exclude-dir=node_modules
grep -r "OPLAB_ACCESS_TOKEN.*=.*[a-zA-Z0-9]{20,}" . --exclude-dir=node_modules
```

### 🔑 **CHAVES QUE NUNCA DEVEM SER COMMITADAS**

| Variável                    | Formato          | Risco                               |
| --------------------------- | ---------------- | ----------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...`         | **CRÍTICO** - Acesso total ao banco |
| `DEEPSEEK_API_KEY`          | `sk-...`         | **ALTO** - Custos de API            |
| `OPLAB_ACCESS_TOKEN`        | `[alphanumeric]` | **MÉDIO** - Dados de mercado        |
| `ALPHA_VANTAGE_API_KEY`     | `[alphanumeric]` | **BAIXO** - Rate limit público      |

## 🛡️ **CHECKLIST PRÉ-DEPLOY**

### ✅ **Variáveis de Ambiente**

- [ ] `.env.local` não commitado
- [ ] `.env.example` com placeholders apenas
- [ ] Variáveis de produção configuradas na Vercel
- [ ] Todas as chaves reais removidas do código

### ✅ **Configurações Supabase**

- [ ] RLS ativado em todas as tabelas sensíveis
- [ ] Políticas de acesso configuradas
- [ ] Service Role limitado por IP (se possível)
- [ ] Logs de auditoria ativados

### ✅ **APIs Externas**

- [ ] Rate limiting implementado
- [ ] Timeouts configurados
- [ ] Fallbacks para APIs indisponíveis
- [ ] Logs não expõem tokens

### ✅ **Logs e Monitoramento**

- [ ] Logger sanitiza dados sensíveis
- [ ] Console.log removidos de produção
- [ ] Error tracking configurado
- [ ] Logs de acesso implementados

## 🔧 **COMANDOS DE VERIFICAÇÃO**

### **Verificar Exposição de Chaves**

```bash
# Buscar chaves expostas em todo o projeto
find . -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" | \
  xargs grep -l "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

# Verificar .env files
find . -name ".env*" ! -name ".env.example"
```

### **Limpar Histórico Git (se necessário)**

```bash
# CUIDADO: Remove histórico de commits
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

## 📋 **POLÍTICAS DE SEGURANÇA**

### **Desenvolvimento**

1. **Nunca** commitar arquivos `.env` reais
2. **Sempre** usar `.env.example` com placeholders
3. **Rotacionar** chaves comprometidas imediatamente
4. **Testar** em ambiente isolado primeiro

### **Produção**

1. **Configurar** variáveis através da interface da Vercel
2. **Limitar** IPs de acesso quando possível
3. **Monitorar** uso anômalo de APIs
4. **Backup** configurações críticas

### **Incident Response**

1. **Revogar** chaves comprometidas
2. **Gerar** novas chaves
3. **Atualizar** configurações de produção
4. **Notificar** team sobre incident

## 🎯 **RESPONSABILIDADES**

| Equipe       | Responsabilidade                      |
| ------------ | ------------------------------------- |
| **Dev**      | Não commitar chaves, seguir checklist |
| **DevOps**   | Configurar env vars, monitorar logs   |
| **Security** | Auditar código, definir políticas     |
| **Product**  | Aprovar integração de novas APIs      |

## 🚨 **CONTATOS DE EMERGÊNCIA**

- **Security Incident**: [definir contato]
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com

---

**⚠️ Este documento deve ser revisado a cada deploy de produção**
