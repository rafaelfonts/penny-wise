import { NextResponse } from 'next/server';
import { apmMonitoring } from '@/lib/services/apm-monitoring';

export async function GET() {
  const startTime = performance.now();
  
  try {
    // Check external APIs that the application depends on
    const externalServices = [
      {
        name: 'Alpha Vantage API',
        url: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=demo',
        timeout: 5000
      },
      {
        name: 'Financial Modeling Prep',
        url: 'https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=demo',
        timeout: 5000
      },
      {
        name: 'IEX Cloud',
        url: 'https://cloud.iexapis.com/stable/stock/aapl/quote?token=demo',
        timeout: 5000
      }
    ];

    const healthChecks = await Promise.allSettled(
      externalServices.map(async (service) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), service.timeout);
        
        try {
          const response = await fetch(service.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'PennyWise/1.0'
            }
          });
          
          clearTimeout(timeoutId);
          
          return {
            service: service.name,
            status: response.ok ? 'healthy' : 'degraded',
            responseTime: performance.now() - startTime,
            statusCode: response.status,
            statusText: response.statusText
          };
        } catch (error) {
          clearTimeout(timeoutId);
          throw {
            service: service.name,
            status: 'unhealthy',
            error: (error as Error).message
          };
        }
      })
    );

    const responseTime = performance.now() - startTime;
    const results = healthChecks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          service: externalServices[index].name,
          status: 'unhealthy',
          error: check.reason?.error || 'Unknown error',
          responseTime: -1
        };
      }
    });

    const healthyServices = results.filter(r => r.status === 'healthy').length;
    const degradedServices = results.filter(r => r.status === 'degraded').length;
    const unhealthyServices = results.filter(r => r.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthyServices > externalServices.length / 2) {
      overallStatus = 'unhealthy';
    } else if (unhealthyServices > 0 || degradedServices > 0) {
      overallStatus = 'degraded';
    }

    // Record metrics
    apmMonitoring.recordMetric('external_apis_healthy', healthyServices);
    apmMonitoring.recordMetric('external_apis_degraded', degradedServices);
    apmMonitoring.recordMetric('external_apis_unhealthy', unhealthyServices);
    apmMonitoring.recordMetric('external_apis_response_time', responseTime);

    if (overallStatus !== 'healthy') {
      apmMonitoring.recordError(
        new Error(`External APIs health check: ${overallStatus}`),
        { 
          endpoint: '/api/health/external',
          results,
          responseTime 
        },
        overallStatus === 'unhealthy' ? 'high' : 'medium'
      );
    }

    return NextResponse.json({
      status: overallStatus,
      responseTime,
      timestamp: new Date().toISOString(),
      summary: {
        total: externalServices.length,
        healthy: healthyServices,
        degraded: degradedServices,
        unhealthy: unhealthyServices
      },
      services: results
    }, { 
      status: overallStatus === 'unhealthy' ? 503 : 200 
    });

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    apmMonitoring.recordError(error as Error, {
      endpoint: '/api/health/external',
      responseTime
    }, 'critical');

    return NextResponse.json({
      status: 'unhealthy',
      error: (error as Error).message,
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
} 