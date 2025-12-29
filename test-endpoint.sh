#!/bin/bash

# Test endpoint GET /api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJlZDc4NGFmZC0yZGFkLTRhNzItODIzZC1jOTQ3ZTAwMGFjNWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY3MDIwNTAzLCJpYXQiOjE3NjcwMTY5MDMsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZWQ3ODRhZmQtMmRhZC00YTcyLTgyM2QtYzk0N2UwMDBhYzVhIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjcwMTY5MDN9XSwic2Vzc2lvbl9pZCI6ImE2YWExYWU1LWU1MWEtNDE3Zi04MjIzLTZiMzI1ZjBjYmJkOCIsImlzX2Fub255bW91cyI6ZmFsc2V9.T21iTYpizU_en3q4Ffqh5yggmg2fr70BuZPiViGbeeo"

echo "=== Testing GET /api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates ==="
echo ""
echo "Test 1: Valid request (200 OK)"
curl -s -X GET 'http://localhost:3000/api/companies/550e8400-e29b-41d4-a716-446655440000/scenarios/1/weekly-aggregates' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test 2: Invalid company ID format (400 Bad Request)"
curl -s -X GET 'http://localhost:3000/api/companies/invalid-uuid/scenarios/1/weekly-aggregates' \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test 3: Invalid scenario ID (400 Bad Request)"
curl -s -X GET 'http://localhost:3000/api/companies/550e8400-e29b-41d4-a716-446655440000/scenarios/abc/weekly-aggregates' \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test 4: Non-existent scenario (404 Not Found)"
curl -s -X GET 'http://localhost:3000/api/companies/550e8400-e29b-41d4-a716-446655440000/scenarios/999/weekly-aggregates' \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test 5: No authorization header (401 Unauthorized)"
curl -s -X GET 'http://localhost:3000/api/companies/550e8400-e29b-41d4-a716-446655440000/scenarios/1/weekly-aggregates' \
  -w "\nHTTP Status: %{http_code}\n"
