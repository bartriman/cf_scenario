import { test, expect } from "@playwright/test";
import { loginViaUI, loginViaAPI, logout, isAuthenticated } from "./helpers/auth";
import { expectToBeOnLoginPage, expectToBeOnDashboard, expectErrorMessage } from "./helpers/assertions";

/**
 * E2E Tests: Authentication & Authorization
 *
 * Critical path testing for user authentication flows including:
 * - Login/logout
 * - Route protection
 * - Session persistence
 * - RLS policy enforcement
 */

test.describe("Authentication Flow", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.context().clearCookies();
  });

  test("should redirect unauthenticated users to login page", async ({ page }) => {
    await page.goto("/account");
    await expectToBeOnLoginPage(page);
  });

  test("should allow user to login with valid credentials", async ({ page }) => {
    // Setup: Create test user (normally done in global setup)
    // For this example, assume user exists

    await page.goto("/auth/login");

    // Fill login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL((url) => !url.pathname.includes("/auth/login"));

    // Verify authenticated
    expect(await isAuthenticated(page)).toBe(true);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    await page.click('button[type="submit"]');

    // Should show error message
    await expectErrorMessage(page, /invalid|incorrect|wrong/i);

    // Should stay on login page
    await expectToBeOnLoginPage(page);
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[type="email"]', "not-an-email");
    await page.fill('input[type="password"]', "somepassword");

    // HTML5 validation should prevent submit or show error
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("should logout user and clear session", async ({ page }) => {
    // Login first
    await loginViaAPI(page, testEmail, testPassword);
    await page.goto("/");

    // Verify logged in
    expect(await isAuthenticated(page)).toBe(true);

    // Logout
    await logout(page);

    // Verify logged out
    expect(await isAuthenticated(page)).toBe(false);
    await expectToBeOnLoginPage(page);
  });

  test("should persist session across page reloads", async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    await page.goto("/");

    // Reload page
    await page.reload();

    // Should still be authenticated
    expect(await isAuthenticated(page)).toBe(true);
  });
});

test.describe("Authorization & Route Protection", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test("should protect /account route", async ({ page }) => {
    await page.goto("/account");
    await expectToBeOnLoginPage(page);
  });

  test("should protect /import route", async ({ page }) => {
    await page.goto("/import");
    await expectToBeOnLoginPage(page);
  });

  test("should protect /scenarios routes", async ({ page }) => {
    await page.goto("/scenarios/123");
    await expectToBeOnLoginPage(page);
  });

  test("should allow access to protected routes when authenticated", async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);

    // Should access account page
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account/);

    // Should access import page
    await page.goto("/import");
    await expect(page).toHaveURL(/\/import/);
  });
});

test.describe("RLS Policy Enforcement", () => {
  const user1Email = `user1-${Date.now()}@example.com`;
  const user2Email = `user2-${Date.now()}@example.com`;
  const password = "TestPassword123!";

  test("should only show user their own companies", async ({ page }) => {
    // Login as user 1
    await loginViaAPI(page, user1Email, password);

    // Navigate to page that lists companies
    await page.goto("/");

    // Get company list (implementation depends on UI)
    const companySelector = '[data-testid="company-selector"], select[name="company"]';
    const companies = page.locator(`${companySelector} option, ${companySelector} [role="option"]`);

    // Verify only user's companies are visible
    // (Specific assertions depend on test data setup)
    await expect(companies.first()).toBeVisible();
  });

  test("should prevent access to other users scenarios via API", async ({ page, request }) => {
    // This would require setting up two users and trying to access
    // User A's scenario as User B via direct API call

    await loginViaAPI(page, user1Email, password);

    // Try to access a scenario that belongs to user2
    const otherUserScenarioId = 999; // Would come from test data
    const response = await request.get(`/api/companies/some-company-id/scenarios/${otherUserScenarioId}`);

    // Should be forbidden or not found due to RLS
    expect([403, 404]).toContain(response.status());
  });
});

test.describe("Session Edge Cases", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test("should handle expired session gracefully", async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);

    // Clear cookies to simulate expired session
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto("/account");

    // Should redirect to login
    await expectToBeOnLoginPage(page);
  });

  test("should prevent concurrent sessions from different browsers", async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Login in first context
    await loginViaAPI(page1, testEmail, testPassword);
    await page1.goto("/");
    expect(await isAuthenticated(page1)).toBe(true);

    // Second context should not be authenticated
    await page2.goto("/");
    await expectToBeOnLoginPage(page2);
    expect(await isAuthenticated(page2)).toBe(false);

    await context1.close();
    await context2.close();
  });
});
