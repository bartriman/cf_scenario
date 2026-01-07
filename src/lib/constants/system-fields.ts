import type { SystemField } from "@/types";

// Konfiguracja pól systemowych dla mapowania CSV
export const SYSTEM_FIELDS: SystemField[] = [
  {
    key: "date_due",
    label: "Data płatności",
    required: true,
    description: "Format: YYYY-MM-DD",
  },
  {
    key: "amount",
    label: "Kwota",
    required: true,
    description: "Liczba dodatnia",
  },
  {
    key: "direction",
    label: "Kierunek",
    required: true,
    description: "INFLOW lub OUTFLOW",
  },
  {
    key: "currency",
    label: "Waluta",
    required: true,
    description: "Kod ISO (np. EUR, USD)",
  },
  {
    key: "flow_id",
    label: "ID transakcji",
    required: false,
    description: "Unikalny identyfikator (opcjonalnie)",
  },
  {
    key: "counterparty",
    label: "Kontrahent",
    required: false,
    description: "Nazwa kontrahenta (opcjonalnie)",
  },
  {
    key: "description",
    label: "Opis",
    required: false,
    description: "Opis transakcji (opcjonalnie)",
  },
  {
    key: "project",
    label: "Projekt",
    required: false,
    description: "Nazwa projektu (opcjonalnie)",
  },
  {
    key: "document",
    label: "Nr dokumentu",
    required: false,
    description: "Numer dokumentu (opcjonalnie)",
  },
  {
    key: "payment_source",
    label: "Źródło płatności",
    required: false,
    description: "Źródło płatności (opcjonalnie)",
  },
];
