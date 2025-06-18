import { CacheService } from "@/lib/utils/cache-service";

describe("CacheService Tests", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      maxSize: 5,
      defaultTTL: 1000,
      cleanupInterval: 500,
      enableStats: true,
    });
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe("Basic Operations", () => {
    test("should set and get cache items", () => {
      const testData = { message: "Hello World" };
      cacheService.set("test-key", testData);
      const retrieved = cacheService.get("test-key");
      expect(retrieved).toEqual(testData);
    });

    test("should return null for non-existent keys", () => {
      const result = cacheService.get("non-existent");
      expect(result).toBeNull();
    });

    test("should check if key exists", () => {
      cacheService.set("exists", "value");
      expect(cacheService.has("exists")).toBe(true);
      expect(cacheService.has("not-exists")).toBe(false);
    });

    test("should delete cache items", () => {
      cacheService.set("to-delete", "value");
      expect(cacheService.has("to-delete")).toBe(true);
      const deleted = cacheService.delete("to-delete");
      expect(deleted).toBe(true);
      expect(cacheService.has("to-delete")).toBe(false);
    });

    test("should clear all cache items", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");
      cacheService.clear();
      expect(cacheService.get("key1")).toBeNull();
      expect(cacheService.get("key2")).toBeNull();
    });
  });

  describe("TTL and Expiration", () => {
    test("should respect custom TTL", async () => {
      cacheService.set("short-lived", "value", 100);
      expect(cacheService.get("short-lived")).toBe("value");
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cacheService.get("short-lived")).toBeNull();
    });

    test("should identify expired items", async () => {
      cacheService.set("expired", "value", 50);
      await new Promise(resolve => setTimeout(resolve, 100));
      const expiredItems = cacheService.getExpiredItems();
      expect(expiredItems).toContain("expired");
    });
  });

  describe("getOrSet Method", () => {
    test("should return cached value if exists", async () => {
      cacheService.set("cached", "existing-value");
      const fetcher = jest.fn().mockResolvedValue("new-value");
      const result = await cacheService.getOrSet("cached", fetcher);
      expect(result).toBe("existing-value");
      expect(fetcher).not.toHaveBeenCalled();
    });

    test("should fetch and cache new value if not exists", async () => {
      const fetcher = jest.fn().mockResolvedValue("fetched-value");
      const result = await cacheService.getOrSet("new-key", fetcher);
      expect(result).toBe("fetched-value");
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(cacheService.get("new-key")).toBe("fetched-value");
    });
  });

  describe("Cache Statistics", () => {
    test("should track hit and miss statistics", () => {
      cacheService.set("hit-key", "value");
      cacheService.get("hit-key");
      cacheService.get("hit-key");
      cacheService.get("miss-key1");
      cacheService.get("miss-key2");
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    test("should track cache size", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");
      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
    });

    test("should track memory usage", () => {
      cacheService.set("memory-test", { data: "test-data" });
      const stats = cacheService.getStats();
      expect(stats.totalMemory).toBeGreaterThan(0);
    });
  });

  describe("Data Types", () => {
    test("should handle different data types", () => {
      const testCases = [
        { key: "string", value: "test string" },
        { key: "number", value: 42 },
        { key: "boolean", value: true },
        { key: "array", value: [1, 2, 3] },
        { key: "object", value: { nested: { data: "value" } } },
        { key: "null", value: null },
      ];
      testCases.forEach(({ key, value }) => {
        cacheService.set(key, value);
        expect(cacheService.get(key)).toEqual(value);
      });
    });
  });

  describe("Configuration", () => {
    test("should respect disabled stats configuration", () => {
      const noStatsCache = new CacheService({ enableStats: false });
      noStatsCache.set("test", "value");
      noStatsCache.get("test");
      noStatsCache.get("missing");
      const stats = noStatsCache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});