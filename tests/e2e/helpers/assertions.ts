import { expect, Page } from "@playwright/test";

/**
 * E2E Test Assertions Helper
 *
 * Custom assertions for common patterns in E2E tests
 */

/**
 * Assert that user is on the login page
 */
export async function expectToBeOnLoginPage(page: Page) {
  await expect(page).toHaveURL(/\/auth\/login/);
}

/**
 * Assert that user is redirected to home/dashboard
 */
export async function expectToBeOnDashboard(page: Page) {
  await expect(page).toHaveURL(/\/(index)?$/);
}

/**
 * Assert that an error message is visible
 */
export async function expectErrorMessage(page: Page, message: string | RegExp) {
  const errorElement = page.locator('[role="alert"], .error-message, .text-destructive').first();
  await expect(errorElement).toBeVisible();
  await expect(errorElement).toContainText(message);
}

/**
 * Assert that a success message is visible
 */
export async function expectSuccessMessage(page: Page, message: string | RegExp) {
  const successElement = page.locator('[role="status"], .success-message, .text-success').first();
  await expect(successElement).toBeVisible();
  await expect(successElement).toContainText(message);
}

/**
 * Assert that a table contains specific number of rows
 */
export async function expectTableRowCount(page: Page, count: number, tableSelector = "table") {
  const rows = page.locator(`${tableSelector} tbody tr`);
  await expect(rows).toHaveCount(count);
}

/**
 * Assert that element is in loading state
 */
export async function expectToBeLoading(page: Page, selector = '[aria-busy="true"], .loading') {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Assert that element is not in loading state
 */
export async function expectNotToBeLoading(page: Page, selector = '[aria-busy="true"], .loading') {
  await expect(page.locator(selector)).not.toBeVisible();
}

/**
 * Assert that download started
 */
export async function expectDownloadStarted(page: Page, filename?: string) {
  const downloadPromise = page.waitForEvent("download");
  const download = await downloadPromise;

  if (filename) {
    expect(download.suggestedFilename()).toBe(filename);
  }

  return download;
}

/**
 * Assert that dialog/modal is open
 */
export async function expectDialogToBeOpen(page: Page, dialogTitleOrContent: string | RegExp) {
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(dialogTitleOrContent);
}

/**
 * Assert that dialog/modal is closed
 */
export async function expectDialogToBeClosed(page: Page) {
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).not.toBeVisible();
}

/**
 * Wait for API call and assert response
 */
export async function expectAPICall(
  page: Page,
  urlPattern: string | RegExp,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
) {
  return page.waitForResponse(
    (response) => response.url().match(urlPattern) !== null && response.request().method() === method
  );
}
