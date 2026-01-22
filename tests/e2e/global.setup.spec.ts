import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_ENV } from "./playwright.env";

/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests as a project dependency
 *
 * Creates test users and test data needed for E2E tests
 */

const supabaseUrl = TEST_ENV.SUPABASE_URL;
const supabaseAnonKey = TEST_ENV.SUPABASE_ANON_KEY;

// Test users to create
const TEST_USERS = [
  {
    email: "test-user-1@example.com",
    password: "TestPassword123!",
    name: "Test User 1",
  },
  {
    email: "test-user-2@example.com",
    password: "TestPassword123!",
    name: "Test User 2",
  },
  {
    email: "test-admin@example.com",
    password: "TestPassword123!",
    name: "Test Admin",
  },
];

setup("create test users", async ({}) => {
  console.log("🚀 Running global setup for E2E tests...");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing environment variables: PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("📝 Creating test users...");

  for (const user of TEST_USERS) {
    try {
      // Always try to create user (will skip if already exists)
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.name,
            company_name: `${user.name}'s Company`,
          },
        },
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          console.log(`ℹ️  User ${user.email} already exists (skipping)`);
          continue;
        }
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
        continue;
      }

      if (data.user) {
        console.log(`✅ Created user: ${user.email} (ID: ${data.user.id})`);
        console.log(`  ℹ️  Company created automatically via handle_new_user trigger`);

        // Sign out after setup
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error(`❌ Error setting up user ${user.email}:`, error);
    }
  }

  console.log("✅ Global setup complete!");
});
