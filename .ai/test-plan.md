# Plan Testów – CashFlow Scenarios MVP

## 1. Wprowadzenie i Cele Testowania

### 1.1. Cel dokumentu
Niniejszy dokument definiuje kompleksową strategię testowania aplikacji CashFlow Scenarios MVP, obejmującą wszystkie warstwy aplikacji oraz kluczowe obszary funkcjonalne. Plan testów został opracowany w oparciu o analizę stosu technologicznego, architektury systemu oraz wymagań biznesowych.

### 1.2. Cele testowania
- **Weryfikacja poprawności funkcjonalnej** – Zapewnienie, że wszystkie funkcjonalności działają zgodnie z wymaganiami biznesowymi
- **Bezpieczeństwo danych** – Weryfikacja mechanizmów autoryzacji, RLS oraz izolacji multi-tenant
- **Wydajność i skalowalność** – Potwierdzenie, że system radzi sobie z obciążeniem w granicach MVP
- **Jakość kodu** – Utrzymanie wysokich standardów kodu przez testy statyczne i code review
- **Dostępność (a11y)** – Zapewnienie, że aplikacja jest dostępna dla wszystkich użytkowników
- **Responsywność UI** – Weryfikacja poprawnego działania na różnych urządzeniach

### 1.3. Zakres MVP
Testy obejmują wersję MVP aplikacji zawierającą:
- Moduł uwierzytelniania i autoryzacji (Supabase Auth)
- Import danych z plików CSV
- Zarządzanie scenariuszami finansowymi
- Edycję transakcji (overrides)
- Analitykę i wizualizacje (wykresy, timeline)
- Eksport danych do Excel

---

## 2. Zakres Testów

### 2.1. Obszary objęte testami

#### Frontend
- Komponenty React (islands)
- Komponenty Astro (statyczne)
- Biblioteka komponentów shadcn/ui
- Custom hooki React
- Logika walidacji po stronie klienta
- Responsywność i dostępność UI

#### Backend & API
- Endpointy API Astro
- Warstwa serwisowa (services)
- Middleware autoryzacyjny
- Walidacja danych (Zod schemas)
- Integracja z Supabase

#### Baza danych
- Migracje i schemat bazy danych
- Widoki SQL (views)
- Funkcje PostgreSQL
- Triggery
- Polityki RLS (Row Level Security)

#### Integracje
- Supabase Auth
- Import/eksport CSV/Excel
- Parsowanie i transformacja danych

### 2.2. Obszary wyłączone z testów (Out of Scope)
- Testy load-testingowe (poza MVP)
- Testy penetracyjne (security audit)
- Automatyczne testy E2E w CI/CD (w MVP – testy manualne)
- Testy cross-browser (focus: Chrome, Firefox, Safari)
- Testy lokalizacji (MVP tylko w języku polskim i angielskim)

---

## 3. Typy Testów do Przeprowadzenia

### 3.1. Testy jednostkowe (Unit Tests)

**Cel:** Weryfikacja poprawności działania pojedynczych funkcji, metod i komponentów w izolacji.

**Zakres:**
- Funkcje pomocnicze (utils)
- Walidatory Zod
- Custom hooki React
- Funkcje serwisowe (service layer)
- Funkcje transformacji danych (CSV parsing, formatowanie)

**Narzędzia:**
- Vitest (test runner dla Vite)
- @testing-library/react (testy komponentów React)
- @testing-library/react-hooks (testy hooków)

**Kryteria:**
- Code coverage: minimum 70% dla warstwy serwisowej i utils
- Wszystkie funkcje z logiką biznesową muszą mieć testy jednostkowe

**Przykładowe obszary:**
- `src/lib/utils/csv-import.ts` – parsowanie i walidacja CSV
- `src/lib/validation/*.ts` – schematy Zod
- `src/components/hooks/*.ts` – custom hooki

### 3.2. Testy integracyjne (Integration Tests)

**Cel:** Weryfikacja poprawności współpracy między różnymi modułami systemu.

**Zakres:**
- Endpointy API z warstwą serwisową
- Warstwa serwisowa z bazą danych (Supabase)
- Middleware z endpointami API
- Komponenty React z API (MSW - Mock Service Worker)

**Narzędzia:**
- Vitest
- MSW (Mock Service Worker) – mockowanie API
- Supabase Test Client – testy z lokalną bazą Supabase

**Kryteria:**
- Wszystkie endpointy API muszą mieć testy integracyjne
- Testy muszą weryfikować kody odpowiedzi HTTP i strukturę danych

**Przykładowe scenariusze:**
- `POST /api/companies/{companyId}/imports` – import CSV
- `GET /api/companies/{companyId}/scenarios` – pobieranie listy scenariuszy
- `POST /api/companies/{companyId}/scenarios/{scenarioId}/overrides/batch` – batch update overrides

### 3.3. Testy API (API Tests)

**Cel:** Weryfikacja kontraktu API zgodnie ze specyfikacją.

**Zakres:**
- Wszystkie endpointy REST API
- Kody statusów HTTP
- Struktura odpowiedzi JSON
- Walidacja query params i request body
- Obsługa błędów i edge cases

**Narzędzia:**
- Bruno / Insomnia – kolekcje testów API
- curl / test-endpoint.sh – skrypty testowe
- Zod – walidacja schematów odpowiedzi

**Kryteria:**
- Wszystkie endpointy API muszą być przetestowane
- Testy muszą obejmować scenariusze pozytywne i negatywne

**Grupy testowe:**
- **Autentykacja:** `/api/auth/*`
- **Scenariusze:** `/api/companies/{companyId}/scenarios/*`
- **Importy:** `/api/companies/{companyId}/imports/*`
- **Analityka:** `/api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates`

