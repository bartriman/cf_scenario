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
