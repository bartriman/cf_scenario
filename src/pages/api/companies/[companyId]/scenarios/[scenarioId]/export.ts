import type { APIRoute } from "astro";
import { z } from "zod";
import ExcelJS from "exceljs";

export const prerender = false;

import {
  getScenarioDetails,
  ForbiddenError,
  DatabaseError,
  ScenarioNotFoundError,
} from "@/lib/services/scenario.service";
import type { ExportWeeklySummaryDTO, ExportTransactionDTO, ExportRunningBalanceDTO } from "@/types";

/**
 * Path parameters schema
 */
const PathParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
  scenarioId: z.coerce.number().int().positive("Invalid scenario ID"),
});

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  format: z.enum(["xlsx"]).default("xlsx"),
  includeCharts: z.enum(["true", "false"]).default("true"),
});

/**
 * GET /api/companies/{companyId}/scenarios/{scenarioId}/export
 *
 * Exports scenario data to Excel file
 * - Only works for Locked scenarios
 * - Includes weekly aggregations sheet
 * - Optionally includes running balance chart
 * - Uses scenario_export_v view for data
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate path parameters
    let validatedParams;
    try {
      validatedParams = PathParamsSchema.parse({
        companyId: params.companyId,
        scenarioId: params.scenarioId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid path parameters",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Step 3: Validate query parameters
    let validatedQuery;
    try {
      validatedQuery = QueryParamsSchema.parse({
        format: url.searchParams.get("format") || undefined,
        includeCharts: url.searchParams.get("includeCharts") || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid query parameters",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Step 4: Get scenario details to verify it's Locked
    const scenario = await getScenarioDetails(supabase, validatedParams.companyId, validatedParams.scenarioId);

    // Step 5: Verify scenario is Locked
    if (scenario.status !== "Locked") {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Only locked scenarios can be exported",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Fetch export data from scenario_export_v
    // NOTE: Supabase has a default limit of 1000 rows. We need to paginate for large datasets.
    let exportData: ExportTransactionDTO[] = [];
    const PAGE_SIZE = 1000;
    let page = 0;
    let hasMore = true;

    console.log("[EXPORT DEBUG] Starting pagination for scenario:", validatedParams.scenarioId);

    while (hasMore) {
      const rangeStart = page * PAGE_SIZE;
      const rangeEnd = (page + 1) * PAGE_SIZE - 1;
      
      console.log(`[EXPORT DEBUG] Fetching page ${page}, range: ${rangeStart}-${rangeEnd}`);
      
      const { data: pageData, error: exportError } = await supabase
        .from("scenario_export_v")
        .select("*")
        .eq("company_id", validatedParams.companyId)
        .eq("scenario_id", validatedParams.scenarioId)
        .order("date_due_effective", { ascending: true })
        .order("transaction_id", { ascending: true })
        .range(rangeStart, rangeEnd);

      if (exportError) {
        console.error("[EXPORT DEBUG] Error fetching page:", exportError);
        throw new DatabaseError("Failed to fetch export data");
      }

      const recordsInPage = pageData?.length || 0;
      console.log(`[EXPORT DEBUG] Page ${page} returned ${recordsInPage} records`);

      if (!pageData || pageData.length === 0) {
        hasMore = false;
      } else {
        exportData = exportData.concat(pageData);
        hasMore = pageData.length === PAGE_SIZE;
        page++;
      }
    }

    console.log(`[EXPORT DEBUG] Pagination complete. Total records: ${exportData.length}, Pages fetched: ${page}`);

    if (!exportData || exportData.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "No transactions found for export",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 7: Fetch weekly aggregates for summary sheet
    const { data: weeklyData, error: weeklyError } = await supabase
      .from("weekly_aggregates_v")
      .select("*")
      .eq("company_id", validatedParams.companyId)
      .eq("scenario_id", validatedParams.scenarioId)
      .order("week_index", { ascending: true });

    if (weeklyError) {
      throw new DatabaseError("Failed to fetch weekly aggregates");
    }

    // Step 8: Fetch running balance data if charts are included
    let runningBalanceData: ExportRunningBalanceDTO[] | null = null;
    if (validatedQuery.includeCharts === "true") {
      // NOTE: Paginate running balance data as well
      let balanceData: ExportRunningBalanceDTO[] = [];
      let balancePage = 0;
      let hasMoreBalance = true;

      while (hasMoreBalance) {
        const { data: pageData, error: balanceError } = await supabase
          .from("running_balance_v")
          .select("*")
          .eq("company_id", validatedParams.companyId)
          .eq("scenario_id", validatedParams.scenarioId)
          .order("as_of_date", { ascending: true })
          .range(balancePage * PAGE_SIZE, (balancePage + 1) * PAGE_SIZE - 1);

        if (balanceError) {
          // Don't fail the export, just skip the chart
          runningBalanceData = null;
          hasMoreBalance = false;
        } else if (!pageData || pageData.length === 0) {
          hasMoreBalance = false;
        } else {
          balanceData = balanceData.concat(pageData);
          hasMoreBalance = pageData.length === PAGE_SIZE;
          balancePage++;
        }
      }

      if (balanceData.length > 0) {
        runningBalanceData = balanceData;
      }
    }

    // Step 9: Generate Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CashFlow Scenarios";
    workbook.created = new Date();

    // Step 10: Add weekly summary sheet
    await addWeeklySummarySheet(workbook, weeklyData || []);

    // Step 11: Add transactions detail sheet
    await addTransactionsSheet(workbook, exportData);

    // Step 12: Add running balance sheet (with chart if data available)
    if (runningBalanceData && runningBalanceData.length > 0) {
      await addRunningBalanceSheet(workbook, runningBalanceData);
    }

    // Step 13: Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Step 14: Return Excel file
    // Clean scenario name: remove .xlsx if present, replace special chars, remove duplicate underscores
    const cleanName = scenario.name
      .replace(/\.xlsx$/i, "") // Remove .xlsx extension if present
      .replace(/[^a-zA-Z0-9]/g, "_") // Replace special chars with underscore
      .replace(/_+/g, "_") // Replace multiple underscores with single one
      .replace(/^_+|_+$/g, ""); // Trim underscores from start and end
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "_");
    const filename = `scenario_${cleanName}_${dateStr}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    // Handle custom error types
    if (error instanceof ScenarioNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: error.message,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Add weekly summary sheet to workbook
 */
