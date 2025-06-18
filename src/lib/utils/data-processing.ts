// Data Processing Utilities for PennyWise Application
// Comprehensive data manipulation, transformation, and analysis functions

// ==========================================
// ARRAY PROCESSING
// ==========================================

export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((acc, val) => {
    return acc.concat(Array.isArray(val) ? flatten(val) : val);
  }, []);
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function multiSort<T>(
  array: T[],
  sortKeys: Array<{ key: keyof T; direction: 'asc' | 'desc' }>
): T[] {
  return [...array].sort((a, b) => {
    for (const { key, direction } of sortKeys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// ==========================================
// OBJECT PROCESSING
// ==========================================

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function deepMerge(target: any, source: any): any {
  if (source === null || typeof source !== 'object') return source;
  if (target === null || typeof target !== 'object') return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

// ==========================================
// DATA VALIDATION
// ==========================================

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z]{1,5}$/.test(symbol);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function validateRequired<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: (keyof T)[] } {
  const missingFields = requiredFields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// ==========================================
// DATA TRANSFORMATION
// ==========================================

export function transformQuoteResponse(apiResponse: any) {
  return {
    symbol: apiResponse.symbol || apiResponse.ticker,
    price: parseFloat(apiResponse.price || apiResponse.currentPrice || 0),
    change: parseFloat(apiResponse.change || apiResponse.priceChange || 0),
    changePercent: parseFloat(apiResponse.changePercent || apiResponse.percentChange || 0),
    volume: parseInt(apiResponse.volume || apiResponse.tradingVolume || 0),
    timestamp: apiResponse.timestamp || apiResponse.lastUpdated || new Date().toISOString(),
  };
}

export function normalizePortfolio(portfolio: any[]) {
  return portfolio.map((position, index) => {
    const id = position.id || `${position.symbol}-${Date.now()}-${index}`;
    const quantity = Math.abs(parseFloat(position.quantity || position.shares || 0));
    const price = parseFloat(position.price || position.currentPrice || 0);
    const value = Math.abs(quantity * price); // Always positive for value
    const gainLoss = parseFloat(position.gainLoss || position.unrealizedPnL || 0);
    
    return {
      id,
      symbol: position.symbol || position.ticker,
      quantity,
      price,
      value,
      gainLoss,
      sector: position.sector || 'Unknown',
    };
  });
}

export function aggregateByPeriod(
  data: Array<{ timestamp: string; value: number }>,
  period: 'hour' | 'day' | 'week'
) {
  const groupedData: Record<string, { sum: number; count: number; values: number[] }> = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    let key: string;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        break;
      default:
        key = item.timestamp;
    }
    
    if (!groupedData[key]) {
      groupedData[key] = { sum: 0, count: 0, values: [] };
    }
    
    groupedData[key].sum += item.value;
    groupedData[key].count += 1;
    groupedData[key].values.push(item.value);
  });
  
  return Object.entries(groupedData).map(([period, data]) => ({
    period,
    average: data.sum / data.count,
    total: data.sum,
    count: data.count,
    min: Math.min(...data.values),
    max: Math.max(...data.values),
  }));
}

// ==========================================
// DATA FILTERING AND SEARCHING
// ==========================================

export function multiFilter<T>(
  data: T[],
  filters: Array<{ key: keyof T; operator: 'eq' | 'gt' | 'lt' | 'contains'; value: any }>
): T[] {
  return data.filter(item => {
    return filters.every(filter => {
      const itemValue = item[filter.key];
      
      switch (filter.operator) {
        case 'eq':
          return itemValue === filter.value;
        case 'gt':
          return Number(itemValue) > Number(filter.value);
        case 'lt':
          return Number(itemValue) < Number(filter.value);
        case 'contains':
          return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
        default:
          return true;
      }
    });
  });
}

export function fuzzySearch(items: string[], query: string, threshold: number = 0.6): string[] {
  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  return items
    .map(item => ({ item, similarity: calculateSimilarity(item, query) }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map(result => result.item);
}

// ==========================================
// PAGINATION AND UTILITY
// ==========================================

export function paginate<T>(data: T[], page: number, pageSize: number) {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

// ==========================================
// PERFORMANCE UTILITIES
// ==========================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
} 