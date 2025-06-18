# 🛠️ Guia de Desenvolvimento

## Visão Geral

Este guia contém informações abrangentes para desenvolvedores trabalhando no projeto Penny Wise, incluindo setup, arquitetura, padrões de código e melhores práticas.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Git
- PostgreSQL (para desenvolvimento local)
- Redis (opcional, para cache)

### Configuração Inicial
```bash
# Clonar o repositório
git clone <repository-url>
cd penny-wise

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🏗️ Visão Geral da Arquitetura

### Stack Tecnológico
- **Frontend**: Next.js 15.3.2 (App Router)
- **Estilização**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Gerenciamento de Estado**: React Query + Context API
- **Segurança de Tipos**: TypeScript
- **Testes**: Jest + React Testing Library + Playwright
- **Deploy**: Vercel

### Estrutura do Projeto
```
src/
├── app/                 # Páginas Next.js App Router
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base UI (shadcn/ui)
│   ├── forms/          # Componentes de formulário
│   ├── dashboard/      # Componentes específicos do dashboard
│   └── charts/         # Componentes de gráficos
├── lib/                # Bibliotecas utilitárias
│   ├── services/       # Serviços de API
│   ├── utils/          # Funções auxiliares
│   ├── hooks/          # Hooks React customizados
│   └── types/          # Definições de tipos TypeScript
├── styles/             # Estilos globais
└── __tests__/          # Arquivos de teste
```

## 🔧 Fluxo de Desenvolvimento

### Fluxo Git
1. Criar branch de feature a partir da `main`
2. Fazer alterações com commits descritivos
3. Fazer push da branch e criar Pull Request
4. Revisão de código e aprovação
5. Merge na `main`

### Padrões de Código

#### TypeScript
- Usar configuração strict do TypeScript
- Definir interfaces para todas as estruturas de dados
- Usar type guards para validação em runtime
- Evitar tipo `any`

#### Componentes
- Usar componentes funcionais com hooks
- Implementar prop types adequados
- Usar React.memo para otimização de performance
- Seguir convenções de nomenclatura (PascalCase)

#### Estilização
- Usar classes utilitárias do Tailwind CSS
- Seguir design responsivo mobile-first
- Usar variáveis CSS para temas
- Manter escala de espaçamento consistente

## 📊 Integração de APIs

### APIs de Dados de Mercado
- **Alpha Vantage**: Cotações de ações, dados históricos
- **OpLab**: Dados financeiros avançados
- **Polygon.io**: Dados de mercado em tempo real

### Arquitetura de Serviços
```typescript
// Exemplo de padrão de serviço
class MarketDataService {
  async getQuote(symbol: string): Promise<Quote> {
    // Implementação com tratamento de erro
  }
  
