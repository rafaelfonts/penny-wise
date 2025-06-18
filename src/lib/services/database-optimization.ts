/**
 * Database Optimization Service
 * Sistema completo de otimização de queries e performance do banco de dados
 */

import { createClient } from '@supabase/supabase-js';
import { apmMonitoring } from './apm-monitoring';
import { Logger } from './logging';

interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  estimatedImprovement: number;
  reason: string;
}

interface IndexSuggestion {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gist' | 'gin';
  estimatedBenefit: 'high' | 'medium' | 'low';
  reason: string;
}

interface QueryPerformance {
  query: string;
  executionTime: number;
  planningTime: number;
  rows: number;
  cost: number;
  timestamp: number;
}

class DatabaseOptimizationService {
  private logger = Logger.getInstance();
  private supabase: any;
  private queryCache = new Map<string, any>();
  private performanceHistory: QueryPerformance[] = [];
  private connectionPool: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.initializeConnectionPool();
    this.startPerformanceMonitoring();
  }

  /**
   * Execute optimized query with monitoring
   */
  async executeQuery<T>(
    query: string,
    params?: any[],
    options?: {
      cache?: boolean;
      cacheExpiry?: number;
      timeout?: number;
    }
  ): Promise<T> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(query, params);

    try {
      // Check cache first
      if (options?.cache && this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < (options.cacheExpiry || 300000)) { // 5 min default
          apmMonitoring.recordMetric('db_query_cache_hit', 1, { query_type: this.getQueryType(query) });
          return cached.data;
        }
      }

      // Execute query with monitoring
      const result = await apmMonitoring.timeFunction(
        'database_query',
        async () => {
          if (query.trim().toUpperCase().startsWith('SELECT')) {
            return await this.supabase.rpc('execute_optimized_query', {
              query_text: query,
              query_params: params || []
            });
          } else {
            // For non-SELECT queries, use regular execution
            return await this.supabase.rpc('execute_query', {
              query_text: query,
              query_params: params || []
            });
          }
        },
        { query_type: this.getQueryType(query) }
      );

      const executionTime = performance.now() - startTime;

      // Record performance metrics
      this.recordQueryPerformance({
        query,
        executionTime,
        planningTime: 0, // Would get from EXPLAIN
        rows: result.data?.length || 0,
        cost: 0, // Would get from EXPLAIN
        timestamp: Date.now()
      });

      // Cache result if requested
      if (options?.cache) {
        this.queryCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
      }

      return result.data;

    } catch (error) {
      apmMonitoring.recordDatabaseQuery(query, performance.now() - startTime, false);
      throw error;
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQuery(query: string): Promise<{
    performance: QueryPerformance;
    optimizations: QueryOptimization[];
    indexSuggestions: IndexSuggestion[];
  }> {
    try {
      // Get execution plan
      const explainResult = await this.supabase.rpc('explain_query', {
        query_text: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`
      });

      const plan = explainResult.data[0]['QUERY PLAN'][0];
      const performance: QueryPerformance = {
        query,
        executionTime: plan['Execution Time'] || 0,
        planningTime: plan['Planning Time'] || 0,
        rows: plan['Plan']?.['Actual Rows'] || 0,
        cost: plan['Plan']?.['Total Cost'] || 0,
        timestamp: Date.now()
      };

      // Analyze for optimizations
      const optimizations = this.suggestQueryOptimizations(query, plan);
      const indexSuggestions = this.suggestIndexes(query, plan);

      return {
        performance,
        optimizations,
        indexSuggestions
      };

    } catch (error) {
      this.logger.error('Query analysis failed', { query, error });
      throw error;
    }
  }

  /**
   * Create database indexes based on usage patterns
   */
  async createOptimalIndexes(): Promise<string[]> {
    const createdIndexes: string[] = [];

    try {
      // Analyze slow queries from performance history
      const slowQueries = this.performanceHistory
        .filter(p => p.executionTime > 1000) // Slower than 1 second
        .slice(-50); // Last 50 slow queries

      const indexSuggestions = new Map<string, IndexSuggestion>();

      for (const queryPerf of slowQueries) {
        const suggestions = await this.analyzeQueryForIndexes(queryPerf.query);
        
        suggestions.forEach(suggestion => {
          const key = `${suggestion.table}_${suggestion.columns.join('_')}`;
          if (!indexSuggestions.has(key)) {
            indexSuggestions.set(key, suggestion);
          }
        });
      }

      // Create high-benefit indexes
      for (const suggestion of indexSuggestions.values()) {
        if (suggestion.estimatedBenefit === 'high') {
          const indexName = `idx_${suggestion.table}_${suggestion.columns.join('_')}`;
          const createQuery = `
            CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
            ON ${suggestion.table} USING ${suggestion.type} (${suggestion.columns.join(', ')})
          `;

          try {
            await this.supabase.rpc('execute_ddl', { ddl_statement: createQuery });
            createdIndexes.push(indexName);
            this.logger.info(`Created index: ${indexName}`, { suggestion });
          } catch (error) {
            this.logger.error(`Failed to create index: ${indexName}`, { error });
          }
        }
      }

      return createdIndexes;

    } catch (error) {
      this.logger.error('Index creation failed', { error });
      return [];
    }
  }

  /**
   * Optimize connection pooling
   */
  private initializeConnectionPool(): void {
    // Connection pool configuration for better performance
    this.connectionPool = {
      max: 20, // Maximum number of connections
      min: 5,  // Minimum number of connections
      idle: 10000, // Connection idle timeout
      acquire: 30000, // Connection acquire timeout
      evict: 1000, // Connection eviction timeout
    };

    this.logger.info('Database connection pool initialized', this.connectionPool);
  }

  /**
   * Monitor database performance continuously
   */
  private startPerformanceMonitoring(): void {
    setInterval(async () => {
      try {
        await this.collectPerformanceMetrics();
      } catch (error) {
        this.logger.error('Performance monitoring failed', { error });
      }
    }, 60000); // Every minute
  }

  /**
   * Collect database performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    try {
      // Query database statistics
      const stats = await this.supabase.rpc('get_database_stats');
      
      if (stats.data) {
        const { 
          active_connections, 
          idle_connections, 
          total_connections,
          cache_hit_ratio,
          index_usage_ratio,
          table_size_mb,
          index_size_mb
        } = stats.data;

        // Record APM metrics
        apmMonitoring.recordMetric('db_active_connections', active_connections);
        apmMonitoring.recordMetric('db_idle_connections', idle_connections);
        apmMonitoring.recordMetric('db_total_connections', total_connections);
        apmMonitoring.recordMetric('db_cache_hit_ratio', cache_hit_ratio);
        apmMonitoring.recordMetric('db_index_usage_ratio', index_usage_ratio);
        apmMonitoring.recordMetric('db_total_size_mb', table_size_mb + index_size_mb);

        // Check for performance issues
        if (cache_hit_ratio < 0.95) {
          apmMonitoring.recordError(
            new Error(`Low cache hit ratio: ${cache_hit_ratio}`),
            { cache_hit_ratio },
            'medium'
          );
        }

        if (index_usage_ratio < 0.90) {
          apmMonitoring.recordError(
            new Error(`Low index usage ratio: ${index_usage_ratio}`),
            { index_usage_ratio },
            'medium'
          );
        }
      }

    } catch (error) {
      this.logger.error('Failed to collect database metrics', { error });
    }
  }

  /**
   * Suggest query optimizations
   */
  private suggestQueryOptimizations(query: string, plan: any): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];
    const upperQuery = query.trim().toUpperCase();

    // Check for common optimization opportunities
    
    // 1. SELECT * optimization
    if (upperQuery.includes('SELECT *')) {
      optimizations.push({
        originalQuery: query,
        optimizedQuery: query.replace(/SELECT \*/gi, 'SELECT specific_columns'),
        estimatedImprovement: 30,
        reason: 'Avoid SELECT * - specify only needed columns to reduce data transfer'
      });
    }

    // 2. Missing WHERE clause on large tables
    if (!upperQuery.includes('WHERE') && upperQuery.includes('FROM')) {
      optimizations.push({
        originalQuery: query,
        optimizedQuery: query + ' WHERE condition',
        estimatedImprovement: 50,
        reason: 'Add WHERE clause to limit rows scanned'
      });
    }

    // 3. LIMIT optimization
    if (!upperQuery.includes('LIMIT') && upperQuery.startsWith('SELECT')) {
      optimizations.push({
        originalQuery: query,
        optimizedQuery: query + ' LIMIT 100',
        estimatedImprovement: 40,
        reason: 'Add LIMIT clause to prevent returning too many rows'
      });
    }

    // 4. ORDER BY without index
    if (upperQuery.includes('ORDER BY') && plan?.Plan?.['Node Type'] === 'Sort') {
      optimizations.push({
        originalQuery: query,
        optimizedQuery: 'Consider adding index on ORDER BY columns',
        estimatedImprovement: 60,
        reason: 'ORDER BY is causing expensive sort operation - needs index'
      });
    }

    // 5. JOIN optimization
    if (upperQuery.includes('JOIN') && plan?.Plan?.['Join Type'] === 'Nested Loop') {
      optimizations.push({
        originalQuery: query,
        optimizedQuery: 'Consider rewriting JOIN or adding indexes',
        estimatedImprovement: 70,
        reason: 'Nested Loop join detected - may benefit from different join strategy'
      });
    }

    return optimizations;
  }

  /**
   * Suggest indexes based on query analysis
   */
  private suggestIndexes(query: string, plan: any): IndexSuggestion[] {
    const suggestions: IndexSuggestion[] = [];
    
    // Parse query for index opportunities
    const tables = this.extractTablesFromQuery(query);
    const whereColumns = this.extractWhereColumns(query);
    const orderByColumns = this.extractOrderByColumns(query);
    const joinColumns = this.extractJoinColumns(query);

    // Suggest indexes for WHERE clauses
    whereColumns.forEach(({ table, column }) => {
      suggestions.push({
        table,
        columns: [column],
        type: 'btree',
        estimatedBenefit: 'high',
        reason: `WHERE clause on ${column} would benefit from index`
      });
    });

    // Suggest indexes for ORDER BY
    orderByColumns.forEach(({ table, columns }) => {
      suggestions.push({
        table,
        columns,
        type: 'btree',
        estimatedBenefit: 'medium',
        reason: `ORDER BY on ${columns.join(', ')} would benefit from composite index`
      });
    });

    // Suggest indexes for JOINs
    joinColumns.forEach(({ table, column }) => {
      suggestions.push({
        table,
        columns: [column],
        type: 'btree',
        estimatedBenefit: 'high',
        reason: `JOIN on ${column} would benefit from index`
      });
    });

    return suggestions;
  }

  /**
   * Analyze query for specific index needs
   */
  private async analyzeQueryForIndexes(query: string): Promise<IndexSuggestion[]> {
    // This would do more sophisticated analysis
    // For now, return basic suggestions
    return this.suggestIndexes(query, {});
  }

  /**
   * Helper methods for query parsing
   */
  private extractTablesFromQuery(query: string): string[] {
    const fromMatch = query.match(/FROM\s+(\w+)/gi);
    const joinMatch = query.match(/JOIN\s+(\w+)/gi);
    
    const tables = new Set<string>();
    
    if (fromMatch) {
      fromMatch.forEach(match => {
        const table = match.split(/\s+/)[1];
        tables.add(table);
      });
    }
    
    if (joinMatch) {
      joinMatch.forEach(match => {
        const table = match.split(/\s+/)[1];
        tables.add(table);
      });
    }
    
    return Array.from(tables);
  }

  private extractWhereColumns(query: string): Array<{ table: string; column: string }> {
    const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT|$)/i);
    if (!whereMatch) return [];
    
    const whereClause = whereMatch[1];
    const columnMatches = whereClause.match(/(\w+)\.(\w+)|(\w+)\s*[=<>]/g);
    
    const columns: Array<{ table: string; column: string }> = [];
    
    if (columnMatches) {
      columnMatches.forEach(match => {
        if (match.includes('.')) {
          const [table, column] = match.split('.');
          columns.push({ table, column: column.replace(/\s*[=<>].*/, '') });
        } else {
          const column = match.replace(/\s*[=<>].*/, '');
          // Assume first table if no table specified
          const tables = this.extractTablesFromQuery(query);
          if (tables.length > 0) {
            columns.push({ table: tables[0], column });
          }
        }
      });
    }
    
    return columns;
  }

  private extractOrderByColumns(query: string): Array<{ table: string; columns: string[] }> {
    const orderMatch = query.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i);
    if (!orderMatch) return [];
    
    const orderClause = orderMatch[1];
    const columns = orderClause.split(',').map(col => col.trim().replace(/\s+(ASC|DESC)$/i, ''));
    
    const tables = this.extractTablesFromQuery(query);
    if (tables.length === 0) return [];
    
    return [{
      table: tables[0], // Assume first table
      columns: columns.map(col => col.includes('.') ? col.split('.')[1] : col)
    }];
  }

  private extractJoinColumns(query: string): Array<{ table: string; column: string }> {
    const joinMatches = query.match(/JOIN\s+(\w+)\s+ON\s+(.+?)(?:\s+WHERE|\s+ORDER|\s+GROUP|$)/gi);
    if (!joinMatches) return [];
    
    const columns: Array<{ table: string; column: string }> = [];
    
    joinMatches.forEach(joinMatch => {
      const parts = joinMatch.split(/\s+ON\s+/i);
      if (parts.length > 1) {
        const table = parts[0].split(/\s+/)[1];
        const condition = parts[1];
        
        const columnMatches = condition.match(/(\w+)\.(\w+)/g);
        if (columnMatches) {
          columnMatches.forEach(match => {
            const [matchTable, column] = match.split('.');
            if (matchTable === table) {
              columns.push({ table, column });
            }
          });
        }
      }
    });
    
    return columns;
  }

  private recordQueryPerformance(performance: QueryPerformance): void {
    this.performanceHistory.push(performance);
    
    // Keep only last 1000 entries
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }

    // Record to APM
    apmMonitoring.recordDatabaseQuery(
      performance.query,
      performance.executionTime,
      true
    );
  }

  private generateCacheKey(query: string, params?: any[]): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `query_${Buffer.from(query + paramString).toString('base64')}`;
  }

  private getQueryType(query: string): string {
    const upperQuery = query.trim().toUpperCase();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationReport(): {
    slowQueries: QueryPerformance[];
    indexSuggestions: Map<string, IndexSuggestion>;
    cacheHitRate: number;
    averageQueryTime: number;
  } {
    const slowQueries = this.performanceHistory
      .filter(q => q.executionTime > 1000)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    const totalQueries = this.performanceHistory.length;
    const cacheHits = Array.from(this.queryCache.values()).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;

    const totalTime = this.performanceHistory.reduce((sum, q) => sum + q.executionTime, 0);
    const averageQueryTime = totalQueries > 0 ? totalTime / totalQueries : 0;

    return {
      slowQueries,
      indexSuggestions: new Map(), // Would be populated with real suggestions
      cacheHitRate,
      averageQueryTime
    };
  }
}

// Global instance
export const databaseOptimization = new DatabaseOptimizationService();

export { DatabaseOptimizationService };
export type { QueryOptimization, IndexSuggestion, QueryPerformance }; 