import type { Scenario, WeeklyAggregateVM, RunningBalancePoint, UpsertOverrideRequestDTO } from "@/types";

export interface ScenarioDataProvider {
  fetchScenarioData(): Promise<ScenarioData>;
  updateTransaction(flowId: string, data: UpsertOverrideRequestDTO): Promise<void>;
  moveTransaction(flowId: string, newDate: string): Promise<void>;
}

export interface ScenarioData {
  scenario: Scenario | null;
  weeklyAggregates: WeeklyAggregateVM[];
  runningBalance: RunningBalancePoint[];
}
