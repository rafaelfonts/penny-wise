import { NextResponse } from 'next/server';

export async function GET() {
  const helpText = `
🤖 **Penny Wise - Assistente Financeiro Inteligente**

**🧠 SISTEMA INTELIGENTE DE ANÁLISE:**
O Penny Wise agora detecta automaticamente a nacionalidade das empresas e usa a API mais apropriada:

**🇺🇸 EMPRESAS AMERICANAS** → Alpha Vantage API
• Símbolos: AAPL, MSFT, TSLA, GOOGL, AMZN, etc.
• Formato: 1-5 letras (sem números)
• Exchanges: NASDAQ, NYSE
• Moeda: USD (Dólar)

**🇧🇷 EMPRESAS BRASILEIRAS** → OpLab API  
• Símbolos: PETR4, VALE3, ITUB4, BBDC4, etc.
• Formato: 4 letras + dígito
• Exchange: B3 (Bolsa do Brasil)
• Moeda: BRL (Real)

**📊 COMANDOS DISPONÍVEIS:**

• \`/analyze AAPL\` - Análise de empresa americana
• \`/analyze PETR4\` - Análise de empresa brasileira  
• \`/help\` - Esta ajuda

**🎯 EXEMPLOS DE USO:**

**Americana:**
\`/analyze AAPL\` → Usa Alpha Vantage, dados em USD
\`/analyze TSLA\` → Tesla com análise técnica completa

**Brasileira:**
\`/analyze PETR4\` → Usa OpLab, dados em BRL (se configurado)
\`/analyze VALE3\` → Vale com contexto brasileiro

**🔧 CLASSIFICAÇÃO AUTOMÁTICA:**
O sistema identifica automaticamente:
• **95% confiança** - Empresas conhecidas em listas
• **85% confiança** - Padrões brasileiros (4 letras + número)
• **75% confiança** - Padrões americanos (1-5 letras)
• **Fallback** - Se uma API falha, tenta a outra

**💡 DICAS:**

**Para empresas brasileiras:**
• Use o dígito final: 3=ON, 4=PN, 11=Units
• Exemplos: PETR3 (ON), PETR4 (PN), SANB11 (Unit)

**Para empresas americanas:**
• Sem números no final
• Exemplos: AAPL, MSFT, GOOGL, BRK.A

**⚙️ CONFIGURAÇÃO:**
• Alpha Vantage: Configurado ✅
• OpLab: Precisa do token OPLAB_ACCESS_TOKEN

**🌟 RECURSOS AVANÇADOS:**
• Análise técnica inteligente por mercado
• Insights específicos por região
• Recomendações contextualizadas
• Formatação de moeda automática
• Detecção de volatilidade
• Sugestões personalizadas

**📈 EXEMPLO DE RESPOSTA:**
\`\`\`
🇺🇸 AAPL está cotado a $203.92 (+1.64%)

📊 Análise Técnica:
• Tendência: ↗️ ALTA
• Recomendação: ✅ COMPRA
• Volume: 46,607,693

🎯 Insights:
• Volume muito alto - possível catalisador
• Considere variação cambial USD/BRL

Fonte: Alpha Vantage | NASDAQ | Confiança: 95%
\`\`\`

**🚀 PRÓXIMOS PASSOS:**
1. Configure OPLAB_ACCESS_TOKEN para empresas brasileiras
2. Use /analyze com qualquer empresa
3. O sistema escolhe a API automaticamente
4. Receba análises contextualizadas por mercado

*Investimentos envolvem risco. Esta é uma análise educacional, não recomendação de investimento.*
`;

  return NextResponse.json({
    success: true,
    help: helpText,
    commands: [
      {
        command: '/analyze [SÍMBOLO]',
        description: 'Análise inteligente com detecção automática de mercado',
        examples: [
          '/analyze AAPL',
          '/analyze PETR4',
          '/analyze TSLA',
          '/analyze VALE3',
        ],
      },
      {
        command: '/help',
        description: 'Mostra esta ajuda',
      },
    ],
    classification: {
      american_examples: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'NFLX'],
      brazilian_examples: [
        'PETR4',
        'VALE3',
        'ITUB4',
        'BBDC4',
        'ABEV3',
        'B3SA3',
      ],
      api_mapping: {
        US: 'Alpha Vantage',
        BR: 'OpLab',
      },
    },
    status: {
      alpha_vantage: 'Configurado ✅',
      oplab: 'Precisa configurar OPLAB_ACCESS_TOKEN',
    },
  });
}
