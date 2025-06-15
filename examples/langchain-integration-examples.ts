// ==========================================
// EXEMPLOS PRÁTICOS - INTEGRAÇÃO LANGCHAIN
// Exemplos de uso da integração robusta DeepSeek + OpLab
// ==========================================

/**
 * EXEMPLO 1: USO BÁSICO DA INTEGRAÇÃO
 * Processamento simples de mensagem com roteamento inteligente
 */

// Exemplo de requisição para comando OpLab direto
const exemploOpLabDireto = {
  message: '/market-status',
  userId: 'user_123',
  options: {
    enableCache: true,
    temperature: 0.1,
  },
};

// Exemplo de requisição para análise com DeepSeek
const exemploAnaliseDeepSeek = {
  message: 'Explique como funciona a estratégia de covered call',
  userId: 'user_123',
  options: {
    temperature: 0.5,
    maxTokens: 1500,
  },
};

// Exemplo de requisição híbrida (OpLab + DeepSeek)
const exemploHibrido = {
  message: 'Analise as opções da PETR4 e sugira uma estratégia',
  userId: 'user_123',
  includeMarketData: true,
  options: {
    temperature: 0.3,
    enableCache: true,
  },
};

/**
 * EXEMPLO 2: FUNÇÃO UTILITÁRIA PARA FAZER REQUISIÇÕES
 */
