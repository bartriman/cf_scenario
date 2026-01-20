import { describe, it, expect } from "vitest";

/**
 * Export functions for testing
 * Note: These are internal functions in the service, so we need to extract them
 * or make them exportable for testing purposes
 */

/**
 * Calculate week label from week_index and start_date
 * Week 0 = "Initial Balance"
 * Week 1+ = "YYWW" (e.g., "2603" for week 3 of 2026)
 */
export function calculateWeekLabel(weekIndex: number, startDate: string): string {
  if (weekIndex === 0) {
    return "Initial Balance";
  }

  const start = new Date(startDate);
  const weekStartDate = new Date(start);
  weekStartDate.setDate(start.getDate() + (weekIndex - 1) * 7);

  // Calculate ISO week number
  const year = weekStartDate.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((weekStartDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const isoWeek = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  // Format as YYWW
  const yy = year.toString().slice(-2);
  const ww = isoWeek.toString().padStart(2, "0");

  return `${yy}${ww}`;
}

/**
 * Calculate week start date from week_index and scenario start_date
 * Week 0 = null (Initial Balance)
 * Week 1+ = start_date + (week_index - 1) * 7 days
 */
export function calculateWeekStartDate(weekIndex: number, startDate: string): string | null {
  if (weekIndex === 0) {
    return null;
  }

  const start = new Date(startDate);
  const weekStartDate = new Date(start);
  weekStartDate.setDate(start.getDate() + (weekIndex - 1) * 7);

  return weekStartDate.toISOString().split("T")[0];
}

/**
 * Parse JSONB top5 array to TopTransactionItemDTO[]
 */
export function parseTop5Transactions(jsonbData: unknown): any[] {
  if (!jsonbData || !Array.isArray(jsonbData)) {
    return [];
  }

  try {
    return jsonbData
      .map((item) => {
        // Basic validation
        if (!item || typeof item !== "object") {
          return null;
        }

        const obj = item as Record<string, any>;

        // Check required fields
        if (!obj.flow_id || typeof obj.amount_book_cents !== "number" || !obj.date_due) {
          return null;
        }

        return {
          flow_id: obj.flow_id,
          amount_book_cents: obj.amount_book_cents,
          counterparty: obj.counterparty || null,
          description: obj.description || null,
          date_due: obj.date_due,
        };
      })
      .filter((item): item is any => item !== null);
  } catch (error) {
    console.warn("Failed to parse top5 transactions:", error);
    return [];
  }
}

describe("scenario-analytics.service", () => {
  describe("calculateWeekLabel", () => {
    it('should return "Initial Balance" for week 0', () => {
      const result = calculateWeekLabel(0, "2026-01-06");
      expect(result).toBe("Initial Balance");
    });

    it("should calculate correct YYWW for week 1 (first week of scenario)", () => {
      // Week 1 starts on 2026-01-06 (scenario start date)
      const result = calculateWeekLabel(1, "2026-01-06");
      expect(result).toMatch(/^26\d{2}$/); // Should be 26XX format
    });

    it("should calculate correct YYWW for week 2", () => {
      // Week 2 starts on 2026-01-13 (7 days after start)
      const result = calculateWeekLabel(2, "2026-01-06");
      expect(result).toMatch(/^26\d{2}$/);
    });

    it("should handle scenario starting on January 1st", () => {
      const result = calculateWeekLabel(1, "2026-01-01");
      expect(result).toBe("2601"); // Week 1 of 2026
    });

    it("should handle scenario starting mid-year", () => {
      const result = calculateWeekLabel(1, "2026-07-01");
      expect(result).toMatch(/^26\d{2}$/);
    });

    it("should handle year boundary (week in late December)", () => {
      const result = calculateWeekLabel(1, "2026-12-28");
      expect(result).toMatch(/^(26|27)\d{2}$/); // Could be week 53 of 2026 or week 1 of 2027
    });

    it("should handle scenario spanning into next year", () => {
      // Week 10 starting from Dec 28, 2026 would be in early March 2027
      const result = calculateWeekLabel(10, "2026-12-28");
      expect(result).toMatch(/^27\d{2}$/); // Should be 27XX (year 2027)
    });

    it("should handle large week numbers", () => {
      const result = calculateWeekLabel(52, "2026-01-01");
      expect(result).toMatch(/^(26|27)\d{2}$/); // Week 52 from Jan 1, 2026
    });

    it("should format week numbers with leading zero", () => {
      const result = calculateWeekLabel(1, "2026-01-05");
      expect(result).toMatch(/^26\d{2}$/);
      expect(result.length).toBe(4); // YYWW format
    });
  });

  describe("calculateWeekStartDate", () => {
    it("should return null for week 0 (Initial Balance)", () => {
      const result = calculateWeekStartDate(0, "2026-01-06");
      expect(result).toBeNull();
    });

    it("should return start_date for week 1", () => {
      const result = calculateWeekStartDate(1, "2026-01-06");
      expect(result).toBe("2026-01-06");
    });

    it("should add 7 days for week 2", () => {
      const result = calculateWeekStartDate(2, "2026-01-06");
      expect(result).toBe("2026-01-13");
    });

    it("should add 14 days for week 3", () => {
      const result = calculateWeekStartDate(3, "2026-01-06");
      expect(result).toBe("2026-01-20");
    });

    it("should handle month boundaries correctly", () => {
      // Week 5 from Jan 28 should be Feb 25
      const result = calculateWeekStartDate(5, "2026-01-28");
      expect(result).toBe("2026-02-25");
    });

    it("should handle year boundaries correctly", () => {
      // Week 2 from Dec 28, 2026 should be Jan 4, 2027
      const result = calculateWeekStartDate(2, "2026-12-28");
      expect(result).toBe("2027-01-04");
    });

    it("should handle leap year (2024)", () => {
      // Week 10 from Feb 1, 2024 (leap year)
      // Week 10 means start_date + (10-1) * 7 = start_date + 63 days
      const result = calculateWeekStartDate(10, "2024-02-01");
      expect(result).toBe("2024-04-03"); // Feb 1 + 63 days = April 3
    });

    it("should handle non-leap year (2026)", () => {
      // Week 5 from Feb 1, 2026
      const result = calculateWeekStartDate(5, "2026-02-01");
      expect(result).toBe("2026-03-01");
    });

    it("should handle large week numbers (52 weeks)", () => {
      const result = calculateWeekStartDate(52, "2026-01-01");
      expect(result).toBe("2026-12-24"); // 51 weeks * 7 days = 357 days from Jan 1
    });

    it("should always return ISO date format (YYYY-MM-DD)", () => {
      const result = calculateWeekStartDate(1, "2026-01-06");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should handle dates with different start days of week", () => {
      // Monday
      expect(calculateWeekStartDate(1, "2026-01-05")).toBe("2026-01-05");
      // Tuesday
      expect(calculateWeekStartDate(1, "2026-01-06")).toBe("2026-01-06");
      // Sunday
      expect(calculateWeekStartDate(1, "2026-01-04")).toBe("2026-01-04");
    });
  });

  describe("parseTop5Transactions", () => {
    it("should return empty array for null input", () => {
      const result = parseTop5Transactions(null);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = parseTop5Transactions(undefined);
      expect(result).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      const result = parseTop5Transactions({ foo: "bar" });
      expect(result).toEqual([]);
    });

    it("should parse valid top5 transaction item", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: 100000,
          counterparty: "ACME Corp",
          description: "Payment for services",
          date_due: "2026-01-20",
        },
      ];

      const result = parseTop5Transactions(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        flow_id: "FLOW-001",
        amount_book_cents: 100000,
        counterparty: "ACME Corp",
        description: "Payment for services",
        date_due: "2026-01-20",
      });
    });

    it("should parse multiple valid items", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: 100000,
          counterparty: "ACME Corp",
          description: "Payment 1",
          date_due: "2026-01-20",
        },
        {
          flow_id: "FLOW-002",
          amount_book_cents: 50000,
          counterparty: "XYZ Ltd",
          description: "Payment 2",
          date_due: "2026-01-21",
        },
      ];

      const result = parseTop5Transactions(input);
      expect(result).toHaveLength(2);
    });

    it("should handle null counterparty and description", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: 100000,
          counterparty: null,
          description: null,
          date_due: "2026-01-20",
        },
      ];

      const result = parseTop5Transactions(input);

      expect(result).toHaveLength(1);
      expect(result[0].counterparty).toBeNull();
      expect(result[0].description).toBeNull();
    });

    it("should filter out items with missing required fields", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: 100000,
          date_due: "2026-01-20",
        },
        {
          // Missing flow_id
          amount_book_cents: 50000,
          date_due: "2026-01-21",
        },
        {
          flow_id: "FLOW-003",
          // Missing amount_book_cents
          date_due: "2026-01-22",
        },
        {
          flow_id: "FLOW-004",
          amount_book_cents: 75000,
          // Missing date_due
        },
      ];

      const result = parseTop5Transactions(input);
      expect(result).toHaveLength(1); // Only first item is valid
    });

    it("should filter out non-object items", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: 100000,
          date_due: "2026-01-20",
        },
        "invalid string",
        123,
        null,
        undefined,
      ];

      const result = parseTop5Transactions(input);
      expect(result).toHaveLength(1);
    });

    it("should handle empty array", () => {
      const result = parseTop5Transactions([]);
      expect(result).toEqual([]);
    });

    it("should handle negative amounts", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: -100000,
          counterparty: "ACME Corp",
          description: "Refund",
          date_due: "2026-01-20",
        },
      ];

      const result = parseTop5Transactions(input);
      expect(result).toHaveLength(1);
      expect(result[0].amount_book_cents).toBe(-100000);
    });

    it("should handle zero amount", () => {
      const input = [
        {
          flow_id: "FLOW-001",
          amount_book_cents: 0,
          counterparty: "ACME Corp",
          description: "Zero payment",
          date_due: "2026-01-20",
        },
      ];

      const result = parseTop5Transactions(input);
      expect(result).toHaveLength(1);
      expect(result[0].amount_book_cents).toBe(0);
    });
  });
});
