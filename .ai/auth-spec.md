# Specyfikacja Techniczna: Moduł Uwierzytelniania

## 1. Przegląd

Niniejszy dokument opisuje architekturę i plan wdrożenia funkcjonalności uwierzytelniania użytkowników (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) oraz trybu demonstracyjnego dla aplikacji CashFlow Scenarios. Rozwiązanie opiera się na wymaganiach zdefiniowanych w PRD (US-000, US-001) oraz na istniejącym stosie technologicznym (Astro, React, Supabase).

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Nowe Strony (Routes)

Zostaną utworzone następujące strony w katalogu `src/pages/`:

- `auth/login.astro`: Strona z formularzem logowania.
- `auth/register.astro`: Strona z formularzem rejestracji.
- `auth/forgot-password.astro`: Strona z formularzem do zainicjowania procesu odzyskiwania hasła.
- `auth/callback.astro`: Endpoint API do obsługi callbacku z Supabase po zalogowaniu (np. przez OAuth) i po resecie hasła.
- `auth/update-password.astro`: Strona, na którą użytkownik jest przekierowywany z maila, aby ustawić nowe hasło.

### 2.2. Modyfikacja Istniejących Stron

- `pages/index.astro`: Strona główna (`/`) będzie teraz renderować widok scenariusza w trybie demonstracyjnym (US-000). Będzie sprawdzać, czy użytkownik jest zalogowany. Jeśli tak, przekieruje go do jego domyślnego scenariusza (np. `/scenarios/1`). Jeśli nie, wyświetli `ScenarioView` z danymi demonstracyjnymi.
- `pages/scenarios/[scenarioId].astro`: Logika autoryzacji na tej stronie zostanie zachowana. Dostęp będzie możliwy tylko dla zalogowanych użytkowników.

### 2.3. Nowe Komponenty

- **`src/components/auth/AuthForm.tsx` (React, client-side):**
  - Uniwersalny, interaktywny komponent formularza dla logowania, rejestracji i odzyskiwania hasła.
  - Będzie przyjmował `props` określający jego tryb (`login`, `register`, `forgot-password`, `update-password`).
  - Zarządzanie stanem formularza (dane wejściowe, status ładowania, komunikaty błędów) za pomocą hooków `useState` i `useEffect`.
  - Walidacja po stronie klienta (np. format email, siła hasła) przy użyciu biblioteki `zod` i `react-hook-form` dla lepszego UX.
  - Obsługa wysyłania danych do odpowiednich endpointów API (`/api/auth/...`).

- **`src/components/layout/Header.astro` (Astro):**
  - Komponent nagłówka, który będzie częścią głównego layoutu.
  - Będzie sprawdzał status uwierzytelnienia użytkownika pobrany z `Astro.locals`.
  - **Tryb non-auth:** Wyświetli przyciski "Zaloguj się" i "Zarejestruj się" oraz baner informacyjny o trybie demo.
  - **Tryb auth:** Wyświetli menu użytkownika (awatar, email) z opcjami "Moje konto" i "Wyloguj się".

- **`src/components/auth/DemoBanner.astro` (Astro):**
  - Komponent wyświetlający baner informacyjny: "Testujesz wersję demo. Zaloguj się lub zarejestruj, aby pracować na własnych danych." z przyciskiem "Reset demo". Logika przycisku będzie zaimplementowana po stronie klienta i będzie polegać na wyczyszczeniu odpowiedniego klucza w `localStorage` oraz odświeżeniu strony w celu przywrócenia stanu początkowego danych demonstracyjnych.

### 2.4. Modyfikacja Layoutu

- **`src/layouts/Layout.astro`:**
  - Zostanie do niego dodany komponent `Header.astro`.
  - Layout będzie pobierał informacje o sesji użytkownika z `Astro.locals` i przekazywał je do `Header.astro`, aby dynamicznie renderować odpowiednie elementy UI.

### 2.5. Scenariusze Użytkownika i Walidacja

- **Rejestracja:**
  - Użytkownik wypełnia email, hasło i powtórzenie hasła.
  - Walidacja `AuthForm.tsx` sprawdza, czy hasła są identyczne i spełniają wymogi bezpieczeństwa.
  - Po wysłaniu, endpoint `/api/auth/register` zwraca błąd, jeśli email już istnieje. Błąd jest wyświetlany w formularzu.
  - Po sukcesie, użytkownik jest automatycznie logowany i przekierowywany.

- **Logowanie:**
  - Użytkownik podaje email i hasło.
  - Endpoint `/api/auth/login` zwraca błąd "Nieprawidłowy email lub hasło" w przypadku niepowodzenia.

- **Tryb Demo (`/`):**
  - Niezalogowany użytkownik widzi `ScenarioView` z danymi mockowymi.
  - Hook `useScenarioData` zostanie zmodyfikowany, aby w przypadku braku `scenarioId` i `companyId` (tryb demo) pobierać dane z lokalnego pliku `mock-data.ts` zamiast z API.
  - Wszelkie zmiany (przesunięcia transakcji) będą zapisywane w `localStorage` i odczytywane przy ponownym załadowaniu hooka, aby zachować stan demo.