async function langchainRequest(
  message: string,
  options: {
    userId: string;
    conversationId?: string;
    temperature?: number;
    enableCache?: boolean;
  }
) {
  const response = await fetch('/api/chat/langchain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`, // Se necessário
    },
    body: JSON.stringify({
      message,
      userId: options.userId,
      conversationId: options.conversationId,
      options: {
        temperature: options.temperature || 0.3,
        enableCache: options.enableCache !== false,
        retryAttempts: 3,
        timeout: 30000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * EXEMPLO 3: CASOS DE USO ESPECÍFICOS
 */

// Caso 1: Consulta de mercado em tempo real
async function consultarMercado() {
  try {
    const resultado = await langchainRequest('/market-status', {
      userId: 'user_123',
    });

    console.log('Status do Mercado:', resultado.response);
    console.log('Ferramentas executadas:', resultado.executedTools);
    console.log('Tempo de processamento:', resultado.processingTime + 'ms');

    return resultado;
  } catch (error) {
    console.error('Erro ao consultar mercado:', error);
  }
}

// Caso 2: Análise detalhada de ação
async function analisarAcao(simbolo: string) {
  try {
    const resultado = await langchainRequest(
      `Faça uma análise completa da ação ${simbolo} incluindo dados fundamentalistas e opções disponíveis`,
      {
        userId: 'user_123',
        temperature: 0.4,
      }
    );

    console.log('Análise da Ação:', resultado.response);
    console.log('Dados estruturados:', resultado.data);

    return resultado;
  } catch (error) {
    console.error('Erro na análise:', error);
  }
}

// Caso 3: Comparação de estratégias
async function compararEstrategias() {
  try {
    const resultado = await langchainRequest(
      'Compare as estratégias de covered call vs protective put para um investidor conservador',
      {
        userId: 'user_123',
        temperature: 0.6,
      }
    );

    console.log('Comparação de Estratégias:', resultado.response);

    return resultado;
  } catch (error) {
    console.error('Erro na comparação:', error);
  }
}

/**
 * EXEMPLO 4: MONITORAMENTO E HEALTH CHECK
 */
async function verificarStatusServico() {
  try {
    const response = await fetch('/api/chat/langchain?action=status');
    const status = await response.json();

    console.log('Status do Serviço LangChain:');
    console.log('- Ferramentas disponíveis:', status.status.tools_count);
    console.log('- Cache conectado:', status.status.cache_connected);
    console.log('- Rate limiter ativo:', status.status.rate_limiter_connected);
    console.log('- Modelo configurado:', status.status.model_configured);
    console.log('- Endpoints configurados:', status.status.endpoints);

    return status;
  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }
}

/**
 * EXEMPLO 5: PROCESSAMENTO EM LOTE
 */
async function processarLoteConsultas(consultas: string[], userId: string) {
  const resultados = [];

  for (const consulta of consultas) {
    try {
      console.log(`Processando: ${consulta}`);

      const resultado = await langchainRequest(consulta, {
        userId,
        enableCache: true, // Importante para evitar reprocessamento
      });

      resultados.push({
        consulta,
        sucesso: true,
        resposta: resultado.response,
        tempoProcessamento: resultado.processingTime,
        cacheHit: resultado.cacheHit,
        ferramentasUsadas: resultado.executedTools,
      });

      // Delay para respeitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Erro ao processar "${consulta}":`, error);
      resultados.push({
        consulta,
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  return resultados;
}

/**
 * EXEMPLO 6: CONVERSA CONTEXTUAL
 */
class ConversaContextual {
  private conversationId: string;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async enviarMensagem(mensagem: string, temperatura: number = 0.3) {
    try {
      const resultado = await langchainRequest(mensagem, {
        userId: this.userId,
        conversationId: this.conversationId,
        temperature: temperatura,
      });

      console.log(`[${this.conversationId}] Usuário: ${mensagem}`);
      console.log(`[${this.conversationId}] Assistente: ${resultado.response}`);
      console.log(
        `[${this.conversationId}] Meta: ${JSON.stringify(resultado.metadata)}`
      );

      return resultado;
    } catch (error) {
      console.error(`Erro na conversa ${this.conversationId}:`, error);
      throw error;
    }
  }

  getConversationId(): string {
    return this.conversationId;
  }
}

/**
 * EXEMPLO 7: TESTES AUTOMATIZADOS
 */
async function executarTestesIntegracao() {
  console.log('🧪 Iniciando testes de integração LangChain...');

  const testes = [
    {
      nome: 'Teste OpLab - Status do Mercado',
      consulta: '/market-status',
      esperado: (resultado: Record<string, unknown>) =>
        Array.isArray(resultado.executedTools) &&
        resultado.executedTools.includes('oplab_market_data'),
    },
    {
      nome: 'Teste DeepSeek - Análise',
      consulta: 'Explique o que é uma opção financeira',
      esperado: (resultado: Record<string, unknown>) =>
        Array.isArray(resultado.executedTools) &&
        resultado.executedTools.includes('deepseek_analysis'),
    },
    {
      nome: 'Teste Híbrido - Cotação + Análise',
      consulta: 'Analise a cotação atual da PETR4',
      esperado: (resultado: Record<string, unknown>) =>
        Array.isArray(resultado.executedTools) &&
        resultado.executedTools.length > 0,
    },
    {
      nome: 'Teste Cache - Consulta Repetida',
      consulta: '/market-status',
      esperado: (resultado: Record<string, unknown>) =>
        resultado.cacheHit === true, // Segunda execução deve usar cache
    },
  ];

  const resultados = [];

  for (const teste of testes) {
    try {
      console.log(`Executando: ${teste.nome}`);

      const resultado = await langchainRequest(teste.consulta, {
        userId: 'test_user_123',
      });

      const passou = teste.esperado(resultado);

      resultados.push({
        nome: teste.nome,
        passou,
        tempo: resultado.processingTime,
        detalhes: {
          ferramentas: resultado.executedTools,
          cache: resultado.cacheHit,
          tokens: resultado.tokensUsed,
        },
      });

      console.log(`✅ ${teste.nome}: ${passou ? 'PASSOU' : 'FALHOU'}`);
    } catch (error) {
      console.log(`❌ ${teste.nome}: ERRO - ${error}`);
      resultados.push({
        nome: teste.nome,
        passou: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  console.log('\n📊 Resumo dos testes:');
  const passou = resultados.filter(r => r.passou).length;
  const total = resultados.length;
  console.log(`${passou}/${total} testes passaram`);

  return resultados;
}

/**
 * EXEMPLO 8: BENCHMARK DE PERFORMANCE
 */
async function benchmarkPerformance() {
  console.log('⚡ Iniciando benchmark de performance...');

  const consultas = [
    '/market-status',
    '/stocks',
    'Explique covered call',
    'Analise PETR4',
    '/options VALE3',
  ];

  const resultados = [];

  for (let i = 0; i < 3; i++) {
    // 3 rodadas
    console.log(`Rodada ${i + 1}/3`);

    for (const consulta of consultas) {
      const inicio = Date.now();

      try {
        const resultado = await langchainRequest(consulta, {
          userId: `benchmark_user_${i}`,
        });

        const tempoTotal = Date.now() - inicio;

        resultados.push({
          rodada: i + 1,
          consulta,
          tempoTotal,
          tempoProcessamento: resultado.processingTime,
          cacheHit: resultado.cacheHit,
          tokens: resultado.tokensUsed,
          ferramentas: resultado.executedTools.length,
        });

        console.log(
          `  ${consulta}: ${tempoTotal}ms (cache: ${resultado.cacheHit})`
        );
      } catch (error) {
        console.log(`  ${consulta}: ERRO - ${error}`);
      }

      // Delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Calcular estatísticas
  const tempos = resultados.map(r => r.tempoTotal);
  const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
  const min = Math.min(...tempos);
  const max = Math.max(...tempos);

  console.log('\n📈 Estatísticas:');
  console.log(`Tempo médio: ${media.toFixed(2)}ms`);
  console.log(`Tempo mínimo: ${min}ms`);
  console.log(`Tempo máximo: ${max}ms`);
  console.log(
    `Cache hits: ${resultados.filter(r => r.cacheHit).length}/${resultados.length}`
  );

  return { resultados, estatisticas: { media, min, max } };
}

// ==========================================
// EXPORTS PARA USO EM OUTROS ARQUIVOS
// ==========================================

export {
  langchainRequest,
  consultarMercado,
  analisarAcao,
  compararEstrategias,
  verificarStatusServico,
  processarLoteConsultas,
  ConversaContextual,
  executarTestesIntegracao,
  benchmarkPerformance,
};

// Exemplos de dados para exportar
export const exemplosRequisicoes = {
  exemploOpLabDireto,
  exemploAnaliseDeepSeek,
  exemploHibrido,
};
