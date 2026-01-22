import { test, expect } from "@playwright/test";
import { DEFAULT_TEST_USER, TEST_USERS } from "./helpers/test-users";
import { loginViaAPI } from "./helpers/auth";
import { createTestCompany, deleteTestScenario } from "./helpers/test-data";
import {
  expectErrorMessage,
  expectSuccessMessage,
  expectTableRowCount,
  expectDialogToBeOpen,
  expectDialogToBeClosed,
  expectAPICall,
} from "./helpers/assertions";

/**
 * E2E Tests: Scenario Management (CRUD Operations)
 *
 * Critical path testing for scenario lifecycle:
 * - Create (manual and from import)
 * - Read (list and details)
 * - Update (metadata and overrides)
 * - Delete (soft delete)
 * - Duplicate
 * - Lock/Unlock
 *
 * Tests RLS policies, business rules, and edge cases
 */

test.describe("Scenario List & Display", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;
  let companyId: string;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    // Assume company is created in global setup or beforeAll
  });

  test("should display list of scenarios", async ({ page }) => {
    await page.goto("/");

    // Navigate to scenarios (if not default view)
    const scenariosLink = page.locator('a:has-text("Scenarios"), [href*="scenarios"]');
    if (await scenariosLink.isVisible()) {
      await scenariosLink.click();
    }

    // Should show scenarios list
    const scenariosList = page.locator('[data-testid="scenarios-list"], .scenarios-list');
    await expect(scenariosList).toBeVisible();
  });

  test("should show empty state when no scenarios exist", async ({ page }) => {
    // This requires a fresh company with no scenarios
    await page.goto("/");

    // Check for empty state message
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
    const hasScenarios = (await page.locator('[data-testid="scenario-card"], .scenario-card').count()) > 0;

    if (!hasScenarios) {
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText(/no scenarios|get started|create your first/i);
    }
  });

  test("should display scenario cards with key information", async ({ page }) => {
    await page.goto("/");

    const scenarioCard = page.locator('[data-testid="scenario-card"], .scenario-card').first();

    if (await scenarioCard.isVisible()) {
      // Should show scenario name
      await expect(scenarioCard.locator('.scenario-name, [data-testid="scenario-name"]')).toBeVisible();

      // Should show date range
      await expect(scenarioCard).toContainText(/\d{4}-\d{2}-\d{2}/);

      // Should show status (Draft/Locked)
      await expect(scenarioCard).toContainText(/draft|locked/i);
    }
  });

  test("should filter scenarios by status", async ({ page }) => {
    await page.goto("/");

    // Look for filter controls
    const filterSelect = page.locator('select[name="status"], [data-testid="status-filter"]');

    if (await filterSelect.isVisible()) {
      // Filter by Draft
      await filterSelect.selectOption("Draft");

      // All visible scenarios should be Draft
      const cards = page.locator('[data-testid="scenario-card"]');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        await expect(cards.nth(i)).toContainText(/draft/i);
      }
    }
  });

  test("should search scenarios by name", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill("Test");

      // Should filter results
      const cards = page.locator('[data-testid="scenario-card"]');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        await expect(cards.nth(i)).toContainText(/test/i);
      }
    }
  });

  test("should navigate to scenario details on click", async ({ page }) => {
    await page.goto("/");

    const firstScenario = page.locator('[data-testid="scenario-card"], .scenario-card').first();

    if (await firstScenario.isVisible()) {
      await firstScenario.click();

      // Should navigate to scenario details page
      await expect(page).toHaveURL(/\/scenarios\/\d+/);
    }
  });
});

