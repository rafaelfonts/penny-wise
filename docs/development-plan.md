# Plano de Desenvolvimento Completo - Penny Wise

## Visão Geral do Projeto

**Penny Wise** é uma plataforma de análise financeira com IA que combina chat conversacional inteligente com dados de mercado em tempo real. O objetivo é criar uma ferramenta completa para análise de ações e opções, utilizando uma arquitetura moderna e escalável.

### Stack Tecnológico

**Frontend:**
- **Next.js 14** (App Router) - Performance otimizada
- **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion**
- **Zustand** - Estado global leve
- **React Query/TanStack Query** - Cache e sincronização

**Backend (100% Supabase):**
- **Supabase Edge Functions** - Serverless Functions (Deno runtime)
- **Supabase Database** - PostgreSQL gerenciado
- **Supabase Auth** - Autenticação completa
- **Supabase Storage** - Arquivos (charts, exports)
- **Supabase Realtime** - WebSocket nativo
- **Supabase Vector/pgvector** - Embeddings para RAG

**Integrações Externas:**
- **DeepSeek-V3 API** - Chat principal
- **Alpha Vantage** - Dados de ações gratuitos
- **Yahoo Finance API** - Backup de cotações
- **Oplab** - Dados de opções e ações (Brasil)

**Deploy:**
- **Vercel** (frontend) + **Supabase** (backend completo)

---

## Design System e Internacionalização

### Sistema de Ícones Padronizado

#### **Padrão de Ícones: Lucide + Tabler Icons (Outline Style)**

**Biblioteca Principal: Lucide React**
- **Pacote:** `lucide-react` (já incluído)
- **Estilo:** Outline/Stroke (consistente e moderno)
- **Tamanho padrão:** 20px (1.25rem)
- **Stroke width:** 1.5px (padrão Lucide)

**Biblioteca Complementar: Tabler Icons**
- **Pacote:** `@tabler/icons-react`
- **Uso:** Ícones específicos não disponíveis no Lucide
- **Estilo:** Outline (matching Lucide)
- **Integração:** Mesmas props e API do Lucide

#### **Convenções de Uso**

**1. Hierarquia de Ícones:**
```typescript
// src/lib/icons/index.ts
import { 
  // Navegação e UI
  Menu, X, ChevronDown, ChevronRight, Search, Settings,
  // Financeiro
  TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart,
  // Ações do usuário
  Plus, Edit, Trash2, Download, Upload, Share, Save, Copy,
  // Status e feedback
  Check, AlertCircle, Info, XCircle, Loader2, AlertTriangle,
  // Ícones adicionais necessários
  MessageSquare, Briefcase, Bell, Target, ThumbsUp, ThumbsDown, 
  Minus, Brain
} from 'lucide-react';

import { 
  // Ícones específicos do Tabler (quando não disponível no Lucide)
  IconCandlestick, IconChartLine, IconReportMoney 
} from '@tabler/icons-react';

// Re-export padronizado
export {
  // Lucide icons
  Menu, X, ChevronDown, ChevronRight, Search, Settings,
  TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart,
  Plus, Edit, Trash2, Download, Upload, Share, Save, Copy,
  Check, AlertCircle, Info, XCircle, Loader2, AlertTriangle,
  MessageSquare, Briefcase, Bell, Target, ThumbsUp, ThumbsDown,
  Minus, Brain,
  // Tabler icons (prefixados para clareza)
  IconCandlestick as Candlestick,
  IconChartLine as ChartLine,
  IconReportMoney as ReportMoney
};
```

**2. Componente Icon Wrapper:**
```typescript
// src/components/ui/icon.tsx
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const iconSizes = {
  xs: 'w-3 h-3',    // 12px
  sm: 'w-4 h-4',    // 16px  
  md: 'w-5 h-5',    // 20px (padrão)
  lg: 'w-6 h-6',    // 24px
  xl: 'w-8 h-8'     // 32px
};

export function Icon({ icon: IconComponent, size = 'md', className }: IconProps) {
  return (
    <IconComponent 
      className={cn(iconSizes[size], className)} 
      strokeWidth={1.5}
    />
  );
}
```

**3. Mapeamento de Contexto:**
```typescript
// src/lib/icons/context-icons.ts
export const CONTEXT_ICONS = {
  // Navegação
  navigation: {
    dashboard: BarChart3,
    chat: MessageSquare,
    portfolio: Briefcase,
    market: TrendingUp,
    alerts: Bell,
    settings: Settings
  },
  
  // Mercado Financeiro
  market: {
    bullish: TrendingUp,
    bearish: TrendingDown,
    neutral: Minus,
    volume: BarChart3,
    price: DollarSign,
    candlestick: Candlestick, // Tabler
    options: Target
  },
  
  // Sentimento (Multi-modelo)
  sentiment: {
    positive: ThumbsUp,
    negative: ThumbsDown,
    neutral: Minus,
    analysis: Brain // ou IconReportMoney do Tabler
  },
  
  // Ações do usuário
  actions: {
    add: Plus,
    edit: Edit,
    delete: Trash2,
    save: Save,
    export: Download,
    import: Upload,
    share: Share,
    copy: Copy
  },
  
  // Status
  status: {
    success: Check,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2
  }
} as const;
```

### Sistema de Tipografia

#### **Fontes: Outfit + Inter (Google Fonts)**

**Fonte Principal: Outfit**
- **Uso:** Títulos (h1, h2, h3) e subtítulos (h4, h5, h6)
- **Características:** Moderna, geométrica, alta legibilidade
- **Peso:** Regular (400), Medium (500) e SemiBold (600)
- **Fallback:** `'Outfit', 'Helvetica Neue', Arial, sans-serif`

**Fonte Secundária: Inter**
- **Uso:** Corpo de texto, labels, botões, inputs
- **Peso principal:** Light (300) para textos gerais
- **Pesos adicionais:** Regular (400), Medium (500), SemiBold (600)
- **Fallback:** `'Inter', 'Helvetica Neue', Arial, sans-serif`

#### **Configuração das Fontes**

**1. Next.js Font Optimization (Google Fonts):**
```typescript
// src/app/layout.tsx
import { Inter, Outfit } from 'next/font/google';

// Inter font configuration
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

// Outfit font configuration
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-inter">{children}</body>
    </html>
  );
}
```

**2. Tailwind CSS Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'outfit': ['var(--font-outfit)', '"Outfit"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'inter': ['var(--font-inter)', '"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
      }
    }
  }
}
```

**3. Classes de Tipografia:**
```css
/* src/app/globals.css */
.heading-1 {
  @apply font-outfit text-4xl font-medium leading-tight tracking-tight;
}

.heading-2 {
  @apply font-outfit text-3xl font-medium leading-tight tracking-tight;
}

.heading-3 {
  @apply font-outfit text-2xl font-normal leading-tight;
}

.heading-4 {
  @apply font-outfit text-xl font-normal leading-snug;
}

.heading-5 {
  @apply font-outfit text-lg font-normal leading-snug;
}

.heading-6 {
  @apply font-outfit text-base font-normal leading-normal;
}

.body-large {
  @apply font-inter text-lg font-light leading-relaxed;
}

.body-normal {
  @apply font-inter text-base font-light leading-normal;
}

.body-small {
  @apply font-inter text-sm font-light leading-normal;
}

.body-xs {
  @apply font-inter text-xs font-normal leading-tight;
}

.label {
  @apply font-inter text-sm font-medium leading-none;
}

.caption {
  @apply font-inter text-xs font-normal leading-tight text-gray-600;
}
```

#### **Componente Typography:**
```typescript
// src/components/ui/typography.tsx
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn('heading-1', className)}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn('heading-2', className)}>
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn('heading-3', className)}>
      {children}
    </h3>
  );
}

export function BodyText({ children, className, size = 'normal' }: TypographyProps & { size?: 'large' | 'normal' | 'small' | 'xs' }) {
  const sizeClasses = {
    large: 'body-large',
    normal: 'body-normal',
    small: 'body-small',
    xs: 'body-xs'
  };
  
  return (
    <p className={cn(sizeClasses[size], className)}>
      {children}
    </p>
  );
}

export function Label({ children, className }: TypographyProps) {
  return (
    <span className={cn('label', className)}>
      {children}
    </span>
  );
}