### 3.4. Testy bazodanowe (Database Tests)

**Cel:** Weryfikacja poprawności schematu, widoków, funkcji i polityk RLS.

**Zakres:**
- Migracje – test rollback i forward
- Widoki SQL – poprawność wyników
- Funkcje PostgreSQL – logika biznesowa
- Triggery – walidacja side-effects
- Polityki RLS – izolacja danych między tenant'ami

**Narzędzia:**
- pgTAP (PostgreSQL Testing Framework)
- Supabase CLI – lokalne środowisko testowe
- SQL scripts – testy manualne

**Kryteria:**
- Wszystkie widoki muszą zwracać poprawne dane dla przykładowych danych testowych
- Polityki RLS muszą uniemożliwiać dostęp do danych innych firm

**Kluczowe obszary:**
- `scenario_transactions_v` – merge transakcji z overrides
- `weekly_aggregates_v` – agregacje tygodniowe
- `running_balance_v` – obliczenia bilansu bieżącego
- RLS policies dla tabel `scenarios`, `transactions`, `imports`

### 3.5. Testy UI / UX (UI/UX Tests)

**Cel:** Weryfikacja jakości interfejsu użytkownika i doświadczenia użytkownika.

**Zakres:**
- Responsywność na urządzeniach mobilnych i desktopowych
- Dostępność (WCAG 2.1 AA)
- Interaktywność komponentów React
- Feedback użytkownika (loading states, error messages)
- Flow użytkownika (user journeys)

**Narzędzia:**
- Playwright / Cypress – testy E2E
- axe-core / Pa11y – testy dostępności
- Chrome DevTools – testy responsywności
- Lighthouse – audyty wydajności i dostępności

**Kryteria:**
- Wszystkie kluczowe ścieżki użytkownika muszą być przetestowane
- Score dostępności: minimum 90/100 (Lighthouse)
- Responsywność: breakpointy 320px, 768px, 1024px, 1920px

**Kluczowe user journeys:**
- Rejestracja i logowanie
- Import CSV – cały wizard (4 kroki)
- Tworzenie scenariusza
- Edycja transakcji (drag & drop)
- Eksport scenariusza do Excel

### 3.6. Testy wydajnościowe (Performance Tests)

**Cel:** Weryfikacja, że system spełnia wymagania wydajnościowe w ramach MVP.

**Zakres:**
- Czas ładowania strony (< 3s)
- Czas odpowiedzi API (< 500ms dla 95% requestów)
- Rendering dużych list (virtualization)
- Import plików CSV do 10MB

**Narzędzia:**
- Lighthouse (Core Web Vitals)
- Chrome DevTools Performance
- k6 / Artillery – load testing (opcjonalnie)

**Kryteria:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- API response time p95 < 500ms

### 3.7. Testy bezpieczeństwa (Security Tests)

**Cel:** Weryfikacja mechanizmów bezpieczeństwa i ochrony danych.

**Zakres:**
- Autoryzacja – RLS policies
- Autentykacja – JWT validation
- CSRF protection
- XSS prevention
- SQL injection prevention (parametryzowane zapytania)
- Rate limiting
- Data isolation (multi-tenancy)

**Narzędzia:**
- Supabase RLS Test Framework
- OWASP ZAP – skanowanie podatności (opcjonalnie)
- Manual testing – weryfikacja scenariuszy

**Kryteria:**
- Użytkownik nie może uzyskać dostępu do danych innej firmy
- Nieuwierzytelnione requesty zwracają 401
- Niezautoryzowane requesty zwracają 403

**Scenariusze testowe:**
- Próba dostępu do scenariusza innej firmy
- Próba modyfikacji transakcji bez autoryzacji
- Próba SQL injection przez parametry query
- Weryfikacja cookie security (HttpOnly, Secure, SameSite)

### 3.8. Testy regresji (Regression Tests)

**Cel:** Upewnienie się, że nowe zmiany nie wprowadzają błędów do istniejącej funkcjonalności.

**Zakres:**
- Ponowne uruchomienie testów jednostkowych i integracyjnych
- Smoke tests – weryfikacja kluczowych ścieżek
- Visual regression tests (opcjonalnie)

**Narzędzia:**
- Vitest (testy automatyczne)
- Percy / Chromatic – visual regression (opcjonalnie)

**Kryteria:**
- Wszystkie testy muszą przechodzić przed merge do main
- CI/CD pipeline uruchamia testy automatycznie

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Moduł Uwierzytelniania

#### ST-AUTH-001: Rejestracja nowego użytkownika
**Warunki wstępne:** Brak

**Kroki:**
1. Otwórz stronę `/auth/register`
2. Wprowadź prawidłowy email i hasło (min. 6 znaków)
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- Użytkownik zostaje zarejestrowany w Supabase Auth
- Profil użytkownika tworzony w tabeli `user_profiles`
- Przekierowanie na stronę logowania lub dashboard
- Email weryfikacyjny wysłany (jeśli włączone)

**Warunki zakończenia:** Użytkownik zalogowany w systemie

---

#### ST-AUTH-002: Logowanie z poprawnymi danymi
**Warunki wstępne:** Użytkownik zarejestrowany w systemie

**Kroki:**
1. Otwórz stronę `/auth/login`
2. Wprowadź email i hasło
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- Użytkownik zalogowany
- Sesja utworzona (cookie HttpOnly)
- Przekierowanie na `/scenarios` lub ostatnio odwiedzaną stronę
- Middleware ustawia `locals.user`

**Warunki zakończenia:** Użytkownik widzi dashboard

---