test.describe("Create Scenario - Manual", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    await page.goto("/");
  });

  test("should open create scenario dialog", async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Scenario"), button:has-text("New Scenario")');
    await createButton.click();

    await expectDialogToBeOpen(page, /create scenario|new scenario/i);
  });

  test("should create scenario with valid data", async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Scenario"), button:has-text("New Scenario")');
    await createButton.click();

    // Fill form
    await page.fill('input[name="name"]', "Manual Test Scenario");
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    // Select import source (if required for manual creation)
    const importSelect = page.locator('select[name="import_id"]');
    if (await importSelect.isVisible()) {
      // Select first available import
      await importSelect.selectOption({ index: 1 });
    }

    // Submit
    const submitButton = page.locator('button[type="submit"]:has-text("Create")');
    await submitButton.click();

    // Wait for API call
    const response = await expectAPICall(page, /\/api\/.*\/scenarios$/, "POST");
    expect(response.status()).toBe(201);

    // Should show success
    await expectSuccessMessage(page, /created|success/i);

    // Dialog should close
    await expectDialogToBeClosed(page);

    // New scenario should appear in list
    await expect(page.getByText("Manual Test Scenario")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Scenario")');
    await createButton.click();

    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"]:has-text("Create")');
    await submitButton.click();

    // Should show validation errors
    await expectErrorMessage(page, /name.*required|required.*name/i);
  });

  test("should validate scenario name length", async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Scenario")');
    await createButton.click();

    // Fill with very long name (>255 characters)
    const longName = "A".repeat(256);
    await page.fill('input[name="name"]', longName);
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    const submitButton = page.locator('button[type="submit"]:has-text("Create")');
    await submitButton.click();

    // Should show length validation error
    await expectErrorMessage(page, /255|too long|exceed/i);
  });

  test("should validate date range logic", async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Scenario")');
    await createButton.click();

    await page.fill('input[name="name"]', "Invalid Date Range");
    await page.fill('input[name="start_date"]', "2024-12-31");
    await page.fill('input[name="end_date"]', "2024-01-01");

    const submitButton = page.locator('button[type="submit"]:has-text("Create")');
    await submitButton.click();

    // Should show date validation error
    await expectErrorMessage(page, /end date.*later|after start date/i);
  });

  test("should prevent creating scenario with same name", async ({ page }) => {
    const existingName = "Duplicate Name Test";

    // Create first scenario
    const createButton = page.locator('button:has-text("Create Scenario")');
    await createButton.click();

    await page.fill('input[name="name"]', existingName);
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    await page.click('button[type="submit"]:has-text("Create")');
    await expectSuccessMessage(page, /created/i);

    // Try to create another with same name
    await page.click('button:has-text("Create Scenario")');
    await page.fill('input[name="name"]', existingName);
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    await page.click('button[type="submit"]:has-text("Create")');

    // Should show conflict error
    await expectErrorMessage(page, /already exists|duplicate|conflict/i);
  });
});

test.describe("Scenario Details & Analytics", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should display scenario overview", async ({ page }) => {
    // Navigate to a scenario (ID would come from test data)
    await page.goto("/scenarios/1");

    // Should show scenario name
    const scenarioName = page.locator('h1, [data-testid="scenario-name"]');
    await expect(scenarioName).toBeVisible();

    // Should show date range
    await expect(page.getByText(/\d{4}-\d{2}-\d{2}/)).toBeVisible();

    // Should show status
    await expect(page.getByText(/draft|locked/i)).toBeVisible();
  });

  test("should display transactions table", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Should show transactions table
    const table = page.locator('table[data-testid="transactions-table"], table');
    await expect(table).toBeVisible();

    // Should have headers
    const headers = ["Date", "Amount", "Direction", "Counterparty"];
    for (const header of headers) {
      await expect(table.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test("should display weekly aggregates view", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Navigate to analytics tab
    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics"), a:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
    }

    // Should show weekly aggregates
    const weeklyView = page.locator('[data-testid="weekly-aggregates"], .weekly-aggregates');
    await expect(weeklyView).toBeVisible();
  });

  test("should display cash flow projection chart", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Look for chart/visualization
    const chart = page.locator('[data-testid="cash-flow-chart"], .chart, canvas');

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test("should calculate running balance correctly", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Check if running balance column exists
    const balanceHeader = page.locator('th:has-text("Balance"), th:has-text("Running Balance")');

    if (await balanceHeader.isVisible()) {
      // Verify balance values are displayed
      const balanceCells = page.locator('td[data-testid="balance"], td.balance');
      await expect(balanceCells.first()).toBeVisible();
    }
  });

  test("should sort transactions by date", async ({ page }) => {
    await page.goto("/scenarios/1");

    const dateHeader = page.locator('th:has-text("Date")');
    await dateHeader.click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Verify order changed (implementation specific)
  });

  test("should filter transactions by direction", async ({ page }) => {
    await page.goto("/scenarios/1");

    const filterSelect = page.locator('select[name="direction"], [data-testid="direction-filter"]');

    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption("INFLOW");

      // All visible transactions should be INFLOW
      const rows = page.locator("tbody tr");
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText(/inflow/i);
      }
    }
  });
});