export function Caption({ children, className }: TypographyProps) {
  return (
    <span className={cn('caption', className)}>
      {children}
    </span>
  );
}
```

### Sistema de Botões Arredondados

#### **Especificação: Todos os botões são arredondados**

**Padrão de Border Radius:**
- **Botões pequenos:** `rounded-lg` (8px)
- **Botões médios:** `rounded-xl` (12px) 
- **Botões grandes:** `rounded-2xl` (16px)
- **Botões de ação flutuante:** `rounded-full` (50%)

#### **Componente Button Atualizado:**
```typescript
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-inter font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm rounded-xl",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-8 text-base rounded-2xl",
        xl: "h-14 px-10 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-2xl",
        fab: "h-14 w-14 rounded-full", // Floating Action Button
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

#### **Outros Componentes com Bordas Arredondadas:**

**1. Input Fields:**
```typescript
// src/components/ui/input.tsx (atualizado)
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 font-inter font-light text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**2. Cards:**
```typescript
// src/components/ui/card.tsx (atualizado)
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
);
```

**3. Dialog/Modal:**
```typescript
// src/components/ui/dialog.tsx (atualizado)
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
```

#### **Configuração Tailwind para Bordas Arredondadas:**
```javascript
// tailwind.config.js (atualizado)
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        'full': '9999px',
      }
    }
  }
}
```

### Cronograma de Implementação

#### **Semana 1: Setup e Design System**
- [ ] Configurar Google Fonts (Outfit + Inter)
- [ ] Configurar Tabler Icons como dependência
- [ ] Implementar sistema de tipografia
- [ ] Criar sistema de ícones padronizado
- [ ] Implementar componente Icon wrapper
- [ ] Atualizar componentes de botão com bordas arredondadas
- [ ] Aplicar bordas arredondadas em todos os componentes UI
- [ ] Definir mapeamento de contexto
- [ ] Criar documentação de design system
- [ ] Documentar convenções de uso

#### **Semana 2: Internacionalização e Aplicação do Design System**
- [ ] Configurar next-intl
- [ ] Criar estrutura de traduções
- [ ] Implementar middleware de localização
- [ ] Traduzir componentes principais
- [ ] Implementar seletor de idioma
- [ ] Aplicar tipografia em todos os componentes
- [ ] Testar legibilidade e acessibilidade
- [ ] Ajustar espaçamentos e hierarquia visual
- [ ] Validar consistência visual

#### **Semana 2.5: Integração Multi-Modelo**
- [ ] Configurar Hugging Face API e tokens
- [ ] Implementar serviço FinBERT
- [ ] Criar function calling setup
- [ ] Implementar cache de sentimento
- [ ] Testar integração DeepSeek + FinBERT

#### **Semana 3: Dados de Mercado**
- [ ] Integrar traduções com análise de sentimento
- [ ] Localizar componentes de mercado
- [ ] Implementar formatação de números por locale
- [ ] Testar fluxos em ambos idiomas

#### **Semana 4: Integração Avançada e Análises**
- [ ] Adicionar análise de sentimento ao chat
- [ ] Implementar componentes de visualização
- [ ] Criar dashboard de sentimento
- [ ] Integrar com dados de mercado
- [ ] Implementar trending de sentimento

### Sistema de Internacionalização (i18n)

#### **Biblioteca: next-intl (Open Source)**

**Por que next-intl:**
- **Open source** e mantido ativamente
- **Integração nativa** com Next.js 14 App Router
- **Type-safe** com TypeScript
- **Performance otimizada** com Server Components
- **Pluralização** e formatação avançada
- **Namespace** para organização modular

#### **Configuração Base**

**1. Estrutura de Arquivos:**
```
src/
├── i18n/
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── chat.json
│   │   │   ├── market.json
│   │   │   ├── portfolio.json
│   │   │   └── sentiment.json
│   │   └── pt-BR/
│   │       ├── common.json
│   │       ├── chat.json
│   │       ├── market.json
│   │       ├── portfolio.json
│   │       └── sentiment.json
│   ├── config.ts
│   └── request.ts
```

**2. Configuração next-intl:**
```typescript
// src/i18n/config.ts
export const locales = ['en', 'pt-BR'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'pt-BR';

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'pt-BR': 'Português (Brasil)'
};

export const localeFlags: Record<Locale, string> = {
  'en': '🇺🇸',
  'pt-BR': '🇧🇷'
};
```

**3. Middleware de Localização:**
```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // /en/dashboard ou /dashboard (pt-BR)
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

#### **Estrutura de Traduções**

**1. Traduções Comuns (common.json):**
```json
// src/i18n/locales/pt-BR/common.json
{
  "navigation": {
    "dashboard": "Dashboard",
    "chat": "Chat",
    "portfolio": "Portfólio", 
    "market": "Mercado",
    "alerts": "Alertas",
    "settings": "Configurações"
  },
  "actions": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "add": "Adicionar",
    "export": "Exportar",
    "import": "Importar",
    "search": "Buscar"
  },
  "status": {
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso",
    "warning": "Aviso",
    "noData": "Nenhum dado encontrado"
  },
  "time": {
    "now": "Agora",
    "today": "Hoje",
    "yesterday": "Ontem",
    "thisWeek": "Esta semana",
    "thisMonth": "Este mês"
  }
}
```

**2. Traduções do Chat (chat.json):**
```json
// src/i18n/locales/pt-BR/chat.json
{
  "interface": {
    "placeholder": "Digite sua pergunta sobre o mercado...",
    "send": "Enviar",
    "newChat": "Nova conversa",
    "clearHistory": "Limpar histórico"
  },
  "commands": {
    "analyze": "Analisar",
    "compare": "Comparar", 
    "alert": "Criar alerta",
    "portfolio": "Portfólio",
    "scan": "Escanear mercado"
  },
  "responses": {
    "thinking": "Analisando...",
    "analyzing": "Analisando dados do mercado...",
    "sentimentAnalysis": "Análise de sentimento",
    "error": "Desculpe, ocorreu um erro. Tente novamente."
  }
}
```

**3. Traduções de Mercado (market.json):**
```json
// src/i18n/locales/pt-BR/market.json
{
  "data": {
    "price": "Preço",
    "change": "Variação",
    "volume": "Volume",
    "marketCap": "Valor de mercado",
    "high": "Máxima",
    "low": "Mínima",
    "open": "Abertura",
    "close": "Fechamento"
  },
  "sentiment": {
    "positive": "Positivo",
    "negative": "Negativo", 
    "neutral": "Neutro",
    "confidence": "Confiança",
    "analysis": "Análise de sentimento",
    "trend": "Tendência de sentimento"
  },
  "indicators": {
    "rsi": "RSI",
    "macd": "MACD",
    "sma": "Média Móvel Simples",
    "ema": "Média Móvel Exponencial",
    "bollinger": "Bandas de Bollinger"
  }
}
```

#### **Implementação nos Componentes**

**1. Hook de Tradução:**
```typescript
// src/hooks/use-translations.ts
import { useTranslations } from 'next-intl';

export function useCommonTranslations() {
  return useTranslations('common');
}

export function useChatTranslations() {
  return useTranslations('chat');
}

export function useMarketTranslations() {
  return useTranslations('market');
}

export function useSentimentTranslations() {
  return useTranslations('market.sentiment');
}
```

**2. Componente com Tradução:**
```typescript
// src/components/market/sentiment-indicator.tsx
import { useSentimentTranslations } from '@/hooks/use-translations';
import { CONTEXT_ICONS } from '@/lib/icons/context-icons';
import { Icon } from '@/components/ui/icon';

interface SentimentIndicatorProps {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  symbol?: string;
}

export function SentimentIndicator({ sentiment, score }: SentimentIndicatorProps) {
  const t = useSentimentTranslations();
  
  const getColor = () => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${getColor()}`}>
      <Icon 
        icon={CONTEXT_ICONS.sentiment[sentiment]} 
        size="sm" 
      />
      <span className="font-medium">{t(sentiment)}</span>
      <span className="text-sm opacity-75">
        ({(score * 100).toFixed(1)}%)
      </span>
    </div>
  );
}
```

**3. Seletor de Idioma:**
```
// src/components/layout/language-selector.tsx
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags } from '@/i18n/config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-40">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{localeFlags[locale as keyof typeof localeFlags]}</span>
            <span>{localeNames[locale as keyof typeof localeNames]}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <div className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### **Integração com Multi-Modelo**

