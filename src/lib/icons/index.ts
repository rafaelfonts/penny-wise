// src/lib/icons/index.ts
import {
  // Navegação e UI
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  // Financeiro
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  // Ações do usuário
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Share,
  Save,
  Copy,
  // Status e feedback
  Check,
  AlertCircle,
  Info,
  XCircle,
  Loader2,
  AlertTriangle,
  // Ícones adicionais necessários
  MessageSquare,
  Briefcase,
  Bell,
  Target,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Brain,
  CandlestickChart,
} from 'lucide-react';

import {
  // Ícones específicos do Tabler (quando não disponível no Lucide)
  IconChartLine,
  IconReportMoney,
} from '@tabler/icons-react';

// Re-export padronizado
export {
  // Lucide icons
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Share,
  Save,
  Copy,
  Check,
  AlertCircle,
  Info,
  XCircle,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  Bell,
  Target,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Brain,
  // Usando CandlestickChart do Lucide em vez do Tabler
  CandlestickChart as Candlestick,
  // Tabler icons (prefixados para clareza)
  IconChartLine as ChartLine,
  IconReportMoney as ReportMoney,
};
