import type { ScenarioDataProvider, ScenarioData } from "./types";
import type { UpsertOverrideRequestDTO } from "@/types";
import { transformWeekAggregate } from "@/lib/utils/scenario-transformers";

export class ApiDataProvider implements ScenarioDataProvider {
  constructor(
    private scenarioId: string,
    private companyId: string
  ) {}

  async fetchScenarioData(): Promise<ScenarioData> {
    const timestamp = Date.now();

    const [scenarioRes, weeklyRes, balanceRes] = await Promise.all([
      fetch(`/api/companies/${this.companyId}/scenarios/${this.scenarioId}?_t=${timestamp}`),
      fetch(`/api/companies/${this.companyId}/scenarios/${this.scenarioId}/weekly-aggregates?_t=${timestamp}`),
      fetch(`/api/companies/${this.companyId}/scenarios/${this.scenarioId}/running-balance?_t=${timestamp}`),
    ]);

    if (!scenarioRes.ok || !weeklyRes.ok || !balanceRes.ok) {
      throw new Error("Failed to fetch scenario data");
    }

    const [scenario, weeklyData, balanceData] = await Promise.all([
      scenarioRes.json(),
      weeklyRes.json(),
      balanceRes.json(),
    ]);

    return {
      scenario,
      weeklyAggregates: weeklyData.weeks.map(transformWeekAggregate),
      runningBalance: balanceData.balances.map((item: { as_of_date: string; running_balance_book_cents: number }) => ({
        date: item.as_of_date,
        balance: item.running_balance_book_cents / 100,
      })),
    };
  }

  async updateTransaction(flowId: string, data: UpsertOverrideRequestDTO): Promise<void> {
    const response = await fetch(`/api/companies/${this.companyId}/scenarios/${this.scenarioId}/overrides/${flowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update transaction");
    }
  }

  async moveTransaction(flowId: string, newDate: string): Promise<void> {
    const response = await fetch(`/api/companies/${this.companyId}/scenarios/${this.scenarioId}/overrides/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overrides: [{ flow_id: flowId, new_date_due: newDate }],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to move transaction");
    }
  }
}
