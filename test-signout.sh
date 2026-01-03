#!/bin/bash

# Test endpoint POST /api/auth/signout

echo "=== Testing POST /api/auth/signout ==="
echo ""
echo "Test: Sign out request (should return 200 OK)"
curl -s -X POST 'http://localhost:3000/api/auth/signout' \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Note: This endpoint will clear session cookies and sign out the user"
echo "Expected: { \"message\": \"Successfully signed out\" }"
