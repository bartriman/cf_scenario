import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DuplicateScenarioForm } from "./DuplicateScenarioForm";
import { toast } from "sonner";
import type { ScenarioListItemDTO, DuplicateScenarioRequestDTO, DuplicateScenarioResponseDTO } from "@/types";

interface DuplicateScenarioDialogProps {
  companyId: string;
  sourceScenario: ScenarioListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (scenario: DuplicateScenarioResponseDTO) => void;
}

export function DuplicateScenarioDialog({
  companyId,
  sourceScenario,
  open,
  onOpenChange,
  onSuccess,
}: DuplicateScenarioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DuplicateScenarioRequestDTO) => {
    if (!sourceScenario) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/companies/${companyId}/scenarios/${sourceScenario.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Scenariusz o tej nazwie już istnieje");
        }
        throw new Error("Nie udało się zduplikować scenariusza");
      }

      const duplicatedScenario: DuplicateScenarioResponseDTO = await response.json();

      toast.success("Scenariusz zduplikowany", {
        description: `Skopiowano ${duplicatedScenario.overrides_count} modyfikacji`,
      });

      onSuccess(duplicatedScenario);
      onOpenChange(false);
    } catch (error) {
      toast.error("Błąd", {
        description: error instanceof Error ? error.message : "Nie udało się zduplikować scenariusza",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sourceScenario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplikuj scenariusz: {sourceScenario.name}</DialogTitle>
          <DialogDescription>Utwórz kopię scenariusza wraz ze wszystkimi modyfikacjami</DialogDescription>
        </DialogHeader>

        <DuplicateScenarioForm
          sourceScenarioName={sourceScenario.name}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
