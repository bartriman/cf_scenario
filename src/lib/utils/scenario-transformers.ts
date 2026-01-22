import type { WeekAggregateDTO, WeeklyAggregateVM, TransactionVM, TopTransactionItemDTO } from "@/types";

/**
 * Transform WeekAggregateDTO from API to WeeklyAggregateVM for UI
 */
export function transformWeekAggregate(week: WeekAggregateDTO): WeeklyAggregateVM {
  const transactions: TransactionVM[] = [];
  const isInitialBalance = week.week_index === 0;

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
      is_initial_balance: isInitialBalance,
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
      is_initial_balance: isInitialBalance,
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
      is_initial_balance: isInitialBalance,
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
      is_initial_balance: isInitialBalance,
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
