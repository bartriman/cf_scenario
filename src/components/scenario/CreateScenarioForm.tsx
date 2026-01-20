import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createScenarioSchema, type CreateScenarioFormValues } from "@/lib/validation/scenario.validation";
import type { CreateScenarioRequestDTO } from "@/types";

interface CreateScenarioFormProps {
  companyId: string;
  onSubmit: (data: CreateScenarioRequestDTO) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function CreateScenarioForm({ onSubmit, isSubmitting, onCancel }: CreateScenarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateScenarioFormValues>({
    resolver: zodResolver(createScenarioSchema),
    defaultValues: {
      name: "",
      dataset_code: "",
      start_date: "",
      end_date: "",
    },
  });

  const onFormSubmit = async (data: CreateScenarioFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="create-name">
          Scenario name <span className="text-destructive">*</span>
        </Label>
        <Input id="create-name" {...register("name")} disabled={isSubmitting} placeholder="e.g. Q1 2026 Plan" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="create-dataset-code">
          Dataset code <span className="text-destructive">*</span>
        </Label>
        <Input
          id="create-dataset-code"
          {...register("dataset_code")}
          disabled={isSubmitting}
          placeholder="e.g. DS-2026-Q1"
        />
        {errors.dataset_code && <p className="text-sm text-destructive">{errors.dataset_code.message}</p>}
        <p className="text-xs text-muted-foreground">Only letters, numbers, hyphens and underscores</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="create-start-date">
            Start date <span className="text-destructive">*</span>
          </Label>
          <Input id="create-start-date" type="date" {...register("start_date")} disabled={isSubmitting} />
          {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-end-date">
            End date <span className="text-destructive">*</span>
          </Label>
          <Input id="create-end-date" type="date" {...register("end_date")} disabled={isSubmitting} />
          {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create scenario"}
        </Button>
      </div>
    </form>
  );
}
