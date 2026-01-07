import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFromImportSchema, type CreateFromImportFormValues } from "@/lib/validation/scenario.validation";
import type { CreateScenarioRequestDTO, ImportListItemDTO } from "@/types";
import { Loader2 } from "lucide-react";

interface CreateFromImportFormProps {
  companyId: string;
  onSubmit: (data: CreateScenarioRequestDTO) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function CreateFromImportForm({ companyId, onSubmit, isSubmitting, onCancel }: CreateFromImportFormProps) {
  const [imports, setImports] = useState<ImportListItemDTO[]>([]);
  const [isLoadingImports, setIsLoadingImports] = useState(true);
  const [selectedImport, setSelectedImport] = useState<ImportListItemDTO | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateFromImportFormValues>({
    resolver: zodResolver(createFromImportSchema),
    defaultValues: {
      name: "",
      import_id: 0,
      start_date: "",
      end_date: "",
    },
  });

  // Pobierz listę importów
  useEffect(() => {
    const fetchImports = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/imports?status=completed`);
        if (!response.ok) throw new Error("Failed to fetch imports");
        const data = await response.json();
        setImports(data.imports || []);
      } catch {
        // Error fetching imports - continue with empty list
      } finally {
        setIsLoadingImports(false);
      }
    };

    fetchImports();
  }, [companyId]);

  const handleImportSelect = (importId: string) => {
    const selected = imports.find((imp) => imp.id === parseInt(importId));
    if (!selected) return;

    setSelectedImport(selected);
    setValue("import_id", selected.id);

    // Auto-fill nazwy i kodu datasetu
    if (!selectedImport) {
      setValue("name", `Scenariusz ${selected.dataset_code}`);
    }
  };

  const onFormSubmit = async (data: CreateFromImportFormValues) => {
    // Przekształć dane formularza do DTO
    const requestData: CreateScenarioRequestDTO = {
      import_id: data.import_id,
      name: data.name,
      dataset_code: selectedImport?.dataset_code || "",
      start_date: data.start_date,
      end_date: data.end_date,
    };

    await onSubmit(requestData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="import-select">
          Wybierz import <span className="text-destructive">*</span>
        </Label>
        {isLoadingImports ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select onValueChange={handleImportSelect} disabled={isSubmitting || imports.length === 0}>
            <SelectTrigger id="import-select">
              <SelectValue placeholder={imports.length === 0 ? "Brak dostępnych importów" : "Wybierz import..."} />
            </SelectTrigger>
            <SelectContent>
              {imports.map((imp) => (
                <SelectItem key={imp.id} value={imp.id.toString()}>
                  {imp.dataset_code} - {imp.file_name} ({imp.valid_rows} wierszy)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.import_id && <p className="text-sm text-destructive">{errors.import_id.message}</p>}
      </div>

      {selectedImport && (
        <>
          <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kod datasetu:</span>
              <span className="font-medium">{selectedImport.dataset_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prawidłowych wierszy:</span>
              <span className="font-medium">{selectedImport.valid_rows}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utworzonych transakcji:</span>
              <span className="font-medium">{selectedImport.inserted_transactions_count}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-name">
              Nazwa scenariusza <span className="text-destructive">*</span>
            </Label>
            <Input
              id="import-name"
              {...register("name")}
              disabled={isSubmitting}
              placeholder="np. Scenariusz z importu Q1"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="import-start-date">
                Data rozpoczęcia <span className="text-destructive">*</span>
              </Label>
              <Input id="import-start-date" type="date" {...register("start_date")} disabled={isSubmitting} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-end-date">
                Data zakończenia <span className="text-destructive">*</span>
              </Label>
              <Input id="import-end-date" type="date" {...register("end_date")} disabled={isSubmitting} />
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !selectedImport}>
          {isSubmitting ? "Tworzenie..." : "Utwórz scenariusz"}
        </Button>
      </div>
    </form>
  );
}
