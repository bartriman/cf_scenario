# 🔧 Konfiguracja Zmiennych Środowiskowych

## Lokalne Zmienne Środowiskowe (Development)

Dla **lokalnego Supabase** (uruchomionego przez `supabase start`):

```env
# URL lokalnego Supabase
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Anon key dla lokalnego Supabase (standardowy klucz demo)
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Opcjonalnie - czyszczenie danych po testach
E2E_CLEANUP=false
```

### 📝 Jak pobrać klucze lokalnego Supabase?

```bash
# Sprawdź status Supabase
supabase status

# W output znajdziesz:
# - API URL: http://127.0.0.1:54321
# - Anon key: (domyślnie to klucz demo powyżej)
# - Service role key: (dla operacji admin)
```

## Produkcyjne Zmienne Środowiskowe

Dla **zdalnego Supabase** (Supabase Cloud):

```env
# URL twojego projektu Supabase
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Anon key z Supabase Dashboard
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
```

### 🔑 Jak pobrać klucze z Supabase Dashboard?

1. Otwórz [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon / public** key → `PUBLIC_SUPABASE_ANON_KEY`

## Weryfikacja Konfiguracji

Po ustawieniu zmiennych, zweryfikuj czy wszystko działa:

```bash
# Test połączenia i utworzenie użytkowników testowych
npm run test:e2e:verify
```

Ten skrypt sprawdzi:
- ✅ Czy zmienne środowiskowe są ustawione
- ✅ Czy można połączyć się z Supabase
- ✅ Czy użytkownicy testowi mogą być utworzeni

## Przełączanie między Lokalne ↔ Produkcja

### Opcja 1: Różne pliki .env

```bash
# .env.local - dla lokalnego Supabase
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...demo_key

# .env.production - dla produkcji
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_real_key
```

Następnie:
```bash
# Użyj lokalnego
cp .env.local .env

# Użyj produkcji
cp .env.production .env
```

### Opcja 2: Astro Environment Variables

W `astro.config.mjs` możesz użyć różnych konfiguracji:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  // ...
  vite: {
    define: {
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(
        process.env.NODE_ENV === 'development'
          ? 'http://127.0.0.1:54321'
          : process.env.PUBLIC_SUPABASE_URL
      ),
    },
  },
});
```

## Zmienne dla CI/CD

Dla GitHub Actions / CI:

```yaml
env:
  PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  E2E_CLEANUP: true
```

Dodaj secrets w GitHub:
1. Repozytorium → Settings → Secrets and variables → Actions
2. New repository secret
3. Dodaj `SUPABASE_URL` i `SUPABASE_ANON_KEY`

## Troubleshooting

### "Missing environment variables"

```bash
# Sprawdź czy .env istnieje
ls -la .env

# Sprawdź zawartość
cat .env
```

### "Cannot connect to Supabase"

```bash
# Sprawdź czy Supabase działa
supabase status

# Jeśli nie działa, uruchom:
supabase start
```

### "CORS errors" w testach

Dla lokalnego Supabase, upewnij się że używasz `http://127.0.0.1` zamiast `http://localhost`:

```env
# ✅ Prawidłowo
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# ❌ Może powodować problemy z CORS
PUBLIC_SUPABASE_URL=http://localhost:54321
```

## Bezpieczeństwo

⚠️ **NIGDY** nie commituj pliku `.env` do git!

```bash
# Sprawdź .gitignore
cat .gitignore | grep .env

# Powinno zawierać:
.env
.env.local
.env.production
```

✅ Zawsze używaj `.env.example` jako template:

```bash
# Skopiuj przykładową konfigurację
cp .env.example .env

# Następnie edytuj .env z prawdziwymi wartościami
```
