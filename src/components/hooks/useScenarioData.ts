import { useState, useEffect, useCallback } from "react";
import type {
  Scenario,
  WeeklyAggregatesResponseDTO,
  RunningBalanceResponseDTO,
  WeekAggregateDTO,
  TopTransactionItemDTO,
  BatchUpdateOverridesRequestDTO,
  UpsertOverrideRequestDTO,
} from "@/types";
import type { WeeklyAggregateVM, TransactionVM, RunningBalancePoint } from "@/types";

interface UseScenarioDataResult {
  scenario: Scenario | null;
  weeklyAggregates: WeeklyAggregateVM[];
  runningBalance: RunningBalancePoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateTransaction: (flowId: string, data: UpsertOverrideRequestDTO) => Promise<void>;
  moveTransaction: (flowId: string, newWeekStartDate: string) => Promise<void>;
}

// Helper function to transform WeekAggregateDTO to WeeklyAggregateVM
function transformWeekAggregate(week: WeekAggregateDTO): WeeklyAggregateVM {
  const transactions: TransactionVM[] = [];

  // Add Top 5 inflows
  week.inflow_top5.forEach((tx: TopTransactionItemDTO) => {
    transactions.push({
      id: tx.flow_id,
      type: "transaction",
      direction: "INFLOW",
      amount_book_cents: tx.amount_book_cents,
      counterparty: tx.counterparty,
      description: tx.description,
      date_due: tx.date_due,
    });
  });

  // Add "Other" inflow if exists
  if (week.inflow_other_book_cents > 0) {
    transactions.push({
      id: `other-inflow-${week.week_index}`,
      type: "other",
      direction: "INFLOW",
      amount_book_cents: week.inflow_other_book_cents,
      counterparty: null,
      description: "Other",
      date_due: week.week_start_date || "",
    });
  }

  // Add Top 5 outflows
  week.outflow_top5.forEach((tx: TopTransactionItemDTO) => {
    transactions.push({
      id: tx.flow_id,
      type: "transaction",
      direction: "OUTFLOW",
      amount_book_cents: tx.amount_book_cents,
      counterparty: tx.counterparty,
      description: tx.description,
      date_due: tx.date_due,
    });
  });

  // Add "Other" outflow if exists
  if (week.outflow_other_book_cents > 0) {
    transactions.push({
      id: `other-outflow-${week.week_index}`,
      type: "other",
      direction: "OUTFLOW",
      amount_book_cents: week.outflow_other_book_cents,
      counterparty: null,
      description: "Other",
      date_due: week.week_start_date || "",
    });
  }

  return {
    week_index: week.week_index,
    week_label: week.week_label,
    week_start_date: week.week_start_date,
    inflow_total_book_cents: week.inflow_total_book_cents,
    outflow_total_book_cents: week.outflow_total_book_cents,
    transactions,
  };
}

export function useScenarioData(scenarioId: string, companyId: string): UseScenarioDataResult {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [weeklyAggregates, setWeeklyAggregates] = useState<WeeklyAggregateVM[]>([]);
  const [runningBalance, setRunningBalance] = useState<RunningBalancePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!scenarioId || !companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [scenarioRes, weeklyRes, balanceRes] = await Promise.all([
        fetch(`/api/companies/${companyId}/scenarios/${scenarioId}`),
        fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/weekly-aggregates`),
        fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/running-balance`),
      ]);

      // Check for errors
      if (!scenarioRes.ok) {
        throw new Error(`Failed to fetch scenario: ${scenarioRes.status}`);
      }
      if (!weeklyRes.ok) {
        throw new Error(`Failed to fetch weekly aggregates: ${weeklyRes.status}`);
      }
      if (!balanceRes.ok) {
        throw new Error(`Failed to fetch running balance: ${balanceRes.status}`);
      }

      // Parse responses
      const scenarioData: Scenario = await scenarioRes.json();
      const weeklyData: WeeklyAggregatesResponseDTO = await weeklyRes.json();
      const balanceData: RunningBalanceResponseDTO = await balanceRes.json();

      // Transform data
      const transformedWeeks = weeklyData.weeks.map(transformWeekAggregate);
      const transformedBalance = balanceData.balances.map((item) => ({
        date: item.as_of_date,
        balance: item.running_balance_book_cents / 100,
      }));

      setScenario(scenarioData);
      setWeeklyAggregates(transformedWeeks);
      setRunningBalance(transformedBalance);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateTransaction = useCallback(
    async (flowId: string, data: UpsertOverrideRequestDTO) => {
      if (!scenarioId || !companyId) return;

      try {
        const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/overrides/${flowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update transaction: ${response.status}`);
        }

        // Refetch data after successful update
        await refetch();
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to update transaction"));
        throw err;
      }
    },
    [scenarioId, companyId, refetch]
  );

  const moveTransaction = useCallback(
    async (flowId: string, newWeekStartDate: string) => {
      if (!scenarioId || !companyId) return;

      try {
        const batchData: BatchUpdateOverridesRequestDTO = {
          overrides: [
            {
              flow_id: flowId,
              new_date_due: newWeekStartDate,
            },
          ],
        };

        const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/overrides/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batchData),
        });

        if (!response.ok) {
          throw new Error(`Failed to move transaction: ${response.status}`);
        }

        // Refetch data after successful move
        await refetch();
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to move transaction"));
        throw err;
      }
    },
    [scenarioId, companyId, refetch]
  );

  return {
    scenario,
    weeklyAggregates,
    runningBalance,
    isLoading,
    error,
    refetch,
    updateTransaction,
    moveTransaction,
  };
}
