import { config } from 'dotenv';

// Load environment variables from .env file
// This is imported by ALL test files to ensure env vars are available
config();

// Export env vars for use in tests
export const TEST_ENV = {
  SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY!,
} as const;

// Validate required env vars are loaded
if (!TEST_ENV.SUPABASE_URL || !TEST_ENV.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables. Please ensure .env file exists with PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY'
  );
}
