import type { WeeklyAggregateVM, TransactionVM, RunningBalancePoint } from "@/types";

/**
 * Recalculate running balance from weekly aggregates
 */
export function recalculateRunningBalance(
  weeklyAggregates: WeeklyAggregateVM[],
  initialBalance = 100000
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
      const dateTransactions = transactionsByDate.get(date);
      if (dateTransactions) {
        dateTransactions.push(tx);
      }
    }

    // Sort dates chronologically
    const sortedDates = Array.from(transactionsByDate.keys()).sort();

    // Add balance points for each date with transactions
    for (const date of sortedDates) {
      const transactions = transactionsByDate.get(date);
      if (!transactions) continue;

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

/**
 * Validate that a transaction can be moved (not Initial Balance)
 */
export function validateTransactionMove(flowId: string, weeks: WeeklyAggregateVM[]): void {
  const isIB = weeks.some((w) => w.transactions.some((t) => t.id === flowId && t.is_initial_balance));

  if (isIB) {
    throw new Error("Cannot move Initial Balance (IB) transaction. IB transactions are read-only.");
  }
}

/**
 * Find and remove a transaction from weekly aggregates
 * Returns updated weeks and the removed transaction
 */
export function findAndRemoveTransaction(
  weeks: WeeklyAggregateVM[],
  flowId: string
): [WeeklyAggregateVM[], TransactionVM | null] {
  let movedTx: TransactionVM | null = null;

  const updated = weeks.map((week) => {
    const idx = week.transactions.findIndex((tx) => tx.id === flowId);
    if (idx !== -1) {
      movedTx = week.transactions[idx];
      return {
        ...week,
        transactions: week.transactions.filter((tx) => tx.id !== flowId),
      };
    }
    return week;
  });

  return [updated, movedTx];
}

/**
 * Add a transaction to the target week
 */
export function addTransactionToWeek(
  weeks: WeeklyAggregateVM[],
  transaction: TransactionVM,
  targetDate: string
): WeeklyAggregateVM[] {
  return weeks.map((week) => {
    const isTarget = week.week_start_date === targetDate || week.transactions.some((t) => t.date_due === targetDate);

    if (isTarget) {
      const targetDateForTx = week.transactions.length > 0 ? week.transactions[0].date_due : targetDate;

      return {
        ...week,
        transactions: [...week.transactions, { ...transaction, date_due: targetDateForTx }],
      };
    }
    return week;
  });
}
