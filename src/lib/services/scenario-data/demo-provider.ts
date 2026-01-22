import { getDemoData, saveDemoData } from "@/lib/mock-data";
import type { ScenarioDataProvider, ScenarioData } from "./types";
import type { UpsertOverrideRequestDTO } from "@/types";
import {
  recalculateRunningBalance,
  findAndRemoveTransaction,
  addTransactionToWeek,
} from "@/lib/utils/scenario-calculations";

export class DemoDataProvider implements ScenarioDataProvider {
  private data: ScenarioData;

  constructor() {
    this.data = getDemoData();
  }

  async fetchScenarioData(): Promise<ScenarioData> {
    return Promise.resolve(this.data);
  }

  async updateTransaction(flowId: string, updateData: UpsertOverrideRequestDTO): Promise<void> {
    const updatedWeeks = this.data.weeklyAggregates.map((week) => ({
      ...week,
      transactions: week.transactions.map((tx) => {
        if (tx.id === flowId) {
          return {
            ...tx,
            amount_book_cents: updateData.new_amount_book_cents ?? tx.amount_book_cents,
            date_due: updateData.new_date_due ?? tx.date_due,
          };
        }
        return tx;
      }),
    }));

    const updatedBalance = recalculateRunningBalance(updatedWeeks);

    this.data = {
      ...this.data,
      weeklyAggregates: updatedWeeks,
      runningBalance: updatedBalance,
    };

    saveDemoData(updatedWeeks, updatedBalance);
  }

  async moveTransaction(flowId: string, newDate: string): Promise<void> {
    const [weeksAfterRemove, movedTx] = findAndRemoveTransaction(this.data.weeklyAggregates, flowId);

    if (!movedTx) {
      throw new Error(`Transaction ${flowId} not found`);
    }

    const weeksAfterAdd = addTransactionToWeek(weeksAfterRemove, movedTx, newDate);
    const updatedBalance = recalculateRunningBalance(weeksAfterAdd);

    this.data = {
      ...this.data,
      weeklyAggregates: weeksAfterAdd,
      runningBalance: updatedBalance,
    };

    saveDemoData(weeksAfterAdd, updatedBalance);
  }
}
