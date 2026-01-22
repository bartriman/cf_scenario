/**
 * Test users created by global-setup.ts
 * Use these pre-created users instead of creating new ones in tests
 */

export const TEST_USERS = {
  USER_1: {
    email: "test-user-1@example.com",
    password: "TestPassword123!",
  },
  USER_2: {
    email: "test-user-2@example.com",
    password: "TestPassword123!",
  },
  ADMIN: {
    email: "test-admin@example.com",
    password: "TestPassword123!",
  },
} as const;

// Default test user for most tests
export const DEFAULT_TEST_USER = TEST_USERS.USER_1;
