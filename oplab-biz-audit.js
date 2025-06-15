// ==========================================
// AUDITORIA COMPLETA API OPLAB - PLANO BIZ
// ==========================================

const TOKEN =
  'vs1ENXEvw1vkg8TysJmEAycX0WCn7FuWdo1pYnlq8ejsqkyc91I18jzd+YMPfwlP--LXjLgyXWOplVqnvjyUrdkw==--MjQyNDVhZTBhNTMzZWJkYjc4ODI2NWQwNTIyZmQyNTQ=';
const BASE_URL = 'https://api.oplab.com.br/v3';

const ENDPOINTS_TO_AUDIT = [
  // ==========================================
  // DOMAIN/AUTH - FUNCIONAVAM NO PLANO ECO
  // ==========================================
  {
    name: 'User Authorize',
    url: '/domain/users/authorize?for=default',
    method: 'GET',
    category: 'auth',
  },
  {
    name: 'User Settings',
    url: '/domain/users/settings',
    method: 'GET',
    category: 'auth',
  },
  {
    name: 'Portfolios',
    url: '/domain/portfolios',
    method: 'GET',
    category: 'portfolio',
  },

  // ==========================================
  // MARKET STOCKS - ERAM 403 NO PLANO ECO
  // ==========================================
  {
    name: 'Market Stocks List',
    url: '/market/stocks',
    method: 'GET',
    category: 'stocks',
  },
  {
    name: 'Stock PETR4',
    url: '/market/stocks/PETR4',
    method: 'GET',
    category: 'stocks',
  },
  {
    name: 'Stock VALE3',
    url: '/market/stocks/VALE3',
    method: 'GET',
    category: 'stocks',
  },
  {
    name: 'Stock ITUB4',
    url: '/market/stocks/ITUB4',
    method: 'GET',
    category: 'stocks',
  },
  {
    name: 'Stocks with Options',
    url: '/market/stocks?has_options=true',
    method: 'GET',
    category: 'stocks',
  },

  // ==========================================
  // MARKET DATA - ERAM 404 NO PLANO ECO
  // ==========================================
  {
    name: 'Market Status',
    url: '/market/status',
    method: 'GET',
    category: 'market',
  },
  {
    name: 'Market Quotes PETR4',
    url: '/market/quotes?symbols=PETR4',
    method: 'GET',
    category: 'quotes',
  },
  {
    name: 'Market Quotes Multiple',
    url: '/market/quotes?symbols=PETR4,VALE3,ITUB4',
    method: 'GET',
    category: 'quotes',
  },

  // ==========================================
  // INSTRUMENTS - ERAM 400 NO PLANO ECO
  // ==========================================
  {
    name: 'Market Instruments',
    url: '/market/instruments',
    method: 'GET',
    category: 'instruments',
  },
  {
    name: 'Instrument PETR4',
    url: '/market/instruments/PETR4',
    method: 'GET',
    category: 'instruments',
  },
  {
    name: 'Instrument Option Series',
    url: '/market/instruments/PETR4/option-series',
    method: 'GET',
    category: 'instruments',
  },

  // ==========================================
  // OPTIONS - ERAM 404 NO PLANO ECO
  // ==========================================
  {
    name: 'Options for PETR4',
    url: '/market/options?underlying=PETR4',
    method: 'GET',
    category: 'options',
  },
  {
    name: 'Options Covered PETR4',
    url: '/market/options/PETR4/covered',
    method: 'GET',
    category: 'options',
  },
  {
    name: 'Top Options',
    url: '/market/options/top',
    method: 'GET',
    category: 'options',
  },

  // ==========================================
  // COMPANIES - ERAM 400 NO PLANO ECO
  // ==========================================
  {
    name: 'Market Companies',
    url: '/market/companies',
    method: 'GET',
    category: 'companies',
  },
  {
    name: 'Company PETR4',
    url: '/market/companies/PETR4',
    method: 'GET',
    category: 'companies',
  },

  // ==========================================
  // RANKINGS - ERAM 404 NO PLANO ECO
  // ==========================================
  {
    name: 'Options Volume Ranking',
    url: '/market/rankings/options/volume',
    method: 'GET',
    category: 'rankings',
  },
  {
    name: 'Options Profit Ranking',
    url: '/market/rankings/options/profit',
    method: 'GET',
    category: 'rankings',
  },
  {
    name: 'Options Variation Ranking',
    url: '/market/rankings/options/variation',
    method: 'GET',
    category: 'rankings',
  },
  {
    name: 'Options Trends Up',
    url: '/market/rankings/options/trends?direction=up',
    method: 'GET',
    category: 'rankings',
  },
  {
    name: 'Options IBOV Correlation',
    url: '/market/rankings/options/ibov-correlation',
    method: 'GET',
    category: 'rankings',
  },
  {
    name: 'Stocks OpLab Score',
    url: '/market/rankings/stocks/oplab-score',
    method: 'GET',
    category: 'rankings',
  },
  {
    name: 'Fundamentalist Companies',
    url: '/market/rankings/companies/fundamentals?attribute=market-cap',
    method: 'GET',
    category: 'rankings',
  },

  // ==========================================
  // CHARTS/TRADING VIEW - ERAM 404 NO PLANO ECO
  // ==========================================
  {
    name: 'Chart Market Data Info',
    url: '/v2/charts/data/info',
    method: 'GET',
    category: 'charts',
  },
  {
    name: 'Chart Server Time',
    url: '/v2/charts/data/time',
    method: 'GET',
    category: 'charts',
  },
  {
    name: 'Chart Data PETR4 1D',
    url: '/v2/charts/data/PETR4/1D',
    method: 'GET',
    category: 'charts',
  },
  {
    name: 'Chart Data PETR4 1H',
    url: '/v2/charts/data/PETR4/1H',
    method: 'GET',
    category: 'charts',
  },
  {
    name: 'Search Instruments PETR',
    url: '/v2/charts/instruments/search/PETR',
    method: 'GET',
    category: 'charts',
  },

  // ==========================================
  // ADDITIONAL ENDPOINTS
  // ==========================================
  {
    name: 'Interest Rates',
    url: '/market/interest-rates',
    method: 'GET',
    category: 'rates',
  },
  {
    name: 'SELIC Rate',
    url: '/market/interest-rates/SELIC',
    method: 'GET',
    category: 'rates',
  },
  {
    name: 'Exchanges',
    url: '/market/exchanges',
    method: 'GET',
    category: 'exchanges',
  },
  {
    name: 'BOVESPA Exchange',
    url: '/market/exchanges/BOVESPA',
    method: 'GET',
    category: 'exchanges',
  },
  {
    name: 'Historical Data PETR4',
    url: '/market/historical/PETR4',
    method: 'GET',
    category: 'historical',
  },
  {
    name: 'Options History PETR4',
    url: '/market/options/PETR4/history',
    method: 'GET',
    category: 'historical',
  },
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.url}`, {
      method: endpoint.method,
      headers: {
        'Access-Token': TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type');
    let data = '';
    let dataPreview = '';

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        if (Array.isArray(data)) {
          dataPreview = `Array[${data.length}] - ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'empty'}`;
        } else if (typeof data === 'object' && data !== null) {
          const keys = Object.keys(data);
          dataPreview = `Object{${keys.slice(0, 5).join(', ')}}${keys.length > 5 ? '...' : ''}`;
        } else {
          dataPreview = String(data).substring(0, 100);
        }
      } catch {
        data = 'JSON Parse Error';
        dataPreview = 'JSON Parse Error';
      }
    } else {
      const text = await response.text();
      if (text.includes('<html>')) {
        data = 'HTML Response';
        dataPreview = 'HTML Response';
      } else {
        data = text.substring(0, 200);
        dataPreview = text.substring(0, 100);
      }
    }

    return {
      name: endpoint.name,
      url: endpoint.url,
      category: endpoint.category,
      status: response.status,
      success: response.ok,
      data: data,
      dataPreview: dataPreview,
      contentType: contentType || 'none',
    };
  } catch (error) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      category: endpoint.category,
      status: 'ERROR',
      success: false,
      error: error.message,
      dataPreview: 'Network Error',
    };
  }
}

async function runBizAudit() {
  console.log('==========================================');
  console.log('AUDITORIA COMPLETA API OPLAB - PLANO BIZ');
  console.log('==========================================');
  console.log(`Token: ${TOKEN.substring(0, 20)}...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Total endpoints: ${ENDPOINTS_TO_AUDIT.length}`);
  console.log('==========================================\n');

  const results = [];

  for (const endpoint of ENDPOINTS_TO_AUDIT) {
    console.log(`[${endpoint.category.toUpperCase()}] ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${result.status} - ${result.dataPreview}`);
    } else {
      console.log(
        `❌ ${result.status} - ${result.error || result.dataPreview || 'Failed'}`
      );
    }

    // Delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n==========================================');
  console.log('ANÁLISE POR CATEGORIA');
  console.log('==========================================');

  const categories = [...new Set(results.map(r => r.category))];

  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const working = categoryResults.filter(r => r.success);
    const failing = categoryResults.filter(r => !r.success);

    console.log(`\n📂 ${category.toUpperCase()}`);
    console.log(
      `   ✅ Funcionando: ${working.length}/${categoryResults.length}`
    );
    console.log(`   ❌ Com falha: ${failing.length}/${categoryResults.length}`);

    if (working.length > 0) {
      console.log('   📋 Endpoints funcionais:');
      working.forEach(r => console.log(`      • ${r.name}`));
    }

    if (failing.length > 0) {
      console.log('   🚫 Endpoints com falha:');
      failing.forEach(r => console.log(`      • ${r.name} (${r.status})`));
    }
  });

  console.log('\n==========================================');
  console.log('RESUMO GERAL');
  console.log('==========================================');

  const working = results.filter(r => r.success);
  const failing = results.filter(r => !r.success);

  console.log(
    `✅ Total funcionando: ${working.length}/${results.length} (${Math.round((working.length / results.length) * 100)}%)`
  );
  console.log(
    `❌ Total com falha: ${failing.length}/${results.length} (${Math.round((failing.length / results.length) * 100)}%)`
  );

  // Status codes breakdown
  const statusCodes = {};
  results.forEach(r => {
    statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
  });

  console.log('\n📊 Status Codes:');
  Object.entries(statusCodes).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} endpoints`);
  });

  return results;
}

// Executar auditoria
runBizAudit()
  .then(() => {
    console.log('\n==========================================');
    console.log('AUDITORIA PLANO BIZ CONCLUÍDA');
    console.log('==========================================');
    console.log('📋 Resultados salvos para análise de implementação');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro durante auditoria:', error);
    process.exit(1);
  });
