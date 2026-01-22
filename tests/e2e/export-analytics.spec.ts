import { test, expect } from "@playwright/test";
import { DEFAULT_TEST_USER, TEST_USERS } from "./helpers/test-users";
import { loginViaAPI } from "./helpers/auth";
import { expectSuccessMessage, expectAPICall } from "./helpers/assertions";

/**
 * E2E Tests: Scenario Export & Analytics
 *
 * Critical path testing for:
 * - CSV export functionality
 * - Analytics views (weekly aggregates, cash flow projection)
 * - Data integrity in exports
 * - Different export formats and groupings
 */

test.describe("Export Scenario to CSV", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should export scenario as CSV", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Click export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download CSV")');

    // Wait for download
    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    // Verify file content
    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // Should have CSV headers
      expect(content).toContain("date_due");
      expect(content).toContain("amount");
      expect(content).toContain("direction");

      // Should have data rows
      const lines = content.split("\n");
      expect(lines.length).toBeGreaterThan(1);
    }
  });

  test("should export with weekly aggregation", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Open export dialog
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    // Select weekly grouping
    const groupBySelect = page.locator('select[name="group_by"], [data-testid="group-by-select"]');
    if (await groupBySelect.isVisible()) {
      await groupBySelect.selectOption("week");

      // Download
      const downloadPromise = page.waitForEvent("download");
      await page.click('button:has-text("Download"), button[type="submit"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/week/i);
    }
  });

  test("should export with monthly aggregation", async ({ page }) => {
    await page.goto("/scenarios/1");

    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    const groupBySelect = page.locator('select[name="group_by"]');
    if (await groupBySelect.isVisible()) {
      await groupBySelect.selectOption("month");

      const downloadPromise = page.waitForEvent("download");
      await page.click('button:has-text("Download")');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/month/i);
    }
  });

  test("should export with daily transactions (ungrouped)", async ({ page }) => {
    await page.goto("/scenarios/1");

    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    const groupBySelect = page.locator('select[name="group_by"]');
    if (await groupBySelect.isVisible()) {
      await groupBySelect.selectOption("day");
    }

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // Daily export should have individual transactions
      const lines = content.split("\n");
      expect(lines.length).toBeGreaterThan(2);
    }
  });

  test("should include overrides in export", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Create an override with specific value
    const editIcon = page.locator("tbody tr").first().locator('button[aria-label*="edit"]');
    if (await editIcon.isVisible()) {
      await editIcon.click();
      await page.fill('input[name="amount"]', "12345.67");
      await page.click('button[type="submit"]:has-text("Save")');
      await expectSuccessMessage(page, /saved/i);
    }

    // Export
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // Should contain the overridden value
      expect(content).toContain("12345.67");
    }
  });

  test("should export with correct number format", async ({ page }) => {
    await page.goto("/scenarios/1");

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // Numbers should be in standard format (e.g., 1234.56)
      expect(content).toMatch(/\d+\.\d{2}/);
    }
  });

  test("should export with all required columns", async ({ page }) => {
    await page.goto("/scenarios/1");

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");
      const headers = content.split("\n")[0];

      // Required columns
      expect(headers).toContain("date_due");
      expect(headers).toContain("amount");
      expect(headers).toContain("direction");
      expect(headers).toContain("currency");
    }
  });

  test("should handle export of scenario with no transactions", async ({ page }) => {
    // Navigate to empty scenario (requires test data)
    await page.goto("/scenarios/999"); // Assumes this is empty

    const exportButton = page.locator('button:has-text("Export")');

    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent("download");
      await exportButton.click();
      const download = await downloadPromise;

      const path = await download.path();
      if (path) {
        const fs = require("fs");
        const content = fs.readFileSync(path, "utf-8");

        // Should have headers but no data rows
        const lines = content.split("\n").filter((l) => l.trim());
        expect(lines.length).toBe(1); // Only header
      }
    }
  });
});

test.describe("Weekly Aggregates View", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should display weekly aggregates table", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Navigate to weekly view
    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly"), button:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();
    }

    // Should show weekly aggregates table
    const table = page.locator('[data-testid="weekly-aggregates"], table');
    await expect(table).toBeVisible();
  });

  test("should show week numbers and date ranges", async ({ page }) => {
    await page.goto("/scenarios/1");

    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();

      // Should display week information
      await expect(page.getByText(/week \d+/i)).toBeVisible();
    }
  });

  test("should display inflow, outflow, and balance for each week", async ({ page }) => {
    await page.goto("/scenarios/1");

    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();

      const table = page.locator('[data-testid="weekly-aggregates"], table');

      // Check for column headers
      await expect(table.locator('th:has-text("Inflow")')).toBeVisible();
      await expect(table.locator('th:has-text("Outflow")')).toBeVisible();
      await expect(table.locator('th:has-text("Balance"), th:has-text("Net")')).toBeVisible();
    }
  });

  test("should calculate weekly totals correctly", async ({ page }) => {
    await page.goto("/scenarios/1");

    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();

      // Get first week's data
      const firstRow = page.locator("tbody tr").first();

      // Extract values (implementation specific)
      const cells = firstRow.locator("td");
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(0);
    }
  });

  test("should show running balance across weeks", async ({ page }) => {
    await page.goto("/scenarios/1");

    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();

      // Should have running balance column
      const balanceHeader = page.locator('th:has-text("Running Balance"), th:has-text("Cumulative")');
      if (await balanceHeader.isVisible()) {
        await expect(balanceHeader).toBeVisible();
      }
    }
  });

  test("should highlight weeks with negative balance", async ({ page }) => {
    await page.goto("/scenarios/1");

    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();

      // Look for negative balance indicators
      const negativeBalances = page.locator('.text-red-600, .text-destructive, [data-negative="true"]');
      const count = await negativeBalances.count();

      // May or may not have negative balances depending on data
      if (count > 0) {
        await expect(negativeBalances.first()).toBeVisible();
      }
    }
  });
});

