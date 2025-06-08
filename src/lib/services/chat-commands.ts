// ==========================================
// CHAT COMMANDS SERVICE - Day 6 Enhancement
// ==========================================

import marketContextService from './market-context';
import { AlertType, ConditionType } from '@/lib/types/alerts';

export interface CommandMatch {
  command: string;
  confidence: number;
  params: Record<string, unknown>;
  rawMatch: string;
}

export interface AlertCommand {
  symbol: string;
  type: AlertType;
  condition: ConditionType;
  threshold: number;
  message?: string;
}

export interface AnalysisCommand {
  symbol: string;
  analysisType: 'overview' | 'technical' | 'fundamental' | 'news';
  timeframe?: string;
}

export interface PortfolioCommand {
  action: 'analyze' | 'performance' | 'risk' | 'diversification';
  timeframe?: '1d' | '1w' | '1m' | '3m' | '1y';
  includeRecommendations?: boolean;
}

class ChatCommandsService {
  // Alert creation patterns
  private readonly ALERT_PATTERNS = [
    {
      name: 'create_alert_when_above',
      pattern: /(?:criar?|gerar|fazer|set(?:ar)?)\s+(?:um\s+)?(?:alerta|alert)\s+(?:para\s+|of\s+|on\s+)?([A-Z]{2,6}[0-9]*)\s+(?:quando|when|if)\s+(?:preço|price|valor)\s+(?:for\s+|ir\s+|ficar\s+|goes?\s+|is\s+)?(?:acima\s+(?:de\s+)?|above\s+|>\s*)([0-9]+(?:\.[0-9]+)?)/gi,
      type: 'price' as AlertType,
             condition: 'above' as ConditionType,
      confidence: 0.9
    },
    {
      name: 'create_alert_when_below',
      pattern: /(?:criar?|gerar|fazer|set(?:ar)?)\s+(?:um\s+)?(?:alerta|alert)\s+(?:para\s+|of\s+|on\s+)?([A-Z]{2,6}[0-9]*)\s+(?:quando|when|if)\s+(?:preço|price|valor)\s+(?:for\s+|ir\s+|ficar\s+|goes?\s+|is\s+)?(?:abaixo\s+(?:de\s+)?|below\s+|<\s*)([0-9]+(?:\.[0-9]+)?)/gi,
      type: 'price' as AlertType,
      condition: 'below' as ConditionType,
      confidence: 0.9
    },
    {
      name: 'alert_me_when',
      pattern: /(?:me\s+)?(?:avise|avisa|alert|notify)\s+(?:quando|when)\s+([A-Z]{2,6}[0-9]*)\s+(?:chegar?\s+(?:em\s+|a\s+)?|atingir|reach(?:es)?\s+|hits?\s+)([0-9]+(?:\.[0-9]+)?)/gi,
      type: 'price' as AlertType,
      condition: 'cross_above' as ConditionType,
      confidence: 0.8
    },
    {
      name: 'simple_alert_syntax',
      pattern: /alert\s+([A-Z]{2,6}[0-9]*)\s+([><])\s*([0-9]+(?:\.[0-9]+)?)/gi,
      type: 'price' as AlertType,
      condition: null, // Will be determined by operator
      confidence: 0.9
    }
  ];

  // Analysis command patterns
  private readonly ANALYSIS_PATTERNS = [
    {
      name: 'analyze_stock',
      pattern: /(?:analise|analiza|analyze|analysis|estud[eo])\s+(?:a\s+ação\s+|o\s+papel\s+|stock\s+)?([A-Z]{2,6}[0-9]*)/gi,
      analysisType: 'overview',
      confidence: 0.9
    },
    {
      name: 'technical_analysis',
      pattern: /(?:análise\s+técnica|technical\s+analysis)\s+(?:da\s+|do\s+|of\s+)?([A-Z]{2,6}[0-9]*)/gi,
      analysisType: 'technical',
      confidence: 0.95
    },
    {
      name: 'slash_analyze',
      pattern: /\/analyze\s+([A-Z]{2,6}[0-9]*)/gi,
      analysisType: 'overview',
      confidence: 1.0
    },
    {
      name: 'company_overview',
      pattern: /(?:visão\s+geral|overview|perfil)\s+(?:da\s+empresa\s+|da\s+|do\s+|of\s+)?([A-Z]{2,6}[0-9]*)/gi,
      analysisType: 'fundamental',
      confidence: 0.85
    }
  ];

