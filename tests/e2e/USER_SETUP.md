# Tworzenie Użytkowników Testowych dla E2E

Istnieje kilka sposobów tworzenia użytkowników testowych. Wybierz metodę odpowiednią dla Twojego przypadku użycia.

## 🎯 Metoda 1: Automatyczna (Zalecana) - Global Setup

Użytkownicy testowi są automatycznie tworzeni przed uruchomieniem testów.

### Konfiguracja

1. **Zaktualizuj `playwright.config.ts`**:

```typescript
export default defineConfig({
  // ... reszta konfiguracji
  
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});
```

2. **Uruchom testy**:

```bash
npm run test:e2e
```

Global setup automatycznie:
- ✅ Tworzy 3 użytkowników testowych
- ✅ Tworzy firmy dla każdego użytkownika
- ✅ Dodaje użytkowników jako adminów firm
- ✅ Sprawdza czy użytkownicy już istnieją (nie duplikuje)

### Użytkownicy testowi:
- `test-user-1@example.com` / `TestPassword123!`
- `test-user-2@example.com` / `TestPassword123!`
- `test-admin@example.com` / `TestPassword123!`

## 🛠️ Metoda 2: Ręczna przez Supabase Dashboard

1. **Otwórz Supabase Dashboard**:
   - Przejdź do swojego projektu Supabase
   - Kliknij "Authentication" → "Users"

2. **Dodaj użytkownika**:
   - Kliknij "Add user" → "Create new user"
   - Email: `test-user-1@example.com`
   - Password: `TestPassword123!`
   - Auto Confirm User: **TAK** ✅
   - Kliknij "Create user"

3. **Stwórz firmę dla użytkownika**:
   - Przejdź do "Table Editor" → "companies"
   - Kliknij "Insert" → "Insert row"
   - Wypełnij: `name: "Test Company"`
   - Zapisz i skopiuj `id` (UUID)

4. **Dodaj użytkownika do firmy**:
   - Przejdź do "company_members"
   - Kliknij "Insert row"
   - `company_id`: [UUID z kroku 3]
   - `user_id`: [UUID użytkownika]
   - `role`: `admin`
   - Zapisz

## 💻 Metoda 3: Przez SQL w Supabase

Najszybsza metoda jeśli znasz SQL.

```sql
-- 1. Utwórz użytkownika (w Authentication, nie przez SQL)
-- Musisz to zrobić przez Dashboard lub API

-- 2. Po utworzeniu użytkownika, stwórz firmę i przypisz
DO $$
DECLARE
  test_user_id uuid := 'USER_ID_Z_DASHBOARD'; -- Zamień na prawdziwe ID
  company_id uuid;
BEGIN
  -- Utwórz firmę
  INSERT INTO companies (name)
  VALUES ('Test Company')
  RETURNING id INTO company_id;
  
  -- Dodaj użytkownika do firmy
  INSERT INTO company_members (company_id, user_id, role)
  VALUES (company_id, test_user_id, 'admin');
  
  RAISE NOTICE 'Created company % for user %', company_id, test_user_id;
END $$;
```

## 🔑 Metoda 4: Przez Supabase CLI

Jeśli używasz Supabase lokalnie lub CLI:

```bash
# Utwórz użytkownika
supabase auth create test-user-1@example.com --password TestPassword123!

# Następnie wykonaj SQL z Metody 3
```

## 🎭 Użycie w testach

### Z Global Setup (automatyczne):

```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures';
import { loginViaAPI } from './helpers/auth';

test('my test', async ({ page }) => {
  await loginViaAPI(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
  // Twój test...
});
```

### Z Fixtures (jeszcze prostsze):

```typescript
import { test, expect } from './fixtures';

test('my test', async ({ page, authenticatedPage }) => {
  // Użytkownik już zalogowany!
  await page.goto('/');
  // Twój test...
});
```

### Z różnymi użytkownikami:

```typescript
import { test } from './fixtures';
import { TEST_USERS } from './fixtures';

test.use({ testUser: TEST_USERS.user2 }); // Użyj user2

test('test as user2', async ({ page, authenticatedPage }) => {
  // Zalogowany jako user2
});
```

## ⚙️ Zmienne środowiskowe

Upewnij się, że masz ustawione w `.env`:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Opcjonalnie:
```env
E2E_CLEANUP=true  # Włącz czyszczenie po testach
```

## 🧹 Czyszczenie testowych danych

### Automatyczne (wymaga service role key):

Ustaw w `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
E2E_CLEANUP=true
```

### Ręczne:

1. Usuń użytkowników przez Supabase Dashboard → Authentication → Users
2. Usuń firmy przez Table Editor → companies (cascade delete usunie company_members)

## 🔧 Troubleshooting

### "Email rate limit exceeded"
- Supabase ma limity wysyłania emaili
- Użyj "Auto Confirm User" w dashboard
- Lub wyłącz email confirmation w Auth settings

### "User already exists"
- Global setup sprawdza to automatycznie
- Możesz usunąć użytkownika i spróbować ponownie

### "RLS policy violated"
- Upewnij się, że user_profiles są tworzone automatycznie (trigger)
- Sprawdź czy company_members są poprawnie ustawione

### "Session not working in tests"
- Sprawdź czy cookies są ustawione na prawidłowej domenie (`localhost`)
- Sprawdź czy baseURL w playwright.config.ts pasuje (`http://localhost:4321`)

## 📚 Dodatkowe zasoby

- Zobacz `tests/e2e/global-setup.ts` - implementacja automatycznego tworzenia
- Zobacz `tests/e2e/fixtures.ts` - fixtures dla łatwego użycia
- Zobacz `tests/e2e/helpers/auth.ts` - funkcje pomocnicze autentykacji
