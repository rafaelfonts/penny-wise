import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apmMonitoring } from '@/lib/services/apm-monitoring';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const startTime = performance.now();
  
  try {
    // Test database connectivity with a simple query
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();

    const responseTime = performance.now() - startTime;

    if (error) {
      apmMonitoring.recordError(error, {
        endpoint: '/api/health/database',
        responseTime
      }, 'high');

      return NextResponse.json({
        status: 'unhealthy',
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Additional health checks
    const healthChecks = await Promise.allSettled([
      // Check connection pool
      supabase.rpc('pg_stat_activity_count'),
      
      // Check if we can write to database
      supabase.from('health_checks').insert({
        check_type: 'api_health',
        timestamp: new Date().toISOString(),
        status: 'ok'
      }),

      // Check read performance
      supabase.from('users').select('id').limit(1)
    ]);

    const failedChecks = healthChecks.filter(check => check.status === 'rejected');
    
    if (failedChecks.length > 0) {
      return NextResponse.json({
        status: 'degraded',
        message: `${failedChecks.length} health checks failed`,
        responseTime,
        timestamp: new Date().toISOString(),
        details: failedChecks.map(check => 
          check.status === 'rejected' ? check.reason : null
        )
      }, { status: 200 });
    }

    // Record successful health check
    apmMonitoring.recordMetric('database_health_check_success', 1);
    apmMonitoring.recordMetric('database_response_time', responseTime);

    return NextResponse.json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        connectionPool: 'active',
        readWrite: 'operational',
        queryPerformance: responseTime < 1000 ? 'good' : 'slow'
      }
    });

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    apmMonitoring.recordError(error as Error, {
      endpoint: '/api/health/database',
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