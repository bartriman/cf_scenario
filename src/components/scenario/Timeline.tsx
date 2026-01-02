import type { WeeklyAggregateVM, TransactionVM } from "@/types";
import { WeekCard } from "./WeekCard.tsx";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { TransactionCard } from "./TransactionCard.tsx";

interface TimelineProps {
  weeklyAggregates: WeeklyAggregateVM[];
  onTransactionDrop: (flowId: string, newWeekStartDate: string) => void;
  onTransactionClick: (transaction: TransactionVM) => void;
  isLocked: boolean;
}

export function Timeline({
  weeklyAggregates,
  onTransactionDrop,
  onTransactionClick,
  isLocked,
}: TimelineProps) {
  const [activeTransaction, setActiveTransaction] = useState<TransactionVM | null>(null);

  // Configure sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to activate
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: { active: { id: string } }) => {
    const transactionId = event.active.id;
    
    // Find the transaction being dragged
    for (const week of weeklyAggregates) {
      const transaction = week.transactions.find((tx) => tx.id === transactionId);
      if (transaction) {
        setActiveTransaction(transaction);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTransaction(null);

    if (!over) return;

    const transactionId = active.id as string;
    const weekDroppableId = over.id as string;

    // Extract week_index from droppable id (format: "week-{week_index}")
    const weekIndex = parseInt(weekDroppableId.replace("week-", ""), 10);
    const targetWeek = weeklyAggregates.find((w) => w.week_index === weekIndex);

    if (!targetWeek || !targetWeek.week_start_date) return;

    // Find source week
    let sourceWeekStartDate: string | null = null;
    for (const week of weeklyAggregates) {
      const transaction = week.transactions.find((tx) => tx.id === transactionId);
      if (transaction && transaction.type === "transaction") {
        sourceWeekStartDate = week.week_start_date;
        break;
      }
    }

    // Only trigger drop if moving to a different week
    if (sourceWeekStartDate !== targetWeek.week_start_date) {
      onTransactionDrop(transactionId, targetWeek.week_start_date);
    }
  };

  const handleDragCancel = () => {
    setActiveTransaction(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="inline-flex h-full min-w-full gap-4 px-6 py-4">
          {weeklyAggregates.map((week) => (
            <WeekCard
              key={week.week_index}
              week={week}
              onTransactionClick={onTransactionClick}
              isLocked={isLocked}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTransaction ? (
          <div className="w-80 rotate-3 opacity-80">
            <TransactionCard
              transaction={activeTransaction}
              onClick={() => {}}
              isLocked={isLocked}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
