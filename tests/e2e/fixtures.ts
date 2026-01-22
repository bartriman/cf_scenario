import { test as base } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import { TEST_ENV } from "./playwright.env";

/**
 * Extended Playwright fixtures for E2E tests
 *
 * Provides common test utilities and authenticated contexts
 */

const supabaseUrl = TEST_ENV.SUPABASE_URL;
const supabaseAnonKey = TEST_ENV.SUPABASE_ANON_KEY;

// Test user credentials (should match global-setup.ts)
// Note: Companies are created automatically via handle_new_user trigger
export const TEST_USERS = {
  user1: {
    email: "test-user-1@example.com",
    password: "TestPassword123!",
    id: "183d9951-c105-4a38-80a2-efde5e2302c8",
    companyId: "ae76c9fe-1e46-4c26-b09c-dd657288f878",
  },
  user2: {
    email: "test-user-2@example.com",
    password: "TestPassword123!",
    id: "d031248b-1ea0-4cd8-8ae5-b9985f153c0e",
    companyId: "9a660ccd-08ce-467c-a338-a1ba01b0f4df",
  },
  admin: {
    email: "test-admin@example.com",
    password: "TestPassword123!",
    id: "ab1c49d2-ff36-46b3-82b0-f9a1dd6333e6",
    companyId: "b82e71f8-c959-4c58-a406-d5be2f126976",
  },
} as const;

interface TestFixtures {
  authenticatedPage: void;
  supabaseClient: ReturnType<typeof createClient<Database>>;
  testUser: { email: string; password: string };
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  // Fixture for Supabase client
  supabaseClient: async ({}, use) => {
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey);
    await use(client);
    // Cleanup: sign out
    await client.auth.signOut();
  },

  // Fixture for test user (defaults to user1)
  testUser: async ({}, use) => {
    await use(TEST_USERS.user1);
  },

  // Fixture for authenticated page
  authenticatedPage: async ({ page, testUser }, use) => {
    // Login via API (faster than UI)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (error) throw new Error(`Authentication failed: ${error.message}`);
    if (!data.session) throw new Error("No session created");

    // Set session cookies
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

    await use();

    // Cleanup
    await supabase.auth.signOut();
  },
});

export { expect } from "@playwright/test";
