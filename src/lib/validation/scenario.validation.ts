import { z } from "zod";

// Schemat walidacji dla tworzenia scenariusza
export const createScenarioSchema = z
  .object({
    name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa nie może przekraczać 255 znaków"),
    import_id: z.number().int().positive("Import ID jest wymagany"),
    dataset_code: z
      .string()
      .min(1, "Kod datasetu jest wymagany")
      .regex(/^[a-zA-Z0-9_-]+$/, "Kod może zawierać tylko litery, cyfry, myślniki i podkreślenia"),
    start_date: z
      .string()
      .min(1, "Data rozpoczęcia jest wymagana")
      .refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data rozpoczęcia"),
    end_date: z
      .string()
      .min(1, "Data zakończenia jest wymagana")
      .refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data zakończenia"),
    base_scenario_id: z.number().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return start < end;
    },
    {
      message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
      path: ["end_date"],
    }
  );

// Schemat walidacji dla duplikacji scenariusza
export const duplicateScenarioSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa nie może przekraczać 255 znaków"),
});

// Schemat walidacji dla tworzenia scenariusza z importu
export const createFromImportSchema = z
  .object({
    import_id: z.number().min(1, "Wybierz import"),
    name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa nie może przekraczać 255 znaków"),
    start_date: z
      .string()
      .min(1, "Data rozpoczęcia jest wymagana")
      .refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data rozpoczęcia"),
    end_date: z
      .string()
      .min(1, "Data zakończenia jest wymagana")
      .refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data zakończenia"),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return start < end;
    },
    {
      message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
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
        message: "Nieprawidłowa data",
      }),
    new_amount_book_cents: z
      .number()
      .int("Kwota musi być liczbą całkowitą")
      .nonnegative("Kwota nie może być ujemna")
      .nullable()
      .optional(),
  })
  .refine((data) => data.new_date_due !== undefined || data.new_amount_book_cents !== undefined, {
    message: "Musisz podać przynajmniej jedną wartość do zmiany (datę lub kwotę)",
  });

// Schemat walidacji dla pojedynczego override w batch
export const batchOverrideItemSchema = z
  .object({
    flow_id: z.string().min(1, "flow_id jest wymagany"),
    new_date_due: z
      .string()
      .nullable()
      .optional()
      .refine((val) => val === null || val === undefined || !isNaN(Date.parse(val)), {
        message: "Nieprawidłowa data",
      }),
    new_amount_book_cents: z
      .number()
      .int("Kwota musi być liczbą całkowitą")
      .nonnegative("Kwota nie może być ujemna")
      .nullable()
      .optional(),
  })
  .refine((data) => data.new_date_due !== undefined || data.new_amount_book_cents !== undefined, {
    message: "Musisz podać przynajmniej jedną wartość do zmiany (datę lub kwotę)",
  });

// Schemat walidacji dla batch update overrides (POST endpoint)
export const batchUpdateOverridesSchema = z.object({
  overrides: z
    .array(batchOverrideItemSchema)
    .min(1, "Lista override'ów nie może być pusta")
    .max(100, "Maksymalna liczba override'ów w jednym batchu to 100"),
});

// Typy inferred dla walidacji override'ów
export type UpsertOverrideFormValues = z.infer<typeof upsertOverrideSchema>;
export type BatchOverrideItemFormValues = z.infer<typeof batchOverrideItemSchema>;
export type BatchUpdateOverridesFormValues = z.infer<typeof batchUpdateOverridesSchema>;