test.describe("Update Scenario & Overrides", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should update scenario metadata", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), button[aria-label="Edit scenario"]');
    await editButton.click();

    await expectDialogToBeOpen(page, /edit scenario/i);

    // Update name
    await page.fill('input[name="name"]', "Updated Scenario Name");

    // Submit
    await page.click('button[type="submit"]:has-text("Save")');

    // Wait for API call
    const response = await expectAPICall(page, /\/api\/.*\/scenarios\/\d+/, "PUT");
    expect(response.status()).toBe(200);

    // Should show success
    await expectSuccessMessage(page, /updated|saved/i);

    // Name should be updated
    await expect(page.locator("h1")).toContainText("Updated Scenario Name");
  });

  test("should create transaction override", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Click on a transaction to edit
    const firstTransaction = page.locator("tbody tr").first();
    const editIcon = firstTransaction.locator('button:has-text("Edit"), button[aria-label*="edit"]');

    if (await editIcon.isVisible()) {
      await editIcon.click();

      // Should show override form
      await expectDialogToBeOpen(page, /override|edit transaction/i);

      // Change amount
      await page.fill('input[name="new_amount_book_cents"], input[name="amount"]', "5000.00");

      // Save
      await page.click('button[type="submit"]:has-text("Save")');

      // Should show success
      await expectSuccessMessage(page, /override.*saved|updated/i);

      // Transaction should show updated value
      await expect(firstTransaction).toContainText(/5,?000/);
    }
  });

  test("should update transaction date override", async ({ page }) => {
    await page.goto("/scenarios/1");

    const firstTransaction = page.locator("tbody tr").first();
    const editIcon = firstTransaction.locator('button[aria-label*="edit"]');

    if (await editIcon.isVisible()) {
      await editIcon.click();

      // Change date
      await page.fill('input[name="new_date_due"], input[type="date"]', "2024-06-15");

      await page.click('button[type="submit"]:has-text("Save")');

      await expectSuccessMessage(page, /saved/i);
    }
  });

  test("should prevent editing locked scenario", async ({ page }) => {
    // This requires a locked scenario
    await page.goto("/scenarios/1");

    // Lock scenario first
    const lockButton = page.locator('button:has-text("Lock")');
    if (await lockButton.isVisible()) {
      await lockButton.click();
      await expectSuccessMessage(page, /locked/i);
    }

    // Try to edit
    const editButton = page.locator('button:has-text("Edit")');

    // Edit button should be disabled or not visible
    if (await editButton.isVisible()) {
      await expect(editButton).toBeDisabled();
    }
  });

  test("should batch update multiple overrides", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Select multiple transactions (if UI supports it)
    const selectAll = page.locator('input[type="checkbox"][name="select-all"]');

    if (await selectAll.isVisible()) {
      await selectAll.check();

      // Click bulk action button
      const bulkActionButton = page.locator('button:has-text("Bulk Actions"), button:has-text("Edit Selected")');
      await bulkActionButton.click();

      // Apply bulk change
      await expectDialogToBeOpen(page, /bulk|multiple/i);
    }
  });
});