**Tradução Automática de Sentimento:**
```
// src/lib/services/finbert.ts (atualizado)
import { getTranslations } from 'next-intl/server';

export async function analyzeFinancialSentiment(
  text: string,
  locale: string = 'pt-BR'
): Promise<FinBERTResponse> {
  const usePortuguese = locale === 'pt-BR';
  const model = usePortuguese 
    ? "lucas-leme/FinBERT-PT-BR"
    : "ProsusAI/finbert";
    
  // ... análise do FinBERT ...
  
  // Traduzir resultado se necessário
  const t = await getTranslations({ locale, namespace: 'market.sentiment' });
  
  return {
    label: result[0].label,
    score: result[0].score,
    confidence: Math.max(...result.map(r => r.score)),
    localizedLabel: t(result[0].label) // Tradução localizada
  };
}
```

### Cronograma de Implementação

#### **Semana 1.5: Design System** (Inserir na Semana 1)
- [ ] Configurar Tabler Icons como dependência
- [ ] Criar sistema de ícones padronizado
- [ ] Implementar componente Icon wrapper
- [ ] Definir mapeamento de contexto
- [ ] Documentar convenções de uso

#### **Semana 2: Internacionalização** (Expandir Semana 2)
- [ ] Configurar next-intl
- [ ] Criar estrutura de traduções
- [ ] Implementar middleware de localização
- [ ] Traduzir componentes principais
- [ ] Implementar seletor de idioma

#### **Semana 2.5: Integração Multi-Modelo** (Inserir entre Semana 2 e 3)
- [ ] Configurar Hugging Face API e tokens
- [ ] Implementar serviço FinBERT
- [ ] Criar function calling setup
- [ ] Implementar cache de sentimento
- [ ] Testar integração DeepSeek + FinBERT

#### **Semana 3: Dados de Mercado** (Expandir seção existente)
- [ ] Integrar traduções com análise de sentimento
- [ ] Localizar componentes de mercado
- [ ] Implementar formatação de números por locale
- [ ] Testar fluxos em ambos idiomas

---

## Sistema Multi-Modelo Inteligente (Baseado em multi-model.md)

### Visão Geral da Integração
Implementação de um sistema híbrido que combina **DeepSeek-V3** como orquestrador principal com modelos especializados como **FinBERT** para análise de sentimento financeiro, maximizando eficiência e reduzindo custos.

### Arquitetura Multi-Modelo

```
┌─────────── Usuário ──────────┐
│ "Qual o sentimento sobre     │
│  o balanço da Petrobras?"    │
└──────────────┬───────────────┘
               ▼
    ┌─ DeepSeek-V3 (Orquestrador) ──┐
    │ • Analisa intenção do usuário │
    │ • Decide chamar função/tool   │
    │ • Gera resposta final         │
    └──────────┬───────────┬────────┘
               │           │
     (A) Chat  │           │ (B) Function Call
     Direto    ▼           ▼
        Resposta    ┌─ FinBERT API ─┐
        Imediata    │ • Sentiment   │
                    │ • Score       │
                    │ • Confidence  │
                    └───────────────┘
```

### Modelos Especializados Integrados

#### 1. **FinBERT para Análise de Sentimento**
- **Modelo:** `ProsusAI/finbert` (Hugging Face)
- **Versão PT-BR:** `lucas-leme/FinBERT-PT-BR`
- **Função:** Classificação de sentimento financeiro (positive/neutral/negative)
- **Integração:** Function Calling do DeepSeek-V3

#### 2. **Casos de Uso Específicos**
- **Análise de notícias** financeiras em tempo real
- **Sentimento de earnings calls** e relatórios
- **Classificação de posts** em redes sociais sobre ações
- **Análise de comunicados** de empresas

### Implementação Técnica

#### 1. **Function Calling Setup**
```
// src/lib/services/multi-model.ts
import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

const FINBERT_TOOLS = [{
  type: "function" as const,
  function: {
    name: "analisar_sentimento_financeiro",
    description: "Analisa sentimento de texto financeiro usando FinBERT especializado",
    parameters: {
      type: "object",
      properties: {
        texto: {
          type: "string",
          description: "Texto financeiro para análise de sentimento"
        },
        contexto: {
          type: "string", 
          description: "Contexto adicional (empresa, setor, etc.)"
        }
      },
      required: ["texto"]
    }
  }
}];
```

#### 2. **FinBERT Service Integration**
```
// src/lib/services/finbert.ts
interface FinBERTResponse {
  label: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
}

export async function analyzeFinancialSentiment(
  text: string,
  usePortuguese = true
): Promise<FinBERTResponse> {
  const model = usePortuguese 
    ? "lucas-leme/FinBERT-PT-BR"
    : "ProsusAI/finbert";
    
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: text })
    }
  );
  
  const result = await response.json();
  return {
    label: result[0].label,
    score: result[0].score,
    confidence: Math.max(...result.map(r => r.score))
  };
}
```

#### 3. **API Route com Multi-Modelo**
```
// src/app/api/chat/enhanced/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeFinancialSentiment } from '@/lib/services/finbert';

export async function POST(request: NextRequest) {
  const { message, conversation_id } = await request.json();
  
  // Verificar autenticação
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Configurar tools para DeepSeek
  const completion = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: message }],
    tools: FINBERT_TOOLS,
    stream: false
  });
  
  const toolCall = completion.choices[0].message.tool_calls?.[0];
  
  if (toolCall?.function.name === "analisar_sentimento_financeiro") {
    const args = JSON.parse(toolCall.function.arguments);
    
    // Chamar FinBERT
    const sentiment = await analyzeFinancialSentiment(args.texto);
    
    // Cache do resultado
    await redis.setex(
      `sentiment:${Buffer.from(args.texto).toString('base64')}`,
      3600, // 1 hora
      JSON.stringify(sentiment)
    );
    
    // Segunda chamada ao DeepSeek com resultado
    const finalResponse = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        completion.choices[0].message,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(sentiment)
        }
      ]
    });
    
    return NextResponse.json({
      response: finalResponse.choices[0].message.content,
      sentiment_analysis: sentiment
    });
  }
  
  return NextResponse.json({
    response: completion.choices[0].message.content
  });
}
```

### Cache e Otimizações

#### 1. **Cache Inteligente de Sentimento**
```
// src/lib/services/sentiment-cache.ts
import { redis } from '@/lib/redis';

export async function getCachedSentiment(text: string) {
  const key = `sentiment:${Buffer.from(text).toString('base64')}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSentiment(text: string, result: FinBERTResponse) {
  const key = `sentiment:${Buffer.from(text).toString('base64')}`;
  await redis.setex(key, 3600, JSON.stringify(result)); // 1 hora
}
```

#### 2. **Paralelização de Chamadas**
```
// Para múltiplas análises simultâneas
export async function analyzeBatchSentiment(texts: string[]) {
  const promises = texts.map(text => 
    getCachedSentiment(text) || analyzeFinancialSentiment(text)
  );
  
  return Promise.all(promises);
}
```

### Database Schema Extensions

#### 1. **Tabela de Análises de Sentimento**
```
// Adicionar à migration existente
create table sentiment_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  text_content text not null,
  sentiment_label text check (sentiment_label in ('positive', 'neutral', 'negative')),
  confidence_score numeric(3,2),
  model_used text default 'finbert',
  context_data jsonb,
  created_at timestamptz default now()
);

// Índices para performance
create index idx_sentiment_user_id on sentiment_analysis(user_id);
create index idx_sentiment_label on sentiment_analysis(sentiment_label);
create index idx_sentiment_created_at on sentiment_analysis(created_at);
```

#### 2. **Função PostgreSQL para Agregação**
```
// Função para calcular sentimento médio por período
create or replace function get_sentiment_trend(
  symbol_param text,
  days_back integer default 7
) returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'symbol', symbol_param,
    'period_days', days_back,
    'avg_sentiment', avg(
      case 
        when sentiment_label = 'positive' then 1
        when sentiment_label = 'neutral' then 0
        when sentiment_label = 'negative' then -1
      end
    ),
    'total_mentions', count(*),
    'sentiment_distribution', jsonb_build_object(
      'positive', count(*) filter (where sentiment_label = 'positive'),
      'neutral', count(*) filter (where sentiment_label = 'neutral'),
      'negative', count(*) filter (where sentiment_label = 'negative')
    )
  ) into result
  from sentiment_analysis sa
  where sa.context_data->>'symbol' = symbol_param
    and sa.created_at >= now() - interval '1 day' * days_back;
  
  return result;
end;
$$ language plpgsql security definer;
```

### Frontend Components

#### 1. **Componente de Sentimento**
```
// src/components/market/sentiment-indicator.tsx
interface SentimentIndicatorProps {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  symbol?: string;
}

