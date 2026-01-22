# 🚀 Quick Start - Testy E2E

# 🚀 Quick Start - Testy E2E

## Krok 1: Uruchom lokalny Supabase

```bash
supabase start
```

Zaczekaj aż wszystkie serwisy się uruchomią (może potrwać ~30 sekund).

## Krok 2: Zmienne środowiskowe

**Dla lokalnego Supabase** (już skonfigurowane w .env.example):

```bash
# Skopiuj przykładową konfigurację
cp .env.example .env
```

Zawartość `.env` dla lokalnego Supabase:

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

💡 **To jest standardowy klucz demo dla lokalnego Supabase** - możesz go bezpiecznie używać.

📖 Więcej o zmiennych: [ENV_SETUP.md](./ENV_SETUP.md)

## Krok 3: Uruchom testy

```bash
npm run test:e2e
```

**To wszystko!** 🎉

Przy pierwszym uruchomieniu:
- Automatycznie utworzą się 3 użytkowników testowych
- Każdy użytkownik dostanie swoją firmę
- Użytkownicy będą dodani jako admini firm

## Użytkownicy testowi

```
Email: test-user-1@example.com
Hasło: TestPassword123!

Email: test-user-2@example.com
Hasło: TestPassword123!

Email: test-admin@example.com
Hasło: TestPassword123!
```

## Weryfikacja setupu

Jeśli chcesz sprawdzić czy wszystko działa przed uruchomieniem testów:

```bash
npm run test:e2e:verify
```

## Inne przydatne komendy

```bash
# Tryb interaktywny (UI)
npm run test:e2e:ui

# Zobacz przeglądarkę podczas testów
npm run test:e2e:headed

# Uruchom konkretny test
npx playwright test tests/e2e/example-fixtures.spec.ts

# Debug mode
npx playwright test --debug

# Zobacz raport
npx playwright show-report
```

## Troubleshooting

### "Email rate limit exceeded"
W Supabase Dashboard → Authentication → Settings:
- Wyłącz "Enable email confirmations" dla testów
- Lub użyj "Auto Confirm Users"

### "RLS policy violated"
Sprawdź czy trigger `handle_new_user` działa:
```sql
-- W Supabase SQL Editor
SELECT * FROM user_profiles;
```

### "Cannot connect to Supabase"
```bash
# Przetestuj połączenie
npm run test:e2e:verify
```

## Co dalej?

- 📖 Szczegóły: [tests/e2e/README.md](./README.md)
- 👥 Tworzenie użytkowników: [tests/e2e/USER_SETUP.md](./USER_SETUP.md)
- 🧪 Przykłady: `tests/e2e/example-fixtures.spec.ts`