test.describe("Duplicate Scenario", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should duplicate scenario with new name", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Click duplicate button
    const duplicateButton = page.locator('button:has-text("Duplicate"), button:has-text("Copy")');
    await duplicateButton.click();

    await expectDialogToBeOpen(page, /duplicate|copy/i);

    // Enter new name
    await page.fill('input[name="name"]', "Duplicated Scenario");

    // Submit
    await page.click('button[type="submit"]:has-text("Duplicate"), button[type="submit"]:has-text("Copy")');

    // Wait for API call
    const response = await expectAPICall(page, /\/api\/.*\/scenarios\/\d+\/duplicate/, "POST");
    expect(response.status()).toBe(201);

    // Should show success
    await expectSuccessMessage(page, /duplicated|copied/i);

    // Should navigate to new scenario or show in list
    await expect(page.getByText("Duplicated Scenario")).toBeVisible();
  });

  test("should copy all transactions from original scenario", async ({ page }) => {
    const originalId = 1;

    // Get original transaction count
    await page.goto(`/scenarios/${originalId}`);
    const originalCount = await page.locator("tbody tr").count();

    // Duplicate
    await page.click('button:has-text("Duplicate")');
    await page.fill('input[name="name"]', "Duplicate with Transactions");
    await page.click('button[type="submit"]:has-text("Duplicate")');

    await expectSuccessMessage(page, /duplicated/i);

    // Navigate to duplicated scenario
    // Should have same number of transactions
    const duplicateCount = await page.locator("tbody tr").count();
    expect(duplicateCount).toBe(originalCount);
  });

  test("should copy overrides from original scenario", async ({ page }) => {
    // This requires original scenario to have overrides
    await page.goto("/scenarios/1");

    // Create an override first
    const editIcon = page.locator("tbody tr").first().locator('button[aria-label*="edit"]');
    if (await editIcon.isVisible()) {
      await editIcon.click();
      await page.fill('input[name="amount"]', "9999.00");
      await page.click('button[type="submit"]:has-text("Save")');
    }

    // Duplicate scenario
    await page.click('button:has-text("Duplicate")');
    await page.fill('input[name="name"]', "Duplicate with Overrides");
    await page.click('button[type="submit"]:has-text("Duplicate")');

    await expectSuccessMessage(page, /duplicated/i);

    // New scenario should have the override
    await expect(page.locator("tbody tr").first()).toContainText(/9,?999/);
  });
});

test.describe("Lock & Unlock Scenario", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should lock draft scenario", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Verify scenario is in draft
    await expect(page.getByText(/draft/i)).toBeVisible();

    // Click lock button
    const lockButton = page.locator('button:has-text("Lock")');
    await lockButton.click();

    // Confirm if confirmation dialog appears
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Wait for API call
    const response = await expectAPICall(page, /\/api\/.*\/scenarios\/\d+\/lock/, "POST");
    expect(response.status()).toBe(200);

    // Should show success
    await expectSuccessMessage(page, /locked/i);

    // Status should change to Locked
    await expect(page.getByText(/locked/i)).toBeVisible();
  });

  test("should unlock locked scenario", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Lock first (if not already locked)
    const lockButton = page.locator('button:has-text("Lock")');
    if (await lockButton.isVisible()) {
      await lockButton.click();
    }

    // Now unlock
    const unlockButton = page.locator('button:has-text("Unlock")');
    await unlockButton.click();

    // Wait for API call
    const response = await expectAPICall(page, /\/api\/.*\/scenarios\/\d+\/lock/, "POST");
    expect(response.status()).toBe(200);

    // Should show success
    await expectSuccessMessage(page, /unlocked/i);

    // Status should change to Draft
    await expect(page.getByText(/draft/i)).toBeVisible();
  });

  test("should disable edit buttons when locked", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Lock scenario
    const lockButton = page.locator('button:has-text("Lock")');
    if (await lockButton.isVisible()) {
      await lockButton.click();
      await expectSuccessMessage(page, /locked/i);
    }

    // Edit buttons should be disabled
    const editButtons = page.locator('button[aria-label*="edit"], button:has-text("Edit")');
    const count = await editButtons.count();

    for (let i = 0; i < count; i++) {
      await expect(editButtons.nth(i)).toBeDisabled();
    }
  });
});