export function SentimentIndicator({ sentiment, score, symbol }: SentimentIndicatorProps) {
  const getColor = () => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getIcon = () => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${getColor()}`}>
      {getIcon()}
      <span className="font-medium capitalize">{sentiment}</span>
      <span className="text-sm opacity-75">({(score * 100).toFixed(1)}%)</span>
    </div>
  );
}
```

#### 2. **Chat com Análise de Sentimento**
```
// src/components/chat/enhanced-message.tsx
interface EnhancedMessageProps {
  content: string;
  sentimentAnalysis?: FinBERTResponse;
}

export function EnhancedMessage({ content, sentimentAnalysis }: EnhancedMessageProps) {
  return (
    <div className="space-y-3">
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      
      {sentimentAnalysis && (
        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Análise de Sentimento
            </span>
            <SentimentIndicator 
              sentiment={sentimentAnalysis.label}
              score={sentimentAnalysis.score}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### Cronograma de Implementação

#### **Semana 1.5: Design System** (Inserir na Semana 1)
- [ ] Configurar Tabler Icons como dependência
- [ ] Criar sistema de ícones padronizado
- [ ] Implementar componente Icon wrapper
- [ ] Definir mapeamento de contexto
- [ ] Documentar convenções de uso

#### **Semana 2: Internacionalização** (Expandir Semana 2)
- [ ] Configurar next-intl
- [ ] Criar estrutura de traduções
- [ ] Implementar middleware de localização
- [ ] Traduzir componentes principais
- [ ] Implementar seletor de idioma

#### **Semana 2.5: Integração Multi-Modelo** (Inserir entre Semana 2 e 3)
- [ ] Configurar Hugging Face API e tokens
- [ ] Implementar serviço FinBERT
- [ ] Criar function calling setup
- [ ] Implementar cache de sentimento
- [ ] Testar integração DeepSeek + FinBERT

#### **Semana 3: Dados de Mercado** (Expandir seção existente)
- [ ] Integrar traduções com análise de sentimento
- [ ] Localizar componentes de mercado
- [ ] Implementar formatação de números por locale
- [ ] Testar fluxos em ambos idiomas

#### **Semana 4: Integração Avançada e Análises**
- [ ] Adicionar análise de sentimento ao chat
- [ ] Implementar componentes de visualização
- [ ] Criar dashboard de sentimento
- [ ] Integrar com dados de mercado
- [ ] Implementar trending de sentimento

### Variáveis de Ambiente Adicionais
```
# Multi-Model APIs
HF_TOKEN=hf_your_hugging_face_token
FINBERT_MODEL_EN=ProsusAI/finbert
FINBERT_MODEL_PT=lucas-leme/FinBERT-PT-BR

# Cache Configuration
SENTIMENT_CACHE_TTL=3600
BATCH_ANALYSIS_LIMIT=10
```

### Dependências Adicionais
```
{
  "dependencies": {
    // ... dependências existentes ...
    "openai": "^4.0.0",
    "node-fetch": "^3.0.0"
  },
  "devDependencies": {
    // ... dependências existentes ...
    "@types/node-fetch": "^2.0.0"
  }
}
```

### Benefícios da Integração Multi-Modelo

#### 1. **Técnicos**
- **Redução de custos:** 40-60% menor que usar apenas GPT-4
- **Latência otimizada:** Análises paralelas com Promise.all
- **Especialização:** FinBERT 95%+ accuracy em sentimento financeiro
- **Escalabilidade:** Cache inteligente reduz chamadas repetidas

#### 2. **Funcionais**
- **Análise de sentimento** em tempo real para notícias
- **Trending de sentimento** por ação/setor
- **Alertas baseados em sentimento** (ex: sentimento muito negativo)
- **Contexto enriquecido** para decisões de investimento

#### 3. **Experiência do Usuário**
- **Respostas mais precisas** com dados quantitativos
- **Visualizações de sentimento** integradas ao chat
- **Histórico de análises** para acompanhamento
- **Insights automáticos** baseados em padrões

---

## Arquitetura do Sistema

### Estrutura Unificada do Projeto
```
penny-wise/
├── src/                     # Next.js Application (Frontend + API Routes)
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Grupo de rotas autenticadas
│   │   ├── (dashboard)/     # Dashboard principal
│   │   ├── api/             # API Routes (Backend integrado)
│   │   │   ├── chat/        # Chat endpoints
│   │   │   ├── market/      # Market data endpoints
│   │   │   ├── options/     # Options analysis endpoints
│   │   │   └── alerts/      # Alerts endpoints
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/          # React Components
│   │   ├── ui/              # Base UI components
│   │   ├── chat/            # Chat components
│   │   ├── market/          # Market components
│   │   └── layout/          # Layout components
│   ├── lib/                 # Utilities & Services
│   │   ├── supabase/        # Supabase client & types
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utilities
│   │   └── hooks/           # Custom hooks
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript definitions
├── supabase/                # Database & Edge Functions
│   ├── functions/           # Edge Functions (para processamento pesado)
│   │   ├── market-sync/     # Sincronização de dados de mercado
│   │   └── alerts-cron/     # Processamento de alertas em background
│   ├── migrations/          # Database schema
│   ├── seed.sql            # Dados iniciais
│   └── config.toml
├── public/                  # Assets estáticos
├── docs/                    # Documentação
├── package.json
├── next.config.js
└── tailwind.config.js
```

### Core Features
1. **Chat Interface** - Conversa fluida com histórico e context-aware responses
2. **Análise de Ações** - Consulta preços, gráficos, indicadores técnicos
3. **Análise de Opções** - Greeks, volatilidade, estratégias, payoff diagrams
4. **Watchlist** - Acompanhamento de ativos com alertas personalizados
5. **Alertas Inteligentes** - Notificações baseadas em ML e análise técnica
6. **Dashboard** - Visão geral personalizada com widgets drag-and-drop
7. **Portfolio Tracker** - Acompanhamento de performance e métricas de risco
8. **Market Scanner** - Busca automática de oportunidades baseada em critérios

### Melhorias Arquiteturais Propostas

#### 1. **Arquitetura Híbrida Inteligente**
- **Next.js API Routes** para lógica de negócio e integração com APIs externas
- **Supabase Edge Functions** apenas para processamento pesado e jobs em background
- **Server Components** para renderização otimizada de dados de mercado
- **Client Components** para interatividade e real-time updates

#### 2. **Sistema de Cache Multicamadas**
- **Redis/Upstash** para cache de alta performance
- **Next.js Cache** para dados estáticos
- **TanStack Query** para cache client-side
- **Supabase Cache** para dados de banco

#### 3. **Real-time Architecture**
- **Supabase Realtime** para updates de mercado
- **WebSocket** para chat em tempo real
- **Server-Sent Events** para notificações
- **Optimistic Updates** para melhor UX

---

## CRONOGRAMA DE DESENVOLVIMENTO (6 SEMANAS)

## SEMANA 1: Setup e Configuração Base

### Setup Unificado do Projeto
- [ ] Criar projeto Next.js 14 com TypeScript
- [ ] Configurar Tailwind CSS + shadcn/ui
- [ ] Configurar ESLint + Prettier + Husky
- [ ] Setup do Supabase (projeto + CLI)
- [ ] Configurar variáveis de ambiente
- [ ] Setup do sistema de cache (Upstash Redis)
- [ ] Configurar monitoramento (Sentry/LogRocket)

**Comandos de Setup:**
```
# Criar projeto Next.js
npx create-next-app@latest penny-wise --typescript --tailwind --eslint --app
cd penny-wise

# Instalar dependências principais
npm install @supabase/supabase-js zustand @tanstack/react-query
npm install @upstash/redis framer-motion lucide-react
npm install recharts react-hook-form zod date-fns

# Instalar dependências de desenvolvimento
npm install -D @types/node husky lint-staged prettier

# Setup Supabase
npx supabase init
npx supabase start
npx supabase login

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog
```

### Database Schema Base
- [ ] Criar migration inicial
- [ ] Implementar tabelas core
- [ ] Configurar Row Level Security (RLS)
- [ ] Testar políticas de segurança

**Schema Principal:**
```
-- Usuários (estende auth.users)
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  preferences jsonb,
  created_at timestamptz default now()
);

-- Conversas do chat
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  title text,
  created_at timestamptz default now()
);

-- Mensagens do chat
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations,
  role text check (role in ('user', 'assistant')),
  content text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Watchlist personalizada
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  symbol text,
  added_at timestamptz default now(),
  alerts jsonb
);

-- Cache de dados de mercado
create table market_cache (
  symbol text primary key,
  data jsonb,
  updated_at timestamptz default now()
);

