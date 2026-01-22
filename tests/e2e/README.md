# E2E Test Suite - 10xdev Cash Flow Scenario

Comprehensive end-to-end test suite for critical user flows in the cash flow scenario application.

## 📋 Test Coverage

### 1. **Authentication & Authorization** (`auth.spec.ts`)
- Login/logout flows
- Route protection and redirects
- Session persistence
- RLS policy enforcement
- Invalid credentials handling
- Session expiration

### 2. **CSV Import Wizard** (`import-csv.spec.ts`)
- **Step 1: File Upload**
  - Valid/invalid file formats
  - File size limits
  - CSV preview
  - Empty file handling
  
- **Step 2: Column Mapping**
  - Auto-mapping columns
  - Required field validation
  - Duplicate mapping prevention
  - Optional field handling
  
- **Step 3: Validation**
  - Valid row detection
  - Error reporting
  - Mixed valid/invalid rows
  - Download error reports
  - Skip invalid rows option
  
- **Step 4: Processing**
  - Scenario creation from import
  - Date range validation
  - Initial balance (IB) handling
  - Number format support (Polish/English)

### 3. **Scenario Management** (`scenarios-crud.spec.ts`)
- **Create**
  - Manual scenario creation
  - Creation from import
  - Name validation
  - Date range validation
  - Duplicate name prevention
  
- **Read**
  - List view with filtering
  - Search functionality
  - Scenario details display
  - Transaction tables
  - Weekly aggregates view
  
- **Update**
  - Metadata updates
  - Transaction overrides
  - Batch updates
  - Lock state validation
  
- **Delete**
  - Soft delete functionality
  - Confirmation dialogs
  - Locked scenario protection
  
- **Duplicate**
  - Scenario copying
  - Transaction preservation
  - Override copying
  
- **Lock/Unlock**
  - Status changes
  - Edit prevention when locked

### 4. **Export & Analytics** (`export-analytics.spec.ts`)
- CSV export with different formats
- Weekly/monthly/daily aggregation
- Override inclusion in exports
- Analytics dashboards
- Cash flow projections
- Data integrity verification

### 5. **Navigation** (`navigation.spec.ts`)
- Main navigation
- Breadcrumbs
- Deep linking
- Route protection
- View transitions
- Mobile navigation

## 🛠️ Test Helpers

### Authentication (`helpers/auth.ts`)
```typescript
loginViaUI(page, email, password)    // Tests actual login flow
loginViaAPI(page, email, password)   // Fast auth for setup
logout(page)                         // Logout helper
isAuthenticated(page)                // Check auth status
```

### Test Data (`helpers/test-data.ts`)
```typescript
generateValidCSV(rows)               // Valid CSV content
generateInvalidCSV()                 // CSV with errors
generateCSVWithInitialBalance()      // CSV with IB row
generateCSVWithNumberFormats()       // Various number formats
createTestCompany(userId, name)      // Create test company
```

### Assertions (`helpers/assertions.ts`)
```typescript
expectToBeOnLoginPage(page)
expectErrorMessage(page, message)
expectSuccessMessage(page, message)
expectTableRowCount(page, count)
expectDialogToBeOpen(page, title)
expectAPICall(page, url, method)
```

## 🚀 Running Tests

### Quick Start (Zalecane)

```bash
# 1. Upewnij się, że zmienne środowiskowe są ustawione w .env
#    PUBLIC_SUPABASE_URL=...
#    PUBLIC_SUPABASE_ANON_KEY=...

# 2. Uruchom testy - użytkownicy testowi będą utworzeni automatycznie!
npm run test:e2e
```

Global setup automatycznie utworzy użytkowników testowych przy pierwszym uruchomieniu.

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run with UI mode (interactive)
```bash
npx playwright test --ui
```

### Debug specific test
```bash
npx playwright test --debug tests/e2e/import-csv.spec.ts
```

### Generate test report
```bash
npx playwright show-report
```

## 📊 Test Data Setup

### Automatyczne tworzenie użytkowników (Zalecane!)

Testy używają **Project Dependencies** (zalecane przez Playwright), który automatycznie tworzy użytkowników testowych:

**Setup (`global.setup.spec.ts`):**
- Uruchamia się automatycznie przed wszystkimi testami
- Tworzy 3 użytkowników testowych (jeśli nie istnieją)
- Każdy użytkownik ma automatycznie utworzoną firmę

**Teardown (`global.teardown.spec.ts`):**
- Uruchamia się automatycznie po wszystkich testach
- Czyści dane testowe z bazy (gdy `E2E_CLEANUP=true`)
- Usuwa scenariusze, transakcje, importy i firmy testowe

```typescript
// Użytkownicy testowi (utworzeni automatycznie):
test-user-1@example.com / TestPassword123!
test-user-2@example.com / TestPassword123!
test-admin@example.com / TestPassword123!
```