#### ST-AUTH-003: Logowanie z błędnymi danymi
**Warunki wstępne:** Brak

**Kroki:**
1. Otwórz stronę `/auth/login`
2. Wprowadź błędny email lub hasło
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- Komunikat błędu: "Nieprawidłowy email lub hasło"
- Status HTTP 401
- Użytkownik pozostaje na stronie logowania
- Brak przekierowania

**Warunki zakończenia:** Formularz resetuje się

---

#### ST-AUTH-004: Reset hasła
**Warunki wstępne:** Użytkownik zarejestrowany w systemie

**Kroki:**
1. Otwórz stronę `/auth/forgot-password`
2. Wprowadź email
3. Kliknij "Wyślij link resetujący"
4. Otwórz email i kliknij link
5. Wprowadź nowe hasło

**Oczekiwany rezultat:**
- Email z linkiem resetującym wysłany
- Link prowadzi do `/auth/update-password`
- Hasło zostaje zmienione
- Użytkownik może zalogować się nowym hasłem

**Warunki zakończenia:** Hasło zmienione

---

### 4.2. Moduł Importu CSV

#### ST-IMPORT-001: Import poprawnego pliku CSV
**Warunki wstępne:** Użytkownik zalogowany, plik CSV z poprawnymi danymi

**Kroki:**
1. Otwórz stronę `/import`
2. Przeciągnij plik CSV do strefy uploadu
3. Wprowadź `dataset_code` (np. "Q1_2025")
4. Kliknij "Dalej"
5. Zmapuj kolumny CSV na pola systemowe
6. Kliknij "Waliduj"
7. Sprawdź podsumowanie walidacji (brak błędów)
8. Kliknij "Importuj"

**Oczekiwany rezultat:**
- Import utworzony w bazie z statusem `pending`
- Wszystkie wiersze zwalidowane pozytywnie
- Transakcje wstawione do tabeli `transactions`
- Import zmienia status na `completed`
- Scenariusz bazowy utworzony automatycznie
- Przekierowanie na `/scenarios/{scenarioId}`

**Warunki zakończenia:** Import zakończony sukcesem

---

#### ST-IMPORT-002: Import pliku CSV z błędami
**Warunki wstępne:** Użytkownik zalogowany, plik CSV z błędnymi danymi

**Kroki:**
1. Otwórz stronę `/import`
2. Prześlij plik CSV z błędami (np. nieprawidłowe daty, ujemne kwoty)
3. Wprowadź `dataset_code`
4. Zmapuj kolumny
5. Kliknij "Waliduj"

**Oczekiwany rezultat:**
- Walidacja wykrywa błędy
- Wyświetlona tabela z błędami (`ValidationErrorTable`)
- Dostępny przycisk "Pobierz raport błędów" (CSV)
- Jeśli `valid_rows > 0`: możliwość kontynuacji z pominięciem błędnych wierszy
- Jeśli `valid_rows = 0`: blokada importu

**Warunki zakończenia:** Użytkownik podejmuje decyzję (popraw plik lub pomiń błędy)

---

#### ST-IMPORT-003: Pominięcie błędnych wierszy
**Warunki wstępne:** Import z częściowo błędnymi danymi (10% błędnych wierszy)

**Kroki:**
1. Po walidacji kliknij "Pomiń błędy i importuj"
2. Poczekaj na zakończenie importu

**Oczekiwany rezultat:**
- Import przetworzony
- Tylko poprawne wiersze wstawione do `transactions`
- Status importu: `completed`
- `invalid_rows` > 0 w rekordzie importu
- Raport błędów dostępny w `error_report_json`

**Warunki zakończenia:** Import zakończony z ostrzeżeniem

---

#### ST-IMPORT-004: Download raportu błędów
**Warunki wstępne:** Import z błędami

**Kroki:**
1. W kroku walidacji kliknij "Pobierz raport błędów"

**Oczekiwany rezultat:**
- Plik CSV pobrany z listą błędów
- Kolumny: row_number, field_name, invalid_value, error_message
- Plik można otworzyć w Excel

**Warunki zakończenia:** Plik pobrany

---

### 4.3. Moduł Zarządzania Scenariuszami

#### ST-SCENARIO-001: Tworzenie nowego scenariusza
**Warunki wstępne:** Użytkownik zalogowany, istnieje zaimportowany dataset

**Kroki:**
1. Otwórz stronę `/scenarios`
2. Kliknij "Nowy scenariusz"
3. Wprowadź nazwę scenariusza (np. "Scenariusz optymistyczny")
4. Wybierz dataset
5. Ustaw zakres dat (start_date, end_date)
6. Kliknij "Utwórz"

**Oczekiwany rezultat:**
- Scenariusz utworzony w bazie
- Status: `Draft`
- Pole `import_id` wskazuje na najnowszy import dla dataset_code
- Przekierowanie na `/scenarios/{scenarioId}`

**Warunki zakończenia:** Scenariusz widoczny na liście

---

#### ST-SCENARIO-002: Duplikowanie scenariusza
**Warunki wstępne:** Istnieje scenariusz z overrides

**Kroki:**
1. Otwórz listę scenariuszy
2. Kliknij "Duplikuj" na istniejącym scenariuszu
3. Wprowadź nazwę nowego scenariusza
4. Kliknij "Duplikuj"

**Oczekiwany rezultat:**
- Nowy scenariusz utworzony
- Wszystkie overrides skopiowane z oryginalnego scenariusza
- `base_scenario_id` wskazuje na duplikowany scenariusz
- Status: `Draft`

**Warunki zakończenia:** Nowy scenariusz na liście

---

#### ST-SCENARIO-003: Blokowanie scenariusza (Lock)
**Warunki wstępne:** Scenariusz w statusie `Draft`