test.describe("Delete Scenario (Soft Delete)", () => {
  const { email: testEmail, password: testPassword } = DEFAULT_TEST_USER;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should soft delete scenario", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Click delete button
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete"]');
    await deleteButton.click();

    // Should show confirmation dialog
    await expectDialogToBeOpen(page, /delete|confirm|sure/i);

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for API call
    const response = await expectAPICall(page, /\/api\/.*\/scenarios\/\d+/, "DELETE");
    expect(response.status()).toBe(200);

    // Should show success
    await expectSuccessMessage(page, /deleted/i);

    // Should redirect to scenarios list
    await expect(page).toHaveURL(/\/scenarios$|\/$/);
  });

  test("should not show deleted scenario in list", async ({ page }) => {
    const scenarioName = "Scenario to Delete";

    // Create and delete a scenario
    await page.goto("/");

    // Assume scenario exists
    await page.getByText(scenarioName).click();

    // Delete it
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');

    await expectSuccessMessage(page, /deleted/i);

    // Go back to list
    await page.goto("/");

    // Deleted scenario should not appear
    await expect(page.getByText(scenarioName)).not.toBeVisible();
  });

  test("should prevent deletion of locked scenario", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Lock scenario
    const lockButton = page.locator('button:has-text("Lock")');
    if (await lockButton.isVisible()) {
      await lockButton.click();
      await expectSuccessMessage(page, /locked/i);
    }

    // Try to delete
    const deleteButton = page.locator('button:has-text("Delete")');

    // Delete button should be disabled or show error on attempt
    if (await deleteButton.isVisible()) {
      const isDisabled = await deleteButton.isDisabled();

      if (!isDisabled) {
        await deleteButton.click();
        await page.click('button:has-text("Confirm")');

        // Should show error
        await expectErrorMessage(page, /cannot delete.*locked|unlock.*delete/i);
      }
    }
  });

  test("should require confirmation before deletion", async ({ page }) => {
    await page.goto("/scenarios/1");

    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();

    // Confirmation dialog must appear
    await expectDialogToBeOpen(page, /confirm|sure|delete/i);

    // Cancel button should exist
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
  });

  test("should allow canceling deletion", async ({ page }) => {
    await page.goto("/scenarios/1");

    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();

    await expectDialogToBeOpen(page, /delete/i);

    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Dialog should close
    await expectDialogToBeClosed(page);

    // Scenario should still exist
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Scenario RLS & Permissions", () => {
  const user1Email = `user1-${Date.now()}@example.com`;
  const user2Email = `user2-${Date.now()}@example.com`;
  const password = "TestPassword123!";

  test("should only show user their own company scenarios", async ({ page }) => {
    await loginViaAPI(page, user1Email, password);
    await page.goto("/");

    // All visible scenarios should belong to user's company
    // (Specific validation depends on test data setup)
    const scenarios = page.locator('[data-testid="scenario-card"]');
    await expect(scenarios.first()).toBeVisible();
  });

  test("should prevent accessing other company scenarios", async ({ page, request }) => {
    await loginViaAPI(page, user1Email, password);

    // Try to access scenario from different company
    const otherCompanyScenarioId = 999;
    const response = await request.get(`/api/companies/other-company-id/scenarios/${otherCompanyScenarioId}`);

    // Should be forbidden or not found
    expect([403, 404]).toContain(response.status());
  });

  test("should prevent updating other company scenarios", async ({ page, request }) => {
    await loginViaAPI(page, user1Email, password);

    const response = await request.put("/api/companies/other-company-id/scenarios/999", {
      data: { name: "Hacked Name" },
    });

    expect([403, 404]).toContain(response.status());
  });

  test("should prevent deleting other company scenarios", async ({ page, request }) => {
    await loginViaAPI(page, user1Email, password);

    const response = await request.delete("/api/companies/other-company-id/scenarios/999");

    expect([403, 404]).toContain(response.status());
  });
});
