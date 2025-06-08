'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { H1, H2, BodyText } from '@/components/ui/typography';
import { Icon } from '@/components/ui/icon';
import { CONTEXT_ICONS } from '@/lib/icons/context-icons';

interface TestResult {
  success: boolean;
  data: unknown;
  error: string | null;
  timestamp: string;
  source: string;
  cached: boolean;
}

export default function TestOplabPage() {
  const [symbol, setSymbol] = useState('PETR4');
  const [optionSymbol, setOptionSymbol] = useState('PETR4O120');
  const [interval, setInterval] = useState<string>('5min');
  const [days, setDays] = useState('30');
  const [limit, setLimit] = useState('10');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const apiTests = [
    {
      id: 'health',
      name: 'Health Check',
      description: 'Verificar status da API',
      endpoint: '/api/market/oplab?action=health',
      params: [],
      icon: CONTEXT_ICONS.status.success
    },
    {
      id: 'quote',
      name: 'Cotação de Ação',
      description: 'Obter cotação em tempo real',
      endpoint: '/api/market/oplab?action=quote',
      params: [{ key: 'symbol', value: symbol, required: true }],
      icon: CONTEXT_ICONS.market.price
    },
    {
      id: 'intraday',
      name: 'Dados Intraday',
      description: 'Dados de minutos/horas',
      endpoint: '/api/market/oplab?action=intraday',
      params: [
        { key: 'symbol', value: symbol, required: true },
        { key: 'interval', value: interval, required: false }
      ],
      icon: CONTEXT_ICONS.market.candlestick
    },
    {
      id: 'daily',
      name: 'Dados Diários',
      description: 'Histórico de preços diários',
      endpoint: '/api/market/oplab?action=daily',
      params: [
        { key: 'symbol', value: symbol, required: true },
        { key: 'days', value: days, required: false }
      ],
      icon: CONTEXT_ICONS.market.volume
    },
    {
      id: 'options-chain',
      name: 'Cadeia de Opções',
      description: 'Opções disponíveis para o ativo',
      endpoint: '/api/market/oplab?action=options-chain',
      params: [
        { key: 'symbol', value: symbol, required: true },
        { key: 'expiry', value: expiryDate, required: false }
      ],
      icon: CONTEXT_ICONS.market.options
    },
    {
      id: 'option-quote',
      name: 'Cotação de Opção',
      description: 'Dados específicos de uma opção',
      endpoint: '/api/market/oplab?action=option-quote',
      params: [
        { key: 'option_symbol', value: optionSymbol, required: true }
      ],
      icon: CONTEXT_ICONS.market.options
    },
    {
      id: 'market-status',
      name: 'Status do Mercado',
      description: 'Verificar se o mercado está aberto',
      endpoint: '/api/market/oplab?action=market-status',
      params: [],
      icon: CONTEXT_ICONS.status.info
    },
    {
      id: 'top-stocks',
      name: 'Top Ações',
      description: 'Ações mais negociadas',
      endpoint: '/api/market/oplab?action=top-stocks',
      params: [
        { key: 'limit', value: limit, required: false }
      ],
      icon: CONTEXT_ICONS.market.bullish
    },
    {
      id: 'validate',
      name: 'Validar Símbolo',
      description: 'Verificar se o símbolo existe',
      endpoint: '/api/market/oplab?action=validate',
      params: [
        { key: 'symbol', value: symbol, required: true }
      ],
      icon: CONTEXT_ICONS.status.warning
    }
  ];

  const runTest = async (test: {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    params: Array<{ key: string; value: string; required: boolean }>;
    icon: React.ComponentType;
  }) => {
    setLoading(test.id);
    
    try {
      const params = new URLSearchParams();
      params.append('action', test.id === 'health' ? 'health' : test.id);
      
      test.params.forEach((param) => {
        if (param.value) {
          params.append(param.key, param.value);
        }
      });

      const response = await fetch(`/api/market/oplab?${params.toString()}`);
      const result = await response.json();

      setResults(prev => ({
        ...prev,
        [test.id]: result
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          source: 'oplab',
          cached: false
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const runAllTests = async () => {
    for (const test of apiTests) {
      await runTest(test);
      // Pequena pausa entre testes para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const clearResults = () => {
    setResults({});
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <H1>Teste da API Oplab</H1>
        <BodyText className="text-muted-foreground">
          Teste as funcionalidades da API Oplab para dados do mercado brasileiro (B3)
        </BodyText>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="tests">Testes Individuais</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros de Teste</CardTitle>
              <CardDescription>
                Configure os parâmetros para os testes da API
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Símbolo da Ação</label>
                <Input 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="Ex: PETR4, VALE3, ITUB4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Símbolo da Opção</label>
                <Input 
                  value={optionSymbol}
                  onChange={(e) => setOptionSymbol(e.target.value)}
                  placeholder="Ex: PETR4O120, VALE3K150"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Intervalo Intraday</label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1min">1 minuto</SelectItem>
                    <SelectItem value="5min">5 minutos</SelectItem>
                    <SelectItem value="15min">15 minutos</SelectItem>
                    <SelectItem value="30min">30 minutos</SelectItem>
                    <SelectItem value="60min">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dias de Histórico</label>
                <Input 
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="Ex: 30, 90, 365"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Limite de Resultados</label>
                <Input 
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="Ex: 10, 20, 50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Vencimento (YYYY-MM-DD)</label>
                <Input 
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={loading !== null}>
              {loading ? 'Executando...' : 'Executar Todos os Testes'}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Limpar Resultados
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiTests.map((test) => (
              <Card key={test.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon={test.icon} className="h-5 w-5" />
                    {test.name}
                  </CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Endpoint: {test.endpoint}
                    </div>
                    {test.params.length > 0 && (
                      <div className="text-xs">
                        <strong>Parâmetros:</strong>
                        <ul className="list-disc list-inside">
                          {test.params.map((param, idx: number) => (
                            <li key={idx}>
                              {param.key}: {param.value || 'vazio'} 
                              {param.required && <span className="text-red-500">*</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => runTest(test)}
                    disabled={loading === test.id}
                  >
                    {loading === test.id ? 'Testando...' : 'Testar'}
                  </Button>
                  
                  {results[test.id] && (
                    <div className="mt-2">
                      <Badge 
                        variant={results[test.id].success ? "default" : "destructive"}
                      >
                        {results[test.id].success ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {Object.keys(results).length === 0 ? (
            <Card>
              <CardContent className="text-center py-6">
                <BodyText className="text-muted-foreground">
                  Nenhum teste executado ainda. Execute os testes na aba &quot;Testes Individuais&quot;.
                </BodyText>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(results).map(([testId, result]) => {
                const test = apiTests.find(t => t.id === testId);
                return (
                  <Card key={testId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Icon icon={test?.icon || CONTEXT_ICONS.status.info} className="h-5 w-5" />
                          {test?.name || testId}
                        </span>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Executado em: {new Date(result.timestamp).toLocaleString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result.error ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <H2 className="text-red-800 text-sm font-medium mb-1">Erro:</H2>
                          <BodyText className="text-red-700 text-sm">{result.error}</BodyText>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <H2 className="text-green-800 text-sm font-medium mb-2">Dados Retornados:</H2>
                          <pre className="text-xs text-green-700 overflow-auto max-h-40">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 