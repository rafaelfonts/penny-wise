import { describe, test, expect } from '@jest/globals';

describe('String Utilities Tests', () => {
  describe('Text Formatting', () => {
    test('should capitalize first letter of strings', () => {
      const capitalize = (str: string): string => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('tEST')).toBe('Test');
      expect(capitalize('')).toBe('');
      expect(capitalize('a')).toBe('A');
    });

    test('should convert strings to title case', () => {
      const toTitleCase = (str: string): string => {
        return str.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      };

      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
      expect(toTitleCase('APPLE INC')).toBe('Apple Inc');
      expect(toTitleCase('new-york-stock-exchange')).toBe('New-york-stock-exchange');
    });

    test('should convert camelCase to kebab-case', () => {
      const camelToKebab = (str: string): string => {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      };

      expect(camelToKebab('camelCase')).toBe('camel-case');
      expect(camelToKebab('marketDataService')).toBe('market-data-service');
      expect(camelToKebab('XMLHttpRequest')).toBe('xml-http-request');
      expect(camelToKebab('iPhone')).toBe('i-phone');
    });

    test('should convert kebab-case to camelCase', () => {
      const kebabToCamel = (str: string): string => {
        return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      };

      expect(kebabToCamel('kebab-case')).toBe('kebabCase');
      expect(kebabToCamel('market-data-service')).toBe('marketDataService');
      expect(kebabToCamel('stock-symbol')).toBe('stockSymbol');
      expect(kebabToCamel('single')).toBe('single');
    });

    test('should truncate long strings with ellipsis', () => {
      const truncate = (str: string, maxLength: number, suffix: string = '...'): string => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - suffix.length) + suffix;
      };

      expect(truncate('This is a very long string', 10)).toBe('This is...');
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('Exactly ten', 11)).toBe('Exactly ten');
      expect(truncate('Too long text', 8, '…')).toBe('Too lon…');
    });
  });

  describe('String Validation', () => {
    test('should validate stock symbols', () => {
      const isValidStockSymbol = (symbol: string): boolean => {
        // US stock symbols: 1-5 uppercase letters
        return /^[A-Z]{1,5}$/.test(symbol);
      };

      expect(isValidStockSymbol('AAPL')).toBe(true);
      expect(isValidStockSymbol('MSFT')).toBe(true);
      expect(isValidStockSymbol('BRK')).toBe(true);
      expect(isValidStockSymbol('A')).toBe(true);
      expect(isValidStockSymbol('GOOGL')).toBe(true);
      
      expect(isValidStockSymbol('aapl')).toBe(false); // lowercase
      expect(isValidStockSymbol('TOOLONG')).toBe(false); // too long
      expect(isValidStockSymbol('123')).toBe(false); // numbers
      expect(isValidStockSymbol('BRK.B')).toBe(false); // contains dot
      expect(isValidStockSymbol('')).toBe(false); // empty
    });

    test('should validate Brazilian stock symbols', () => {
      const isValidBrazilianSymbol = (symbol: string): boolean => {
        // Brazilian stocks: 4 letters + 1-2 digits
        return /^[A-Z]{4}\d{1,2}$/.test(symbol);
      };

      expect(isValidBrazilianSymbol('PETR4')).toBe(true);
      expect(isValidBrazilianSymbol('VALE3')).toBe(true);
      expect(isValidBrazilianSymbol('ITUB4')).toBe(true);
      expect(isValidBrazilianSymbol('BBDC11')).toBe(true);
      
      expect(isValidBrazilianSymbol('AAPL')).toBe(false); // US format
      expect(isValidBrazilianSymbol('PETR')).toBe(false); // missing number
      expect(isValidBrazilianSymbol('PET4')).toBe(false); // too short
      expect(isValidBrazilianSymbol('PETR123')).toBe(false); // too many digits
    });

    test('should validate email addresses', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.org')).toBe(true);
      
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user name@domain.com')).toBe(false);
    });

    test('should validate phone numbers', () => {
      const isValidPhoneNumber = (phone: string): boolean => {
        // Simple US phone number validation
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
      };

      expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
      expect(isValidPhoneNumber('555-123-4567')).toBe(true);
      expect(isValidPhoneNumber('5551234567')).toBe(true);
      expect(isValidPhoneNumber('1-555-123-4567')).toBe(true);
      expect(isValidPhoneNumber('+1 555 123 4567')).toBe(true);
      
      expect(isValidPhoneNumber('123-4567')).toBe(false); // too short
      expect(isValidPhoneNumber('555-123-456')).toBe(false); // too short
      expect(isValidPhoneNumber('2-555-123-4567')).toBe(false); // invalid country code
    });

    test('should validate URLs', () => {
      const isValidUrl = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('http://api.example.com/v1/data')).toBe(true);
      expect(isValidUrl('https://subdomain.example.co.uk')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
      
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('www.example.com')).toBe(false); // missing protocol
    });
  });

  describe('String Parsing and Extraction', () => {
    test('should extract stock symbols from text', () => {
      const extractStockSymbols = (text: string): string[] => {
        const symbolRegex = /\b[A-Z]{1,5}\b/g;
        const matches = text.match(symbolRegex) || [];
        
        // Filter out common words that might match the pattern
        const commonWords = ['THE', 'AND', 'OR', 'BUT', 'FOR', 'NOR', 'SO', 'YET', 'A', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IN', 'IS', 'IT', 'MY', 'NO', 'OF', 'ON', 'TO', 'UP', 'WE'];
        
        return [...new Set(matches.filter(match => !commonWords.includes(match)))];
      };

      const text1 = 'I bought AAPL and MSFT stocks yesterday. GOOGL is also performing well.';
      const text2 = 'The market is UP today, but I think TSLA will go down.';
      const text3 = 'No symbols here, just regular text.';

      expect(extractStockSymbols(text1)).toEqual(['AAPL', 'MSFT', 'GOOGL']);
      expect(extractStockSymbols(text2)).toEqual(['TSLA']);
      expect(extractStockSymbols(text3)).toEqual([]);
    });

    test('should extract numbers from text', () => {
      const extractNumbers = (text: string): number[] => {
        const numberRegex = /-?\d+(?:\.\d+)?/g;
        const matches = text.match(numberRegex) || [];
        return matches.map(match => parseFloat(match));
      };

      expect(extractNumbers('Price is $150.25 with a change of +2.5%')).toEqual([150.25, 2.5]);
      expect(extractNumbers('Volume: 1,000,000 shares')).toEqual([1, 0, 0]);
      expect(extractNumbers('No numbers here')).toEqual([]);
      expect(extractNumbers('Negative -5.5 and positive 10.2')).toEqual([-5.5, 10.2]);
    });

    test('should extract currency amounts', () => {
      const extractCurrencyAmounts = (text: string): Array<{ amount: number; currency: string }> => {
        const currencyRegex = /([A-Z]{3}|\$|€|£|¥)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
        const results: Array<{ amount: number; currency: string }> = [];
        let match;

        while ((match = currencyRegex.exec(text)) !== null) {
          const currency = match[1];
          const amount = parseFloat(match[2].replace(/,/g, ''));
          results.push({ amount, currency });
        }

        return results;
      };

      const text = 'The stock costs $150.25, or €135.50, or £120.00. Market cap is USD 2,500,000,000.';
      const amounts = extractCurrencyAmounts(text);

      expect(amounts).toHaveLength(4);
      expect(amounts[0]).toEqual({ amount: 150.25, currency: '$' });
      expect(amounts[1]).toEqual({ amount: 135.50, currency: '€' });
      expect(amounts[2]).toEqual({ amount: 120.00, currency: '£' });
      expect(amounts[3]).toEqual({ amount: 2500000000, currency: 'USD' });
    });

    test('should parse CSV strings', () => {
      const parseCSV = (csvString: string): string[][] => {
        const lines = csvString.trim().split('\n');
        return lines.map(line => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          
          result.push(current.trim());
          return result;
        });
      };

      const csv = `Symbol,Price,Volume
AAPL,150.25,1000000
MSFT,"300.50",500000
"GOOGL, Inc",2800.00,250000`;

      const parsed = parseCSV(csv);

      expect(parsed).toHaveLength(4);
      expect(parsed[0]).toEqual(['Symbol', 'Price', 'Volume']);
      expect(parsed[1]).toEqual(['AAPL', '150.25', '1000000']);
      expect(parsed[2]).toEqual(['MSFT', '300.50', '500000']);
      expect(parsed[3]).toEqual(['GOOGL, Inc', '2800.00', '250000']);
    });
  });

  describe('String Sanitization and Security', () => {
    test('should sanitize HTML content', () => {
      const sanitizeHTML = (html: string): string => {
        return html
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      };

      const maliciousHTML = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      const sanitized = sanitizeHTML(maliciousHTML);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('&quot;XSS&quot;');
    });

    test('should sanitize SQL injection attempts', () => {
      const sanitizeSQL = (input: string): string => {
        return input
          .replace(/'/g, "''")
          .replace(/"/g, '""')
          .replace(/;/g, '')
          .replace(/--/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '')
          .replace(/\bDROP\b/gi, '')
          .replace(/\bDELETE\b/gi, '')
          .replace(/\bINSERT\b/gi, '')
          .replace(/\bUPDATE\b/gi, '');
      };

      const maliciousSQL = "'; DROP TABLE users; --";
      const sanitized = sanitizeSQL(maliciousSQL);

      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('--');
    });

    test('should remove sensitive information from logs', () => {
      const sanitizeLogMessage = (message: string): string => {
        return message
          .replace(/password\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'password: ***REDACTED***')
          .replace(/token\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'token: ***REDACTED***')
          .replace(/key\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'key: ***REDACTED***')
          .replace(/secret\s*[:=]\s*["']?[^"'\s]+["']?/gi, 'secret: ***REDACTED***')
          .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****'); // Credit card numbers
      };

      const logMessage = 'User login with password: secret123, token: abc123xyz, and credit card 1234-5678-9012-3456';
      const sanitized = sanitizeLogMessage(logMessage);

      expect(sanitized).toContain('password: ***REDACTED***');
      expect(sanitized).toContain('token: ***REDACTED***');
      expect(sanitized).toContain('****-****-****-****');
      expect(sanitized).not.toContain('secret123');
      expect(sanitized).not.toContain('abc123xyz');
      expect(sanitized).not.toContain('1234-5678-9012-3456');
    });

    test('should validate and sanitize file names', () => {
      const sanitizeFileName = (fileName: string): string => {
        return fileName
          .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
          .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
          .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
          .slice(0, 255); // Limit length
      };

      expect(sanitizeFileName('valid-file_name.txt')).toBe('valid-file_name.txt');
      expect(sanitizeFileName('file with spaces.txt')).toBe('filewithspaces.txt');
      expect(sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFileName('file...name.txt')).toBe('file.name.txt');
      expect(sanitizeFileName('.hidden-file')).toBe('hidden-file');
    });
  });

  describe('String Comparison and Similarity', () => {
    test('should calculate Levenshtein distance', () => {
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

      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('AAPL', 'APPL')).toBe(1);
      expect(levenshteinDistance('identical', 'identical')).toBe(0);
      expect(levenshteinDistance('', 'test')).toBe(4);
      expect(levenshteinDistance('test', '')).toBe(4);
    });

    test('should calculate string similarity percentage', () => {
      const calculateSimilarity = (str1: string, str2: string): number => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 100;
        
        const editDistance = levenshteinDistance(longer, shorter);
        return Math.round(((longer.length - editDistance) / longer.length) * 100);
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

      expect(calculateSimilarity('AAPL', 'AAPL')).toBe(100);
      expect(calculateSimilarity('AAPL', 'APPL')).toBe(75);
      expect(calculateSimilarity('MSFT', 'MSFX')).toBe(75);
      expect(calculateSimilarity('', '')).toBe(100);
    });

    test('should perform case-insensitive comparison', () => {
      const compareIgnoreCase = (str1: string, str2: string): boolean => {
        return str1.toLowerCase() === str2.toLowerCase();
      };

      expect(compareIgnoreCase('AAPL', 'aapl')).toBe(true);
      expect(compareIgnoreCase('Apple Inc', 'APPLE INC')).toBe(true);
      expect(compareIgnoreCase('Test', 'test')).toBe(true);
      expect(compareIgnoreCase('Different', 'Other')).toBe(false);
    });
  });

  describe('String Templates and Interpolation', () => {
    test('should replace template variables', () => {
      const interpolate = (template: string, variables: Record<string, any>): string => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return variables[key] !== undefined ? String(variables[key]) : match;
        });
      };

      const template = 'Stock {{symbol}} is trading at ${{price}} with {{volume}} shares traded.';
      const variables = { symbol: 'AAPL', price: 150.25, volume: 1000000 };
      
      const result = interpolate(template, variables);
      
      expect(result).toBe('Stock AAPL is trading at $150.25 with 1000000 shares traded.');
    });

    test('should format template strings with conditions', () => {
      const formatConditional = (
        template: string,
        data: Record<string, any>,
        conditions: Record<string, (value: any) => boolean>
      ): string => {
        let result = template;
        
        // Replace conditional blocks
        result = result.replace(/\{\{if (\w+)\}\}(.*?)\{\{\/if\}\}/g, (match, condition, content) => {
          const conditionFn = conditions[condition];
          const value = data[condition];
          return conditionFn && conditionFn(value) ? content : '';
        });
        
        // Replace variables
        result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return data[key] !== undefined ? String(data[key]) : match;
        });
        
        return result;
      };

      const template = '{{symbol}} {{if positive}}📈 +{{change}}%{{/if}}{{if negative}}📉 {{change}}%{{/if}}';
      const positiveData = { symbol: 'AAPL', change: 2.5, positive: true, negative: false };
      const negativeData = { symbol: 'TSLA', change: -1.8, positive: false, negative: true };
      
      const conditions = {
        positive: (value: any) => Boolean(value),
        negative: (value: any) => Boolean(value),
      };

      expect(formatConditional(template, positiveData, conditions)).toBe('AAPL 📈 +2.5%');
      expect(formatConditional(template, negativeData, conditions)).toBe('TSLA 📉 -1.8%');
    });
  });

  describe('String Encoding and Decoding', () => {
    test('should encode and decode base64', () => {
      const base64Encode = (str: string): string => {
        return Buffer.from(str, 'utf8').toString('base64');
      };

      const base64Decode = (encoded: string): string => {
        return Buffer.from(encoded, 'base64').toString('utf8');
      };

      const original = 'Hello, World! 🌍';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);

      expect(encoded).toBe('SGVsbG8sIFdvcmxkISDwn42N');
      expect(decoded).toBe(original);
    });

    test('should encode and decode URL components', () => {
      const urlEncode = (str: string): string => {
        return encodeURIComponent(str);
      };

      const urlDecode = (encoded: string): string => {
        return decodeURIComponent(encoded);
      };

      const original = 'symbol=AAPL&price=$150.25&change=+2.5%';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);

      expect(encoded).toBe('symbol%3DAAPL%26price%3D%24150.25%26change%3D%2B2.5%25');
      expect(decoded).toBe(original);
    });

    test('should escape and unescape JSON strings', () => {
      const escapeJSON = (str: string): string => {
        return str
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
      };

      const unescapeJSON = (str: string): string => {
        return str
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t');
      };

      const original = 'Line 1\nLine 2\tTabbed\r\nWith "quotes"';
      const escaped = escapeJSON(original);
      const unescaped = unescapeJSON(escaped);

      expect(escaped).toBe('Line 1\\nLine 2\\tTabbed\\r\\nWith \\"quotes\\"');
      expect(unescaped).toBe(original);
    });
  });
}); 