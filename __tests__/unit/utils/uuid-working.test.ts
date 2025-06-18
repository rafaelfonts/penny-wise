import { generateUUID, generateShortId } from "@/lib/utils/uuid";

describe("UUID Utility Tests", () => {
  describe("generateUUID", () => {
    test("should generate valid UUID format", () => {
      const uuid = generateUUID();
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(uuid).toMatch(uuidRegex);
      expect(typeof uuid).toBe("string");
      expect(uuid.length).toBe(36);
    });

    test("should generate unique UUIDs", () => {
      const uuids = new Set();
      const count = 100;
      
      for (let i = 0; i < count; i++) {
        uuids.add(generateUUID());
      }
      
      expect(uuids.size).toBe(count);
    });

    test("should have correct UUID structure", () => {
      const uuid = generateUUID();
      const parts = uuid.split("-");
      
      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);
    });

    test("should generate UUID v4", () => {
      const uuid = generateUUID();
      const parts = uuid.split("-");
      
      expect(parts[2][0]).toBe("4");
      expect(["8", "9", "a", "b"]).toContain(parts[3][0].toLowerCase());
    });

    test("should only contain valid hexadecimal characters", () => {
      const uuid = generateUUID();
      const cleanUuid = uuid.replace(/-/g, "");
      
      expect(cleanUuid).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe("generateShortId", () => {
    test("should generate short ID with variable length", () => {
      const shortId = generateShortId();
      
      expect(typeof shortId).toBe("string");
      expect(shortId.length).toBeGreaterThanOrEqual(9);
      expect(shortId.length).toBeLessThanOrEqual(13);
    });

    test("should generate unique short IDs", () => {
      const shortIds = new Set();
      const count = 100;
      
      for (let i = 0; i < count; i++) {
        shortIds.add(generateShortId());
      }
      
      expect(shortIds.size).toBeGreaterThan(count * 0.95);
    });

    test("should only contain alphanumeric characters", () => {
      const shortId = generateShortId();
      
      expect(shortId).toMatch(/^[0-9a-z]+$/);
    });

    test("should not contain special characters", () => {
      const shortId = generateShortId();
      
      expect(shortId).not.toMatch(/[^0-9a-z]/);
      expect(shortId).not.toContain("-");
      expect(shortId).not.toContain("_");
      expect(shortId).not.toContain(".");
    });

    test("should be shorter than UUID", () => {
      const uuid = generateUUID();
      const shortId = generateShortId();
      
      expect(shortId.length).toBeLessThan(uuid.length);
    });

    test("should work consistently across multiple calls", () => {
      const shortIds = [];
      
      for (let i = 0; i < 10; i++) {
        shortIds.push(generateShortId());
      }
      
      shortIds.forEach(shortId => {
        expect(shortId).toMatch(/^[0-9a-z]+$/);
        expect(shortId.length).toBeGreaterThanOrEqual(9);
        expect(shortId.length).toBeLessThanOrEqual(13);
      });
      
      const uniqueShortIds = new Set(shortIds);
      expect(uniqueShortIds.size).toBeGreaterThan(8);
    });
  });

  describe("Performance Tests", () => {
    test("should generate UUIDs quickly", () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        generateUUID();
      }
      
      const end = Date.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });

    test("should generate short IDs quickly", () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        generateShortId();
      }
      
      const end = Date.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Format Validation", () => {
    test("UUID should be safe for database storage", () => {
      const uuid = generateUUID();
      
      expect(uuid).not.toContain(";");
      expect(uuid).not.toContain(" ");
    });

    test("short ID should be URL-safe", () => {
      const shortId = generateShortId();
      
      expect(shortId).not.toContain("/");
      expect(shortId).not.toContain("?");
      expect(shortId).not.toContain("&");
      expect(shortId).not.toContain("=");
      expect(shortId).not.toContain(" ");
    });

    test("should be compatible with JSON serialization", () => {
      const uuid = generateUUID();
      const shortId = generateShortId();
      
      const data = { uuid, shortId };
      const jsonString = JSON.stringify(data);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.uuid).toBe(uuid);
      expect(parsed.shortId).toBe(shortId);
    });
  });
});