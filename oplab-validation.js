// ==========================================
// VALIDAÇÃO FINAL - API OPLAB PÓS-UPGRADE BIZ
// ==========================================

const TOKEN =
  'vs1ENXEvw1vkg8TysJmEAycX0WCn7FuWdo1pYnlq8ejsqkyc91I18jzd+YMPfwlP--LXjLgyXWOplVqnvjyUrdkw==--MjQyNDVhZTBhNTMzZWJkYjc4ODI2NWQwNTIyZmQyNTQ=';
const BASE_URL = 'https://api.oplab.com.br/v3';
const INTERNAL_API = 'http://localhost:3000/api/market/oplab';

const CRITICAL_ENDPOINTS = [
  // ==========================================
  // ENDPOINTS CRÍTICOS DA API EXTERNA
  // ==========================================
  {
    name: '✅ User Authorization',
    url: '/domain/users/authorize?for=default',
    method: 'GET',
    critical: true,
  },
  {
    name: '✅ Market Status',
    url: '/market/status',
    method: 'GET',
    critical: true,
  },
  {
    name: '✅ Stocks List',
    url: '/market/stocks',
    method: 'GET',
    critical: true,
  },
  {
    name: '✅ Single Stock',
    url: '/market/stocks/PETR4',
    method: 'GET',
    critical: true,
  },
  {
    name: '✅ User Settings',
    url: '/domain/users/settings',
    method: 'GET',
    critical: true,
  },
  {
    name: '✅ Portfolios',
    url: '/domain/portfolios',
    method: 'GET',
    critical: true,
  },

  // ==========================================
  // ENDPOINTS DA API INTERNA
  // ==========================================
  {
    name: '🔧 Internal Health',
    url: '?action=health',
    method: 'GET',
    internal: true,
    critical: true,
  },
  {
    name: '🔧 Internal Stocks',
    url: '?action=stocks',
    method: 'GET',
    internal: true,
    critical: true,
  },
  {
    name: '🔧 Internal Stock Detail',
    url: '?action=stock&symbol=PETR4',
    method: 'GET',
    internal: true,
    critical: true,
  },
  {
    name: '🔧 Internal Market Status',
    url: '?action=market-status',
    method: 'GET',
    internal: true,
    critical: true,
  },
];

async function testEndpoint(endpoint) {
  const baseUrl = endpoint.internal ? INTERNAL_API : BASE_URL;
  const url = `${baseUrl}${endpoint.url}`;

  const headers = endpoint.internal
    ? { 'Content-Type': 'application/json' }
    : { 'Access-Token': TOKEN, 'Content-Type': 'application/json' };

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
    });

    const status = response.status;
    const success = status === 200;

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Se não conseguir parsear JSON, pega texto
      data = await response.text();
    }

    return {
      name: endpoint.name,
      success,
      status,
      data: success
        ? '✅ Data received'
        : `❌ Error: ${JSON.stringify(data).substring(0, 100)}`,
      critical: endpoint.critical,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: endpoint.name,
      success: false,
      status: 0,
      data: `🚫 Network Error: ${error.message}`,
      critical: endpoint.critical,
      timestamp: new Date().toISOString(),
    };
  }
}

async function runValidation() {
  console.log('🎯 INICIANDO VALIDAÇÃO FINAL DA API OPLAB');
  console.log('==========================================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(
    `🔑 Token Status: ${TOKEN ? 'Configurado' : 'Não configurado'}\n`
  );

  const results = [];
  let successCount = 0;
  let criticalFailures = 0;

  console.log('📊 TESTANDO ENDPOINTS CRÍTICOS...\n');

  for (const endpoint of CRITICAL_ENDPOINTS) {
    console.log(`⏳ Testando: ${endpoint.name}`);
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      successCount++;
      console.log(`   ✅ SUCESSO (${result.status})`);
    } else {
      if (result.critical) criticalFailures++;
      console.log(`   ❌ FALHA (${result.status}) - ${result.data}`);
    }

    // Pequena pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n==========================================');
  console.log('📋 RELATÓRIO FINAL');
  console.log('==========================================');

  console.log(`✅ Sucessos: ${successCount}/${CRITICAL_ENDPOINTS.length}`);
  console.log(`❌ Falhas Críticas: ${criticalFailures}`);
  console.log(
    `📈 Taxa de Sucesso: ${((successCount / CRITICAL_ENDPOINTS.length) * 100).toFixed(1)}%`
  );

  if (criticalFailures === 0) {
    console.log('\n🎉 VALIDAÇÃO COMPLETA!');
    console.log('✅ Todos os endpoints críticos estão funcionando');
    console.log('🚀 API OpLab está 100% operacional com plano BIZ');
  } else {
    console.log('\n⚠️  ATENÇÃO: Falhas críticas detectadas');
    console.log('🔧 Revisar endpoints que falharam');
  }

  console.log('\n📑 DETALHES DOS TESTES:');
  console.log('==========================================');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const critical = result.critical ? '🔴' : '🟡';
    console.log(`${status} ${critical} ${result.name}`);
    if (!result.success) {
      console.log(`   📄 Erro: ${result.data}`);
    }
  });

  return {
    summary: {
      total: CRITICAL_ENDPOINTS.length,
      success: successCount,
      failures: CRITICAL_ENDPOINTS.length - successCount,
      criticalFailures,
      successRate: ((successCount / CRITICAL_ENDPOINTS.length) * 100).toFixed(
        1
      ),
    },
    results,
    timestamp: new Date().toISOString(),
  };
}

// Executar validação
runValidation().catch(console.error);