-- Análises salvas
create table saved_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  symbol text,
  analysis_type text,
  data jsonb,
  created_at timestamptz default now()
);
```

### Autenticação
- [ ] Configurar providers OAuth (Google, GitHub)
- [ ] Configurar Magic Link
- [ ] Configurar templates de email
- [ ] Testar fluxos de autenticação

---

## SEMANA 2: Autenticação e Chat Inteligente

### Sistema de Autenticação Unificado
- [ ] Configurar Supabase Auth com providers sociais
- [ ] Implementar middleware de autenticação Next.js
- [ ] Criar componentes de login/registro
- [ ] Setup de proteção de rotas
- [ ] Gerenciamento de sessão com cookies seguros

### API Routes para Chat
- [ ] Criar `/api/chat/send` - Endpoint principal do chat
- [ ] Implementar integração com DeepSeek-V3
- [ ] Sistema de context injection inteligente
- [ ] Cache de conversas com Redis
- [ ] Rate limiting por usuário

**API Route Example:**
```
// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMarketContext } from '@/lib/services/market-context'
import { callDeepseek } from '@/lib/services/deepseek'
import { redis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  const { message, conversation_id } = await request.json()
  
  // Verificar autenticação
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Rate limiting
  const rateLimitKey = `rate_limit:${user.id}`
  const requests = await redis.incr(rateLimitKey)
  if (requests === 1) await redis.expire(rateLimitKey, 60)
  if (requests > 10) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  
  // Buscar histórico com cache
  const cacheKey = `conversation:${conversation_id}`
  let history = await redis.get(cacheKey)
  
  if (!history) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at')
    history = data
    await redis.setex(cacheKey, 300, JSON.stringify(history)) // 5min cache
  }
  
  // Context injection inteligente
  const marketContext = await getMarketContext(message)
  
  // Chamar Deepseek com streaming
  const response = await callDeepseek({
    messages: [...history, { role: 'user', content: message }],
    context: marketContext,
    stream: true
  })
  
  // Salvar mensagens
  await supabase.from('messages').insert([
    { conversation_id, role: 'user', content: message, user_id: user.id },
    { conversation_id, role: 'assistant', content: response, user_id: user.id }
  ])
  
  // Invalidar cache
  await redis.del(cacheKey)
  
  return NextResponse.json({ response })
}
```

### Interface de Chat Avançada
- [ ] Chat com streaming de respostas
- [ ] Markdown rendering com syntax highlighting
- [ ] Comandos especiais (/analyze, /compare, /alert)
- [ ] Upload de arquivos (CSV, Excel)
- [ ] Histórico de conversas com busca
- [ ] Export de conversas

**Componentes Principais:**
- `ChatInterface` - Container principal
- `MessageStream` - Streaming de respostas
- `CommandPalette` - Comandos especiais
- `FileUpload` - Upload de dados
- `ConversationHistory` - Histórico com busca

### Layout e Navegação
- [ ] Layout responsivo com sidebar colapsável
- [ ] Navegação contextual baseada na página
- [ ] Breadcrumbs dinâmicos
- [ ] Shortcuts de teclado
- [ ] Tema dark/light com persistência

**Componentes de Layout:**
- `AppShell` - Container principal
- `NavigationSidebar` - Navegação lateral
- `TopBar` - Barra superior com user menu
- `CommandBar` - Barra de comandos global

---

## SEMANA 2.5: Integração Multi-Modelo

### Sistema Multi-Modelo com FinBERT
- [ ] Configurar Hugging Face API e tokens
- [ ] Implementar serviço FinBERT para análise de sentimento
- [ ] Criar function calling setup para DeepSeek-V3
- [ ] Implementar cache de sentimento com Redis
- [ ] Testar integração DeepSeek + FinBERT

### Database Schema para Sentimento
- [ ] Criar tabela sentiment_analysis
- [ ] Implementar índices para performance
- [ ] Criar função PostgreSQL para agregação de sentimento
- [ ] Configurar políticas RLS para análises

**Sentiment Analysis Schema:**
```sql
-- Tabela de análises de sentimento
create table sentiment_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  text_content text not null,
  sentiment_label text check (sentiment_label in ('positive', 'neutral', 'negative')),
  confidence_score numeric(3,2),
  model_used text default 'finbert',
  context_data jsonb,
  created_at timestamptz default now()
);

-- Índices para performance
create index idx_sentiment_user_id on sentiment_analysis(user_id);
create index idx_sentiment_label on sentiment_analysis(sentiment_label);
create index idx_sentiment_created_at on sentiment_analysis(created_at);
```

### API Routes para Multi-Modelo
- [ ] Criar `/api/chat/enhanced` - Chat com análise de sentimento
- [ ] Implementar cache inteligente de sentimento
- [ ] Configurar rate limiting para APIs externas
- [ ] Testar integração completa

---

## SEMANA 3: Dados de Mercado

### Backend: Market Data APIs
- [ ] Integração com Alpha Vantage API
- [ ] Integração com Yahoo Finance (fallback)
- [ ] Sistema de cache inteligente
- [ ] Validação e normalização de dados
- [ ] Tratamento de rate limits

**Market Data Function:**
```typescript
// supabase/functions/market-data/index.ts
serve(async (req) => {
  const { symbols, dataType } = await req.json()
  
  // Verificar cache primeiro
  const cachedData = await checkCache(symbols)
  const needsUpdate = symbols.filter(s => !cachedData[s] || isStale(cachedData[s]))
  
  // Buscar dados frescos das APIs
  const freshData = await Promise.all([
    fetchAlphaVantage(needsUpdate),
    fetchYahooFinance(needsUpdate), // fallback
    fetchPolygonFree(needsUpdate)   // backup
  ])
  
  // Atualizar cache
  await updateCache(freshData)
  
  return new Response(JSON.stringify(freshData))
})
```

### Frontend: Visualização de Dados
- [ ] Componentes de mercado
- [ ] Cards de ações
- [ ] Tabelas de cotações
- [ ] Gráficos básicos
- [ ] Watchlist interface

**Componentes:**
- `StockCard`
- `PriceTable`
- `SimpleChart`
- `WatchlistPanel`
- `MarketOverview`

### Real-time Features
- [ ] WebSocket connection
- [ ] Real-time messages
- [ ] Real-time market data
- [ ] Connection status
- [ ] Reconnection logic

**Real-time Setup:**
```typescript
// Real-time para watchlist
const subscription = supabase
  .channel('watchlist-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'market_cache',
    filter: `symbol=in.(${userWatchlist.join(',')})`
  }, (payload) => {
    updatePrices(payload.new)
  })
  .subscribe()
```

---

## SEMANA 4: Integração Avançada e Análises

### Backend: Options Analysis
- [ ] Implementar cálculos de Greeks
- [ ] Cálculo de volatilidade implícita
- [ ] Análise de estratégias de opções
- [ ] Métricas de risco
- [ ] Cache de cálculos complexos

**Options Analysis Function:**
```typescript
// supabase/functions/options-analysis/index.ts
serve(async (req) => {
  const { symbol, expiration, strategy } = await req.json()
  
  // Buscar cadeia de opções
  const options = await getOptionsChain(symbol, expiration)
  
  // Calcular Greeks e métricas
  const analysis = {
    greeks: calculateGreeks(options),
    volatility: calculateIV(options),
    strategies: analyzeStrategies(options, strategy),
    riskMetrics: calculateRisk(options)
  }
  
  return new Response(JSON.stringify(analysis))
})
```

### Database Functions (PostgreSQL)
- [ ] Função para cálculo de portfolio
- [ ] Função para análise técnica
- [ ] Função para ranking de ações
- [ ] Otimização de queries complexas

**Portfolio Function:**
```sql
-- Função para calcular portfolio performance
create or replace function calculate_portfolio_performance(user_uuid uuid)
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_value', sum((data->>'price')::numeric * (data->>'quantity')::numeric),
    'day_change', sum((data->>'day_change')::numeric),
    'positions', count(*)
  ) into result
  from watchlist w
  join market_cache m on w.symbol = m.symbol
  where w.user_id = user_uuid;
  
  return result;
end;
$$ language plpgsql security definer;
```

### Vector Search (RAG)
- [ ] Habilitar extensão pgvector
- [ ] Criar tabela de embeddings
- [ ] Implementar geração de embeddings
- [ ] Sistema de busca semântica
- [ ] Integração com chat

**Vector Setup:**
```sql
-- Habilitar pgvector
create extension if not exists vector;

