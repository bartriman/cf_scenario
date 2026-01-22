import { describe, it, expect } from "vitest";
import {
  recalculateRunningBalance,
  validateTransactionMove,
  findAndRemoveTransaction,
  addTransactionToWeek,
} from "@/lib/utils/scenario-calculations";
import type { WeeklyAggregateVM, TransactionVM } from "@/types";

describe("scenario-calculations", () => {
  describe("recalculateRunningBalance", () => {
    it("should calculate running balance correctly", () => {
      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 0,
          week_label: "IB",
          week_start_date: null,
          inflow_total_book_cents: 10000,
          outflow_total_book_cents: 5000,
          transactions: [
            {
              id: "1",
              type: "transaction",
              direction: "INFLOW",
              amount_book_cents: 10000,
              date_due: "2026-01-01",
              counterparty: "Client A",
              description: "Payment",
              is_initial_balance: false,
            },
            {
              id: "2",
              type: "transaction",
              direction: "OUTFLOW",
              amount_book_cents: 5000,
              date_due: "2026-01-02",
              counterparty: "Supplier B",
              description: "Invoice",
              is_initial_balance: false,
            },
          ],
        },
      ];

      const result = recalculateRunningBalance(weeks, 100000);

      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe(100100); // 100000 + 100
      expect(result[1].balance).toBe(100050); // 100100 - 50
    });

    it("should handle empty weeks", () => {
      const result = recalculateRunningBalance([], 100000);
      expect(result).toHaveLength(0);
    });

    it("should sort weeks by week_index", () => {
      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 2,
          week_label: "W2",
          week_start_date: "2026-01-15",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [
            {
              id: "3",
              type: "transaction",
              direction: "INFLOW",
              amount_book_cents: 30000,
              date_due: "2026-01-15",
              counterparty: null,
              description: null,
              is_initial_balance: false,
            },
          ],
        },
        {
          week_index: 1,
          week_label: "W1",
          week_start_date: "2026-01-08",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [
            {
              id: "2",
              type: "transaction",
              direction: "INFLOW",
              amount_book_cents: 20000,
              date_due: "2026-01-08",
              counterparty: null,
              description: null,
              is_initial_balance: false,
            },
          ],
        },
      ];

      const result = recalculateRunningBalance(weeks, 0);

      expect(result[0].balance).toBe(200); // Week 1 first
      expect(result[1].balance).toBe(500); // Week 2 second
    });
  });

  describe("validateTransactionMove", () => {
    it("should throw error for IB transaction", () => {
      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 0,
          week_label: "IB",
          week_start_date: null,
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [
            {
              id: "ib-1",
              type: "transaction",
              direction: "INFLOW",
              amount_book_cents: 0,
              date_due: "2026-01-01",
              counterparty: null,
              description: null,
              is_initial_balance: true,
            },
          ],
        },
      ];

      expect(() => validateTransactionMove("ib-1", weeks)).toThrow("Cannot move Initial Balance");
    });

    it("should not throw for regular transaction", () => {
      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 1,
          week_label: "W1",
          week_start_date: "2026-01-01",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [
            {
              id: "tx-1",
              type: "transaction",
              direction: "INFLOW",
              amount_book_cents: 0,
              date_due: "2026-01-01",
              counterparty: null,
              description: null,
              is_initial_balance: false,
            },
          ],
        },
      ];

      expect(() => validateTransactionMove("tx-1", weeks)).not.toThrow();
    });
  });

  describe("findAndRemoveTransaction", () => {
    it("should find and remove transaction", () => {
      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 1,
          week_label: "W1",
          week_start_date: "2026-01-01",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [
            {
              id: "tx-1",
              type: "transaction",
              direction: "INFLOW",
              amount_book_cents: 10000,
              date_due: "2026-01-01",
              counterparty: "Client",
              description: "Payment",
              is_initial_balance: false,
            },
            {
              id: "tx-2",
              type: "transaction",
              direction: "OUTFLOW",
              amount_book_cents: 5000,
              date_due: "2026-01-01",
              counterparty: "Supplier",
              description: "Invoice",
              is_initial_balance: false,
            },
          ],
        },
      ];

      const [updated, removed] = findAndRemoveTransaction(weeks, "tx-1");

      expect(removed).not.toBeNull();
      expect(removed?.id).toBe("tx-1");
      expect(updated[0].transactions).toHaveLength(1);
      expect(updated[0].transactions[0].id).toBe("tx-2");
    });

    it("should return null if transaction not found", () => {
      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 1,
          week_label: "W1",
          week_start_date: "2026-01-01",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [],
        },
      ];

      const [updated, removed] = findAndRemoveTransaction(weeks, "non-existent");

      expect(removed).toBeNull();
      expect(updated).toEqual(weeks);
    });
  });

  describe("addTransactionToWeek", () => {
    it("should add transaction to target week by week_start_date", () => {
      const transaction: TransactionVM = {
        id: "new-tx",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 10000,
        date_due: "2026-01-08",
        counterparty: "Client",
        description: "Payment",
        is_initial_balance: false,
      };

      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 1,
          week_label: "W1",
          week_start_date: "2026-01-01",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [],
        },
        {
          week_index: 2,
          week_label: "W2",
          week_start_date: "2026-01-08",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [],
        },
      ];

      const result = addTransactionToWeek(weeks, transaction, "2026-01-08");

      expect(result[1].transactions).toHaveLength(1);
      expect(result[1].transactions[0].id).toBe("new-tx");
    });

    it("should add transaction to week matching transaction date_due", () => {
      const transaction: TransactionVM = {
        id: "new-tx",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 10000,
        date_due: "2026-01-10",
        counterparty: "Client",
        description: "Payment",
        is_initial_balance: false,
      };

      const weeks: WeeklyAggregateVM[] = [
        {
          week_index: 2,
          week_label: "W2",
          week_start_date: "2026-01-08",
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          transactions: [
            {
              id: "existing",
              type: "transaction",
              direction: "OUTFLOW",
              amount_book_cents: 5000,
              date_due: "2026-01-10",
              counterparty: null,
              description: null,
              is_initial_balance: false,
            },
          ],
        },
      ];

      const result = addTransactionToWeek(weeks, transaction, "2026-01-10");

      expect(result[0].transactions).toHaveLength(2);
      expect(result[0].transactions[1].id).toBe("new-tx");
    });
  });
});
