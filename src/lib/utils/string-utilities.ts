// String Utilities for PennyWise Application
// Comprehensive text processing, validation, and formatting functions

// ==========================================
// TEXT FORMATTING
// ==========================================

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  // Handle hyphenated strings differently - preserve hyphens and capitalize each part
  if (str.includes('-')) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  }
  // Handle regular strings
  return str
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function camelToKebab(str: string): string {
  return str
    .replace(/([A-Z][a-z])/g, '-$1')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/^-/, '');
}

export function kebabToCamel(str: string): string {
  if (!str) return '';
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

// ==========================================
// STRING VALIDATION
// ==========================================

export function isValidStockSymbol(symbol: string): boolean {
  if (!symbol) return false;
  // US stock symbols: 1-5 uppercase letters
  const usPattern = /^[A-Z]{1,5}$/;
  // Brazilian stock symbols: letters + numbers
  const brPattern = /^[A-Z]{4}\d{1,2}$/;
  return usPattern.test(symbol) || brPattern.test(symbol);
}

export function isValidBrazilianSymbol(symbol: string): boolean {
  if (!symbol) return false;
  return /^[A-Z]{4}\d{1,2}$/.test(symbol);
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // Brazilian phone format: (11) 99999-9999 or 11999999999
  const cleanPhone = phone.replace(/\D/g, '');
  return /^(\d{10,11})$/.test(cleanPhone);
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// STRING PARSING AND EXTRACTION
// ==========================================

export function extractStockSymbols(text: string): string[] {
  // Match symbols: 2-5 uppercase letters, not preceded by lowercase letters
  const symbolRegex = /(?<![a-z])\b[A-Z]{2,5}\b(?![a-z])/g;
  const matches = text.match(symbolRegex) || [];
  
  // Filter out common words that might match the pattern
  const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'BUT', 'WILL', 'NEW', 'NOW', 'OLD', 'SEE', 'HIM', 'TWO', 'HOW', 'ITS', 'WHO', 'DID', 'YES', 'GET', 'MAY', 'HAS', 'SAY', 'SHE', 'USE', 'HIS', 'HER', 'WHY', 'WAY', 'TRY', 'ASK', 'TOO', 'ANY', 'DAY', 'PUT', 'END', 'LET', 'CAR', 'FAR', 'BIG', 'MAN', 'BOY', 'BAD', 'SUN', 'LOT', 'EYE', 'JOB', 'OFF', 'GOD', 'TOP', 'LEFT', 'CALL', 'WORK', 'LIFE', 'COME', 'BACK', 'GOOD', 'LAST', 'YEAR', 'HOME', 'THEN', 'TIME', 'LONG', 'TURN', 'NEXT', 'PART', 'TAKE', 'GIVE', 'HAND', 'FACE', 'CASE', 'KNOW', 'COME', 'WEEK', 'HEAD', 'KEEP', 'WORD', 'PLAY', 'MOVE', 'HELP', 'NEED', 'SEEM', 'MEAN', 'TELL', 'OVER', 'FEEL', 'FIND', 'MUST', 'WANT', 'FROM', 'WITH', 'THEY', 'HAVE', 'WHAT', 'THAT', 'THIS', 'WHEN', 'THAN', 'EVEN', 'ONLY', 'INTO', 'LIKE', 'MUCH', 'ALSO', 'SUCH', 'MORE', 'WELL', 'VERY', 'SAID', 'BEEN', 'WERE', 'WILL', 'MAKE', 'EACH', 'SOME', 'LOOK', 'MANY', 'MOST'];
  
  return matches.filter(symbol => !commonWords.includes(symbol));
}

export function extractNumbers(text: string): number[] {
  if (!text) return [];
  const matches = text.match(/-?\d+\.?\d*/g);
  return matches ? matches.map(Number).filter(n => !isNaN(n)) : [];
}

export function extractCurrencyAmount(text: string): number | null {
  if (!text) return null;
  const match = text.match(/[\$R\$]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/);
  if (!match) return null;
  
  const numStr = match[1].replace(/[,\.]/g, (match, offset, string) => {
    // If it's the last occurrence and followed by exactly 2 digits, it's decimal
    const remaining = string.slice(offset + 1);
    return remaining.length === 2 ? '.' : '';
  });
  
  return parseFloat(numStr);
}

export function parseCSV(csvText: string): string[][] {
  if (!csvText) return [];
  
  const lines = csvText.split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

// ==========================================
// STRING SANITIZATION AND SECURITY
// ==========================================

export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/onerror/gi, '')
    .replace(/onclick/gi, '')
    .replace(/onload/gi, '')
    .replace(/javascript:/gi, '');
}

export function preventSqlInjection(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

export function sanitizeForLog(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[\r\n]/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .trim();
}

// ==========================================
// STRING COMPARISON
// ==========================================

export function levenshteinDistance(str1: string, str2: string): number {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

// ==========================================
// TEMPLATES AND INTERPOLATION
// ==========================================

export function interpolateTemplate(template: string, variables: Record<string, any>): string {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

export function conditionalFormat(condition: boolean, trueFormat: string, falseFormat: string): string {
  return condition ? trueFormat : falseFormat;
}

// ==========================================
// ENCODING AND DECODING
// ==========================================

export function base64Encode(str: string): string {
  // Handle Unicode properly by first encoding to UTF-8
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}

export function base64Decode(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function urlEncode(text: string): string {
  if (!text) return '';
  return encodeURIComponent(text);
}

export function urlDecode(encoded: string): string {
  if (!encoded) return '';
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export function escapeJsonString(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
} 