-- Tabela para embeddings de análises
create table analysis_embeddings (
  id uuid primary key default gen_random_uuid(),
  content text,
  embedding vector(1536),
  metadata jsonb
);

-- Busca semântica
select content, metadata
from analysis_embeddings
where embedding <-> query_embedding < 0.8
order by embedding <-> query_embedding
limit 5;
```

### Frontend: Gráficos Avançados
- [ ] Integração com Chart.js/Recharts
- [ ] Gráficos de candlestick
- [ ] Gráficos de volume
- [ ] Indicadores técnicos visuais
- [ ] Análise de opções

**Componentes:**
- `AdvancedChart`
- `CandlestickChart`
- `OptionsTable`
- `GreeksVisualization`
- `PayoffDiagram`

### Integração de Análise de Sentimento
- [ ] Adicionar análise de sentimento ao chat
- [ ] Implementar componentes de visualização de sentimento
- [ ] Criar dashboard de sentimento
- [ ] Integrar com dados de mercado
- [ ] Implementar trending de sentimento
- [ ] Configurar alertas baseados em sentimento

**Componentes de Sentimento:**
- `SentimentIndicator`
- `SentimentDashboard`
- `SentimentTrend`
- `EnhancedMessage`

---

## SEMANA 5: Features Avançadas e Alertas

### Backend: Sistema de Alertas
- [ ] Sistema de alertas de preço
- [ ] Alertas de volume
- [ ] Alertas técnicos (RSI, MACD, etc.)
- [ ] Notificações push
- [ ] Histórico de alertas

### Scheduled Jobs (Cron)
- [ ] Job para atualização de cache
- [ ] Job para processamento de alertas
- [ ] Job para limpeza de dados antigos
- [ ] Monitoramento de jobs

**Cron Jobs:**
```sql
-- Atualizar cache de mercado a cada 5 minutos
select cron.schedule(
  'update-market-cache',
  '*/5 * * * *',
  'select net.http_post(url:=''https://your-project.supabase.co/functions/v1/market-data'')'
);
```

### Frontend: Dashboard e Features
- [ ] Dashboard personalizado
- [ ] Widgets configuráveis
- [ ] Sistema de notificações
- [ ] Configuração de alertas
- [ ] Exportação de dados

**Componentes:**
- `Dashboard`
- `Widget`
- `NotificationCenter`
- `AlertsPanel`
- `ExportDialog`

### Storage e Otimizações
- [ ] Configurar buckets para charts
- [ ] Configurar buckets para exports
- [ ] Políticas de acesso
- [ ] Limpeza automática de arquivos

**Storage Setup:**
```typescript
// Salvar gráficos gerados
const { data, error } = await supabase.storage
  .from('charts')
  .upload(`${userId}/${symbol}-${timestamp}.png`, chartBlob)

// URLs públicas temporárias
const { data: { publicUrl } } = supabase.storage
  .from('charts')
  .getPublicUrl(filePath)
```

---

## SEMANA 6: Otimização e Deploy

### Performance e Cache
- [ ] Implementar Redis-like cache
- [ ] Otimização de queries
- [ ] Índices de banco otimizados
- [ ] Compressão de dados

### Frontend: PWA e Otimizações
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Service Worker
- [ ] Offline functionality

### Testes Completos
- [ ] Testes de carga
- [ ] Testes de stress
- [ ] Testes de segurança
- [ ] Testes de integração completa

### Deploy e CI/CD
- [ ] Setup de staging environment
- [ ] Pipeline de deploy automático
- [ ] Rollback strategies
- [ ] Health checks
- [ ] Monitoramento e logs

### Documentação
- [ ] Documentação da API (OpenAPI)
- [ ] Guias de desenvolvimento
- [ ] Troubleshooting guide
- [ ] Performance benchmarks

---

## Estrutura Final Unificada

```
penny-wise/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Grupo de autenticação
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/              # Dashboard principal
│   │   │   ├── chat/                 # Interface de chat
│   │   │   ├── market/               # Análise de mercado
│   │   │   ├── portfolio/            # Gestão de portfolio
│   │   │   ├── scanner/              # Market scanner
│   │   │   ├── alerts/               # Sistema de alertas
│   │   │   └── settings/             # Configurações
│   │   ├── api/                      # API Routes (Backend integrado)
│   │   │   ├── auth/                 # Autenticação
│   │   │   ├── chat/                 # Chat endpoints
│   │   │   │   ├── send/
│   │   │   │   ├── history/
│   │   │   │   └── export/
│   │   │   ├── market/               # Market data
│   │   │   │   ├── quote/
│   │   │   │   ├── chart/
│   │   │   │   └── search/
│   │   │   ├── options/              # Options analysis
│   │   │   │   ├── chain/
│   │   │   │   ├── greeks/
│   │   │   │   └── strategies/
│   │   │   ├── portfolio/            # Portfolio management
│   │   │   │   ├── positions/
│   │   │   │   ├── performance/
│   │   │   │   └── risk/
│   │   │   ├── alerts/               # Alert system
│   │   │   │   ├── create/
│   │   │   │   ├── trigger/
│   │   │   │   └── history/
│   │   │   └── scanner/              # Market scanner
│   │   │       ├── scan/
│   │   │       └── criteria/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── middleware.ts             # Auth middleware
│   ├── components/                   # React Components
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── chat/                     # Chat components
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-stream.tsx
│   │   │   ├── command-palette.tsx
│   │   │   └── file-upload.tsx
│   │   ├── market/                   # Market components
│   │   │   ├── stock-card.tsx
│   │   │   ├── advanced-chart.tsx
│   │   │   ├── options-table.tsx
│   │   │   └── market-scanner.tsx
│   │   ├── portfolio/                # Portfolio components
│   │   │   ├── portfolio-overview.tsx
│   │   │   ├── position-card.tsx
│   │   │   └── risk-metrics.tsx
│   │   └── layout/                   # Layout components
│   │       ├── app-shell.tsx
│   │       ├── navigation-sidebar.tsx
│   │       └── top-bar.tsx
│   ├── lib/                          # Utilities & Services
│   │   ├── supabase/                 # Supabase client & types
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── services/                 # Business logic services
│   │   │   ├── deepseek.ts
│   │   │   ├── market-data.ts
│   │   │   ├── options-analysis.ts
│   │   │   ├── portfolio.ts
│   │   │   └── alerts.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── calculations.ts
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-market-data.ts
│   │   │   ├── use-portfolio.ts
│   │   │   └── use-realtime.ts
│   │   ├── redis.ts                  # Redis client
│   │   └── constants.ts              # App constants
│   ├── store/                        # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── chat-store.ts
│   │   ├── market-store.ts
│   │   ├── portfolio-store.ts
│   │   └── ui-store.ts
│   └── types/                        # TypeScript definitions
│       ├── auth.ts
│       ├── chat.ts
│       ├── market.ts
│       ├── portfolio.ts
│       └── api.ts
├── supabase/                         # Database & Background Jobs
│   ├── config.toml
│   ├── migrations/                   # Database schema
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_analysis_functions.sql
│   │   ├── 003_portfolio_functions.sql
│   │   ├── 004_alert_system.sql
│   │   └── 005_optimizations.sql
│   ├── functions/                    # Edge Functions (apenas jobs pesados)
│   │   ├── market-sync/              # Sincronização de dados
│   │   │   └── index.ts
│   │   └── alerts-cron/              # Processamento de alertas
│   │       └── index.ts
│   └── seed.sql                      # Dados iniciais
├── public/                           # Assets estáticos
├── docs/                             # Documentação
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local
```

---

## Melhorias Arquiteturais Implementadas

### 1. **Arquitetura Unificada Full-Stack**
**Antes:** Frontend e backend separados  
**Agora:** Next.js 14 com API Routes integradas

**Vantagens:**
- **Desenvolvimento simplificado** - Um único repositório e deploy
- **Type safety completo** - Tipos compartilhados entre frontend e backend
- **Performance otimizada** - Server Components e caching nativo
- **Menor latência** - Eliminação de round-trips desnecessários
- **Debugging facilitado** - Stack trace completo em um só lugar

### 2. **Sistema de Cache Inteligente Multicamadas**
```typescript
// Exemplo de implementação do cache
export async function getMarketData(symbol: string) {
  // 1. Cache Redis (mais rápido)
  const cached = await redis.get(`market:${symbol}`)
  if (cached) return JSON.parse(cached)
  
  // 2. Cache Next.js (revalidação automática)
  const data = await fetch(`/api/market/quote/${symbol}`, {
    next: { revalidate: 60 } // 1 minuto
  })
  
  // 3. Cache no Supabase
  await supabase.from('market_cache').upsert({
    symbol,
    data: data,
    updated_at: new Date()
  })
  
  // 4. Cache Redis com TTL
  await redis.setex(`market:${symbol}`, 300, JSON.stringify(data))
  
  return data
}
```

### 3. **Portfolio Tracker Avançado**
Nova funcionalidade que não estava no plano original:
- **Tracking automático** de posições
- **Métricas de risco** em tempo real
- **Performance attribution** por setor/ativo
- **Rebalanceamento inteligente** com sugestões da IA

### 4. **Market Scanner com ML**
Sistema de descoberta de oportunidades:
- **Screening automático** baseado em critérios técnicos
- **Alertas preditivos** usando análise de padrões
- **Ranking de ações** por potencial de alta/baixa
- **Backtesting** de estratégias

### 5. **Sistema de Comandos Avançado**
Chat com comandos especiais:
```
/analyze PETR4 - Análise completa da ação
/compare PETR4 VALE3 - Comparação entre ativos
/alert PETR4 > 35 - Criar alerta de preço
/portfolio add PETR4 100 - Adicionar posição
/scan momentum - Buscar ações com momentum
/backtest strategy - Testar estratégia
```

### 6. **Real-time Architecture Otimizada**
```typescript
// Implementação de real-time otimizada
export function useRealtimeMarketData(symbols: string[]) {
  const [data, setData] = useState<MarketData[]>([])
  
  useEffect(() => {
    // WebSocket para dados críticos (preços)
    const ws = new WebSocket('/api/realtime/market')
    
    // Supabase Realtime para dados menos críticos
    const subscription = supabase
      .channel('market-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'market_cache',
        filter: `symbol=in.(${symbols.join(',')})`
      }, handleUpdate)
      .subscribe()
    
    return () => {
      ws.close()
      subscription.unsubscribe()
    }
  }, [symbols])
  
  return data
}
```

---

## APIs Externas e Integrações

### 1. DeepSeek-V3 API
- **Endpoint:** `https://api.deepseek.com/v1/chat/completions`
- **Autenticação:** API Key
- **Rate Limit:** Verificar documentação