## 3. Logika Backendowa

### 3.1. Middleware (`src/middleware/index.ts`)

Plik middleware zostanie **całkowicie przebudowany**, aby prawidłowo zarządzać sesją użytkownika opartą na ciasteczkach, co jest kluczowe dla aplikacji renderowanych serwerowo w Astro.

- Zamiast przekazywać token `Authorization`, middleware będzie używać `createSupabaseServerClient` z pakietu `@supabase/ssr`.
- Klient Supabase będzie tworzony z `context.request.headers` (dla odczytu ciasteczek) i `context.cookies` (dla zapisu).
- Middleware będzie odświeżał sesję użytkownika przy każdym żądaniu.
- Instancja klienta Supabase oraz sesja użytkownika (`context.locals.session`) będą dostępne w `Astro.locals` dla wszystkich stron i endpointów API.

### 3.2. Endpointy API (`src/pages/api/auth/`)

Zostaną utworzone dedykowane endpointy API (Astro routes) do obsługi logiki autentykacji. Będą one używać klienta Supabase z `Astro.locals`.

- **`login.ts` (POST):**
  - Pobiera `email` i `password` z ciała żądania.
  - Waliduje dane wejściowe za pomocą `zod`.
  - Wywołuje `supabase.auth.signInWithPassword()`.
  - W przypadku błędu zwraca status 401.
  - W przypadku sukcesu, Supabase automatycznie ustawi ciasteczka sesji, a endpoint zwróci status 200.

- **`register.ts` (POST):**
  - Pobiera `email`, `password`, `companyName` z ciała żądania.
  - Waliduje dane.
  - Wywołuje `supabase.auth.signUp()`.
  - **Transakcja bazodanowa:** Po pomyślnym utworzeniu użytkownika w `auth.users`, uruchamia funkcję `pl/pgsql` w bazie danych (`handle_new_user`), która atomowo:
    1.  Tworzy firmę (`companies`).
    2.  Tworzy powiązanie użytkownika z firmą (`company_members`).
    3.  Tworzy profil użytkownika (`user_profiles`).
  - W przypadku błędu (np. email istnieje) zwraca status 409 (Conflict).
  - W przypadku sukcesu zwraca status 201 (Created).

- **`logout.ts` (POST):**
  - Wywołuje `supabase.auth.signOut()`.
  - Zwraca status 200.

- **`forgot-password.ts` (POST):**
  - Pobiera `email` z ciała żądania.
  - Wywołuje `supabase.auth.resetPasswordForEmail()`, podając URL do strony `auth/update-password.astro`.
  - Zawsze zwraca 200, aby nie ujawniać, czy email istnieje w systemie.

- **`update-password.ts` (POST):**
  - Pobiera `password` z ciała żądania oraz token JWT z sesji (który Supabase umieszcza po kliknięciu linka resetującego).
  - Waliduje nowe hasło.
  - Wywołuje `supabase.auth.updateUser()` z nowym hasłem.
  - W przypadku sukcesu zwraca 200, w przypadku błędu (np. nieważny token) zwraca 401.

### 3.3. Renderowanie Server-Side

- Dzięki `output: "server"` w `astro.config.mjs` i nowemu middleware, każda strona `.astro` będzie mogła podejmować decyzje na serwerze w oparciu o stan zalogowania użytkownika.
- Przykład w `pages/index.astro`:

  ```astro
  ---
  const { session } = Astro.locals;
  if (session) {
    // Pobierz domyślny scenariusz i przekieruj
    return Astro.redirect("/scenarios/...");
  }
  // Renderuj widok demo
  ---

  <Layout>
    <ScenarioView client:load mode="demo" />
  </Layout>
  ```

## 4. System Autentykacji (Supabase)

- **Zarządzanie Sesją:** Zostanie wykorzystany pakiet `@supabase/ssr`, który jest przeznaczony do integracji z frameworkami SSR jak Astro. Zapewnia on bezpieczne zarządzanie sesją za pomocą ciasteczek HTTP-only.
- **RLS (Row Level Security):** Istniejące polityki RLS będą działać bez zmian, ponieważ opierają się na `auth.uid()`, które będzie poprawnie identyfikowane przez klienta Supabase skonfigurowanego w middleware.
- **Proces Rejestracji (backend):** Kluczowe będzie stworzenie funkcji `handle_new_user` w PostgreSQL, wyzwalanej przez trigger po dodaniu nowego użytkownika do tabeli `auth.users`. Zapewni to spójność danych (użytkownik zawsze będzie miał powiązaną firmę i profil).
- **Odzyskiwanie Hasła:** Supabase Auth natywnie wspiera wysyłanie linków do resetowania hasła. Skonfigurujemy szablony e-mail w panelu Supabase, aby kierowały użytkownika na stronę `/auth/update-password` w naszej aplikacji. Strona ta obsłuży token z URL i pozwoli ustawić nowe hasło za pomocą `supabase.auth.updateUser()`.