  async getHistoricalData(symbol: string, period: string): Promise<HistoricalData[]> {
    // Implementação com cache
  }
}
```

## 🧪 Estratégia de Testes

### Testes Unitários
- Testar funções utilitárias minuciosamente
- Fazer mock de chamadas de API externas
- Testar comportamento e props de componentes
- Buscar >80% de cobertura de código

### Testes de Integração
- Testar endpoints de API
- Testar operações de banco de dados
- Testar integrações de serviços

### Testes E2E
- Testar fluxos críticos do usuário
- Testar design responsivo
- Testar acessibilidade

### Executando Testes
```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Relatório de cobertura
npm run test:coverage
```

## 🔒 Práticas de Segurança

### Chaves de API
- Nunca committar chaves de API no repositório
- Usar variáveis de ambiente
- Rotacionar chaves regularmente
- Usar chaves diferentes para dev/prod

### Validação de Dados
- Validar todas as entradas de usuário
- Sanitizar dados antes de operações de banco
- Usar TypeScript para validação em tempo de compilação
- Implementar validação em runtime com Zod

### Autenticação
- Usar Supabase Auth para gerenciamento de usuários
- Implementar manuseio adequado de sessão
- Usar middleware para proteção de rotas
- Tratar erros de autenticação graciosamente

## 🚀 Otimização de Performance

### Code Splitting
- Usar imports dinâmicos para componentes grandes
- Implementar code splitting baseado em rotas
- Lazy load recursos não críticos

### Estratégia de Cache
- Fazer cache de respostas de API adequadamente
- Usar React Query para cache do lado cliente
- Implementar service worker para funcionalidade offline
- Usar CDN para assets estáticos

### Otimização de Bundle
- Analisar tamanho do bundle regularmente
- Tree-shake dependências não utilizadas
- Otimizar imagens e assets
- Usar compressão em produção

## 📝 Documentação

### Documentação de Código
- Comentar lógica complexa
- Usar JSDoc para documentação de funções
- Manter arquivos README
- Documentar endpoints de API

### Documentação de Componentes
- Usar Storybook para docs de componentes
- Incluir exemplos de uso
- Documentar props e interfaces
- Mostrar diferentes estados de componentes

## 🐛 Debug

### Ferramentas de Desenvolvimento
- Usar React Developer Tools
- Aproveitar browser DevTools
- Usar aba network para debug de API
- Usar React Profiler para análise de performance

### Logging
- Usar logging estruturado
- Logar erros com contexto
- Usar diferentes níveis de log
- Evitar log de dados sensíveis

## 📦 Deploy

### Processo de Build
```bash
# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Analisar bundle
npm run bundle:analyze
```

### Variáveis de Ambiente
- Configurar variáveis de ambiente de produção
- Usar gerenciamento de secrets para dados sensíveis
- Configurar conexões de banco de dados
- Configurar monitoramento e analytics

### Monitoramento
- Configurar tracking de erros (Sentry/similar)
- Monitorar métricas de performance
- Rastrear analytics de usuário
- Configurar health checks

## 🤝 Contribuindo

### Revisão de Código
- Revisar funcionalidade
- Verificar qualidade e padrões de código
- Verificar testes e documentação
- Garantir práticas de segurança

### Template de Pull Request
- Descrição clara das mudanças
- Referenciar issues relacionadas
- Incluir informações de testes
- Atualizar documentação se necessário

## 📚 Recursos

### Documentação
- [Docs do Next.js](https://nextjs.org/docs)
- [Docs do React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Docs do Supabase](https://supabase.com/docs)

### Ferramentas
- VS Code com extensão TypeScript
- ESLint e Prettier
- Git hooks com Husky
- GitHub Actions para CI/CD

## 🛡️ Segurança

### Validação de Input
- Validar todos os inputs com schemas Zod
- Sanitizar dados antes de operações de banco
- Implementar rate limiting
- Usar headers de segurança

### Gestão de Secrets
- Usar variáveis de ambiente para secrets
- Nunca committar credenciais
- Rotacionar chaves regularmente
- Usar diferentes secrets para ambientes

## 🚀 Performance

### Métricas Core Web Vitals
- Monitorar LCP (Largest Contentful Paint)
- Otimizar FID (First Input Delay)
- Minimizar CLS (Cumulative Layout Shift)

### Otimizações
- Implementar lazy loading
- Usar Image Optimization do Next.js
- Configurar headers de cache
- Minimizar JavaScript não crítico

## 📱 Responsividade

### Breakpoints Tailwind
```css
/* Mobile first approach */
sm: 640px   /* Pequeno */
md: 768px   /* Médio */
lg: 1024px  /* Grande */
xl: 1280px  /* Extra Grande */
2xl: 1536px /* 2X Extra Grande */
```

### Diretrizes Mobile
- Design mobile-first
- Touch targets mínimos 44px
- Navegação otimizada para mobile
- Performance otimizada para conexões lentas

## 🔧 Configuração de Desenvolvimento

### VSCode Extensions Recomendadas
- TypeScript Importer
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- GitLens
- Auto Rename Tag

### Scripts NPM Úteis
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

Para dúvidas ou problemas, consulte o issue tracker do projeto ou entre em contato com a equipe de desenvolvimento.

---

*📅 Atualizado em: Janeiro 2025*  
*👤 Maintainer: Equipe de Desenvolvimento Penny Wise* 