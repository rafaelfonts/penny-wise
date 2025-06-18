/**
 * PENNY WISE - API ENDPOINTS INTEGRATION TESTS
 * Testing API endpoints integration and data flow
 */

import { jest } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('API Endpoints Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Market Data API Integration', () => {
    test('should fetch and process market data', async () => {
      const mockMarketData = {
        symbol: 'PETR4',
        price: 32.45,
        change: 0.85,
        changePercent: 2.69,
        volume: 15420000,
        timestamp: '2024-01-15T18:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockMarketData })
      } as Response);

      const fetchMarketData = async (symbol: string) => {
        const response = await fetch(`/api/market/quote?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        return result.data;
      };

      const data = await fetchMarketData('PETR4');

      expect(mockFetch).toHaveBeenCalledWith('/api/market/quote?symbol=PETR4');
      expect(data).toEqual(mockMarketData);
      expect(data.symbol).toBe('PETR4');
      expect(data.price).toBe(32.45);
    });

    test('should handle market data API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const fetchMarketData = async (symbol: string) => {
        const response = await fetch(`/api/market/quote?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      };

      await expect(fetchMarketData('INVALID')).rejects.toThrow('HTTP 500');
    });

    test('should validate symbol parameter', async () => {
      const validateSymbol = (symbol: string): boolean => {
        if (!symbol || typeof symbol !== 'string') return false;
        const trimmed = symbol.trim().toUpperCase();
        
        // Brazilian stocks: 4 letters + 1-2 digits
        const brazilianPattern = /^[A-Z]{4}\d{1,2}$/;
        // US stocks: 1-5 letters
        const usPattern = /^[A-Z]{1,5}$/;
        
        return brazilianPattern.test(trimmed) || usPattern.test(trimmed);
      };

      expect(validateSymbol('PETR4')).toBe(true);
      expect(validateSymbol('VALE3')).toBe(true);
      expect(validateSymbol('AAPL')).toBe(true);
      expect(validateSymbol('GOOGL')).toBe(true);
      expect(validateSymbol('')).toBe(false);
      expect(validateSymbol('123')).toBe(false);
      expect(validateSymbol('INVALID123')).toBe(false);
    });
  });

  describe('Notifications API Integration', () => {
    test('should create and retrieve notifications', async () => {
      const mockNotification = {
        id: 'notif_123',
        title: 'Price Alert',
        message: 'PETR4 reached target price',
        type: 'info',
        priority: 'high',
        userId: 'user_123',
        read: false,
        createdAt: '2024-01-15T15:00:00Z'
      };

      // Mock POST request for creating notification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockNotification })
      } as Response);

      // Mock GET request for retrieving notifications
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [mockNotification] })
      } as Response);

      const createNotification = async (notificationData: {
        title: string;
        message: string;
        type: string;
        priority: string;
        userId: string;
      }) => {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationData)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result.data;
      };

      const getNotifications = async (userId: string) => {
        const response = await fetch(`/api/notifications?userId=${userId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result.data;
      };

      // Test creating notification
      const created = await createNotification({
        title: 'Price Alert',
        message: 'PETR4 reached target price',
        type: 'info',
        priority: 'high',
        userId: 'user_123'
      });

      expect(created).toEqual(mockNotification);

      // Test retrieving notifications
      const notifications = await getNotifications('user_123');
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toEqual(mockNotification);
    });

    test('should mark notification as read', async () => {
      const updatedNotification = {
        id: 'notif_123',
        read: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: updatedNotification })
      } as Response);

      const markAsRead = async (notificationId: string) => {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result.data;
      };

      const result = await markAsRead('notif_123');
      expect(result.read).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications/notif_123',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true })
        })
      );
    });
  });

  describe('Alerts API Integration', () => {
    test('should create and manage price alerts', async () => {
      const mockAlert = {
        id: 'alert_123',
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00,
        isActive: true,
        createdAt: '2024-01-15T15:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockAlert })
      } as Response);

      const createAlert = async (alertData: {
        userId: string;
        symbol: string;
        condition: string;
        targetPrice: number;
      }) => {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result.data;
      };

      const alert = await createAlert({
        userId: 'user_123',
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00
      });

      expect(alert).toEqual(mockAlert);
      expect(alert.symbol).toBe('PETR4');
      expect(alert.targetPrice).toBe(35.00);
      expect(alert.isActive).toBe(true);
    });

    test('should validate alert data', () => {
      const validateAlertData = (data: Record<string, unknown>): string[] => {
        const errors: string[] = [];

        if (!data.symbol || typeof data.symbol !== 'string') {
          errors.push('Symbol is required');
        }

        if (!data.condition || !['above', 'below', 'equals'].includes(data.condition as string)) {
          errors.push('Valid condition is required');
        }

        if (!data.targetPrice || typeof data.targetPrice !== 'number' || data.targetPrice <= 0) {
          errors.push('Target price must be positive');
        }

        if (!data.userId || typeof data.userId !== 'string') {
          errors.push('User ID is required');
        }

        return errors;
      };

      const validData = {
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00,
        userId: 'user_123'
      };

      const invalidData = {
        symbol: '',
        condition: 'invalid',
        targetPrice: -10,
        userId: null
      };

      expect(validateAlertData(validData)).toHaveLength(0);
      expect(validateAlertData(invalidData)).toHaveLength(4);
    });
  });

  describe('Chat API Integration', () => {
    test('should process chat messages', async () => {
      const mockChatResponse = {
        id: 'msg_123',
        message: 'Qual é o preço da PETR4?',
        response: 'O preço atual da PETR4 é R$ 32,45 (+2,69%)',
        timestamp: '2024-01-15T15:00:00Z',
        processingTime: 1250
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockChatResponse })
      } as Response);

      const sendChatMessage = async (message: string, userId: string) => {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, userId })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result.data;
      };

      const result = await sendChatMessage('Qual é o preço da PETR4?', 'user_123');

      expect(result).toEqual(mockChatResponse);
      expect(result.response).toContain('PETR4');
      expect(result.response).toContain('R$ 32,45');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle chat command validation', () => {
      const validateChatMessage = (message: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!message || typeof message !== 'string') {
          errors.push('Message is required');
          return { isValid: false, errors };
        }

        const trimmed = message.trim();
        
        if (trimmed.length === 0) {
          errors.push('Message cannot be empty');
        }

        if (trimmed.length > 1000) {
          errors.push('Message too long (max 1000 characters)');
        }

        // Check for potentially harmful content
        const harmfulPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i
        ];

        for (const pattern of harmfulPatterns) {
          if (pattern.test(trimmed)) {
            errors.push('Message contains potentially harmful content');
            break;
          }
        }

        return { isValid: errors.length === 0, errors };
      };

      expect(validateChatMessage('Qual é o preço da PETR4?')).toEqual({
        isValid: true,
        errors: []
      });

      expect(validateChatMessage('')).toEqual({
        isValid: false,
        errors: ['Message is required']
      });

      expect(validateChatMessage('<script>alert("xss")</script>')).toEqual({
        isValid: false,
        errors: ['Message contains potentially harmful content']
      });

      const longMessage = 'a'.repeat(1001);
      expect(validateChatMessage(longMessage)).toEqual({
        isValid: false,
        errors: ['Message too long (max 1000 characters)']
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const apiCall = async (endpoint: string) => {
        try {
          const response = await fetch(endpoint);
          return await response.json();
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      };

      const result = await apiCall('/api/market/quote?symbol=PETR4');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'Retry-After': '60'
        })
      } as Response);

      const apiCallWithRetry = async (endpoint: string, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(endpoint);
            
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * attempt;
              
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
              
              throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
            }
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
          } catch (error) {
            if (attempt === maxRetries) throw error;
          }
        }
      };

      await expect(apiCallWithRetry('/api/market/quote?symbol=PETR4', 1))
        .rejects.toThrow('Rate limited');
    });

    test('should validate API responses', () => {
      const validateApiResponse = (response: unknown): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!response || typeof response !== 'object') {
          errors.push('Response must be an object');
          return { isValid: false, errors };
        }

        const resp = response as Record<string, unknown>;

        if (!('success' in resp) || typeof resp.success !== 'boolean') {
          errors.push('Response must have a boolean success field');
        }

        if (resp.success) {
          if (!('data' in resp)) {
            errors.push('Successful response must have data field');
          }
        } else {
          if (!('error' in resp) || typeof resp.error !== 'string') {
            errors.push('Error response must have error message');
          }
        }

        return { isValid: errors.length === 0, errors };
      };

      const validSuccessResponse = { success: true, data: { symbol: 'PETR4' } };
      const validErrorResponse = { success: false, error: 'Symbol not found' };
      const invalidResponse1 = { success: 'true' }; // Wrong type
      const invalidResponse2 = { success: true }; // Missing data
      const invalidResponse3 = { success: false }; // Missing error

      expect(validateApiResponse(validSuccessResponse)).toEqual({
        isValid: true,
        errors: []
      });

      expect(validateApiResponse(validErrorResponse)).toEqual({
        isValid: true,
        errors: []
      });

      expect(validateApiResponse(invalidResponse1).isValid).toBe(false);
      expect(validateApiResponse(invalidResponse2).isValid).toBe(false);
      expect(validateApiResponse(invalidResponse3).isValid).toBe(false);
    });
  });

  describe('Data Flow Integration', () => {
    test('should handle complete market data flow', async () => {
      // Mock sequence: fetch quote -> create alert -> trigger notification
      const mockQuote = {
        symbol: 'PETR4',
        price: 36.00,
        change: 1.55,
        changePercent: 4.50
      };

      const mockAlert = {
        id: 'alert_123',
        symbol: 'PETR4',
        condition: 'above',
        targetPrice: 35.00,
        isActive: true
      };

      const mockNotification = {
        id: 'notif_123',
        title: 'Price Alert Triggered',
        message: 'PETR4 reached R$ 36.00 (target: R$ 35.00)',
        type: 'info'
      };

      // Mock the sequence of API calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockQuote })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockAlert })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockNotification })
        } as Response);

      const processMarketDataFlow = async (symbol: string, userId: string) => {
        // 1. Fetch current quote
        const quoteResponse = await fetch(`/api/market/quote?symbol=${symbol}`);
        const quote = (await quoteResponse.json()).data;

        // 2. Check if any alerts should trigger
        const alertsResponse = await fetch(`/api/alerts?userId=${userId}&symbol=${symbol}`);
        const alerts = (await alertsResponse.json()).data;

        // 3. If alert triggers, create notification
        const alertsArray = Array.isArray(alerts) ? alerts : [alerts];
        const triggeredAlerts = alertsArray.filter((alert: typeof mockAlert) => {
          if (!alert.isActive) return false;
          
          switch (alert.condition) {
            case 'above':
              return quote.price > alert.targetPrice;
            case 'below':
              return quote.price < alert.targetPrice;
            case 'equals':
              return Math.abs(quote.price - alert.targetPrice) < 0.01;
            default:
              return false;
          }
        });

        if (triggeredAlerts.length > 0) {
          const notificationResponse = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Price Alert Triggered',
              message: `${symbol} reached R$ ${quote.price.toFixed(2)} (target: R$ ${triggeredAlerts[0].targetPrice.toFixed(2)})`,
              type: 'info',
              userId
            })
          });
          
          const notification = (await notificationResponse.json()).data;
          return { quote, triggeredAlerts, notification };
        }

        return { quote, triggeredAlerts: [], notification: null };
      };

      const result = await processMarketDataFlow('PETR4', 'user_123');

      expect(result.quote).toEqual(mockQuote);
      expect(result.triggeredAlerts).toHaveLength(1);
      expect(result.notification).toEqual(mockNotification);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
}); 