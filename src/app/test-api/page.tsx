'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import marketDataService from '@/lib/services/market-data';

interface ApiResult {
  yahoo?: unknown;
  alpha?: unknown;
  quick?: unknown;
}

export default function TestApiPage() {
  const [results, setResults] = useState<ApiResult>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testYahooFinance = async () => {
    setLoading('yahoo');
    try {
      const result = await marketDataService.getQuote('AAPL');
      setResults(prev => ({ ...prev, yahoo: result }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, yahoo: { error: errorMessage } }));
    }
    setLoading(null);
  };

  const testAlphaVantage = async () => {
    setLoading('alpha');
    try {
      const result = await marketDataService.getQuote('MSFT');
      setResults(prev => ({ ...prev, alpha: result }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, alpha: { error: errorMessage } }));
    }
    setLoading(null);
  };

  const testQuickQuotes = async () => {
    setLoading('quick');
    try {
      const [spy, qqq, dia] = await Promise.all([
        marketDataService.getQuickQuote('SPY'),
        marketDataService.getQuickQuote('QQQ'),
        marketDataService.getQuickQuote('DIA'),
      ]);
      setResults(prev => ({ ...prev, quick: { spy, qqq, dia } }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, quick: { error: errorMessage } }));
    }
    setLoading(null);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <h1 className="text-3xl font-bold">API Test Page</h1>
      <p className="text-gray-600">
        Teste para verificar se as APIs estão funcionando corretamente
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Yahoo Finance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testYahooFinance}
              disabled={loading === 'yahoo'}
              className="w-full"
            >
              {loading === 'yahoo' ? 'Testing...' : 'Test AAPL Quote'}
            </Button>
            {results.yahoo !== undefined && (
              <pre className="max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(results.yahoo, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alpha Vantage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testAlphaVantage}
              disabled={loading === 'alpha'}
              className="w-full"
            >
              {loading === 'alpha' ? 'Testing...' : 'Test MSFT Quote'}
            </Button>
            {results.alpha !== undefined && (
              <pre className="max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(results.alpha, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Quotes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testQuickQuotes}
              disabled={loading === 'quick'}
              className="w-full"
            >
              {loading === 'quick' ? 'Testing...' : 'Test Market Indices'}
            </Button>
            {results.quick !== undefined && (
              <pre className="max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(results.quick, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Results</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-4 text-xs">
            {JSON.stringify(results, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