  // Portfolio command patterns
  private readonly PORTFOLIO_PATTERNS = [
    {
      name: 'analyze_portfolio',
      pattern: /(?:analise|analyze)\s+(?:meu\s+|my\s+)?(?:portfólio|portfolio)/gi,
      action: 'analyze',
      confidence: 0.9
    },
    {
      name: 'portfolio_performance',
      pattern: /(?:performance|desempenho|rendimento)\s+(?:do\s+|da\s+|of\s+)?(?:portfólio|portfolio)/gi,
      action: 'performance',
      confidence: 0.9
    },
    {
      name: 'portfolio_risk',
      pattern: /(?:risco|risk|análise\s+de\s+risco)\s+(?:do\s+|da\s+|of\s+)?(?:portfólio|portfolio)/gi,
      action: 'risk',
      confidence: 0.9
    },
    {
      name: 'diversification_analysis',
      pattern: /(?:diversificação|diversification)\s+(?:do\s+|da\s+|of\s+)?(?:portfólio|portfolio)/gi,
      action: 'diversification',
      confidence: 0.9
    }
  ];

  /**
   * Parse a message for alert creation commands
   */
  public parseAlertCommands(message: string): AlertCommand[] {
    const commands: AlertCommand[] = [];

    this.ALERT_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.pattern);
      