### 2. Alpha Vantage (Gratuito)
- **Endpoint:** `https://www.alphavantage.co/query`
- **Rate Limit:** 5 calls/minute, 500 calls/day
- **Dados:** Ações, forex, crypto

### 3. Yahoo Finance (Backup)
- **Endpoint:** Não oficial, usar biblioteca
- **Rate Limit:** Não documentado
- **Dados:** Ações globais

### 4. Oplab (Opções Brasil)
- **Endpoint:** Verificar documentação
- **Autenticação:** API Key
- **Dados:** Opções B3

---

## Dependências e Configuração

### Dependências Completas
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "zustand": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.300.0",
    "@tabler/icons-react": "^2.47.0",
    "recharts": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@upstash/redis": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.0.0",
    "date-fns": "^2.0.0",
    "react-dropzone": "^14.0.0",
    "papaparse": "^5.0.0",
    "react-beautiful-dnd": "^13.0.0",
    "react-virtualized": "^9.0.0",
    "ws": "^8.0.0",
    "openai": "^4.0.0",
    "node-fetch": "^3.0.0",
    "next-intl": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/papaparse": "^5.0.0",
    "@types/react-beautiful-dnd": "^13.0.0",
    "@types/react-virtualized": "^9.0.0",
    "@types/ws": "^8.0.0",
    "@types/node-fetch": "^2.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

### Variáveis de Ambiente
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# APIs Externas
DEEPSEEK_API_KEY=
ALPHA_VANTAGE_API_KEY=
OPLAB_API_KEY=

# Multi-Model APIs
HF_TOKEN=hf_your_hugging_face_token
FINBERT_MODEL_EN=ProsusAI/finbert
FINBERT_MODEL_PT=lucas-leme/FinBERT-PT-BR

# Cache Configuration
SENTIMENT_CACHE_TTL=3600
BATCH_ANALYSIS_LIMIT=10

# Internacionalização
NEXT_PUBLIC_DEFAULT_LOCALE=pt-BR
NEXT_PUBLIC_SUPPORTED_LOCALES=en,pt-BR

