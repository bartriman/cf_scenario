import { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_ENV } from "../playwright.env";

/**
 * E2E Test Authentication Helper
 *
 * Provides utilities for managing authentication in E2E tests
 */

const supabaseUrl = TEST_ENV.SUPABASE_URL;
const supabaseAnonKey = TEST_ENV.SUPABASE_ANON_KEY;

export interface TestUser {
  email: string;
  password: string;
  id?: string;
  companyId?: string;
}

/**
 * Creates a test user in Supabase for E2E testing
 * Note: This requires Supabase service role key for proper cleanup
 */
export async function createTestUser(email: string, password: string): Promise<TestUser> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("User creation failed");

  return {
    email,
    password,
    id: data.user.id,
  };
}

/**
 * Login via UI (recommended for E2E tests)
 * Tests the actual login flow as users would experience it
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/auth/login");

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"));
}

/**
 * Login via API (faster for setup in tests that don't test auth flow)
 * Uses the application's login endpoint to properly set session cookies
 */
export async function loginViaAPI(page: Page, email: string, password: string) {
  // Go to any page first to establish context
  await page.goto("/");

  // Call the application's login API endpoint
  const response = await page.request.post("/api/auth/login", {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Login failed: ${errorData.error || response.statusText()}`);
  }

  // The cookies are automatically set by the server response
  // Navigate to a protected page to ensure session is active
  await page.goto("/scenarios");

  // Wait for page to load and verify we're not redirected to login
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 5000 });
}

/**
 * Logout user
 */
export async function logout(page: Page) {
  await page.goto("/");
  await page.click('button[aria-label="Sign out"], button:has-text("Sign out")');
  await page.waitForURL("/auth/login");
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name === "sb-access-token");
}
