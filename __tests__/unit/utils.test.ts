/**
 * PENNY WISE - UTILITY FUNCTIONS TESTS
 * Testing utility functions and data processing
 */

describe('Utility Functions Tests', () => {
  describe('Date Formatting', () => {
    test('should format dates correctly', () => {
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
      };

      const testDate = '2024-01-15T10:30:00Z';
      const formatted = formatDate(testDate);

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    test('should handle invalid dates', () => {
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return isNaN(date.getTime())
          ? 'Invalid Date'
          : date.toLocaleDateString('pt-BR');
      };

      expect(formatDate('invalid-date')).toBe('Invalid Date');
      expect(formatDate('')).toBe('Invalid Date');
    });
  });

  describe('Currency Formatting', () => {
    test('should format currency correctly', () => {
      const formatCurrency = (amount: number, currency = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: currency,
        }).format(amount);
      };

      expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(-100)).toMatch(/-?R\$\s*100,00/);
    });

    test('should handle different currencies', () => {
      const formatCurrency = (amount: number, currency = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: currency,
        }).format(amount);
      };

      expect(formatCurrency(100, 'USD')).toMatch(/US\$\s*100,00/);
      expect(formatCurrency(100, 'EUR')).toMatch(/€\s*100,00/);
    });
  });

  describe('Email Validation', () => {
    test('should validate email addresses', () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('Text Processing', () => {
    test('should truncate long text', () => {
      const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
      };

      const longText = 'This is a very long text that should be truncated';

      expect(truncateText(longText, 20)).toBe('This is a very long ...');
      expect(truncateText('Short text', 20)).toBe('Short text');
      expect(truncateText('', 10)).toBe('');
    });

    test('should sanitize HTML content', () => {
      const sanitizeHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '');
      };

      expect(sanitizeHtml('<script>alert("xss")</script>Hello')).toBe(
        'alert("xss")Hello'
      );
      expect(sanitizeHtml('<p>Paragraph</p>')).toBe('Paragraph');
      expect(sanitizeHtml('Plain text')).toBe('Plain text');
    });
  });

  describe('ID Generation', () => {
    test('should generate unique IDs', () => {
      const generateId = () => {
        return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      };

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toMatch(/^id-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^id-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should generate UUIDs', () => {
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });
  });

  describe('Data Processing', () => {
    test('should sort notifications by priority', () => {
      const notifications = [
        { id: '1', priority: 'low', createdAt: '2024-01-01' },
        { id: '2', priority: 'high', createdAt: '2024-01-02' },
        { id: '3', priority: 'medium', createdAt: '2024-01-03' },
        { id: '4', priority: 'critical', createdAt: '2024-01-04' },
      ];

      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

      const sortByPriority = (items: typeof notifications) => {
        return items.sort(
          (a, b) =>
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
        );
      };

      const sorted = sortByPriority([...notifications]);

      expect(sorted[0].priority).toBe('critical');
      expect(sorted[1].priority).toBe('high');
      expect(sorted[2].priority).toBe('medium');
      expect(sorted[3].priority).toBe('low');
    });

    test('should filter notifications by type', () => {
      const notifications = [
        { id: '1', type: 'system', message: 'System update' },
        { id: '2', type: 'alert', message: 'Price alert' },
        { id: '3', type: 'info', message: 'Information' },
        { id: '4', type: 'alert', message: 'Another alert' },
      ];

      const filterByType = (items: typeof notifications, type: string) => {
        return items.filter(item => item.type === type);
      };

      const alerts = filterByType(notifications, 'alert');
      const systemNotifs = filterByType(notifications, 'system');

      expect(alerts).toHaveLength(2);
      expect(systemNotifs).toHaveLength(1);
      expect(alerts.every(item => item.type === 'alert')).toBe(true);
    });

    test('should group notifications by date', () => {
      const notifications = [
        { id: '1', createdAt: '2024-01-15T10:00:00Z', message: 'Message 1' },
        { id: '2', createdAt: '2024-01-15T14:00:00Z', message: 'Message 2' },
        { id: '3', createdAt: '2024-01-16T09:00:00Z', message: 'Message 3' },
      ];

      const groupByDate = (items: typeof notifications) => {
        return items.reduce(
          (groups, item) => {
            const date = new Date(item.createdAt).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
            return groups;
          },
          {} as Record<string, typeof notifications>
        );
      };

      const grouped = groupByDate(notifications);
      const dates = Object.keys(grouped);

      expect(dates).toHaveLength(2);
      expect(grouped[dates[0]]).toHaveLength(2); // 2024-01-15
      expect(grouped[dates[1]]).toHaveLength(1); // 2024-01-16
    });
  });

  describe('Validation Functions', () => {
    test('should validate component props', () => {
      interface NotificationProps {
        id: string;
        title: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
      }

      const validateProps = (props: Partial<NotificationProps>) => {
        const errors: string[] = [];

        if (!props.id || typeof props.id !== 'string') {
          errors.push('ID is required and must be a string');
        }

        if (!props.title || typeof props.title !== 'string') {
          errors.push('Title is required and must be a string');
        }

        if (
          props.priority &&
          !['low', 'medium', 'high', 'critical'].includes(props.priority)
        ) {
          errors.push('Priority must be one of: low, medium, high, critical');
        }

        return errors;
      };

      const validProps = {
        id: 'test-1',
        title: 'Test Title',
        priority: 'high' as const,
      };
      const invalidProps = {
        id: undefined,
        title: '',
        priority: 'invalid' as 'low',
      };

      expect(validateProps(validProps)).toHaveLength(0);
      expect(validateProps(invalidProps)).toHaveLength(3);
    });

    test('should validate URL formats', () => {
      const validateUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
      expect(validateUrl('ftp://files.example.com')).toBe(true);
      expect(validateUrl('invalid-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('Performance Utilities', () => {
    test('should debounce function calls', done => {
      const debounce = <T extends unknown[]>(
        func: (...args: T) => void,
        delay: number
      ) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: T) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      };

      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Should be called once after delay
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call3');
        done();
      }, 150);
    });

    test('should throttle function calls', done => {
      const throttle = <T extends unknown[]>(
        func: (...args: T) => void,
        delay: number
      ) => {
        let lastCall = 0;
        return (...args: T) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
          }
        };
      };

      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      // Call multiple times rapidly
      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      // Should be called immediately for first call
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      setTimeout(() => {
        throttledFn('call4');
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenCalledWith('call4');
        done();
      }, 150);
    });
  });
});