**Kroki:**
1. Otwórz scenariusz
2. Kliknij "Zablokuj scenariusz"

**Oczekiwany rezultat:**
- Status zmienia się na `Locked`
- Pola `locked_at` i `locked_by` ustawione
- Edycja transakcji zablokowana
- UI wyświetla badge "Locked"

**Warunki zakończenia:** Scenariusz zablokowany

---

#### ST-SCENARIO-004: Soft-delete scenariusza
**Warunki wstępne:** Scenariusz w statusie `Draft` lub `Locked`

**Kroki:**
1. Otwórz listę scenariuszy
2. Kliknij "Usuń" na scenariuszu
3. Potwierdź usunięcie

**Oczekiwany rezultat:**
- Pole `deleted_at` ustawione na bieżącą datę
- Scenariusz nie wyświetla się na liście
- Fizycznie pozostaje w bazie
- Overrides zachowane

**Warunki zakończenia:** Scenariusz ukryty

---

### 4.4. Moduł Edycji Transakcji (Overrides)

#### ST-OVERRIDE-001: Edycja pojedynczej transakcji
**Warunki wstępne:** Scenariusz w statusie `Draft`, transakcja widoczna na timeline

**Kroki:**
1. Otwórz widok scenariusza
2. Kliknij na transakcję
3. W modalu edycji zmień datę lub kwotę
4. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Override utworzony lub zaktualizowany w tabeli `scenario_overrides`
- Oryginalne wartości zamrożone przy pierwszej edycji
- Nowa wartość widoczna w UI
- Timeline aktualizuje się
- Running balance przelicza się

**Warunki zakończenia:** Transakcja zaktualizowana

---

#### ST-OVERRIDE-002: Resetowanie transakcji do wartości oryginalnej
**Warunki wstępne:** Transakcja z override'em

**Kroki:**
1. Otwórz transakcję z override'em
2. Kliknij "Resetuj do oryginału"

**Oczekiwany rezultat:**
- `new_date_due` i `new_amount_book_cents` ustawione na NULL
- Widok transakcji pokazuje wartości oryginalne
- Timeline aktualizuje się

**Warunki zakończenia:** Override usunięty

---

#### ST-OVERRIDE-003: Batch update przez drag & drop
**Warunki wstępne:** Scenariusz Draft, kilka transakcji widocznych

**Kroki:**
1. Zaznacz wiele transakcji (checkbox)
2. Przeciągnij na timeline na nowy tydzień
3. Potwierdź zmianę

**Oczekiwany rezultat:**
- Endpoint `/overrides/batch` wywołany
- Wszystkie zaznaczone transakcje zaktualizowane
- Daty przesunięte o odpowiednią liczbę dni
- UI aktualizuje się masowo

**Warunki zakończenia:** Batch update zakończony

---

### 4.5. Moduł Analityki i Wizualizacji

#### ST-ANALYTICS-001: Wyświetlanie weekly aggregates
**Warunki wstępne:** Scenariusz z transakcjami

**Kroki:**
1. Otwórz widok scenariusza
2. Przewiń do sekcji "Tygodniowe podsumowanie"

**Oczekiwany rezultat:**
- Widok `weekly_aggregates_v` zwraca dane
- Top-5 inflows i outflows dla każdego tygodnia
- Kategoria "Other" dla pozostałych
- Kwoty w walucie bazowej (cents)

**Warunki zakończenia:** Dane wyświetlone

---

#### ST-ANALYTICS-002: Wykres running balance
**Warunki wstępne:** Scenariusz z transakcjami

**Kroki:**
1. Otwórz widok scenariusza
2. Sprawdź wykres bilansu bieżącego

**Oczekiwany rezultat:**
- Wykres liniowy z danymi z `running_balance_v`
- Oś X: daty
- Oś Y: running balance w walucie bazowej
- Tooltips z szczegółami transakcji

**Warunki zakończenia:** Wykres poprawnie wyświetlony

---

### 4.6. Moduł Eksportu

#### ST-EXPORT-001: Eksport scenariusza do Excel
**Warunki wstępne:** Scenariusz z danymi

**Kroki:**
1. Otwórz scenariusz
2. Kliknij "Eksportuj do Excel"
3. Wybierz opcje eksportu (grupowanie: week/day/month)
4. Kliknij "Eksportuj"

**Oczekiwany rezultat:**
- Plik Excel pobrany
- Arkusze: Transactions, Weekly Aggregates, Running Balance
- Dane zgodne z widokiem w UI
- Formatowanie: kwoty jako liczby, daty jako daty

**Warunki zakończenia:** Plik Excel pobrany i otwarty

---

## 5. Środowisko Testowe

### 5.1. Środowiska

#### Lokalne (Development)
- **Frontend:** Astro dev server (`npm run dev`)
- **Backend:** Astro API routes
- **Baza danych:** Supabase Local Development (Docker)
- **Autentykacja:** Supabase Local Auth

**Konfiguracja:**
```bash
# Uruchomienie Supabase lokalnie
npx supabase start

# Uruchomienie aplikacji
npm run dev
```

#### Staging
- **Frontend:** Vercel/Netlify preview deployment
- **Backend:** API routes wdrożone na Vercel
- **Baza danych:** Supabase Staging Project
- **Autentykacja:** Supabase Staging Auth

**Cel:** Testy integracyjne przed wdrożeniem na produkcję

#### Production
- **Frontend:** Vercel/Netlify
- **Backend:** DigitalOcean App Platform
- **Baza danych:** Supabase Production Project
- **Autentykacja:** Supabase Production Auth

**Cel:** Smoke tests po wdrożeniu

