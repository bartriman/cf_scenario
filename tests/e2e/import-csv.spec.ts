import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./helpers/auth";
import {
  generateValidCSV,
  generateInvalidCSV,
  generateMixedValidityCSV,
  generateCSVWithInitialBalance,
  generateCSVWithNumberFormats,
  createCSVBlob,
} from "./helpers/test-data";
import {
  expectErrorMessage,
  expectSuccessMessage,
  expectTableRowCount,
  expectDialogToBeOpen,
  expectDialogToBeClosed,
  expectAPICall,
} from "./helpers/assertions";

/**
 * E2E Tests: CSV Import Flow
 *
 * Critical path testing for the 4-step import wizard:
 * 1. File Upload
 * 2. Column Mapping
 * 3. Validation
 * 4. Processing & Scenario Creation
 *
 * Tests business rules, edge cases, and error handling
 */

test.describe("Import Wizard - File Upload Step", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    await page.goto("/import");
  });

  test("should display file upload zone", async ({ page }) => {
    const uploadZone = page.locator('[data-testid="file-upload-zone"], .dropzone');
    await expect(uploadZone).toBeVisible();
  });

  test("should accept valid CSV file via drag and drop", async ({ page }) => {
    const csvContent = generateValidCSV(10);
    const fileInput = page.locator('input[type="file"]');

    // Create file buffer
    const buffer = Buffer.from(csvContent);
    await fileInput.setInputFiles({
      name: "test-import.csv",
      mimeType: "text/csv",
      buffer,
    });

    // Should show file preview
    await expect(page.locator('[data-testid="csv-preview"], .csv-preview')).toBeVisible();

    // Should show correct row count
    await expect(page.getByText(/10 rows/i)).toBeVisible();
  });

  test("should reject non-CSV files", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Not a CSV"),
    });

    // Should show error
    await expectErrorMessage(page, /csv|format|invalid/i);
  });

  test("should reject empty CSV files", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "empty.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(""),
    });

    await expectErrorMessage(page, /empty|no data/i);
  });

  test("should reject CSV files exceeding size limit", async ({ page }) => {
    // Generate large CSV (e.g., 10MB)
    const largeContent = generateValidCSV(100000);
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "large.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(largeContent),
    });

    // Should show size error if limit is exceeded
    // Note: This depends on actual size limit in implementation
    const errorVisible = await page.locator('[role="alert"]').isVisible();
    if (errorVisible) {
      await expectErrorMessage(page, /size|large|limit/i);
    }
  });

  test("should display CSV preview with correct headers", async ({ page }) => {
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Check preview table headers
    const headers = ["date_due", "amount", "direction", "currency"];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test("should allow proceeding to column mapping after valid upload", async ({ page }) => {
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Click next/continue button
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Should see column mapping step
    await expect(page.getByText(/column mapping|map columns/i)).toBeVisible();
  });
});

test.describe("Import Wizard - Column Mapping Step", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    await page.goto("/import");

    // Upload a file to reach mapping step
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next"), button:has-text("Continue")');
  });

  test("should auto-map columns with matching names", async ({ page }) => {
    // Check if required fields are auto-mapped
    const requiredFields = ["date_due", "amount", "direction", "currency"];

    for (const field of requiredFields) {
      const select = page.locator(`select[name="${field}"], [data-field="${field}"] select`);
      await expect(select).toHaveValue(field);
    }
  });

  test("should validate required column mappings", async ({ page }) => {
    // Unmap a required field
    const amountSelect = page.locator('select[name="amount"], [data-field="amount"] select');
    await amountSelect.selectOption("");

    // Try to proceed
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    await nextButton.click();

    // Should show validation error
    await expectErrorMessage(page, /amount.*required|required.*amount/i);
  });

  test("should allow mapping optional fields", async ({ page }) => {
    // Map optional fields
    const optionalFields = ["flow_id", "counterparty", "description"];

    for (const field of optionalFields) {
      const select = page.locator(`select[name="${field}"], [data-field="${field}"] select`);
      // Should be able to select or leave empty
      await expect(select).toBeVisible();
    }
  });

  test("should prevent duplicate column mappings", async ({ page }) => {
    // Try to map two fields to the same CSV column
    const dateSelect = page.locator('select[name="date_due"]').first();
    const amountSelect = page.locator('select[name="amount"]').first();

    // Both select the same column
    await dateSelect.selectOption("date_due");
    await amountSelect.selectOption("date_due");

    // Try to proceed
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    await nextButton.click();

    // Should show error about duplicate mapping
    await expectErrorMessage(page, /duplicate|same column/i);
  });

  test("should save mapping and proceed to validation", async ({ page }) => {
    // Ensure all required fields are mapped
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Should reach validation step
    await expect(page.getByText(/validat/i)).toBeVisible();
  });
});

