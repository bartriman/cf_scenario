import type { WeeklyAggregateVM, TransactionVM } from "@/types";
import { TransactionCard } from "./TransactionCard.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

interface WeekCardProps {
  week: WeeklyAggregateVM;
  onTransactionClick: (transaction: TransactionVM) => void;
  isLocked: boolean;
}

export function WeekCard({ week, onTransactionClick, isLocked }: WeekCardProps) {
  const isInitialBalance = week.week_index === 0;
  
  const { setNodeRef, isOver } = useDroppable({
    id: `week-${week.week_index}`,
    disabled: isLocked || isInitialBalance, // Disable drop for IB week
  });

  // Separate transactions by direction
  const inflowTransactions = week.transactions.filter((tx) => tx.direction === "INFLOW");
  const outflowTransactions = week.transactions.filter((tx) => tx.direction === "OUTFLOW");

  // Debug logging for last week
  if (week.week_index >= 4) {
    console.log(`[WeekCard] Week ${week.week_index}:`, {
      label: week.week_label,
      start_date: week.week_start_date,
      total_transactions: week.transactions.length,
      inflows: inflowTransactions.length,
      outflows: outflowTransactions.length,
      transactions: week.transactions.map(t => ({
        id: t.id,
        direction: t.direction,
        counterparty: t.counterparty,
        amount: t.amount_book_cents / 100
      }))
    });
  }

  // Format currency
  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card
      ref={setNodeRef}
      data-week-index={week.week_index}
      className={`w-80 flex-shrink-0 snap-center transition-colors ${
        isInitialBalance 
          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20" 
          : ""
      } ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {week.week_label}
          {isInitialBalance && (
            <span className="text-xs font-normal text-blue-600 dark:text-blue-400">(Read-only)</span>
          )}
        </CardTitle>
        {week.week_start_date && (
          <p className="text-xs text-muted-foreground">
            {new Date(week.week_start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inflows Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500">
              <ArrowDownCircle className="h-4 w-4" />
              <span>Inflows</span>
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-500">
              {formatCurrency(week.inflow_total_book_cents)}
            </span>
          </div>
          <div className="space-y-2">
            {inflowTransactions.length > 0 ? (
              inflowTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={onTransactionClick}
                  isLocked={isLocked}
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No inflows</p>
            )}
          </div>
        </div>

        {/* Outflows Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-500">
              <ArrowUpCircle className="h-4 w-4" />
              <span>Outflows</span>
            </div>
            <span className="text-sm font-semibold text-red-600 dark:text-red-500">
              {formatCurrency(week.outflow_total_book_cents)}
            </span>
          </div>
          <div className="space-y-2">
            {outflowTransactions.length > 0 ? (
              outflowTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={onTransactionClick}
                  isLocked={isLocked}
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No outflows</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
