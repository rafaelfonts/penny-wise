'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: unknown;
  error?: string;
  timestamp?: string;
  responseTime?: number;
}

export default function TestOplabPage() {
  const [config, setConfig] = useState({
    accessToken: '',
    symbol: 'PETR4',
    portfolioId: '',
    optionSymbol: 'PETR4C2800',
    instruments: ['PETR4', 'VALE3'],
    attribute: 'market-cap',
    rateId: 'SELIC',
    exchangeId: 'BOVESPA',
    from: '2024-01-01',
    to: '2024-12-31',
    date: '2024-01-15',
    email: '',
    password: '',
    context: 'default' as 'default' | 'chart',
    portfolioName: 'Test Portfolio',
  });

  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunningAllTests, setIsRunningAllTests] = useState(false);

  const updateResult = (endpoint: string, result: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [endpoint]: { ...prev[endpoint], endpoint, ...result },
    }));
  };

  const makeApiCall = async (
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: unknown
  ) => {
    const startTime = Date.now();

    try {
      updateResult(endpoint, { status: 'loading' });

      const url = `/api/market/oplab${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      const responseTime = Date.now() - startTime;

      if (response.ok || data.success) {
        updateResult(endpoint, {
          status: 'success',
          data,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      } else {
        updateResult(endpoint, {
          status: 'error',
          error: data.error || `HTTP ${response.status}`,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      updateResult(endpoint, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Network error',
        responseTime,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Individual test functions
  const testHealthCheck = () => makeApiCall('?action=health');
  const testAuthorize = () =>
    makeApiCall(`?action=authorize&context=${config.context}`);
  const testMarketStatus = () => makeApiCall('?action=market-status');
  const testStocks = () => makeApiCall('?action=stocks');
  const testStock = () => makeApiCall(`?action=stock&symbol=${config.symbol}`);
  const testStocksWithOptions = () =>
    makeApiCall('?action=stocks-with-options');
  const testOptions = () =>
    makeApiCall(`?action=options&symbol=${config.symbol}`);
  const testOption = () =>
    makeApiCall(`?action=option&symbol=${config.optionSymbol}`);
  const testInstrument = () =>
    makeApiCall(`?action=instrument&symbol=${config.symbol}`);
  const testPortfolios = () => makeApiCall('?action=portfolios');
  const testPortfolio = () =>
    makeApiCall(`?action=portfolio&portfolioId=${config.portfolioId}`);
  const testInterestRates = () => makeApiCall('?action=interest-rates');
  const testExchanges = () => makeApiCall('?action=exchanges');
  const testTopVolumeOptions = () => makeApiCall('?action=top-volume-options');
  const testFundamentalistCompanies = () =>
    makeApiCall(
      `?action=fundamentalist-companies&attribute=${config.attribute}`
    );
  const testOplabScoreStocks = () => makeApiCall('?action=oplab-score-stocks');
  const testHistoricalData = () =>
    makeApiCall(
      `?action=historical&symbol=${config.symbol}&from=${config.from}&to=${config.to}`
    );
  const testOptionsHistory = () =>
    makeApiCall(
      `?action=options-history&symbol=${config.symbol}&date=${config.date}`
    );
  const testUserSettings = () => makeApiCall('?action=user-settings');

  // POST requests
  const testAuthenticate = () =>
    makeApiCall('?action=authenticate', 'POST', {
      email: config.email,
      password: config.password,
      context: config.context,
    });

  const testCreatePortfolio = () =>
    makeApiCall('?action=create-portfolio', 'POST', {
      name: config.portfolioName,
      active: true,
    });

  const testInstrumentQuotes = () =>
    makeApiCall('?action=instrument-quotes', 'POST', {
      instruments: config.instruments,
    });

  // DELETE requests - commented out unused function
  // const testDeletePortfolio = () => makeApiCall(`?action=delete-portfolio&portfolioId=${config.portfolioId}`, 'DELETE');

  const runAllTests = async () => {
    setIsRunningAllTests(true);

    // Basic tests (no authentication required)
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testMarketStatus();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testStocks();
    await new Promise(resolve => setTimeout(resolve, 500));

    if (config.symbol) {
      await testStock();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testOptions();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testHistoricalData();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await testStocksWithOptions();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testInterestRates();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testExchanges();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ranking tests
    await testTopVolumeOptions();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testOplabScoreStocks();
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsRunningAllTests(false);
  };

  const clearResults = () => {
    setResults({});
  };

  const formatJsonResponse = (data: unknown) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">Loading</Badge>;
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Oplab API Test Suite</h1>
        <p className="mb-4 text-gray-600">
          Test real Oplab API endpoints. Configure your settings and run
          individual tests or the complete test suite.
        </p>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Esta página testa a API real do Oplab.
            Certifique-se de configurar a variável de ambiente
            <code className="rounded bg-gray-100 px-1">
              OPLAB_ACCESS_TOKEN
            </code>{' '}
            com seu token de acesso válido.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="tests">Individual Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure test parameters for Oplab API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="symbol">Stock Symbol</Label>
                <Input
                  id="symbol"
                  value={config.symbol}
                  onChange={e =>
                    setConfig({ ...config, symbol: e.target.value })
                  }
                  placeholder="PETR4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionSymbol">Option Symbol</Label>
                <Input
                  id="optionSymbol"
                  value={config.optionSymbol}
                  onChange={e =>
                    setConfig({ ...config, optionSymbol: e.target.value })
                  }
                  placeholder="PETR4C2800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioId">Portfolio ID</Label>
                <Input
                  id="portfolioId"
                  value={config.portfolioId}
                  onChange={e =>
                    setConfig({ ...config, portfolioId: e.target.value })
                  }
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioName">Portfolio Name</Label>
                <Input
                  id="portfolioName"
                  value={config.portfolioName}
                  onChange={e =>
                    setConfig({ ...config, portfolioName: e.target.value })
                  }
                  placeholder="Test Portfolio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attribute">Fundamentalist Attribute</Label>
                <Input
                  id="attribute"
                  value={config.attribute}
                  onChange={e =>
                    setConfig({ ...config, attribute: e.target.value })
                  }
                  placeholder="market-cap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateId">Interest Rate ID</Label>
                <Input
                  id="rateId"
                  value={config.rateId}
                  onChange={e =>
                    setConfig({ ...config, rateId: e.target.value })
                  }
                  placeholder="SELIC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchangeId">Exchange ID</Label>
                <Input
                  id="exchangeId"
                  value={config.exchangeId}
                  onChange={e =>
                    setConfig({ ...config, exchangeId: e.target.value })
                  }
                  placeholder="BOVESPA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from">From Date</Label>
                <Input
                  id="from"
                  type="date"
                  value={config.from}
                  onChange={e => setConfig({ ...config, from: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To Date</Label>
                <Input
                  id="to"
                  type="date"
                  value={config.to}
                  onChange={e => setConfig({ ...config, to: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (for auth)</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.email}
                  onChange={e =>
                    setConfig({ ...config, email: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (for auth)</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={e =>
                    setConfig({ ...config, password: e.target.value })
                  }
                  placeholder="password"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <div className="mb-6 flex gap-4">
            <Button
              onClick={runAllTests}
              disabled={isRunningAllTests}
              size="lg"
            >
              {isRunningAllTests && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Run All Tests
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* System Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testHealthCheck}
                    disabled={results.health?.status === 'loading'}
                  >
                    Health Check
                  </Button>
                  {getStatusIcon(results.health?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testMarketStatus}
                    disabled={results['market-status']?.status === 'loading'}
                  >
                    Market Status
                  </Button>
                  {getStatusIcon(results['market-status']?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testUserSettings}
                    disabled={results['user-settings']?.status === 'loading'}
                  >
                    User Settings
                  </Button>
                  {getStatusIcon(results['user-settings']?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Authentication Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testAuthenticate}
                    disabled={
                      results.authenticate?.status === 'loading' ||
                      !config.email ||
                      !config.password
                    }
                  >
                    Authenticate
                  </Button>
                  {getStatusIcon(results.authenticate?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testAuthorize}
                    disabled={results.authorize?.status === 'loading'}
                  >
                    Authorize
                  </Button>
                  {getStatusIcon(results.authorize?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Stock Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Stocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testStocks}
                    disabled={results.stocks?.status === 'loading'}
                  >
                    All Stocks
                  </Button>
                  {getStatusIcon(results.stocks?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testStock}
                    disabled={
                      results.stock?.status === 'loading' || !config.symbol
                    }
                  >
                    Single Stock
                  </Button>
                  {getStatusIcon(results.stock?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testStocksWithOptions}
                    disabled={
                      results['stocks-with-options']?.status === 'loading'
                    }
                  >
                    With Options
                  </Button>
                  {getStatusIcon(results['stocks-with-options']?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Options Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testOptions}
                    disabled={
                      results.options?.status === 'loading' || !config.symbol
                    }
                  >
                    Options Chain
                  </Button>
                  {getStatusIcon(results.options?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testOption}
                    disabled={
                      results.option?.status === 'loading' ||
                      !config.optionSymbol
                    }
                  >
                    Single Option
                  </Button>
                  {getStatusIcon(results.option?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testOptionsHistory}
                    disabled={
                      results['options-history']?.status === 'loading' ||
                      !config.symbol
                    }
                  >
                    Options History
                  </Button>
                  {getStatusIcon(results['options-history']?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Portfolios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testPortfolios}
                    disabled={results.portfolios?.status === 'loading'}
                  >
                    All Portfolios
                  </Button>
                  {getStatusIcon(results.portfolios?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testPortfolio}
                    disabled={
                      results.portfolio?.status === 'loading' ||
                      !config.portfolioId
                    }
                  >
                    Single Portfolio
                  </Button>
                  {getStatusIcon(results.portfolio?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testCreatePortfolio}
                    disabled={
                      results['create-portfolio']?.status === 'loading' ||
                      !config.portfolioName
                    }
                  >
                    Create Portfolio
                  </Button>
                  {getStatusIcon(results['create-portfolio']?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Market Data Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Market Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testInterestRates}
                    disabled={results['interest-rates']?.status === 'loading'}
                  >
                    Interest Rates
                  </Button>
                  {getStatusIcon(results['interest-rates']?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testExchanges}
                    disabled={results.exchanges?.status === 'loading'}
                  >
                    Exchanges
                  </Button>
                  {getStatusIcon(results.exchanges?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testHistoricalData}
                    disabled={
                      results.historical?.status === 'loading' || !config.symbol
                    }
                  >
                    Historical Data
                  </Button>
                  {getStatusIcon(results.historical?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Rankings Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Rankings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testTopVolumeOptions}
                    disabled={
                      results['top-volume-options']?.status === 'loading'
                    }
                  >
                    Top Volume
                  </Button>
                  {getStatusIcon(results['top-volume-options']?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testOplabScoreStocks}
                    disabled={
                      results['oplab-score-stocks']?.status === 'loading'
                    }
                  >
                    Oplab Score
                  </Button>
                  {getStatusIcon(results['oplab-score-stocks']?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testFundamentalistCompanies}
                    disabled={
                      results['fundamentalist-companies']?.status ===
                        'loading' || !config.attribute
                    }
                  >
                    Fundamentalist
                  </Button>
                  {getStatusIcon(results['fundamentalist-companies']?.status)}
                </div>
              </CardContent>
            </Card>

            {/* Instruments Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Instruments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testInstrument}
                    disabled={
                      results.instrument?.status === 'loading' || !config.symbol
                    }
                  >
                    Single Instrument
                  </Button>
                  {getStatusIcon(results.instrument?.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testInstrumentQuotes}
                    disabled={
                      results['instrument-quotes']?.status === 'loading'
                    }
                  >
                    Quotes
                  </Button>
                  {getStatusIcon(results['instrument-quotes']?.status)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid gap-4">
            {Object.entries(results).map(([endpoint, result]) => (
              <Card key={endpoint}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{endpoint}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      {result.responseTime && (
                        <Badge variant="outline">{result.responseTime}ms</Badge>
                      )}
                    </div>
                  </div>
                  {result.timestamp && (
                    <CardDescription>
                      {new Date(result.timestamp).toLocaleString()}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {result.status === 'error' && result.error && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}

                  {result.data !== undefined && (
                    <div className="rounded-lg bg-gray-50 p-4">
                      <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
                        {formatJsonResponse(result.data)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {Object.keys(results).length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">
                    No test results yet. Run some tests to see results here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
