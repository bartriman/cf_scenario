import { useState } from "react";
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
import type { ScenarioListItemDTO } from "@/types";

interface DuplicateScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: ScenarioListItemDTO | null;
  onSubmit: (scenarioId: number, newName: string) => Promise<void>;
}

export default function DuplicateScenarioDialog({
  open,
  onOpenChange,
  scenario,
  onSubmit,
}: DuplicateScenarioDialogProps) {
  const defaultName = scenario ? `${scenario.name} (kopia)` : "";
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aktualizuj nazwę gdy zmienia się scenariusz
  useState(() => {
    setName(defaultName);
  });

  const validateName = (): boolean => {
    if (!name.trim()) {
      setError("Nazwa jest wymagana");
      return false;
    }
    if (name.length > 255) {
      setError("Nazwa nie może przekraczać 255 znaków");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scenario || !validateName()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(scenario.id, name);
      setName("");
      setError("");
    } catch (_error) {
      // Błąd jest obsługiwany w komponencie nadrzędnym
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName(defaultName);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplikuj scenariusz</DialogTitle>
          <DialogDescription>
            Tworzysz kopię scenariusza: <strong>{scenario?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nowa nazwa *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa nowego scenariusza"
                maxLength={255}
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Duplikowanie..." : "Duplikuj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
