import {
  BarChart3,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Bell,
  Settings,
  TrendingDown,
  Minus,
  DollarSign,
  Target,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Share,
  Copy,
  Check,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Candlestick,
} from './index';

export const CONTEXT_ICONS = {
  // Navegação
  navigation: {
    dashboard: BarChart3,
    chat: MessageSquare,
    portfolio: Briefcase,
    market: TrendingUp,
    alerts: Bell,
    settings: Settings,
  },

  // Mercado Financeiro
  market: {
    bullish: TrendingUp,
    bearish: TrendingDown,
    neutral: Minus,
    volume: BarChart3,
    price: DollarSign,
    candlestick: Candlestick, // Tabler
    options: Target,
  },

  // Sentimento (Multi-modelo)
  sentiment: {
    positive: ThumbsUp,
    negative: ThumbsDown,
    neutral: Minus,
    analysis: Brain,
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
    copy: Copy,
  },

  // Status
  status: {
    success: Check,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
  },
} as const;
