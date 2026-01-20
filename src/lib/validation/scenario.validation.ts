import { z } from "zod";

// Schemat walidacji dla tworzenia scenariusza
export const createScenarioSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
    import_id: z.number().int().positive("Import ID is required"),
    dataset_code: z
      .string()
      .min(1, "Dataset code is required")
      .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, hyphens and underscores"),
    start_date: z
      .string()
      .min(1, "Start date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    end_date: z
      .string()
      .min(1, "End date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
    base_scenario_id: z.number().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return start < end;
    },
    {
      message: "End date must be later than start date",
      path: ["end_date"],
    }
  );

// Schemat walidacji dla duplikacji scenariusza
export const duplicateScenarioSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
});

// Schemat walidacji dla tworzenia scenariusza z importu
export const createFromImportSchema = z
  .object({
    import_id: z.number().min(1, "Select import"),
    name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
    start_date: z
      .string()
      .min(1, "Start date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    end_date: z
      .string()
      .min(1, "End date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return start < end;
    },
    {
      message: "End date must be later than start date",
      path: ["end_date"],
    }
  );

// Typy inferred z schematów
export type CreateScenarioFormValues = z.infer<typeof createScenarioSchema>;
export type DuplicateScenarioFormValues = z.infer<typeof duplicateScenarioSchema>;
export type CreateFromImportFormValues = z.infer<typeof createFromImportSchema>;

// Schemat walidacji dla upsert override (PUT endpoint)
export const upsertOverrideSchema = z
  .object({
    new_date_due: z
      .string()
      .nullable()
      .optional()
      .refine((val) => val === null || val === undefined || !isNaN(Date.parse(val)), {
        message: "Invalid date",
      }),
    new_amount_book_cents: z
      .number()
      .int("Amount must be an integer")
      .nonnegative("Amount cannot be negative")
      .nullable()
      .optional(),
  })
  .refine((data) => data.new_date_due !== undefined || data.new_amount_book_cents !== undefined, {
    message: "You must provide at least one value to change (date or amount)",
  });

// Schemat walidacji dla pojedynczego override w batch
export const batchOverrideItemSchema = z
  .object({
    flow_id: z.string().min(1, "flow_id is required"),
    new_date_due: z
      .string()
      .nullable()
      .optional()
      .refine((val) => val === null || val === undefined || !isNaN(Date.parse(val)), {
        message: "Invalid date",
      }),
    new_amount_book_cents: z
      .number()
      .int("Amount must be an integer")
      .nonnegative("Amount cannot be negative")
      .nullable()
      .optional(),
  })
  .refine((data) => data.new_date_due !== undefined || data.new_amount_book_cents !== undefined, {
    message: "You must provide at least one value to change (date or amount)",
  });

// Schema validation for batch update overrides (POST endpoint)
export const batchUpdateOverridesSchema = z.object({
  overrides: z
    .array(batchOverrideItemSchema)
    .min(1, "Override list cannot be empty")
    .max(100, "Maximum number of overrides in one batch is 100"),
});

// Typy inferred dla walidacji override'ów
export type UpsertOverrideFormValues = z.infer<typeof upsertOverrideSchema>;
export type BatchOverrideItemFormValues = z.infer<typeof batchOverrideItemSchema>;
export type BatchUpdateOverridesFormValues = z.infer<typeof batchUpdateOverridesSchema>;