**Nie musisz nic robić!** Po prostu uruchom testy.

### Ręczne tworzenie (opcjonalne)

Jeśli chcesz ręcznie utworzyć użytkowników, zobacz szczegółowy poradnik:
📖 **[USER_SETUP.md](./USER_SETUP.md)** - Pełny przewodnik po tworzeniu użytkowników testowych

### Environment Variables Required
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Opcjonalne - czyszczenie danych po testach:
E2E_CLEANUP=true  # Włącz czyszczenie danych po testach (usuwa dane + użytkowników auth)
```

### Czyszczenie danych testowych

**Automatyczne czyszczenie** (wymaga `E2E_CLEANUP=true`):
```bash
E2E_CLEANUP=true npm run test:e2e
```

Teardown usuwa:
- ✅ Scenariusze cash flow
- ✅ Transakcje i override'y
- ✅ Importy CSV
- ✅ Firmy testowe
- ✅ Użytkownicy auth (przez SQL function `delete_test_users`)

**Ręczne czyszczenie**:
```bash
# Uruchom tylko cleanup
npx playwright test --project=cleanup

# Lub z włączonym czyszczeniem
E2E_CLEANUP=true npx playwright test --project=cleanup

# Lub bezpośrednio przez SQL
docker exec supabase_db_10xdev_cf_scenario psql -U postgres -c "DELETE FROM auth.users WHERE email LIKE '%@example.com';"
```

**Uwaga:** Cleanup usuwa WSZYSTKO (dane + użytkowników). Setup utworzy ich ponownie przy następnym uruchomieniu testów.

## 🔍 Key Business Rules Tested

### Import Validation
- ✅ Date format: YYYY-MM-DD, DD/MM/YYYY
- ✅ Amount formats: English (1,234.56), Polish (1 234,56)
- ✅ Negative amounts: -1234.56 or (1234.56)
- ✅ Direction: INFLOW, OUTFLOW, IB
- ✅ Currency: 3-letter codes (PLN, USD, EUR)
- ✅ Initial Balance (IB) special handling

### Scenario Business Rules
- ✅ End date must be after start date
- ✅ Scenario name max 255 characters
- ✅ Name must match regex: `^[a-zA-Z0-9_-]+$` for dataset_code
- ✅ Cannot edit locked scenarios
- ✅ Soft delete (deleted_at timestamp)
- ✅ RLS policies enforce company membership

### Override Rules
- ✅ Overrides don't modify original transactions
- ✅ Overrides persist in duplicated scenarios
- ✅ Overrides reflected in exports
- ✅ Running balance recalculated with overrides

## 🎯 Edge Cases Covered

### File Upload
- Empty files
- Files exceeding size limit
- Non-CSV formats
- Malformed CSV structure

### Validation
- Mixed valid/invalid rows
- All invalid rows
- Special characters in data
- Missing required fields
- Out-of-range dates

### Concurrency
- Multiple sessions for same user
- Concurrent edits (optimistic locking)
- Race conditions in batch operations

### Data Integrity
- Running balance calculations
- Weekly aggregate accuracy
- Override application order
- Export data completeness

## 📝 Writing New Tests

### Test Structure
```typescript
test.describe('Feature Name', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, testEmail, testPassword);
    // Setup test data
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');
    
    // Act
    await page.click('button:has-text("Action")');
    
    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Best Practices
1. **Use data-testid attributes** for stable selectors
2. **Parallelize independent tests** with `test.describe.configure({ mode: 'parallel' })`
3. **Use API login** for faster setup (loginViaAPI)
4. **Test one thing per test** for clarity
5. **Clean up test data** in afterEach hooks
6. **Use meaningful test names** that describe business scenarios
7. **Avoid hard-coded waits** - use `waitForSelector` or `waitForResponse`

### Debugging Tips
- Use `await page.pause()` to pause execution
- Use `test.only()` to run single test
- Check `playwright-report/` for failure screenshots
- Use `--trace on` to record traces
- View traces with `npx playwright show-trace trace.zip`

## 🔧 CI/CD Integration

### GitHub Actions
```yaml
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  
- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📈 Test Metrics

Track these metrics to ensure test quality:
- **Coverage**: % of critical paths tested
- **Flakiness**: % of flaky tests
- **Execution time**: Average test run duration
- **Failure rate**: % of failed tests in CI

## 🐛 Known Issues & Limitations

1. **Test data dependency**: Some tests require specific test data setup
2. **RLS policies**: Tests assume RLS policies are properly configured
3. **Date dependencies**: Some tests may fail if run at month/year boundaries
4. **Network latency**: Adjust timeouts for slow connections

## 🔗 Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [Project README](../../README.md)
- [API Documentation](../../docs/api.md)
- [Database Schema](../../supabase/migrations/)