      while ((match = regex.exec(message)) !== null) {
        try {
          const symbol = match[1].toUpperCase();
          let condition = pattern.condition;
          
          // Handle simple syntax with operators
          if (pattern.name === 'simple_alert_syntax') {
            const operator = match[2];
            condition = operator === '>' ? 'above' : 'below';
          }
          
          const threshold = parseFloat(match[pattern.name === 'simple_alert_syntax' ? 3 : 2]);
          
          if (!isNaN(threshold) && marketContextService.validateSymbol(symbol)) {
            commands.push({
              symbol,
              type: pattern.type,
              condition: condition!,
              threshold,
              message: `Alert created via chat: ${symbol} ${condition} ${threshold}`
            });
          }
        } catch (error) {
          console.warn('Error parsing alert command:', error);
        }
      }
    });

    return commands;
  }

  /**
   * Parse a message for analysis commands
   */
  public parseAnalysisCommands(message: string): AnalysisCommand[] {
    const commands: AnalysisCommand[] = [];

    this.ANALYSIS_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.pattern);
      
      while ((match = regex.exec(message)) !== null) {
        try {
          const symbol = match[1].toUpperCase();
          
          if (marketContextService.validateSymbol(symbol)) {
                         commands.push({
               symbol,
               analysisType: pattern.analysisType as 'overview' | 'technical' | 'fundamental' | 'news',
               timeframe: this.extractTimeframe(message)
             });
          }
        } catch (error) {
          console.warn('Error parsing analysis command:', error);
        }
      }
    });

    return commands;
  }

  /**
   * Parse a message for portfolio commands
   */
  public parsePortfolioCommands(message: string): PortfolioCommand[] {
    const commands: PortfolioCommand[] = [];

    this.PORTFOLIO_PATTERNS.forEach(pattern => {
      const regex = new RegExp(pattern.pattern);
      
      if (regex.test(message)) {
                 commands.push({
           action: pattern.action as 'analyze' | 'performance' | 'risk' | 'diversification',
           timeframe: this.extractTimeframe(message) as '1d' | '1w' | '1m' | '3m' | '1y' | undefined,
           includeRecommendations: message.toLowerCase().includes('recomendaç') || message.toLowerCase().includes('recommend')
         });
      }
    });

    return commands;
  }

  /**
   * Extract timeframe from message
   */
  private extractTimeframe(message: string): string | undefined {
    const timeframePatterns = [
      { pattern: /(?:nos?\s+)?(?:últimos?\s+)?(?:1\s+dia|today|hoje)/gi, value: '1d' },
      { pattern: /(?:nos?\s+)?(?:últimos?\s+)?(?:1\s+semana|this\s+week|semana)/gi, value: '1w' },
      { pattern: /(?:nos?\s+)?(?:últimos?\s+)?(?:1\s+mês|this\s+month|mês)/gi, value: '1m' },
      { pattern: /(?:nos?\s+)?(?:últimos?\s+)?(?:3\s+meses|quarter|trimestre)/gi, value: '3m' },
      { pattern: /(?:nos?\s+)?(?:últimos?\s+)?(?:1\s+ano|this\s+year|ano)/gi, value: '1y' }
    ];

    for (const timeframe of timeframePatterns) {
      if (timeframe.pattern.test(message)) {
        return timeframe.value;
      }
    }

    return undefined;
  }

  /**
   * Check if message contains any commands
   */
  public hasCommands(message: string): boolean {
    const alertCommands = this.parseAlertCommands(message);
    const analysisCommands = this.parseAnalysisCommands(message);
    const portfolioCommands = this.parsePortfolioCommands(message);

    return alertCommands.length > 0 || analysisCommands.length > 0 || portfolioCommands.length > 0;
  }

  /**
   * Parse all types of commands from a message
   */
  public parseAllCommands(message: string): {
    alerts: AlertCommand[];
    analysis: AnalysisCommand[];
    portfolio: PortfolioCommand[];
    hasCommands: boolean;
  } {
    const alerts = this.parseAlertCommands(message);
    const analysis = this.parseAnalysisCommands(message);
    const portfolio = this.parsePortfolioCommands(message);

    return {
      alerts,
      analysis,
      portfolio,
      hasCommands: alerts.length > 0 || analysis.length > 0 || portfolio.length > 0
    };
  }

  /**
   * Generate natural language response for executed commands
   */
  public generateCommandResponse(commands: {
    alerts: AlertCommand[];
    analysis: AnalysisCommand[];
    portfolio: PortfolioCommand[];
  }): string {
    const responses: string[] = [];

    // Alert responses
    if (commands.alerts.length > 0) {
      commands.alerts.forEach(alert => {
        const conditionText = alert.condition === 'above' ? 'acima de' : 
                             alert.condition === 'below' ? 'abaixo de' : 
                             'atingir';
        responses.push(`✅ Alerta criado para ${alert.symbol} quando preço ${conditionText} $${alert.threshold}`);
      });
    }

    // Analysis responses
    if (commands.analysis.length > 0) {
      commands.analysis.forEach(analysis => {
        const typeText = {
          overview: 'Visão geral',
          technical: 'Análise técnica',
          fundamental: 'Análise fundamentalista',
          news: 'Análise de notícias'
        }[analysis.analysisType] || 'Análise';
        
        responses.push(`📊 Iniciando ${typeText.toLowerCase()} de ${analysis.symbol}...`);
      });
    }

    // Portfolio responses
    if (commands.portfolio.length > 0) {
      commands.portfolio.forEach(portfolio => {
        const actionText = {
          analyze: 'Análise do portfólio',
          performance: 'Análise de performance',
          risk: 'Análise de risco',
          diversification: 'Análise de diversificação'
        }[portfolio.action] || 'Análise';
        
        responses.push(`📈 Iniciando ${actionText.toLowerCase()}...`);
      });
    }

    return responses.join('\n');
  }

  /**
   * Get command help text
   */
  public getHelpText(): string {
    return `
🤖 **Comandos Disponíveis:**

**Criação de Alertas:**
• \`criar alerta PETR4 quando preço acima 25.50\`
• \`alert VALE3 > 60.00\`
• \`me avise quando ITUB4 chegar em 30.00\`

**Análise de Ações:**
• \`analise PETR4\`
• \`/analyze VALE3\`
• \`análise técnica ITUB4\`

**Análise de Portfólio:**
• \`analise meu portfólio\`
• \`performance do portfólio no último mês\`
• \`risco do portfólio\`

**Dicas:**
• Use símbolos em maiúsculas (PETR4, AAPL)
• Inclua períodos de tempo (1 dia, 1 semana, 1 mês)
• Seja específico com valores ($25.50, R$ 30.00)
    `.trim();
  }
}

// Export singleton instance
const chatCommandsService = new ChatCommandsService();
export default chatCommandsService; 