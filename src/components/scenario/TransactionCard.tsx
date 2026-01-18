import type { TransactionVM } from "@/types";
import { Card } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface TransactionCardProps {
  transaction: TransactionVM;
  onClick: (transaction: TransactionVM) => void;
  isLocked: boolean;
}

export function TransactionCard({ transaction, onClick, isLocked }: TransactionCardProps) {
  const isOther = transaction.type === "other";
  const isClickable = !isOther && !isLocked;
  const isDraggable = !isOther && !isLocked;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: transaction.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Format currency
  const formatCurrency = (cents: number) => {
    return (Math.abs(cents) / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleClick = () => {
    if (isClickable) {
      onClick(transaction);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${
        isClickable
          ? "cursor-pointer transition-colors hover:bg-accent"
          : isOther
            ? "cursor-default bg-muted/50"
            : "cursor-not-allowed opacity-60"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        {!isOther && !isLocked && (
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to move transaction"
          >
            <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {transaction.counterparty || transaction.description || "(bez opisu)"}
          </p>
          {transaction.counterparty && transaction.description && transaction.description !== "Other" && (
            <p className="truncate text-xs text-muted-foreground">{transaction.description}</p>
          )}
          <p
            className={`mt-1 text-sm font-semibold ${
              transaction.direction === "INFLOW"
                ? "text-green-600 dark:text-green-500"
                : "text-red-600 dark:text-red-500"
            }`}
          >
            {transaction.direction === "INFLOW" ? "+" : "-"}
            {formatCurrency(transaction.amount_book_cents)}
          </p>
        </div>
      </div>
    </Card>
  );
}
