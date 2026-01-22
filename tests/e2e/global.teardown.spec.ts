import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_ENV } from "./playwright.env";

/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests as a project teardown
 *
 * Cleans up test data from database using delete_test_users SQL function
 */

const supabaseUrl = TEST_ENV.SUPABASE_URL;
const CLEANUP_ENABLED = process.env.E2E_CLEANUP === "true";

// Test users to clean up
const TEST_USER_EMAILS = ["test-user-1@example.com", "test-user-2@example.com", "test-admin@example.com"];

teardown("cleanup test data", async ({}) => {
  console.log("🧹 Running global teardown for E2E tests...");

  if (!CLEANUP_ENABLED) {
    console.log("ℹ️  Cleanup is disabled. Set E2E_CLEANUP=true to enable.");
    console.log("ℹ️  Test data preserved for inspection.");
    return;
  }

  console.log("⚠️  Cleanup enabled - removing test data...");

  if (!supabaseUrl) {
    console.error("❌ Missing SUPABASE_URL environment variable");
    return;
  }

  const supabase = createClient(supabaseUrl, TEST_ENV.SUPABASE_ANON_KEY);

  try {
    console.log("🗑️  Deleting test users and their data...");

    // Use SQL function to delete everything in correct order
    // This function handles: profiles, members, companies, and auth users
    const { data, error } = await supabase.rpc("delete_test_users", { email_list: TEST_USER_EMAILS });

    if (error) {
      console.error(`❌ Error during cleanup: ${error.message}`);
      console.log(`\nℹ️  For local development, you can manually delete users:`);
      console.log(`  docker exec supabase_db_10xdev_cf_scenario psql -U postgres -c "DELETE FROM auth.users WHERE email LIKE '%@example.com';"`);
      return;
    }

    if (data) {
      console.log(`  ✓ Deleted ${data.deleted_users} users from auth`);
      console.log(`  ✓ Deleted ${data.deleted_companies} companies`);
      console.log(`  ✓ Deleted user_profiles and company_members`);
    }

    console.log("\n✅ Database cleanup complete!");
  } catch (error: any) {
    console.error("❌ Error during cleanup:", error.message);
  }
});
