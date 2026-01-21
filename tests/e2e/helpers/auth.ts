import { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * E2E Test Authentication Helper
 *
 * Provides utilities for managing authentication in E2E tests
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

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
 * Sets session cookies directly
 */
export async function loginViaAPI(page: Page, email: string, password: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.session) throw new Error("Login failed - no session");

  // Set session cookies in the browser context
  await page.context().addCookies([
    {
      name: "sb-access-token",
      value: data.session.access_token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "sb-refresh-token",
      value: data.session.refresh_token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
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
