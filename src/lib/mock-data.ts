import type { Scenario, WeeklyAggregateVM, RunningBalancePoint } from "@/types";

/**
 * Mock data for demo mode (non-authenticated users)
 * This data represents a sample company with 4 weeks of cash flow transactions
 */

// Demo scenario metadata
export const DEMO_SCENARIO: Scenario = {
  id: 0,
  name: "Demo Scenario - Q1 2026",
  company_id: "demo-company",
  dataset_code: "DEMO_2026_Q1",
  status: "Draft",
  created_at: "2026-01-01T00:00:00Z",
  locked_at: null,
  locked_by: null,
  base_scenario_id: null,
  deleted_at: null,
  end_date: "2026-02-02",
  import_id: 0,
  start_date: "2026-01-06",
};

// Demo weekly aggregates with realistic transactions
export const DEMO_WEEKLY_AGGREGATES: WeeklyAggregateVM[] = [
  {
    week_index: 1,
    week_label: "Week 1 (Jan 6-12)",
    week_start_date: "2026-01-06",
    inflow_total_book_cents: 4850000, // $48,500
    outflow_total_book_cents: 2750000, // $27,500
    transactions: [
      // Inflows
      {
        id: "demo-flow-1",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 2500000, // $25,000
        counterparty: "Acme Corporation",
        description: "Invoice #2024-001 - Consulting Services",
        date_due: "2026-01-08",
      },
      {
        id: "demo-flow-2",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1500000, // $15,000
        counterparty: "TechStart Inc.",
        description: "Monthly Retainer - January",
        date_due: "2026-01-10",
      },
      {
        id: "demo-flow-3",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 850000, // $8,500
        counterparty: "Global Solutions Ltd",
        description: "Project Milestone Payment",
        date_due: "2026-01-12",
      },
      // Outflows
      {
        id: "demo-flow-4",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 1200000, // $12,000
        counterparty: "Office Supplies Co.",
        description: "Equipment Purchase",
        date_due: "2026-01-07",
      },
      {
        id: "demo-flow-5",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 800000, // $8,000
        counterparty: "Rent Holdings LLC",
        description: "Office Rent - January",
        date_due: "2026-01-09",
      },
      {
        id: "demo-flow-6",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 450000, // $4,500
        counterparty: "Cloud Services Provider",
        description: "Monthly Subscription",
        date_due: "2026-01-11",
      },
      {
        id: "demo-flow-7",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 300000, // $3,000
        counterparty: "Marketing Agency",
        description: "Social Media Management",
        date_due: "2026-01-12",
      },
    ],
  },
  {
    week_index: 2,
    week_label: "Week 2 (Jan 13-19)",
    week_start_date: "2026-01-13",
    inflow_total_book_cents: 3200000, // $32,000
    outflow_total_book_cents: 3850000, // $38,500
    transactions: [
      // Inflows
      {
        id: "demo-flow-8",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1800000, // $18,000
        counterparty: "Enterprise Client XYZ",
        description: "Quarterly Payment - Q1",
        date_due: "2026-01-15",
      },
      {
        id: "demo-flow-9",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1400000, // $14,000
        counterparty: "Startup Ventures",
        description: "Development Services",
        date_due: "2026-01-17",
      },
      // Outflows
      {
        id: "demo-flow-10",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 2000000, // $20,000
        counterparty: "Payroll Services Inc.",
        description: "Employee Salaries - January",
        date_due: "2026-01-15",
      },
      {
        id: "demo-flow-11",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 950000, // $9,500
        counterparty: "Insurance Provider",
        description: "Business Insurance Premium",
        date_due: "2026-01-16",
      },
      {
        id: "demo-flow-12",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 600000, // $6,000
        counterparty: "Legal Advisory LLC",
        description: "Contract Review Services",
        date_due: "2026-01-18",
      },
      {
        id: "demo-flow-13",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 300000, // $3,000
        counterparty: "Utilities Company",
        description: "Electricity & Internet",
        date_due: "2026-01-19",
      },
    ],
  },
  {
    week_index: 3,
    week_label: "Week 3 (Jan 20-26)",
    week_start_date: "2026-01-20",
    inflow_total_book_cents: 5500000, // $55,000
    outflow_total_book_cents: 2100000, // $21,000
    transactions: [
      // Inflows
      {
        id: "demo-flow-14",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 3000000, // $30,000
        counterparty: "Major Client Corp",
        description: "Invoice #2024-045 - Full Stack Development",
        date_due: "2026-01-22",
      },
      {
        id: "demo-flow-15",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1500000, // $15,000
        counterparty: "TechStart Inc.",
        description: "Monthly Retainer - February (Early Payment)",
        date_due: "2026-01-24",
      },
      {
        id: "demo-flow-16",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1000000, // $10,000
        counterparty: "E-commerce Platform",
        description: "API Integration Services",
        date_due: "2026-01-26",
      },
      // Outflows
      {
        id: "demo-flow-17",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 850000, // $8,500
        counterparty: "Software Licenses Ltd",
        description: "Annual Software Licenses",
        date_due: "2026-01-21",
      },
      {
        id: "demo-flow-18",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 750000, // $7,500
        counterparty: "Professional Training",
        description: "Employee Development Program",
        date_due: "2026-01-23",
      },
      {
        id: "demo-flow-19",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 500000, // $5,000
        counterparty: "Travel Agency",
        description: "Client Meeting Expenses",
        date_due: "2026-01-25",
      },
    ],
  },
  {
    week_index: 4,
    week_label: "Week 4 (Jan 27-Feb 2)",
    week_start_date: "2026-01-27",
    inflow_total_book_cents: 2800000, // $28,000
    outflow_total_book_cents: 3200000, // $32,000
    transactions: [
      // Inflows
      {
        id: "demo-flow-20",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1600000, // $16,000
        counterparty: "Retail Chain Inc.",
        description: "POS Integration Project",
        date_due: "2026-01-29",
      },
      {
        id: "demo-flow-21",
        type: "transaction",
        direction: "INFLOW",
        amount_book_cents: 1200000, // $12,000
        counterparty: "Healthcare Provider",
        description: "System Maintenance Fee",
        date_due: "2026-01-31",
      },
      // Outflows
      {
        id: "demo-flow-22",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 1500000, // $15,000
        counterparty: "Tax Advisor Services",
        description: "Q4 2025 Tax Preparation",
        date_due: "2026-01-28",
      },
      {
        id: "demo-flow-23",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 900000, // $9,000
        counterparty: "Equipment Rental Co.",
        description: "Server Hosting & Infrastructure",
        date_due: "2026-01-30",
      },
      {
        id: "demo-flow-24",
        type: "transaction",
        direction: "OUTFLOW",
        amount_book_cents: 800000, // $8,000
        counterparty: "Rent Holdings LLC",
        description: "Office Rent - February",
        date_due: "2026-02-01",
      },
    ],
  },
];

