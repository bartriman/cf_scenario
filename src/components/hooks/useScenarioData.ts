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
import { getDemoData, saveDemoData } from "@/lib/mock-data";

interface UseScenarioDataResult {
  scenario: Scenario | null;
  weeklyAggregates: WeeklyAggregateVM[];
  runningBalance: RunningBalancePoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateTransaction: (flowId: string, data: UpsertOverrideRequestDTO) => Promise<void>;
  moveTransaction: (flowId: string, newWeekStartDate: string) => Promise<void>;
  isDemoMode: boolean;
}

// Helper function to recalculate running balance from weekly aggregates
function recalculateRunningBalance(
  weeklyAggregates: WeeklyAggregateVM[],
  initialBalance: number = 100000
): RunningBalancePoint[] {
  const balancePoints: RunningBalancePoint[] = [];
  let currentBalance = initialBalance;

  // Sort weeks by week_index to ensure proper order
  const sortedWeeks = [...weeklyAggregates].sort((a, b) => a.week_index - b.week_index);

  for (const week of sortedWeeks) {
    // Group transactions by date
    const transactionsByDate = new Map<string, TransactionVM[]>();
    
    for (const tx of week.transactions) {
      const date = tx.date_due;
      if (!transactionsByDate.has(date)) {
        transactionsByDate.set(date, []);
      }
      transactionsByDate.get(date)!.push(tx);
    }

    // Sort dates chronologically
    const sortedDates = Array.from(transactionsByDate.keys()).sort();

    // Add balance points for each date with transactions
    for (const date of sortedDates) {
      const transactions = transactionsByDate.get(date)!;
      
      for (const tx of transactions) {
        if (tx.direction === "INFLOW") {
          currentBalance += tx.amount_book_cents / 100;
        } else {
          currentBalance -= tx.amount_book_cents / 100;
        }
      }

      balancePoints.push({
        date,
        balance: currentBalance,
      });
    }
  }

  return balancePoints;
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

export function useScenarioData(scenarioId?: string, companyId?: string): UseScenarioDataResult {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [weeklyAggregates, setWeeklyAggregates] = useState<WeeklyAggregateVM[]>([]);
  const [runningBalance, setRunningBalance] = useState<RunningBalancePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Demo mode is active when scenarioId or companyId is not provided
  const isDemoMode = !scenarioId || !companyId;

  const fetchData = useCallback(async () => {
    // Demo mode - load from localStorage or use initial mock data
    if (isDemoMode) {
      setIsLoading(true);
      setError(null);

      try {
        const demoData = getDemoData();
        setScenario(demoData.scenario);
        setWeeklyAggregates(demoData.weeklyAggregates);
        setRunningBalance(demoData.runningBalance);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load demo data"));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now();
      console.log('[fetchData] Fetching with timestamp:', timestamp);
      
      // Fetch all data in parallel
      const [scenarioRes, weeklyRes, balanceRes] = await Promise.all([
        fetch(`/api/companies/${companyId}/scenarios/${scenarioId}?_t=${timestamp}`),
        fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/weekly-aggregates?_t=${timestamp}`),
        fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/running-balance?_t=${timestamp}`),
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

      console.log('[fetchData] Received data:', {
        scenarioId,
        weeksCount: weeklyData.weeks.length,
        lastWeek: weeklyData.weeks[weeklyData.weeks.length - 1],
      });

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
  }, [scenarioId, companyId, isDemoMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateTransaction = useCallback(
    async (flowId: string, data: UpsertOverrideRequestDTO) => {
      // Demo mode - update locally only
      if (isDemoMode) {
        try {
          // Find and update the transaction in weeklyAggregates
          const updatedWeeks = weeklyAggregates.map((week) => ({
            ...week,
            transactions: week.transactions.map((tx) => {
              if (tx.id === flowId) {
                return {
                  ...tx,
                  amount_book_cents: data.new_amount_book_cents ?? tx.amount_book_cents,
                  date_due: data.new_date_due ?? tx.date_due,
                };
              }
              return tx;
            }),
          }));

          // Recalculate running balance based on updated transactions
          const updatedBalance = recalculateRunningBalance(updatedWeeks);

          setWeeklyAggregates(updatedWeeks);
          setRunningBalance(updatedBalance);
          saveDemoData(updatedWeeks, updatedBalance);
        } catch (err) {
          setError(err instanceof Error ? err : new Error("Failed to update demo transaction"));
          throw err;
        }
        return;
      }

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
    [scenarioId, companyId, refetch, isDemoMode, weeklyAggregates]
  );

  const moveTransaction = useCallback(
    async (flowId: string, newWeekStartDate: string) => {
      // Demo mode - move transaction locally
      if (isDemoMode) {
        try {
          // Find and remove the transaction from source week
          let movedTransaction: TransactionVM | null = null;
          
          const weeksAfterRemove = weeklyAggregates.map((week) => {
            const txIndex = week.transactions.findIndex((tx) => tx.id === flowId);
            if (txIndex !== -1) {
              movedTransaction = { ...week.transactions[txIndex], date_due: newWeekStartDate };
              return {
                ...week,
                transactions: week.transactions.filter((tx) => tx.id !== flowId),
              };
            }
            return week;
          });

          if (!movedTransaction) {
            console.error('[moveTransaction] Transaction not found:', flowId);
            throw new Error(`Transaction ${flowId} not found`);
          }

          console.log('[moveTransaction] Transaction found and removed:', {
            transactionId: flowId,
            newWeekStartDate,
            transaction: movedTransaction
          });

          // Add the transaction to target week
          // In demo mode, newWeekStartDate might be either week_start_date or a transaction's date_due
          let targetWeekFound = false;
          const weeksAfterAdd = weeksAfterRemove.map((week) => {
            console.log('[moveTransaction] Checking week:', {
              week_index: week.week_index,
              week_label: week.week_label,
              week_start_date: week.week_start_date,
              newWeekStartDate,
              matchesStartDate: week.week_start_date === newWeekStartDate,
              matchesTransactionDate: week.transactions.some(t => t.date_due === newWeekStartDate),
            });
            
            // Check if newWeekStartDate matches either week_start_date or any transaction's date_due in this week
            const isTargetWeek = week.week_start_date === newWeekStartDate || 
                                week.transactions.some(t => t.date_due === newWeekStartDate);
            
            if (isTargetWeek) {
              targetWeekFound = true;
              console.log('[moveTransaction] Found target week! Adding transaction to week:', week.week_index);
              
              // Use the date from existing transactions in this week, or fall back to newWeekStartDate
              const targetDate = week.transactions.length > 0 
                ? week.transactions[0].date_due 
                : newWeekStartDate;
              
              return {
                ...week,
                transactions: [...week.transactions, { ...movedTransaction!, date_due: targetDate }],
              };
            }
            return week;
          });

          if (!targetWeekFound) {
            console.error('[moveTransaction] Target week not found:', {
              newWeekStartDate,
              availableWeeks: weeklyAggregates.map(w => ({ 
                index: w.week_index, 
                label: w.week_label,
                date: w.week_start_date 
              }))
            });
            throw new Error(`Target week with date ${newWeekStartDate} not found`);
          }

          // Recalculate running balance based on moved transactions
          const updatedBalance = recalculateRunningBalance(weeksAfterAdd);

          setWeeklyAggregates(weeksAfterAdd);
          setRunningBalance(updatedBalance);
          saveDemoData(weeksAfterAdd, updatedBalance);
        } catch (err) {
          setError(err instanceof Error ? err : new Error("Failed to move demo transaction"));
          throw err;
        }
        return;
      }

      try {
        console.log('[moveTransaction] API mode - sending batch update:', {
          flowId,
          newWeekStartDate,
          scenarioId,
          companyId
        });

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

        console.log('[moveTransaction] API response:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[moveTransaction] API error:', {
            status: response.status,
            errorText
          });
          throw new Error(`Failed to move transaction: ${response.status}`);
        }

        console.log('[moveTransaction] API call successful, refetching data...');
        // Refetch data after successful move
        await refetch();
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to move transaction"));
        throw err;
      }
    },
    [scenarioId, companyId, refetch, isDemoMode, weeklyAggregates]
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
    isDemoMode,
  };
}
