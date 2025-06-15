/**
 * @jest-environment jsdom
 */

// Integration test for EnhancedOplabService
describe('EnhancedOplabService Integration', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  it('should be able to import the module', async () => {
    const { EnhancedOplabService } = await import('../oplab-enhanced');
    expect(EnhancedOplabService).toBeDefined();
  });

  it('should be able to create an instance', async () => {
    const { EnhancedOplabService } = await import('../oplab-enhanced');

    const config = {
      accessToken: 'test-token',
      baseUrl: 'https://api.test.com',
    };

    const service = new EnhancedOplabService(config);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(EnhancedOplabService);
  });

  it('should have cache management methods', async () => {
    const { EnhancedOplabService } = await import('../oplab-enhanced');

    const config = {
      accessToken: 'test-token',
      baseUrl: 'https://api.test.com',
    };

    const service = new EnhancedOplabService(config);

    expect(typeof service.clearCache).toBe('function');
    expect(typeof service.getCacheStats).toBe('function');
  });

  it('should have enhanced methods', async () => {
    const { EnhancedOplabService } = await import('../oplab-enhanced');

    const config = {
      accessToken: 'test-token',
      baseUrl: 'https://api.test.com',
    };

    const service = new EnhancedOplabService(config);

    expect(typeof service.getStocksEnhanced).toBe('function');
    expect(typeof service.getStockEnhanced).toBe('function');
    expect(typeof service.getMarketStatusEnhanced).toBe('function');
    expect(typeof service.getPortfoliosEnhanced).toBe('function');
    expect(typeof service.getMultipleStocks).toBe('function');
    expect(typeof service.healthCheckEnhanced).toBe('function');
  });

  it('should have error handling methods', async () => {
    const { EnhancedOplabService } = await import('../oplab-enhanced');

    const config = {
      accessToken: 'test-token',
      baseUrl: 'https://api.test.com',
    };

    const service = new EnhancedOplabService(config);

    expect(typeof service.getErrorLogs).toBe('function');
    expect(typeof service.clearErrorLogs).toBe('function');
  });

  it('should manage cache correctly', async () => {
    const { EnhancedOplabService } = await import('../oplab-enhanced');

    const config = {
      accessToken: 'test-token',
      baseUrl: 'https://api.test.com',
    };

    const service = new EnhancedOplabService(config);

    // Initially cache should be empty
    const initialStats = service.getCacheStats();
    expect(initialStats.size).toBe(0);
    expect(initialStats.keys).toEqual([]);

    // After clearing, should still be empty
    service.clearCache();
    const finalStats = service.getCacheStats();
    expect(finalStats.size).toBe(0);
    expect(finalStats.keys).toEqual([]);
  });

  it('should handle error logs', () => {
    const mockErrors = [{ message: 'Error 1' }, { message: 'Error 2' }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockErrors));

    // Test with dynamic import to avoid inheritance issues
    return import('../oplab-enhanced').then(({ EnhancedOplabService }) => {
      const config = {
        accessToken: 'test-token',
        baseUrl: 'https://api.test.com',
      };

      const service = new EnhancedOplabService(config);

      const errors = service.getErrorLogs();
      expect(errors).toEqual(mockErrors);

      // Test clearing logs
      service.clearErrorLogs();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('oplab_errors');
    });
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    return import('../oplab-enhanced').then(({ EnhancedOplabService }) => {
      const config = {
        accessToken: 'test-token',
        baseUrl: 'https://api.test.com',
      };

      const service = new EnhancedOplabService(config);

      const errors = service.getErrorLogs();
      expect(errors).toEqual([]);
    });
  });
});