// Demo running balance (cumulative cash flow)
export const DEMO_RUNNING_BALANCE: RunningBalancePoint[] = [
  { date: "2026-01-06", balance: 100000.0 }, // Starting balance: $100,000
  { date: "2026-01-07", balance: 88000.0 }, // -$12,000
  { date: "2026-01-08", balance: 113000.0 }, // +$25,000
  { date: "2026-01-09", balance: 105000.0 }, // -$8,000
  { date: "2026-01-10", balance: 120000.0 }, // +$15,000
  { date: "2026-01-11", balance: 115500.0 }, // -$4,500
  { date: "2026-01-12", balance: 121000.0 }, // +$8,500 -$3,000
  { date: "2026-01-13", balance: 121000.0 }, // No change
  { date: "2026-01-14", balance: 121000.0 }, // No change
  { date: "2026-01-15", balance: 119000.0 }, // +$18,000 -$20,000
  { date: "2026-01-16", balance: 109500.0 }, // -$9,500
  { date: "2026-01-17", balance: 123500.0 }, // +$14,000
  { date: "2026-01-18", balance: 117500.0 }, // -$6,000
  { date: "2026-01-19", balance: 114500.0 }, // -$3,000
  { date: "2026-01-20", balance: 114500.0 }, // No change
  { date: "2026-01-21", balance: 106000.0 }, // -$8,500
  { date: "2026-01-22", balance: 136000.0 }, // +$30,000
  { date: "2026-01-23", balance: 128500.0 }, // -$7,500
  { date: "2026-01-24", balance: 143500.0 }, // +$15,000
  { date: "2026-01-25", balance: 138500.0 }, // -$5,000
  { date: "2026-01-26", balance: 148500.0 }, // +$10,000
  { date: "2026-01-27", balance: 148500.0 }, // No change
  { date: "2026-01-28", balance: 133500.0 }, // -$15,000
  { date: "2026-01-29", balance: 149500.0 }, // +$16,000
  { date: "2026-01-30", balance: 140500.0 }, // -$9,000
  { date: "2026-01-31", balance: 152500.0 }, // +$12,000
  { date: "2026-02-01", balance: 144500.0 }, // -$8,000
  { date: "2026-02-02", balance: 144500.0 }, // No change
];

// Base currency for demo
export const DEMO_BASE_CURRENCY = "USD";

// LocalStorage key for demo modifications
export const DEMO_STORAGE_KEY = "demo_scenario_modifications";

/**
 * Get demo data from localStorage if available, otherwise return initial data
 */
export function getDemoData(): {
  scenario: Scenario;
  weeklyAggregates: WeeklyAggregateVM[];
  runningBalance: RunningBalancePoint[];
} {
  if (typeof window === "undefined") {
    return {
      scenario: DEMO_SCENARIO,
      weeklyAggregates: DEMO_WEEKLY_AGGREGATES,
      runningBalance: DEMO_RUNNING_BALANCE,
    };
  }

  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        scenario: DEMO_SCENARIO,
        weeklyAggregates: parsed.weeklyAggregates || DEMO_WEEKLY_AGGREGATES,
        runningBalance: parsed.runningBalance || DEMO_RUNNING_BALANCE,
      };
    }
  } catch {
    // Silently fall back to initial data if localStorage fails
  }

  return {
    scenario: DEMO_SCENARIO,
    weeklyAggregates: DEMO_WEEKLY_AGGREGATES,
    runningBalance: DEMO_RUNNING_BALANCE,
  };
}

/**
 * Save demo modifications to localStorage
 */
export function saveDemoData(weeklyAggregates: WeeklyAggregateVM[], runningBalance: RunningBalancePoint[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        weeklyAggregates,
        runningBalance,
        lastModified: new Date().toISOString(),
      })
    );
  } catch {
    // Silently ignore localStorage save errors
  }
}

/**
 * Reset demo data to initial state
 */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Silently ignore localStorage reset errors
  }
}
