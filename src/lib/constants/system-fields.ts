import type { SystemField } from "@/types";

// Konfiguracja pól systemowych dla mapowania CSV
export const SYSTEM_FIELDS: SystemField[] = [
  {
    key: "date_due",
    label: "Payment date",
    required: true,
    description: "Format: YYYY-MM-DD",
  },
  {
    key: "amount",
    label: "Amount",
    required: true,
    description: "Positive number",
  },
  {
    key: "direction",
    label: "Direction",
    required: true,
    description: "INFLOW or OUTFLOW",
  },
  {
    key: "currency",
    label: "Currency",
    required: true,
    description: "ISO code (e.g. EUR, USD)",
  },
  {
    key: "flow_id",
    label: "Transaction ID",
    required: false,
    description: "Unique identifier (optional)",
  },
  {
    key: "counterparty",
    label: "Counterparty",
    required: false,
    description: "Counterparty name (optional)",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    description: "Transaction description (optional)",
  },
  {
    key: "project",
    label: "Project",
    required: false,
    description: "Project name (optional)",
  },
  {
    key: "document",
    label: "Document No.",
    required: false,
    description: "Document number (optional)",
  },
  {
    key: "payment_source",
    label: "Payment source",
    required: false,
    description: "Payment source (optional)",
  },
];
