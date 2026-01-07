import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateScenarioForm } from "./CreateScenarioForm";
import { CreateFromImportForm } from "./CreateFromImportForm";
import { toast } from "sonner";
import type { CreateScenarioRequestDTO, CreateScenarioResponseDTO } from "@/types";

interface CreateScenarioDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (scenario: CreateScenarioResponseDTO) => void;
}

export function CreateScenarioDialog({ companyId, open, onOpenChange, onSuccess }: CreateScenarioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateScenarioRequestDTO) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/companies/${companyId}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Scenariusz o tej nazwie już istnieje");
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Nieprawidłowe dane formularza");
        }
        throw new Error("Nie udało się utworzyć scenariusza");
      }

      const newScenario: CreateScenarioResponseDTO = await response.json();

      toast.success("Scenariusz utworzony", {
        description: `Scenariusz "${newScenario.name}" został pomyślnie utworzony`,
      });

      onSuccess(newScenario);
      onOpenChange(false);
    } catch (error) {
      toast.error("Błąd", {
        description: error instanceof Error ? error.message : "Nie udało się utworzyć scenariusza",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nowy scenariusz</DialogTitle>
          <DialogDescription>Utwórz pusty scenariusz lub na podstawie istniejącego importu</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="blank" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blank">Pusty scenariusz</TabsTrigger>
            <TabsTrigger value="import">Z importu</TabsTrigger>
          </TabsList>

          <TabsContent value="blank" className="mt-6">
            <CreateScenarioForm
              companyId={companyId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <CreateFromImportForm
              companyId={companyId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
