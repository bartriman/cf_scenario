import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { duplicateScenarioSchema, type DuplicateScenarioFormValues } from "@/lib/validation/scenario.validation";
import type { DuplicateScenarioRequestDTO } from "@/types";

interface DuplicateScenarioFormProps {
  sourceScenarioName: string;
  onSubmit: (data: DuplicateScenarioRequestDTO) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function DuplicateScenarioForm({
  sourceScenarioName,
  onSubmit,
  isSubmitting,
  onCancel,
}: DuplicateScenarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DuplicateScenarioFormValues>({
    resolver: zodResolver(duplicateScenarioSchema),
    defaultValues: {
      name: `${sourceScenarioName} (kopia)`,
    },
  });

  const onFormSubmit = async (data: DuplicateScenarioFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="duplicate-name">Nazwa nowego scenariusza</Label>
        <Input
          id="duplicate-name"
          {...register("name")}
          disabled={isSubmitting}
          placeholder="Wprowadź nazwę scenariusza"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        Nowy scenariusz będzie zawierał wszystkie transakcje i modyfikacje z oryginału
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Duplikowanie..." : "Duplikuj"}
        </Button>
      </div>
    </form>
  );
}