# Configurações
ENVIRONMENT=development
LOG_LEVEL=debug
```

---

## Custos e Recursos

### Supabase Free Tier
- **Database:** 500MB
- **Auth:** 50,000 usuários
- **Storage:** 1GB
- **Edge Functions:** 500,000 invocações
- **Realtime:** 200 conexões simultâneas

### Custos Externos (Mensal)
- **Deepseek API:** $10-30/mês
- **Upstash Redis:** $0-10/mês (tier gratuito até 10k requests)
- **Market Data APIs:** Gratuito (tiers iniciais)
- **Vercel:** Gratuito para hobby
- **Total:** $10-40/mês

### Comparação de Custos: Antes vs Depois
**Arquitetura Anterior (Separada):**
- Supabase Pro: $25/mês
- Vercel Pro: $20/mês (para backend)
- APIs: $10-30/mês
- **Total: $55-75/mês**

**Nova Arquitetura (Unificada):**
- Supabase Free: $0/mês
- Upstash Redis: $0-10/mês
- Vercel Free: $0/mês
- APIs: $10-30/mês
- **Total: $10-40/mês**

**Economia: 60-70% nos custos de infraestrutura**

---

## Métricas de Sucesso

### Performance Targets
- [ ] **Response Time:** < 200ms para 95% das requests
- [ ] **First Contentful Paint:** < 1.5s
- [ ] **Largest Contentful Paint:** < 2.5s
- [ ] **Cumulative Layout Shift:** < 0.1
- [ ] **Bundle Size:** < 500KB (gzipped)

### Qualidade e Segurança
- [ ] **Disponibilidade:** 99.9% uptime
- [ ] **Escalabilidade:** Suportar 1000+ usuários simultâneos
- [ ] **Segurança:** Zero vulnerabilidades críticas
- [ ] **Cobertura de Testes:** > 80%
- [ ] **Acessibilidade:** WCAG 2.1 AA compliance

---

## Desenvolvimento Independente

### Como Frontend e Backend podem ser desenvolvidos em paralelo:

1. **Mock Data:** Usar dados mockados durante desenvolvimento
2. **API Contracts:** Definir interfaces TypeScript baseadas no backend plan
3. **Environment Switching:** Alternar entre mock e APIs reais
4. **Storybook:** Desenvolver componentes isoladamente
5. **MSW (Mock Service Worker):** Simular APIs durante testes

### Exemplo de Mock:
```typescript
// lib/mocks/market-data.ts
export const mockMarketData = {
  'PETR4': {
    price: 32.45,
    change: 0.85,
    changePercent: 2.69,
    volume: 15420000
  }
}
```

---

## Vantagens da Nova Arquitetura Unificada

### Técnicas
1. **Custo 60-70% menor** com tier gratuito otimizado
2. **Performance superior** com cache multicamadas
3. **Type safety completo** entre frontend e backend
4. **Desenvolvimento 40% mais rápido** com stack unificada
5. **Debugging simplificado** com stack trace único
6. **Deploy atômico** sem problemas de sincronização
7. **Escalabilidade automática** com Vercel + Supabase

### Funcionais
1. **Portfolio Tracker** - Gestão completa de investimentos
2. **Market Scanner** - Descoberta automática de oportunidades
3. **Comandos Inteligentes** - Chat com ações diretas
4. **Real-time Otimizado** - Updates instantâneos
5. **Cache Inteligente** - Performance consistente
6. **Análise Preditiva** - ML para alertas avançados

## Diferenciais Competitivos Únicos

### 1. **Chat Financeiro Mais Avançado do Mercado**
- Context injection automático com dados de mercado
- Comandos especiais para ações diretas
- Streaming de respostas em tempo real
- Upload e análise de planilhas

### 2. **Portfolio Intelligence**
- Tracking automático de posições
- Métricas de risco em tempo real
- Sugestões de rebalanceamento com IA
- Performance attribution detalhada

### 3. **Market Discovery Engine**
- Scanner automático de oportunidades
- Alertas preditivos com ML
- Backtesting integrado
- Ranking inteligente de ativos

### 4. **Performance e Custo Imbatíveis**
- Carregamento sub-segundo
- 60-70% mais barato que concorrentes
- Escalabilidade automática
- Zero downtime

### 5. **Developer Experience Superior**
- Stack unificada moderna
- Type safety completo
- Hot reload em desenvolvimento
- Debugging integrado

---

## Próximos Passos Imediatos

1. [ ] Validar acesso às APIs escolhidas
2. [ ] Criar wireframes detalhados
3. [ ] Configurar ambiente de desenvolvimento
4. [ ] Implementar autenticação simples
5. [ ] Desenvolver primeiro protótipo funcional

---

*Este documento serve como guia completo para o desenvolvimento do Penny Wise, combinando planejamento de backend, frontend e estratégia de MVP em um cronograma executável de 6 semanas.*

---

## RESUMO EXECUTIVO: Integração Multi-Modelo

### Estratégia de Implementação Otimizada

A integração do sistema multi-modelo baseado no `multi-model.md` no Penny Wise foi estrategicamente planejada para **maximizar valor** com **mínimo impacto** no cronograma original de 6 semanas.

### Pontos-Chave da Integração

#### 1. **Timing Perfeito**
- **Semana 2.5:** Implementação core do sistema multi-modelo
- **Semana 4:** Expansão com análises avançadas de sentimento
- **Zero atraso** no cronograma original

#### 2. **Arquitetura Híbrida Inteligente**
```
DeepSeek-V3 (Orquestrador) + FinBERT (Especialista) = Solução Completa
```
- **DeepSeek-V3:** Mantém como modelo principal para chat e reasoning
- **FinBERT:** Adiciona análise de sentimento financeiro especializada
- **Function Calling:** Integração nativa e transparente

#### 3. **ROI Imediato**
- **Redução de custos:** 40-60% vs. usar apenas GPT-4
- **Precisão superior:** FinBERT 95%+ accuracy em sentimento financeiro
- **Diferencial competitivo:** Análise de sentimento em tempo real

#### 4. **Implementação Progressiva**

| Fase | Semana | Entregáveis | Impacto |
|------|--------|-------------|---------|
| **Setup** | 2.5 | FinBERT integration, Function calling | Base técnica |
| **Core** | 4 | Sentiment analysis no chat | Feature completa |
| **Advanced** | 5-6 | Dashboard, trending, alertas | Diferencial |

#### 5. **Benefícios Técnicos**

**Performance:**
- Cache inteligente com Redis (TTL 1h)
- Paralelização com Promise.all
- Fallbacks robustos

**Escalabilidade:**
- Batch processing para múltiplas análises
- Rate limiting automático
- Monitoramento de latência

**Manutenibilidade:**
- Código modular e testável
- Types TypeScript completos
- Documentação integrada

#### 6. **Benefícios Funcionais**

**Para Usuários:**
- Análise de sentimento automática em notícias
- Indicadores visuais de sentimento por ação
- Alertas baseados em mudanças de sentimento
- Histórico de análises para tracking

**Para o Negócio:**
- Diferencial competitivo único no mercado
- Dados proprietários de sentimento
- Insights para tomada de decisão
- Base para features futuras (ML, predições)

### Riscos Mitigados

#### 1. **Dependência Externa (Hugging Face)**
- **Solução:** Fallbacks e cache robusto
- **Backup:** Múltiplos modelos disponíveis
- **Monitoramento:** Health checks automáticos

#### 2. **Latência Adicional**
- **Solução:** Cache de 1 hora + paralelização
- **Otimização:** Batch processing
- **Fallback:** Resposta sem sentimento se timeout

#### 3. **Custos de API**
- **Solução:** Tier gratuito HF + cache inteligente
- **Controle:** Rate limiting e batch limits
- **Monitoramento:** Tracking de usage

### Métricas de Sucesso

#### Técnicas
- [ ] **Latência:** < 300ms para análise de sentimento
- [ ] **Cache Hit Rate:** > 70%
- [ ] **Uptime:** 99.9% para serviço de sentimento
- [ ] **Accuracy:** > 90% vs. análise manual

#### Funcionais
- [ ] **Adoption:** 80% dos usuários usam análise de sentimento
- [ ] **Engagement:** 25% aumento no tempo de sessão
- [ ] **Retention:** 15% melhoria na retenção semanal
- [ ] **Satisfaction:** NPS > 8.0 para feature de sentimento

### Roadmap Futuro

#### Curto Prazo (Pós-MVP)
- [ ] Análise de sentimento em tempo real para watchlist
- [ ] Alertas preditivos baseados em mudanças de sentimento
- [ ] Dashboard de sentimento por setor/mercado

#### Médio Prazo (3-6 meses)
- [ ] Integração com mais modelos especializados
- [ ] Análise de sentimento em redes sociais
- [ ] ML para predição de movimentos baseado em sentimento

#### Longo Prazo (6+ meses)
- [ ] Modelos proprietários treinados em dados brasileiros
- [ ] Análise multimodal (texto + imagem + vídeo)
- [ ] Sistema de recomendação baseado em sentimento

### Conclusão

A integração do sistema multi-modelo representa um **upgrade estratégico** do Penny Wise que:

1. **Mantém** o cronograma original de 6 semanas
2. **Adiciona** capacidades de análise de sentimento de classe mundial
3. **Reduz** custos operacionais em 40-60%
4. **Cria** diferencial competitivo sustentável
5. **Estabelece** base para inovações futuras

### Funcionalidades Adicionais Integradas

#### **Design System Profissional Completo**
- **Sistema de ícones padronizado** com Lucide + Tabler Icons (outline style)
- **Tipografia moderna** com Outfit (títulos) + Inter Light (textos)
- **Botões 100% arredondados** com border radius consistente
- **Componentes UI unificados** com bordas arredondadas
- **Hierarquia visual clara** com pesos de fonte otimizados
- **Documentação completa** de convenções e uso

#### **Sistema de Tipografia Avançado (Google Fonts)**
- **Outfit via Google Fonts** para todos os títulos e subtítulos (h1-h6)
- **Inter Light (300) via Google Fonts** como peso principal para textos
- **Implementação otimizada** com Next.js Font para ambas as fontes
- **Fallbacks robustos** para compatibilidade máxima
- **Classes CSS utilitárias** para aplicação consistente
- **Componentes Typography** type-safe com TypeScript
- **Performance optimization** com preload e display=swap

#### **Interface Moderna com Bordas Arredondadas**
- **Botões arredondados** em todos os tamanhos (8px a 16px)
- **Cards e modais** com bordas suaves (16px-20px)
- **Inputs e formulários** com cantos arredondados (12px)
- **Floating Action Buttons** completamente circulares
- **Consistência visual** em toda a aplicação
- **Acessibilidade mantida** com focus states otimizados

#### **Internacionalização Completa**
- **Suporte nativo** para Português (Brasil) e Inglês
- **next-intl** para performance otimizada
- **Traduções modulares** por namespace
- **Seletor de idioma** integrado
- **Formatação localizada** de números e datas

#### **Integração Multi-Modelo Localizada**
- **Análise de sentimento** em ambos idiomas
- **FinBERT-PT-BR** para português
- **FinBERT original** para inglês
- **Traduções automáticas** de resultados

Esta implementação posiciona o Penny Wise como a **plataforma de análise financeira com IA mais avançada** do mercado brasileiro, combinando:

- **Chat conversacional fluido** com insights quantitativos de sentimento
- **Design system profissional** com tipografia moderna e interface arredondada
- **Experiência visual premium** com Outfit + Inter Light
- **Suporte internacional** para expansão global
- **Arquitetura escalável** preparada para o futuro

---
```

#### **Exemplo Prático de Implementação:**

```typescript
// src/app/layout.tsx - Implementação Final Recomendada
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

// Configuração otimizada do Inter
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

// Configuração do Outfit
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  );
}
```

```css
/* src/app/globals.css - Configuração CSS */
:root {
  --font-outfit: 'Outfit', 'Helvetica Neue', Arial, sans-serif;
  --font-inter: 'Inter', 'Helvetica Neue', Arial, sans-serif;
}

/* Classes de tipografia com fontes Google Fonts */
.heading-1 {
  font-family: var(--font-outfit);
  @apply text-4xl font-medium leading-tight tracking-tight;
}

.body-normal {
  font-family: var(--font-inter);
  @apply text-base font-light leading-normal;
}
```

```typescript
// Exemplo de uso nos componentes
import { H1, BodyText } from '@/components/ui/typography';

export function WelcomeSection() {
  return (
    <div>
      <H1 className="text-gray-900 mb-4">
        Bem-vindo ao Penny Wise
      </H1>
      <BodyText className="text-gray-600">
        Sua plataforma de análise financeira com IA
      </BodyText>
    </div>
  );
}
```

### Cronograma de Implementação