### 5.2. Dane testowe

#### Seed Data
Plik: `supabase/seed.sql`

**Zawartość:**
- 2 firmy (companies)
- 4 użytkowników (2 na firmę)
- 1 import z dataset_code "TEST_Q1_2025"
- 100 transakcji testowych
- 2 scenariusze (Draft i Locked)
- 10 overrides

#### Generowanie danych testowych
Skrypt: `scripts/generate-test-data.ts`

**Parametry:**
- Liczba firm
- Liczba użytkowników na firmę
- Liczba transakcji
- Zakres dat

### 5.3. Narzędzia testowe

| Kategoria | Narzędzie | Cel |
|-----------|-----------|-----|
| Unit Tests | Vitest | Testy jednostkowe |
| Integration Tests | Vitest + MSW | Testy API i komponentów |
| E2E Tests | Playwright | Testy End-to-End |
| API Tests | Bruno / curl | Testy REST API |
| Accessibility | axe-core, Pa11y | Testy a11y |
| Performance | Lighthouse | Audyty wydajności |
| Database | pgTAP, Supabase CLI | Testy bazy danych |
| Code Quality | ESLint, TypeScript | Analiza statyczna |

---

## 6. Narzędzia do Testowania

### 6.1. Framework testowy

**Vitest** – Primary test framework
- Szybki test runner dla Vite
- Kompatybilny z API Jest
- Wsparcie dla ESM, TypeScript
- Built-in coverage (c8)

**Konfiguracja:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

### 6.2. Narzędzia do testów komponentów

**@testing-library/react**
- Testowanie komponentów React
- Focus na testowanie zachowań użytkownika
- Queries: getByRole, getByText, etc.

**@testing-library/user-event**
- Symulacja interakcji użytkownika
- Click, type, hover, drag & drop

### 6.3. Mockowanie API

**MSW (Mock Service Worker)**
- Interceptowanie requestów HTTP
- Mockowanie odpowiedzi API
- Izolacja testów frontend od backend

