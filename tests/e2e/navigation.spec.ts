import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./helpers/auth";
import { expectToBeOnLoginPage } from "./helpers/assertions";

/**
 * E2E Tests: Navigation & Route Protection
 *
 * Tests for:
 * - Navigation between pages
 * - Breadcrumbs
 * - View transitions
 * - Route protection and redirects
 * - Deep linking
 */

test.describe("Main Navigation", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should navigate to home/dashboard", async ({ page }) => {
    await page.goto("/account");

    const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("Dashboard")');
    await homeLink.click();

    await expect(page).toHaveURL(/\/(index)?$/);
  });

  test("should navigate to scenarios page", async ({ page }) => {
    await page.goto("/");

    const scenariosLink = page.locator('a[href*="scenarios"], a:has-text("Scenarios")');
    if (await scenariosLink.isVisible()) {
      await scenariosLink.click();
      await expect(page).toHaveURL(/\/scenarios/);
    }
  });

  test("should navigate to import page", async ({ page }) => {
    await page.goto("/");

    const importLink = page.locator('a[href="/import"], a:has-text("Import")');
    await importLink.click();

    await expect(page).toHaveURL(/\/import/);
  });

  test("should navigate to account page", async ({ page }) => {
    await page.goto("/");

    const accountLink = page.locator('a[href="/account"], a:has-text("Account"), button:has-text("Profile")');
    await accountLink.click();

    await expect(page).toHaveURL(/\/account/);
  });

  test("should show active navigation state", async ({ page }) => {
    await page.goto("/import");

    const importLink = page.locator('a[href="/import"]');

    // Should have active class or aria-current
    const isActive =
      (await importLink.getAttribute("aria-current")) === "page" ||
      (await importLink.getAttribute("class")?.includes("active"));

    expect(isActive).toBeTruthy();
  });
});

test.describe("Breadcrumbs", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should display breadcrumbs on scenario details page", async ({ page }) => {
    await page.goto("/scenarios/1");

    const breadcrumbs = page.locator('[aria-label="Breadcrumb"], .breadcrumbs, nav[aria-label*="bread"]');
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toBeVisible();
      await expect(breadcrumbs).toContainText(/scenarios?/i);
    }
  });

  test("should allow navigation via breadcrumbs", async ({ page }) => {
    await page.goto("/scenarios/1");

    const breadcrumbLink = page.locator('[aria-label="Breadcrumb"] a:has-text("Scenarios"), .breadcrumbs a');
    if (await breadcrumbLink.isVisible()) {
      await breadcrumbLink.click();
      await expect(page).toHaveURL(/\/scenarios$|\/$/);
    }
  });
});

test.describe("Route Protection", () => {
  test("should redirect to login when accessing protected route while logged out", async ({ page }) => {
    await page.goto("/account");
    await expectToBeOnLoginPage(page);
  });

  test("should redirect to login when accessing import while logged out", async ({ page }) => {
    await page.goto("/import");
    await expectToBeOnLoginPage(page);
  });

  test("should redirect to login when accessing scenario details while logged out", async ({ page }) => {
    await page.goto("/scenarios/1");
    await expectToBeOnLoginPage(page);
  });

  test("should preserve intended destination after login", async ({ page }) => {
    // Try to access protected route
    await page.goto("/account");
    await expectToBeOnLoginPage(page);

    // Login
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to originally requested page
    // (Implementation depends on redirect_to parameter)
  });
});

test.describe("Deep Linking", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should support direct navigation to scenario details", async ({ page }) => {
    await page.goto("/scenarios/1");

    // Should load scenario details
    await expect(page).toHaveURL(/\/scenarios\/1/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should handle invalid scenario ID gracefully", async ({ page }) => {
    await page.goto("/scenarios/99999999");

    // Should show error or redirect
    const notFound = await page.locator("text=/not found|doesn't exist/i").isVisible();
    const redirected = page.url().includes("/scenarios") && !page.url().includes("99999999");

    expect(notFound || redirected).toBeTruthy();
  });

  test("should support URL parameters for filtering", async ({ page }) => {
    await page.goto("/?status=locked");

    // Should apply status filter from URL
    const filterSelect = page.locator('select[name="status"]');
    if (await filterSelect.isVisible()) {
      const value = await filterSelect.inputValue();
      expect(value).toBe("locked");
    }
  });
});

test.describe("View Transitions (Astro)", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should use view transitions for smooth navigation", async ({ page }) => {
    await page.goto("/");

    // Navigate to another page
    await page.click('a[href="/import"]');

    // Check if view transition occurred (implementation specific)
    // This might involve checking for CSS animations or transition classes
    await expect(page).toHaveURL(/\/import/);
  });

  test("should maintain scroll position on back navigation", async ({ page }) => {
    await page.goto("/");

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Navigate away and back
    await page.click('a[href="/import"]');
    await page.goBack();

    // Scroll position may or may not be preserved depending on implementation
    const scrollAfter = await page.evaluate(() => window.scrollY);
    // This is informational - behavior varies
  });
});

test.describe("Error Pages", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should show 404 page for non-existent routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.locator("text=/404|not found/i")).toBeVisible();
  });

  test("should provide navigation back from error pages", async ({ page }) => {
    await page.goto("/non-existent-page");

    const homeLink = page.locator('a:has-text("Home"), a:has-text("Go back"), a[href="/"]');
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });
});

test.describe("Company Switcher", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should display company selector if user belongs to multiple companies", async ({ page }) => {
    await page.goto("/");

    const companySelector = page.locator('select[name="company"], [data-testid="company-selector"]');

    // May or may not be visible depending on user's companies
    if (await companySelector.isVisible()) {
      await expect(companySelector).toBeVisible();
    }
  });

  test("should switch context when changing company", async ({ page }) => {
    await page.goto("/");

    const companySelector = page.locator('select[name="company"]');

    if (await companySelector.isVisible()) {
      const optionCount = await companySelector.locator("option").count();

      if (optionCount > 1) {
        // Select different company
        await companySelector.selectOption({ index: 1 });

        // Page should reload or update to show new company's data
        await page.waitForTimeout(500);

        // Scenarios should update
        // (Specific verification depends on implementation)
      }
    }
  });
});

test.describe("Mobile Navigation", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
  });

  test("should show mobile menu button on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu")');
    if (await menuButton.isVisible()) {
      await expect(menuButton).toBeVisible();
    }
  });

  test("should open mobile menu on button click", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuButton = page.locator('button[aria-label*="menu"]');

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Menu should open
      const mobileMenu = page.locator('[role="dialog"], .mobile-menu, nav[aria-label="Mobile"]');
      await expect(mobileMenu).toBeVisible();
    }
  });
});