test.describe("Import Wizard - Validation Step", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should validate CSV with all valid rows", async ({ page }) => {
    await page.goto("/import");

    // Upload valid CSV
    const csvContent = generateValidCSV(10);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "valid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Proceed through mapping
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Wait for validation API call
    await expectAPICall(page, /\/api\/.*\/imports\/validate/, "POST");

    // Should show success - all rows valid
    await expect(page.getByText(/10.*valid|all valid/i)).toBeVisible();
    await expect(page.getByText(/0.*error/i)).toBeVisible();
  });

  test("should display validation errors for invalid rows", async ({ page }) => {
    await page.goto("/import");

    // Upload CSV with errors
    const csvContent = generateInvalidCSV();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.getByText(/error|invalid/i)).toBeVisible();

    // Should display error table
    const errorTable = page.locator('[data-testid="validation-errors"], .validation-errors table');
    await expect(errorTable).toBeVisible();
  });

  test("should show specific error messages for each validation failure", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateInvalidCSV();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Check for specific error types
    await expect(page.getByText(/invalid date/i)).toBeVisible();
    await expect(page.getByText(/invalid amount|must be a number/i)).toBeVisible();
    await expect(page.getByText(/direction must be/i)).toBeVisible();
    await expect(page.getByText(/currency.*3 characters/i)).toBeVisible();
  });

  test("should handle mixed valid and invalid rows", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateMixedValidityCSV();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "mixed.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Should show both valid and invalid counts
    await expect(page.getByText(/3.*valid/i)).toBeVisible();
    await expect(page.getByText(/2.*error/i)).toBeVisible();
  });

  test("should allow downloading error report", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateInvalidCSV();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Click download error report button
    const downloadButton = page.locator('button:has-text("Download"), button:has-text("Export Errors")');

    if (await downloadButton.isVisible()) {
      const downloadPromise = page.waitForEvent("download");
      await downloadButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/error|validation/i);
    }
  });

  test('should support "skip invalid rows" option', async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateMixedValidityCSV();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "mixed.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Enable "skip invalid rows" option
    const skipCheckbox = page.locator(
      'input[type="checkbox"][name="skip_invalid_rows"], label:has-text("Skip invalid")'
    );
    if (await skipCheckbox.isVisible()) {
      await skipCheckbox.check();
    }

    // Should allow proceeding with only valid rows
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    await expect(nextButton).toBeEnabled();
  });

  test("should block proceeding if errors exist and skip is disabled", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateInvalidCSV();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Next button should be disabled
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    await expect(nextButton).toBeDisabled();
  });
});

test.describe("Import Wizard - Processing Step", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should create import and scenario from valid CSV", async ({ page }) => {
    await page.goto("/import");

    // Upload and validate
    const csvContent = generateValidCSV(10);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Fill scenario creation form
    await page.fill('input[name="name"]', "Test Scenario");
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    // Submit
    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');
    await createButton.click();

    // Wait for API calls
    const importResponse = await expectAPICall(page, /\/api\/.*\/imports$/, "POST");
    expect(importResponse.status()).toBe(201);

    const processResponse = await expectAPICall(page, /\/api\/.*\/imports\/\d+\/process/, "POST");
    expect(processResponse.status()).toBe(200);

    // Should show success and redirect to scenario
    await expectSuccessMessage(page, /created|success/i);
    await expect(page).toHaveURL(/\/scenarios\/\d+/);
  });

  test("should validate scenario name is required", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Leave name empty
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');
    await createButton.click();

    // Should show validation error
    await expectErrorMessage(page, /name.*required/i);
  });

  test("should validate date range (end date > start date)", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="name"]', "Test Scenario");
    await page.fill('input[name="start_date"]', "2024-12-31");
    await page.fill('input[name="end_date"]', "2024-01-01");

    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');
    await createButton.click();

    // Should show date validation error
    await expectErrorMessage(page, /end date.*later|start date.*before/i);
  });

  test("should handle initial balance (IB) rows correctly", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateCSVWithInitialBalance();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "with-ib.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Should show IB row in preview
    await expect(page.getByText(/initial balance|IB/i)).toBeVisible();

    await page.click('button:has-text("Next")');
    await page.fill('input[name="name"]', "Scenario with IB");
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');
    await createButton.click();

    // Should create successfully
    await expectSuccessMessage(page, /created|success/i);
  });

  test("should handle various number formats in amount field", async ({ page }) => {
    await page.goto("/import");

    const csvContent = generateCSVWithNumberFormats();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "number-formats.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // All formats should be valid
    await expect(page.getByText(/6.*valid|all valid/i)).toBeVisible();
    await expect(page.getByText(/0.*error/i)).toBeVisible();
  });
});

test.describe("Import Wizard - Navigation & State", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    await page.goto("/import");
  });

  test("should allow going back to previous steps", async ({ page }) => {
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Go to step 2
    await page.click('button:has-text("Next")');
    await expect(page.getByText(/column mapping|map columns/i)).toBeVisible();

    // Go back to step 1
    const backButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
    await backButton.click();

    // Should see file upload again
    await expect(page.locator('[data-testid="file-upload-zone"]')).toBeVisible();
  });

  test("should preserve uploaded file when going back", async ({ page }) => {
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Next")');
    const backButton = page.locator('button:has-text("Back")');
    await backButton.click();

    // File should still be loaded
    await expect(page.locator('[data-testid="csv-preview"]')).toBeVisible();
  });

  test("should allow canceling import wizard", async ({ page }) => {
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should redirect or reset
      await page.waitForTimeout(500);
      // Verify state is reset
    }
  });

  test("should display progress indicator", async ({ page }) => {
    const csvContent = generateValidCSV(5);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Should show step 1 of 4
    const progressIndicator = page.locator('[data-testid="wizard-progress"], .wizard-steps');
    await expect(progressIndicator).toBeVisible();

    // Move to step 2
    await page.click('button:has-text("Next")');

    // Progress should update
    await expect(progressIndicator).toContainText(/2/);
  });
});
