import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/db/database.types";

/**
 * E2E Test Data Helper
 *
 * Utilities for creating and managing test data in E2E tests
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

export interface TestCompany {
  id: string;
  name: string;
}

export interface TestScenario {
  id: number;
  name: string;
  company_id: string;
}

/**
 * Creates a test company for E2E testing
 */
export async function createTestCompany(
  userId: string,
  companyName = `Test Company ${Date.now()}`
): Promise<TestCompany> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Create company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: companyName })
    .select()
    .single();

  if (companyError) throw companyError;

  // Add user as company member
  const { error: memberError } = await supabase.from("company_members").insert({
    company_id: company.id,
    user_id: userId,
    role: "admin",
  });

  if (memberError) throw memberError;

  return {
    id: company.id,
    name: company.name,
  };
}

/**
 * Generates valid CSV content for import testing
 */
export function generateValidCSV(rows = 10): string {
  const headers = "date_due,amount,direction,currency,flow_id,counterparty,description,project,document,payment_source";
  const dataRows: string[] = [];

  for (let i = 0; i < rows; i++) {
    const date = new Date(2024, 0, i + 1).toISOString().split("T")[0];
    const amount = (Math.random() * 10000).toFixed(2);
    const direction = i % 3 === 0 ? "INFLOW" : "OUTFLOW";
    const currency = "PLN";
    const flowId = `FLOW_${i}`;
    const counterparty = `Contractor ${i}`;
    const description = `Transaction ${i}`;
    const project = i % 2 === 0 ? `Project A` : `Project B`;
    const document = `INV/${i + 1}/2024`;
    const paymentSource = "Bank Transfer";

    dataRows.push(
      `${date},${amount},${direction},${currency},${flowId},${counterparty},${description},${project},${document},${paymentSource}`
    );
  }

  return [headers, ...dataRows].join("\n");
}

/**
 * Generates CSV with initial balance row
 */
export function generateCSVWithInitialBalance(): string {
  return `date_due,amount,direction,currency,flow_id,counterparty,description,project,document,payment_source
2024-01-01,10000.00,IB,PLN,,,Initial Balance,,,
2024-01-05,5000.00,INFLOW,PLN,FLOW_1,Client A,Payment received,Project X,INV/1/2024,Bank Transfer
2024-01-10,2000.00,OUTFLOW,PLN,FLOW_2,Supplier B,Office supplies,Project X,PO/1/2024,Bank Transfer`;
}

/**
 * Generates CSV with validation errors
 */
export function generateInvalidCSV(): string {
  return `date_due,amount,direction,currency,flow_id,counterparty,description,project,document,payment_source
invalid-date,5000.00,INFLOW,PLN,FLOW_1,Client A,Payment,Project X,INV/1,Bank
2024-01-05,not-a-number,OUTFLOW,PLN,FLOW_2,Supplier B,Purchase,Project Y,PO/1,Bank
2024-01-10,3000.00,INVALID_DIR,PLN,FLOW_3,Client C,Service,Project Z,INV/2,Bank
2024-01-15,4000.00,INFLOW,US,FLOW_4,Client D,Payment,Project X,INV/3,Bank`;
}

/**
 * Generates CSV with mixed valid and invalid rows
 */
export function generateMixedValidityCSV(): string {
  return `date_due,amount,direction,currency,flow_id,counterparty,description,project,document,payment_source
2024-01-01,1000.00,INFLOW,PLN,FLOW_1,Client A,Valid payment,Project X,INV/1,Bank
invalid-date,2000.00,INFLOW,PLN,FLOW_2,Client B,Invalid date,Project Y,INV/2,Bank
2024-01-03,3000.00,OUTFLOW,PLN,FLOW_3,Supplier A,Valid purchase,Project X,PO/1,Bank
2024-01-04,not-a-number,OUTFLOW,PLN,FLOW_4,Supplier B,Invalid amount,Project Y,PO/2,Bank
2024-01-05,5000.00,INFLOW,PLN,FLOW_5,Client C,Valid payment,Project Z,INV/3,Bank`;
}

/**
 * Generates CSV with different number formats
 */
export function generateCSVWithNumberFormats(): string {
  return `date_due,amount,direction,currency,flow_id,counterparty,description,project,document,payment_source
2024-01-01,1234.56,INFLOW,PLN,FLOW_1,Client A,English format,Project X,INV/1,Bank
2024-01-02,"1,234.56",INFLOW,PLN,FLOW_2,Client B,English with thousands,Project X,INV/2,Bank
2024-01-03,"1234,56",INFLOW,PLN,FLOW_3,Client C,Polish format,Project X,INV/3,Bank
2024-01-04,"1 234,56",INFLOW,PLN,FLOW_4,Client D,Polish with spaces,Project X,INV/4,Bank
2024-01-05,(500.00),OUTFLOW,PLN,FLOW_5,Supplier A,Negative in parentheses,Project Y,PO/1,Bank
2024-01-06,-750.00,OUTFLOW,PLN,FLOW_6,Supplier B,Negative with minus,Project Y,PO/2,Bank`;
}

/**
 * Creates a CSV file blob for upload testing
 */
export function createCSVBlob(content: string, filename = "test-import.csv"): File {
  return new File([content], filename, { type: "text/csv" });
}

/**
 * Cleanup: Delete test company and all related data
 */
export async function deleteTestCompany(companyId: string) {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Supabase will cascade delete related records via foreign keys
  const { error } = await supabase.from("companies").delete().eq("id", companyId);

  if (error) throw error;
}

/**
 * Cleanup: Delete test scenario
 */
export async function deleteTestScenario(scenarioId: number) {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase.from("scenarios").delete().eq("id", scenarioId);

  if (error) throw error;
}