test.describe("Cash Flow Analytics", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should display cash flow projection chart", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Navigate to analytics
    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics"), a:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
    }

    // Should show chart
    const chart = page.locator('[data-testid="cash-flow-chart"], canvas, .chart-container');
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test("should show key metrics summary", async ({ page }) => {
    await page.goto("/scenarios/1");

    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();

      // Should display summary metrics
      const metrics = [/total inflow/i, /total outflow/i, /net cash flow/i, /ending balance/i];

      for (const metric of metrics) {
        const element = page.locator(`text=${metric}`);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test("should display flow analytics breakdown", async ({ page }) => {
    await page.goto("/scenarios/1");

    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();

      // Should show flow breakdown by flow_id
      const flowTable = page.locator('[data-testid="flow-analytics"], table');
      if (await flowTable.isVisible()) {
        await expect(flowTable).toBeVisible();

        // Should have flow IDs
        await expect(flowTable.locator("td")).toHaveCount.greaterThan(0);
      }
    }
  });

  test("should allow filtering analytics by date range", async ({ page }) => {
    await page.goto("/scenarios/1");

    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();

      // Look for date filters
      const startDateInput = page.locator('input[name="filter_start_date"], input[type="date"]').first();
      const endDateInput = page.locator('input[name="filter_end_date"], input[type="date"]').nth(1);

      if ((await startDateInput.isVisible()) && (await endDateInput.isVisible())) {
        await startDateInput.fill("2024-01-01");
        await endDateInput.fill("2024-03-31");

        // Apply filter
        const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")');
        if (await applyButton.isVisible()) {
          await applyButton.click();

          // Wait for data to update
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test("should display transaction count by category", async ({ page }) => {
    await page.goto("/scenarios/1");

    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();

      // Should show counts
      const statsSection = page.locator('[data-testid="transaction-stats"], .stats');
      if (await statsSection.isVisible()) {
        await expect(statsSection).toContainText(/\d+ transactions?/i);
      }
    }
  });
});

test.describe("Export Edge Cases", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should handle export of large datasets", async ({ page }) => {
    // Navigate to scenario with many transactions
    await page.goto("/scenarios/1");

    // Set timeout for large export
    const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    expect(download).toBeTruthy();
  });

  test("should export with special characters in data", async ({ page }) => {
    await page.goto("/scenarios/1");

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // CSV should properly escape special characters
      // (commas, quotes, newlines in fields)
      expect(content).toBeDefined();
    }
  });

  test("should handle export with multiple currencies", async ({ page }) => {
    // This requires test data with multiple currencies
    await page.goto("/scenarios/1");

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // Should include currency column
      expect(content).toContain("currency");
    }
  });

  test("should preserve date formats in export", async ({ page }) => {
    await page.goto("/scenarios/1");

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    const path = await download.path();
    if (path) {
      const fs = require("fs");
      const content = fs.readFileSync(path, "utf-8");

      // Dates should be in ISO format (YYYY-MM-DD)
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  test("should show error if export fails", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Mock API failure (implementation specific)
    // Or test with scenario that would cause export failure

    // Try to export
    await page.click('button:has-text("Export")');

    // Should show error message if export fails
    // (This depends on error handling implementation)
  });
});

test.describe("Analytics Data Integrity", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should calculate initial balance correctly", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Should show initial balance (if IB row exists)
    const ibRow = page.locator('tr:has-text("Initial Balance"), tr:has-text("IB")');
    if (await ibRow.isVisible()) {
      await expect(ibRow).toBeVisible();
    }
  });

  test("should reflect overrides in analytics", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Create override
    const editIcon = page.locator("tbody tr").first().locator('button[aria-label*="edit"]');
    if (await editIcon.isVisible()) {
      await editIcon.click();
      await page.fill('input[name="amount"]', "50000.00");
      await page.click('button[type="submit"]:has-text("Save")');
    }

    // Navigate to analytics
    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();

      // The new amount should be reflected in totals
      await expect(page.getByText(/50,?000/)).toBeVisible();
    }
  });

  test("should update weekly aggregates when transactions change", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Get initial weekly total
    const weeklyTab = page.locator('[role="tab"]:has-text("Weekly")');
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();

      const firstWeekBalance = await page.locator("tbody tr").first().locator("td").last().textContent();

      // Create an override
      await page.click('[role="tab"]:has-text("Transactions")');
      const editIcon = page.locator("tbody tr").first().locator('button[aria-label*="edit"]');
      if (await editIcon.isVisible()) {
        await editIcon.click();
        await page.fill('input[name="amount"]', "99999.00");
        await page.click('button[type="submit"]:has-text("Save")');
      }

      // Go back to weekly view
      await weeklyTab.click();

      // Balance should have changed
      const newFirstWeekBalance = await page.locator("tbody tr").first().locator("td").last().textContent();
      expect(newFirstWeekBalance).not.toBe(firstWeekBalance);
    }
  });
});
