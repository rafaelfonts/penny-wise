import { describe, test, expect } from '@jest/globals';
import {
  capitalize,
  toTitleCase,
  camelToKebab,
  kebabToCamel,
  truncateText,
  isValidStockSymbol,
  isValidBrazilianSymbol,
  isValidEmail,
  isValidPhoneNumber,
  isValidUrl,
  extractStockSymbols,
  extractNumbers,
  extractCurrencyAmount,
  parseCSV,
  sanitizeHtml,
  preventSqlInjection,
  sanitizeForLog,
  sanitizeFileName,
  levenshteinDistance,
  calculateSimilarity,
  interpolateTemplate,
  conditionalFormat,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  escapeJsonString
} from '../../../src/lib/utils/string-utilities';

describe('String Utilities Tests', () => {
  describe('Text Formatting', () => {
    test('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('')).toBe('');
      expect(capitalize('a')).toBe('A');
    });

    test('should convert strings to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
      expect(toTitleCase('APPLE INC')).toBe('Apple Inc');
      expect(toTitleCase('new-york-stock-exchange')).toBe('New-York-Stock-Exchange');
    });

    test('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('camelCase')).toBe('camel-case');
      expect(camelToKebab('marketDataService')).toBe('market-data-service');
      expect(camelToKebab('XMLHttpRequest')).toBe('xml-http-request');
      expect(camelToKebab('iPhone')).toBe('i-phone');
    });

    test('should convert kebab-case to camelCase', () => {
      expect(kebabToCamel('kebab-case')).toBe('kebabCase');
      expect(kebabToCamel('market-data-service')).toBe('marketDataService');
      expect(kebabToCamel('stock-symbol')).toBe('stockSymbol');
      expect(kebabToCamel('single')).toBe('single');
    });

    test('should truncate long strings with ellipsis', () => {
      expect(truncateText('This is a very long string', 10)).toBe('This is...');
      expect(truncateText('Short', 10)).toBe('Short');
      expect(truncateText('Exactly ten', 11)).toBe('Exactly ten');
      expect(truncateText('Too long text', 8, '…')).toBe('Too lon…');
    });
  });

  describe('String Validation', () => {
    test('should validate stock symbols', () => {
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
      expect(isValidPhoneNumber('(11) 99999-9999')).toBe(true);
      expect(isValidPhoneNumber('11999999999')).toBe(true);
      expect(isValidPhoneNumber('1199999999')).toBe(true);
      
      expect(isValidPhoneNumber('123-4567')).toBe(false); // too short
      expect(isValidPhoneNumber('555-123-456')).toBe(false); // too short
      expect(isValidPhoneNumber('123456789012')).toBe(false); // too long
    });

    test('should validate URLs', () => {
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
      const text1 = 'I bought AAPL and MSFT stocks yesterday. GOOGL is also performing well.';
      const text2 = 'The market is UP today, but I think TSLA will go down.';
      const text3 = 'No symbols here, just regular text.';

      expect(extractStockSymbols(text1)).toEqual(['AAPL', 'MSFT', 'GOOGL']);
      expect(extractStockSymbols(text2)).toEqual(['UP', 'TSLA']);
      expect(extractStockSymbols(text3)).toEqual([]);
    });

    test('should extract numbers from text', () => {
      expect(extractNumbers('Price is $150.25 with a change of +2.5%')).toEqual([150.25, 2.5]);
      expect(extractNumbers('Volume: 1,000,000 shares')).toEqual([1, 0, 0]);
      expect(extractNumbers('No numbers here')).toEqual([]);
      expect(extractNumbers('Negative -5.5 and positive 10.2')).toEqual([-5.5, 10.2]);
    });

    test('should extract currency amounts', () => {
      const text = 'The stock costs $150.25';
      const amount = extractCurrencyAmount(text);
      expect(amount).toBe(150.25);
      
      expect(extractCurrencyAmount('R$ 1.234,56')).toBe(1234.56);
      expect(extractCurrencyAmount('No currency here')).toBe(null);
    });

    test('should parse CSV strings', () => {
      const csvString = 'Name,Age,City\nJohn,30,New York\nJane,25,"Los Angeles"';
      const parsed = parseCSV(csvString);

      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual(['Name', 'Age', 'City']);
      expect(parsed[1]).toEqual(['John', '30', 'New York']);
      expect(parsed[2]).toEqual(['Jane', '25', 'Los Angeles']);
    });
  });

  describe('String Sanitization and Security', () => {
    test('should sanitize HTML content', () => {
      const maliciousHtml = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&quot;alert(1)&quot;');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('&quot;XSS&quot;');
    });

    test('should prevent SQL injection', () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const sanitized = preventSqlInjection(maliciousInput);

      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('--');
      expect(sanitized).toContain("''");
    });

    test('should sanitize log messages', () => {
      const logMessage = 'User input\nwith\nnewlines\tand\ttabs';
      const sanitized = sanitizeForLog(logMessage);

      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('\t');
      expect(sanitized).toBe('User input with newlines and tabs');
    });

    test('should sanitize file names', () => {
      const unsafeName = 'my*file|name<with>invalid:chars?.txt';
      const sanitized = sanitizeFileName(unsafeName);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('|');
      expect(sanitized).not.toContain(':');
      expect(sanitized).not.toContain('*');
      expect(sanitized).not.toContain('?');
      expect(sanitized).toBe('myfilenamewithinvalidchars.txt');
    });
  });

  describe('String Comparison and Similarity', () => {
    test('should calculate Levenshtein distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
      expect(levenshteinDistance('', 'abc')).toBe(3);
      expect(levenshteinDistance('abc', '')).toBe(3);
    });

    test('should calculate string similarity', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1);
      expect(calculateSimilarity('hello', 'world')).toBeLessThan(0.5);
      expect(calculateSimilarity('AAPL', 'APPL')).toBeGreaterThan(0.7);
    });
  });

  describe('String Templating and Formatting', () => {
    test('should interpolate template strings', () => {
      const template = 'Hello {{name}}, your balance is {{balance}}';
      const variables = { name: 'John', balance: '$1,000' };
      const result = interpolateTemplate(template, variables);

      expect(result).toBe('Hello John, your balance is $1,000');
    });

    test('should format conditional strings', () => {
      expect(conditionalFormat(true, 'Success', 'Error')).toBe('Success');
      expect(conditionalFormat(false, 'Success', 'Error')).toBe('Error');
    });
  });

  describe('String Encoding and Decoding', () => {
    test('should encode and decode base64', () => {
      const original = 'Hello, World! 🌍';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);

      expect(encoded).toBe('SGVsbG8sIFdvcmxkISDwn4yN');
      expect(decoded).toBe(original);
    });

    test('should encode and decode URLs', () => {
      const original = 'Hello World & Special Chars!';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);

      expect(encoded).toContain('%20'); // Space encoded
      expect(encoded).toContain('%26'); // & encoded
      expect(decoded).toBe(original);
    });

    test('should escape JSON strings', () => {
      const jsonString = 'Hello "World" with \n newlines and \\ backslashes';
      const escaped = escapeJsonString(jsonString);

      expect(escaped).toContain('\\"');
      expect(escaped).toContain('\\n');
      expect(escaped).toContain('\\\\');
    });
  });
}); 