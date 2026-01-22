import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Scenario, UpsertOverrideRequestDTO } from "@/types";
import type { WeeklyAggregateVM, RunningBalancePoint } from "@/types";
import { DemoDataProvider } from "@/lib/services/scenario-data/demo-provider";
import { ApiDataProvider } from "@/lib/services/scenario-data/api-provider";
import { validateTransactionMove } from "@/lib/utils/scenario-calculations";

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

export function useScenarioData(scenarioId?: string, companyId?: string): UseScenarioDataResult {
  const queryClient = useQueryClient();
  const isDemoMode = !scenarioId || !companyId;

  // Create the appropriate provider based on mode
  const provider = useMemo(() => {
    return isDemoMode ? new DemoDataProvider() : new ApiDataProvider(scenarioId!, companyId!);
  }, [isDemoMode, scenarioId, companyId]);

  // Fetch scenario data using React Query
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ["scenarioData", scenarioId, companyId, isDemoMode],
    queryFn: () => provider.fetchScenarioData(),
    staleTime: isDemoMode ? Infinity : 30000, // Demo data never stale, API data stale after 30s
    retry: isDemoMode ? 0 : 1,
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: ({ flowId, updateData }: { flowId: string; updateData: UpsertOverrideRequestDTO }) =>
      provider.updateTransaction(flowId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarioData", scenarioId, companyId, isDemoMode] });
    },
  });

  // Move transaction mutation
  const moveMutation = useMutation({
    mutationFn: ({ flowId, newDate }: { flowId: string; newDate: string }) => {
      // Validate move before executing
      if (data?.weeklyAggregates) {
        validateTransactionMove(flowId, data.weeklyAggregates);
      }
      return provider.moveTransaction(flowId, newDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarioData", scenarioId, companyId, isDemoMode] });
    },
  });

  const updateTransaction = async (flowId: string, updateData: UpsertOverrideRequestDTO) => {
    await updateMutation.mutateAsync({ flowId, updateData });
  };

  const moveTransaction = async (flowId: string, newWeekStartDate: string) => {
    await moveMutation.mutateAsync({ flowId, newDate: newWeekStartDate });
  };

  const refetch = async () => {
    await queryRefetch();
  };

  return {
    scenario: data?.scenario ?? null,
    weeklyAggregates: data?.weeklyAggregates ?? [],
    runningBalance: data?.runningBalance ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
    updateTransaction,
    moveTransaction,
    isDemoMode,
  };
}
