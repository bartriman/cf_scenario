#!/bin/bash

# Script to clean up test users from local Supabase
# This removes test users so they can be recreated with proper company setup

echo "🧹 Cleaning up test users..."

# Delete test users via SQL
docker exec supabase_db_10xdev_cf_scenario psql \
  -U postgres \
  -d postgres \
  -c "DELETE FROM auth.users WHERE email LIKE 'test-%@example.com';"

echo "✅ Test users cleaned up!"
echo "ℹ️  Now run: npx tsx tests/e2e/global-setup.ts"
