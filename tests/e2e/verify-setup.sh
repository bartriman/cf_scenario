#!/bin/bash

# Skrypt testowy do weryfikacji konfiguracji E2E

echo "🔍 Sprawdzanie konfiguracji testów E2E..."
echo ""

# Załaduj zmienne środowiskowe z .env
if [ -f .env ]; then
    echo "📄 Ładowanie zmiennych z .env..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  Brak pliku .env - tworzę z .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        export $(grep -v '^#' .env | xargs)
    else
        echo "❌ Brak pliku .env.example!"
        exit 1
    fi
fi

# Sprawdź zmienne środowiskowe
if [ -z "$PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Brak PUBLIC_SUPABASE_URL w zmiennych środowiskowych"
    echo "   Dodaj do .env: PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    exit 1
else
    echo "✅ PUBLIC_SUPABASE_URL: $PUBLIC_SUPABASE_URL"
fi

if [ -z "$PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Brak PUBLIC_SUPABASE_ANON_KEY w zmiennych środowiskowych"
    echo "   Dodaj do .env: PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    exit 1
else
    echo "✅ PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY:0:20}..."
fi

echo ""
echo "📦 Sprawdzanie zależności..."

if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx nie jest zainstalowany"
    exit 1
fi

if [ ! -d "node_modules/@playwright" ]; then
    echo "⚠️  Playwright nie jest zainstalowany"
    echo "   Instaluję Playwright..."
    npm install
    npx playwright install chromium
else
    echo "✅ Playwright zainstalowany"
fi

echo ""
echo "🎭 Testowanie połączenia z Supabase..."

# Sprawdź czy Supabase jest dostępny
if curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_SUPABASE_URL/rest/v1/" | grep -q "200\|401\|404"; then
    echo "✅ Połączenie z Supabase działa!"
else
    echo "❌ Nie można połączyć się z Supabase na $PUBLIC_SUPABASE_URL"
    echo "   Sprawdź czy Supabase jest uruchomiony: supabase status"
    exit 1
fi

echo ""
echo "🚀 Uruchamianie global setup..."
echo ""

# Uruchom tylko global setup używając tsx
if command -v npx &> /dev/null; then
    npx tsx tests/e2e/global-setup.ts 2>&1
    SETUP_EXIT=$?
else
    echo "❌ npx nie jest dostępny"
    exit 1
fi

if [ $SETUP_EXIT -eq 0 ]; then
    echo ""
    echo "✅ Konfiguracja E2E jest poprawna!"
    echo ""
    echo "📝 Użytkownicy testowi:"
    echo "   - test-user-1@example.com / TestPassword123!"
    echo "   - test-user-2@example.com / TestPassword123!"
    echo "   - test-admin@example.com / TestPassword123!"
    echo ""
    echo "🎯 Możesz teraz uruchomić testy:"
    echo "   npm run test:e2e"
    echo ""
    echo "   lub pojedynczy test:"
    echo "   npx playwright test tests/e2e/example-fixtures.spec.ts"
    echo ""
    exit 0
else
    echo ""
    echo "❌ Wystąpił błąd podczas tworzenia użytkowników testowych"
    echo ""
    echo "💡 Możliwe przyczyny:"
    echo "   1. Sprawdź czy Supabase jest uruchomiony: supabase status"
    echo "   2. Sprawdź czy w Supabase Auth są włączone rejestracje"
    echo "   3. Sprawdź czy trigger handle_new_user działa poprawnie"
    echo "   4. Sprawdź RLS policies dla tabel companies i company_members"
    echo ""
    exit 1
fi