async function addWeeklySummarySheet(workbook: ExcelJS.Workbook, weeklyData: ExportWeeklySummaryDTO[]): Promise<void> {
  const sheet = workbook.addWorksheet("Weekly Summary");

  // Set column widths
  sheet.columns = [
    { key: "week", width: 15 },
    { key: "inflow_total", width: 18 },
    { key: "outflow_total", width: 18 },
    { key: "net_flow", width: 18 },
  ];

  // Add header
  sheet.addRow({
    week: "Week",
    inflow_total: "Inflows (PLN)",
    outflow_total: "Outflows (PLN)",
    net_flow: "Net Flow (PLN)",
  });

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Add data rows
  weeklyData.forEach((week) => {
    const inflowAmount = (week.inflow_total_book_cents || 0) / 100;
    const outflowAmount = (week.outflow_total_book_cents || 0) / 100;
    const netFlow = inflowAmount - outflowAmount;

    sheet.addRow({
      week: week.week_index === 0 ? "Initial Balance" : `Week ${week.week_index}`,
      inflow_total: inflowAmount,
      outflow_total: outflowAmount,
      net_flow: netFlow,
    });
  });

  // Format number columns
  sheet.getColumn("inflow_total").numFmt = "#,##0.00";
  sheet.getColumn("outflow_total").numFmt = "#,##0.00";
  sheet.getColumn("net_flow").numFmt = "#,##0.00";

  // Add borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });
}

/**
 * Calculate week number in YYWW format from date
 */
function calculateWeekNumber(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const isoWeek = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  // Format as YYWW
  const yy = year.toString().slice(-2);
  const ww = isoWeek.toString().padStart(2, "0");

  return `${yy}${ww}`;
}

/**
 * Add transactions detail sheet to workbook
 */
async function addTransactionsSheet(workbook: ExcelJS.Workbook, transactions: ExportTransactionDTO[]): Promise<void> {
  const sheet = workbook.addWorksheet("Transactions");

  // Set column widths
  sheet.columns = [
    { key: "week", width: 10 },
    { key: "date", width: 12 },
    { key: "direction", width: 10 },
    { key: "amount", width: 15 },
    { key: "counterparty", width: 25 },
    { key: "description", width: 40 },
    { key: "project", width: 20 },
    { key: "document", width: 20 },
    { key: "payment_source", width: 20 },
    { key: "is_overridden", width: 12 },
  ];

  // Add header
  sheet.addRow({
    week: "Week",
    date: "Date",
    direction: "Type",
    amount: "Amount (PLN)",
    counterparty: "Counterparty",
    description: "Description",
    project: "Project",
    document: "Document",
    payment_source: "Payment Source",
    is_overridden: "Modified",
  });

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Add data rows
  transactions.forEach((transaction) => {
    const amount = (transaction.amount_book_cents_effective || 0) / 100;
    const weekNumber = calculateWeekNumber(transaction.date_due_effective);

    sheet.addRow({
      week: weekNumber,
      date: transaction.date_due_effective,
      direction: transaction.direction,
      amount: amount,
      counterparty: transaction.counterparty || "",
      description: transaction.description || "",
      project: transaction.project || "",
      document: transaction.document || "",
      payment_source: transaction.payment_source || "",
      is_overridden: transaction.is_overridden ? "Yes" : "No",
    });
  });

  // Format date column
  sheet.getColumn("date").numFmt = "yyyy-mm-dd";

  // Format amount column
  sheet.getColumn("amount").numFmt = "#,##0.00";

  // Add borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });
}

/**
 * Add running balance sheet with chart to workbook
 */
async function addRunningBalanceSheet(
  workbook: ExcelJS.Workbook,
  balanceData: ExportRunningBalanceDTO[]
): Promise<void> {
  const sheet = workbook.addWorksheet("Running Balance");

  // Set column widths
  sheet.columns = [
    { key: "date", width: 12 },
    { key: "balance", width: 18 },
  ];

  // Add header
  sheet.addRow({
    date: "Date",
    balance: "Balance (PLN)",
  });

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Add data rows
  balanceData.forEach((balance) => {
    const balanceAmount = (balance.running_balance_book_cents || 0) / 100;

    sheet.addRow({
      date: balance.as_of_date,
      balance: balanceAmount,
    });
  });

  // Format date column
  sheet.getColumn("date").numFmt = "yyyy-mm-dd";

  // Format balance column
  sheet.getColumn("balance").numFmt = "#,##0.00";

  // Add borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Note: ExcelJS doesn't support adding charts directly in Node.js
  // Charts would need to be created manually in Excel after export
  // or using a different library like officegen
}
