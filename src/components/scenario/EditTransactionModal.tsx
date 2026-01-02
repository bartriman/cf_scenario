import { useState, useEffect } from "react";
import type { TransactionVM, UpsertOverrideRequestDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: TransactionVM | null;
  onSave: (flowId: string, data: UpsertOverrideRequestDTO) => void;
  onClose: () => void;
  isLocked: boolean;
}

export function EditTransactionModal({ isOpen, transaction, onSave, onClose, isLocked }: EditTransactionModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setNewDate(transaction.date_due);
      setNewAmount((transaction.amount_book_cents / 100).toString());
      setHasChanges(false);
    }
  }, [transaction]);

  // Track if form has changes
  useEffect(() => {
    if (!transaction) return;

    const dateChanged = newDate !== transaction.date_due;
    const amountChanged = parseFloat(newAmount) !== transaction.amount_book_cents / 100;

    setHasChanges(dateChanged || amountChanged);
  }, [newDate, newAmount, transaction]);

  const handleSave = () => {
    if (!transaction || !hasChanges) return;

    const data: UpsertOverrideRequestDTO = {};

    // Only include changed fields
    if (newDate !== transaction.date_due) {
      data.new_date_due = newDate;
    }

    if (parseFloat(newAmount) !== transaction.amount_book_cents / 100) {
      data.new_amount_book_cents = Math.round(parseFloat(newAmount) * 100);
    }

    // At least one field must be set
    if (Object.keys(data).length === 0) return;

    onSave(transaction.id, data);
  };

  const formatCurrency = (cents: number) => {
    return (Math.abs(cents) / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Modify the date or amount for this transaction.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Details */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium">{transaction.counterparty}</p>
            {transaction.description && <p className="text-xs text-muted-foreground">{transaction.description}</p>}
            <p
              className={`mt-1 text-sm font-semibold ${
                transaction.direction === "INFLOW"
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              }`}
            >
              Original: {transaction.direction === "INFLOW" ? "+" : "-"}
              {formatCurrency(transaction.amount_book_cents)}
            </p>
          </div>

          {/* Date Field */}
          <div className="space-y-2">
            <Label htmlFor="date">Date Due</Label>
            <Input
              id="date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              disabled={isLocked}
            />
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({transaction.direction === "INFLOW" ? "Inflow" : "Outflow"})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              disabled={isLocked}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isLocked}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