**Przykład:**
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/companies/:companyId/scenarios', () => {
    return HttpResponse.json({
      scenarios: [/* ... */],
      pagination: { /* ... */ }
    });
  })
];
```

### 6.4. Testy E2E

**Playwright**
- Cross-browser testing
- Auto-wait mechanisms
- Screenshot/video recording
- Network interception

**Przykładowy test:**
```typescript
test('user can create scenario', async ({ page }) => {
  await page.goto('/scenarios');
  await page.click('text=Nowy scenariusz');
  await page.fill('input[name="name"]', 'Test Scenario');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/scenarios\/\d+/);
});
```

### 6.5. Testy dostępności

**axe-core** / **@axe-core/playwright**
- Automatyczne wykrywanie problemów a11y
- Integracja z Playwright

**Pa11y**
- CLI tool do audytów a11y
- Integracja z CI/CD

### 6.6. Audyty wydajności

**Lighthouse CI**
- Automatyczne audyty wydajności
- Core Web Vitals
- Integracja z GitHub Actions

---

## 7. Harmonogram Testów

### 7.1. Faza 1: Setup (Tydzień 1)
**Cel:** Przygotowanie środowiska testowego

- [ ] Konfiguracja Vitest
- [ ] Setup @testing-library/react
- [ ] Konfiguracja MSW
- [ ] Przygotowanie danych testowych (seed.sql)
- [ ] Konfiguracja Playwright
- [ ] Setup Lighthouse CI

**Rezultat:** Działające środowisko testowe

### 7.2. Faza 2: Testy jednostkowe (Tydzień 2-3)
**Cel:** Pokrycie logiki biznesowej testami jednostkowymi

- [ ] Testy utils (csv-import, formatowanie)
- [ ] Testy walidatorów Zod
- [ ] Testy custom hooków
- [ ] Testy komponentów UI (shadcn/ui)
- [ ] Code coverage > 70%

**Rezultat:** Testy jednostkowe dla warstwy utils i hooków

### 7.3. Faza 3: Testy integracyjne API (Tydzień 4)
**Cel:** Weryfikacja endpointów API

- [ ] Testy autentykacji (`/api/auth/*`)
- [ ] Testy scenariuszy (`/api/scenarios/*`)
- [ ] Testy importów (`/api/imports/*`)
- [ ] Testy analityki (`/api/weekly-aggregates`, `/api/running-balance`)
- [ ] Testy overrides (`/api/overrides/*`)

**Rezultat:** Wszystkie endpointy API przetestowane

### 7.4. Faza 4: Testy bazodanowe (Tydzień 5)
**Cel:** Weryfikacja schematu i logiki SQL

- [ ] Testy migracji (rollback/forward)
- [ ] Testy widoków (scenario_transactions_v, weekly_aggregates_v)
- [ ] Testy funkcji PostgreSQL
- [ ] Testy polityk RLS
- [ ] Testy triggerów

**Rezultat:** Schemat bazy danych zweryfikowany

### 7.5. Faza 5: Testy E2E (Tydzień 6)
**Cel:** Weryfikacja kluczowych ścieżek użytkownika

- [ ] Test: Rejestracja i logowanie
- [ ] Test: Import CSV (cały flow)
- [ ] Test: Tworzenie scenariusza
- [ ] Test: Edycja transakcji
- [ ] Test: Eksport do Excel

**Rezultat:** Kluczowe user journeys przetestowane

### 7.6. Faza 6: Testy dostępności i wydajności (Tydzień 7)
**Cel:** Zapewnienie jakości UX

- [ ] Audyty Lighthouse (wszystkie strony)
- [ ] Testy axe-core (komponenty)
- [ ] Testy responsywności (breakpointy)
- [ ] Testy wydajności (Core Web Vitals)

**Rezultat:** Score dostępności > 90, LCP < 2.5s

### 7.7. Faza 7: Testy bezpieczeństwa (Tydzień 8)
**Cel:** Weryfikacja mechanizmów bezpieczeństwa

- [ ] Testy RLS (izolacja multi-tenant)
- [ ] Testy autoryzacji (próby dostępu bez uprawnień)
- [ ] Testy JWT validation
- [ ] Testy CSRF protection
- [ ] Testy rate limiting

**Rezultat:** Bezpieczeństwo potwierdzone

---

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria dla testów jednostkowych
- ✅ Code coverage minimum 70% dla warstwy serwisowej
- ✅ Code coverage minimum 60% dla komponentów React
- ✅ Wszystkie funkcje z logiką biznesową pokryte testami
- ✅ Testy muszą być szybkie (< 1s na test suite)

### 8.2. Kryteria dla testów integracyjnych
- ✅ Wszystkie endpointy API przetestowane
- ✅ Scenariusze pozytywne i negatywne pokryte
- ✅ Walidacja struktury odpowiedzi JSON
- ✅ Kody statusów HTTP weryfikowane

### 8.3. Kryteria dla testów E2E
- ✅ Wszystkie kluczowe user journeys przetestowane
- ✅ Testy stabilne (brak flaky tests)
- ✅ Screenshots/videos przy błędach
- ✅ Testy cross-browser (Chrome, Firefox, Safari)

### 8.4. Kryteria dla testów bazodanowych
- ✅ Wszystkie widoki zwracają poprawne dane
- ✅ Polityki RLS uniemożliwiają dostęp do danych innych firm
- ✅ Funkcje PostgreSQL działają zgodnie z oczekiwaniami
- ✅ Migracje można rollback i forward bez błędów

### 8.5. Kryteria dla testów dostępności
- ✅ Lighthouse accessibility score > 90
- ✅ Brak critical issues w axe-core
- ✅ Klawiatura navigation działa
- ✅ Screen reader compatibility

### 8.6. Kryteria dla testów wydajności
- ✅ LCP (Largest Contentful Paint) < 2.5s
- ✅ FID (First Input Delay) < 100ms
- ✅ CLS (Cumulative Layout Shift) < 0.1
- ✅ API response time p95 < 500ms

### 8.7. Kryteria dla testów bezpieczeństwa
- ✅ Użytkownik nie może uzyskać dostępu do danych innej firmy
- ✅ Nieuwierzytelnione requesty zwracają 401
- ✅ Niezautoryzowane requesty zwracają 403
- ✅ Brak SQL injection vulnerabilities
- ✅ CSRF tokens działają poprawnie

---

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1. QA Engineer (Lead)
**Odpowiedzialności:**
- Opracowanie strategii testowej
- Tworzenie planów testów
- Nadzór nad wykonaniem testów
- Raportowanie wyników
- Koordynacja z zespołem dev

### 9.2. Backend Developer
**Odpowiedzialności:**
- Testy jednostkowe dla service layer
- Testy integracyjne API
- Testy bazodanowe (widoki, funkcje, RLS)
- Code review testów

### 9.3. Frontend Developer
**Odpowiedzialności:**
- Testy jednostkowe komponentów React
- Testy custom hooków
- Testy integracyjne z MSW
- Testy dostępności (a11y)

### 9.4. Full-Stack Developer
**Odpowiedzialności:**
- Testy E2E (Playwright)
- Testy wydajności
- Testy bezpieczeństwa
- Integracja testów z CI/CD

### 9.5. Product Owner
**Odpowiedzialności:**
- Definiowanie kryteriów akceptacji
- Priorytetyzacja obszarów testowych
- Akceptacja wyników testów
- Decyzje o deploy na production

---

## 10. Procedury Raportowania Błędów

### 10.1. Proces raportowania

#### Krok 1: Wykrycie błędu
- Tester/Developer identyfikuje błąd podczas testów
- Weryfikacja, czy błąd jest powtarzalny
- Sprawdzenie, czy błąd nie jest już zgłoszony

#### Krok 2: Utworzenie raportu
**Narzędzie:** GitHub Issues

**Template raportu:**
```markdown
## Opis błędu
[Krótki opis problemu]

## Kroki do reprodukcji
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

## Oczekiwane zachowanie
[Co powinno się wydarzyć]

## Rzeczywiste zachowanie
[Co się wydarzyło]

## Środowisko
- Browser: [Chrome 120]
- OS: [macOS 14]
- Environment: [Development/Staging/Production]

## Screenshots/Logs
[Załączniki]

## Severity
- [ ] Critical (Blocker)
- [ ] High
- [ ] Medium
- [ ] Low

## Labels
bug, [moduł], [priorytet]
```

#### Krok 3: Priorytetyzacja
**Kryteria:**
- **Critical:** Aplikacja nie działa, brak workaround
- **High:** Główna funkcjonalność nie działa, jest workaround
- **Medium:** Funkcjonalność działa z ograniczeniami
- **Low:** Kosmetyczne problemy, edge cases

#### Krok 4: Przypisanie i Fix
- PO przypisuje błąd do developera
- Developer oznacza issue jako "In Progress"
- Developer tworzy branch `fix/[issue-number]-[description]`
- Developer commituje fix + dodaje test regresyjny

#### Krok 5: Weryfikacja
- Tester weryfikuje fix w środowisku Staging
- Jeśli OK: zamknięcie issue
- Jeśli NOK: reopening z komentarzem

### 10.2. Workflow GitHub Issues

**Statusy:**
- `Open` – Nowy błąd
- `In Progress` – W trakcie naprawy
- `Ready for Testing` – Gotowe do weryfikacji
- `Closed` – Zweryfikowane i zamknięte

**Labels:**
- `bug` – Błąd
- `enhancement` – Ulepszenie
- `critical` / `high` / `medium` / `low` – Priorytet
- `auth` / `import` / `scenarios` / `ui` – Moduł
- `needs-investigation` – Wymaga analizy

### 10.3. Metryki jakości

**Śledzone wskaźniki:**
- **Bug Density:** Liczba bugów / KLOC (1000 linii kodu)
- **Bug Resolution Time:** Średni czas naprawy buga (dni)
- **Reopen Rate:** % bugów ponownie otwartych
- **Test Coverage:** % pokrycia kodu testami
- **Escaped Defects:** Liczba bugów znalezionych na produkcji

**Cel MVP:**
- Bug Density < 5 bugs / KLOC
- Bug Resolution Time < 3 dni (Critical), < 7 dni (High)
- Reopen Rate < 10%
- Test Coverage > 70%
- Escaped Defects < 5 w pierwszym miesiącu

---

## 11. Definicja Gotowości (Definition of Done)

Funkcjonalność jest uznawana za gotową, gdy:

### 11.1. Kod
- ✅ Kod zaimplementowany zgodnie z wymaganiami
- ✅ Code review przeprowadzony i zaakceptowany
- ✅ Brak błędów ESLint i TypeScript
- ✅ Kod sformatowany (Prettier)

### 11.2. Testy
- ✅ Testy jednostkowe napisane i przechodzą
- ✅ Testy integracyjne napisane i przechodzą (jeśli dotyczy)
- ✅ Testy E2E napisane dla kluczowych ścieżek (jeśli dotyczy)
- ✅ Code coverage > 70% dla nowego kodu

### 11.3. Dokumentacja
- ✅ Dokumentacja API zaktualizowana (jeśli nowy endpoint)
- ✅ Komentarze w kodzie (JSDoc dla funkcji publicznych)
- ✅ README zaktualizowane (jeśli zmiana w setup)

### 11.4. Weryfikacja
- ✅ Funkcjonalność zweryfikowana przez QA
- ✅ Akceptacja Product Ownera
- ✅ Brak znanych critical/high bugów

### 11.5. Deployment
- ✅ Merge do main branch
- ✅ CI/CD pipeline przeszedł
- ✅ Deploy na staging/production zakończony
- ✅ Smoke tests po deploy przeszły

---

## 12. Ryzyka i Mitigacje

### 12.1. Ryzyko: Niedostateczne pokrycie testami

**Prawdopodobieństwo:** Średnie  
**Wpływ:** Wysoki

**Opis:**
Presja czasowa w MVP może prowadzić do pominięcia testów dla niektórych obszarów.

**Mitigacja:**
- Priorytetyzacja testów (focus na critical paths)
- Minimum viable test coverage: 70%
- Code review requirement – każdy PR musi zawierać testy
- Pre-commit hooks – blokada commit bez testów

---

### 12.2. Ryzyko: Flaky tests w E2E

**Prawdopodobieństwo:** Wysokie  
**Wpływ:** Średni

**Opis:**
Testy E2E mogą być niestabilne z powodu timing issues, race conditions.

**Mitigacja:**
- Użycie Playwright z auto-wait mechanisms
- Retry logic dla flaky tests
- Izolacja testów (każdy test w czystym stanie)
- Network mocking dla stabilności

---

### 12.3. Ryzyko: Brak testów RLS

**Prawdopodobieństwo:** Niskie  
**Wpływ:** Krytyczny

**Opis:**
Nieprzetestowane polityki RLS mogą prowadzić do wycieków danych między tenantami.

**Mitigacja:**
- Dedykowane testy RLS dla każdej tabeli
- Scenariusze testowe: user z firmy A próbuje dostępu do danych firmy B
- Manual testing przez QA
- Code review polityk RLS przez Senior Dev

---

### 12.4. Ryzyko: Wydajność nie spełnia wymagań

**Prawdopodobieństwo:** Średnie  
**Wpływ:** Wysoki

**Opis:**
Wolne ładowanie strony, długi czas odpowiedzi API.

**Mitigacja:**
- Testy wydajności już w fazie development
- Lighthouse CI w każdym PR
- Indeksy bazy danych dla kluczowych zapytań
- Virtualization dla długich list
- Monitoring wydajności na production (Sentry)

---

### 12.5. Ryzyko: Brak testów cross-browser

**Prawdopodobieństwo:** Średnie  
**Wpływ:** Średni

**Opis:**
Problemy z kompatybilnością w różnych przeglądarkach.

**Mitigacja:**
- Playwright wspiera Chrome, Firefox, Safari
- Manual testing na różnych przeglądarkach (QA)
- Focus na nowoczesne przeglądarki (last 2 versions)
- Graceful degradation dla starszych przeglądarek

---

## 13. Podsumowanie i Wnioski

### 13.1. Kluczowe obszary testowe

Plan testów obejmuje wszystkie krytyczne obszary aplikacji CashFlow Scenarios MVP:

1. **Uwierzytelnianie i autoryzacja** – Fundamentalne dla bezpieczeństwa multi-tenant
2. **Import CSV** – Kompleksowy flow z walidacją i obsługą błędów
3. **Zarządzanie scenariuszami** – CRUD operations, duplikacja, soft-delete
4. **Edycja transakcji** – Overrides, batch updates, drag & drop
5. **Analityka i wizualizacje** – Widoki SQL, wykresy, aggregacje
6. **Eksport do Excel** – Generowanie raportów

### 13.2. Strategia testowa

**Piramida testów:**
- **70% Unit Tests** – Szybkie, tanie, łatwe w utrzymaniu
- **20% Integration Tests** – Weryfikacja współpracy modułów
- **10% E2E Tests** – Krytyczne user journeys

**Focus na automatyzację:**
- CI/CD integration z GitHub Actions
- Pre-commit hooks z testami jednostkowymi
- Lighthouse CI dla każdego PR

### 13.3. Metryki sukcesu

Projekt uznajemy za gotowy do release, gdy:
- ✅ Code coverage > 70%
- ✅ Wszystkie critical/high bugs zamknięte
- ✅ Lighthouse accessibility score > 90
- ✅ LCP < 2.5s, FID < 100ms
- ✅ Wszystkie kluczowe user journeys przetestowane
- ✅ RLS policies zweryfikowane
- ✅ 0 escaped defects w smoke tests

### 13.4. Continuous Improvement

Po release MVP:
- **Retrospektywa testów** – Co zadziałało? Co można poprawić?
- **Rozbudowa testów** – Dodanie test coverage dla edge cases
- **Performance monitoring** – Sentry, LogRocket
- **A/B testing** – Optymalizacja UX na podstawie danych

---

## Appendix A: Checklist przed Release

### Pre-Release Checklist

#### Testy
- [ ] Wszystkie testy jednostkowe przechodzą
- [ ] Wszystkie testy integracyjne przechodzą
- [ ] Kluczowe testy E2E przechodzą
- [ ] Testy RLS zweryfikowane
- [ ] Testy wydajności przeprowadzone
- [ ] Testy dostępności przeprowadzone

#### Bezpieczeństwo
- [ ] JWT validation działa
- [ ] RLS policies aktywne
- [ ] CSRF protection włączone
- [ ] Rate limiting skonfigurowane
- [ ] Cookies secure (HttpOnly, Secure, SameSite)

#### Wydajność
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] API response time p95 < 500ms
- [ ] Indeksy bazy danych utworzone

#### Dokumentacja
- [ ] API documentation aktualne
- [ ] README zaktualizowane
- [ ] Changelog utworzony
- [ ] Deployment guide gotowy

#### Deployment
- [ ] Environment variables skonfigurowane
- [ ] Database migrations uruchomione
- [ ] Seed data wstawione (jeśli potrzebne)
- [ ] Backup bazy danych wykonany

#### Monitoring
- [ ] Sentry skonfigurowane
- [ ] Logs streaming włączone
- [ ] Health checks działają
- [ ] Alerting skonfigurowane

---

## Appendix B: Przykłady Testów

### Test jednostkowy (Vitest)

```typescript
// src/lib/utils/csv-import.test.ts
import { describe, it, expect } from 'vitest';
import { parseCSVAmount } from './csv-import';

describe('parseCSVAmount', () => {
  it('should parse positive amount', () => {
    expect(parseCSVAmount('1234.56')).toBe(123456);
  });

  it('should parse amount with comma separator', () => {
    expect(parseCSVAmount('1,234.56')).toBe(123456);
  });

  it('should handle zero', () => {
    expect(parseCSVAmount('0')).toBe(0);
  });

  it('should throw on negative amount', () => {
    expect(() => parseCSVAmount('-100')).toThrow();
  });
});
```

### Test integracyjny API (Vitest + MSW)

```typescript
// src/pages/api/scenarios.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/companies/:companyId/scenarios', () => {
    return HttpResponse.json({
      scenarios: [
        { id: 1, name: 'Test Scenario', status: 'Draft' }
      ],
      pagination: { page: 1, limit: 20, total: 1 }
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('GET /api/scenarios', () => {
  it('should return scenarios list', async () => {
    const response = await fetch('/api/companies/uuid/scenarios');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.scenarios).toHaveLength(1);
    expect(data.scenarios[0].name).toBe('Test Scenario');
  });
});
```

### Test E2E (Playwright)

```typescript
// e2e/import-csv.spec.ts
import { test, expect } from '@playwright/test';

test('user can import CSV file', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to import
  await page.goto('/import');
  
  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./fixtures/test-data.csv');
  
  // Enter dataset code
  await page.fill('input[name="dataset_code"]', 'E2E_TEST');
  await page.click('button:has-text("Dalej")');
  
  // Wait for validation
  await expect(page.locator('text=Walidacja zakończona')).toBeVisible();
  
  // Continue to import
  await page.click('button:has-text("Importuj")');
  
  // Verify redirect to scenario
  await expect(page).toHaveURL(/\/scenarios\/\d+/);
});
```

### Test RLS (pgTAP)

```sql
-- tests/rls_scenarios.sql
BEGIN;
SELECT plan(3);

-- Setup test data
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-1-uuid';

-- Test 1: User can see only their company's scenarios
SELECT results_eq(
  'SELECT id FROM scenarios WHERE company_id = ''company-1-uuid''',
  ARRAY[1, 2],
  'User can see scenarios from their company'
);

-- Test 2: User cannot see other company's scenarios
SELECT is_empty(
  'SELECT id FROM scenarios WHERE company_id = ''company-2-uuid''',
  'User cannot see scenarios from other company'
);

-- Test 3: User cannot insert scenario for other company
SELECT throws_ok(
  'INSERT INTO scenarios (company_id, name) VALUES (''company-2-uuid'', ''Hack'')',
  'RLS blocks insert for other company'
);

SELECT * FROM finish();
ROLLBACK;
```

---

**Koniec dokumentu**

---

**Wersja:** 1.0  
**Data utworzenia:** 16 stycznia 2026  
**Autor:** QA Team  
**Status:** Zatwierdzony do realizacji
