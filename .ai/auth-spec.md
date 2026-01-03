# Specyfikacja Techniczna: Moduł Autentykacji (US-001)

## 1. Architektura Interfejsu Użytkownika (Frontend)

Rozszerzenie warstwy prezentacji o nowe widoki i komponenty obsługujące procesy rejestracji i odzyskiwania hasła, przy zachowaniu spójności z istniejącym systemem logowania.

### 1.1. Strony Astro (Server-Side)

Należy utworzyć nowe strony w katalogu `src/pages/`, które będą serwowane przez Astro (SSR). Strony te będą pełnić rolę kontenerów dla interaktywnych komponentów React.

*   **`src/pages/register.astro`**:
    *   **Dostęp**: Publiczny (dla niezalogowanych).
    *   **Funkcja**: Wyświetla formularz rejestracji.
    *   **Logika**: Sprawdza sesję – jeśli użytkownik jest zalogowany, przekierowuje na dashboard.
    *   **Layout**: `Layout.astro` (lub dedykowany layout autentykacji, jeśli zostanie wyodrębniony).

*   **`src/pages/forgot-password.astro`**:
    *   **Dostęp**: Publiczny.
    *   **Funkcja**: Wyświetla formularz prośby o reset hasła (podanie emaila).
    *   **Logika**: Przekierowanie zalogowanych użytkowników.

*   **`src/pages/update-password.astro`**:
    *   **Dostęp**: Chroniony (wymaga sesji, np. uzyskanej z linku resetującego).
    *   **Funkcja**: Wyświetla formularz ustawienia nowego hasła.
    *   **Logika**: Weryfikacja czy użytkownik posiada aktywną sesję (w kontekście flow odzyskiwania hasła Supabase automatycznie loguje użytkownika po kliknięciu w link).

*   **`src/pages/auth/callback.ts` (API Route)**:
    *   **Funkcja**: Endpoint do obsługi przekierowań z Supabase Auth (PKCE flow) dla potwierdzenia emaila i resetu hasła.
    *   **Zadanie**: Wymiana kodu autoryzacyjnego na sesję i przekierowanie użytkownika do odpowiedniej strony (np. dashboardu lub `update-password`).

### 1.2. Komponenty React (Client-Side)

Nowe komponenty interaktywne w `src/components/auth/`, wykorzystujące `shadcn/ui` i `react-hook-form` (lub obecne podejście ze stanem lokalnym).

*   **`RegisterForm.tsx`**:
    *   **Pola**: Email, Hasło, Powtórz hasło, Nazwa firmy (opcjonalne).
    *   **Walidacja (Client)**:
        *   Email: format.
        *   Hasło: min. 8 znaków.
        *   Powtórz hasło: zgodność z hasłem.
    *   **Akcja**: POST do `/api/auth/signup`.
    *   **UI**: Obsługa stanów loading, error, success. Link do logowania ("Masz już konto? Zaloguj się").

*   **`ForgotPasswordForm.tsx`**:
    *   **Pola**: Email.
    *   **Akcja**: POST do `/api/auth/reset-password`.
    *   **UI**: Po wysłaniu wyświetla komunikat o sprawdzeniu skrzynki pocztowej. Link powrotny do logowania.

*   **`UpdatePasswordForm.tsx`**:
    *   **Pola**: Nowe hasło, Powtórz nowe hasło.
    *   **Akcja**: POST do `/api/auth/update-password`.
    *   **UI**: Po sukcesie przekierowanie do logowania lub dashboardu.

*   **Modyfikacja `LoginForm.tsx`**:
    *   Dodanie linku "Zarejestruj się" kierującego do `/register`.
    *   Dodanie linku "Nie pamiętam hasła" kierującego do `/forgot-password`.
    *   **Obsługa błędów**: Wyświetlanie ogólnego komunikatu "Nieprawidłowy email lub hasło" w przypadku błędu logowania (zgodnie z US-001 pkt 10).

### 1.3. UX i Obsługa Błędów

*   **Walidacja**: Dwustopniowa – natychmiastowa (client-side) przy opuszczaniu pola (onBlur) oraz pełna przy próbie wysłania formularza.
*   **Komunikaty**:
    *   Błędy walidacji wyświetlane bezpośrednio pod polami input.
    *   Błędy API (np. "Użytkownik już istnieje") wyświetlane w globalnym alercie w obrębie formularza.
*   **Feedback**: Spinner na przycisku akcji podczas przetwarzania żądania.

---

## 2. Logika Backendowa (API & Server)

Implementacja endpointów API w Astro (`src/pages/api/auth/`) obsługujących żądania z komponentów React.

### 2.1. Endpointy API

*   **`POST /api/auth/signup.ts`**:
    *   **Input**: `SignUpRequestDTO` (email, password, companyName?).
    *   **Proces**:
        1.  Walidacja danych wejściowych (Zod).
        2.  Wywołanie `supabase.auth.signUp()`.
        3.  (Opcjonalnie) Jeśli podano nazwę firmy, utworzenie rekordu w tabeli `companies` i powiązanie użytkownika (może wymagać logiki po stronie serwera lub triggera bazy danych, jeśli `signUp` nie zwraca od razu sesji przy włączonym potwierdzaniu emaila). W MVP, przy braku wymogu potwierdzenia emaila, sesja jest dostępna od razu.
    *   **Output**: `SignUpResponseDTO` (zawierający sesję) lub błąd.
    *   **Zgodność z PRD**: Zgodnie z US-001 pkt 7, po rejestracji następuje automatyczne logowanie. Endpoint musi zwracać sesję, a klient (formularz) musi ją obsłużyć (np. przeładowanie strony lub przekierowanie).

*   **`POST /api/auth/reset-password.ts`**:
    *   **Input**: `{ email: string }`.
    *   **Proces**: Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../auth/callback?next=/update-password' })`.
    *   **Output**: Status 200 (niezależnie czy email istnieje, ze względów bezpieczeństwa).

*   **`POST /api/auth/update-password.ts`**:
    *   **Input**: `{ password: string }`.
    *   **Wymagania**: Aktywna sesja (użytkownik musi być zalogowany, co dzieje się automatycznie po kliknięciu w link resetujący).
    *   **Proces**: Wywołanie `supabase.auth.updateUser({ password })`.
    *   **Output**: Status 200.

*   **`POST /api/auth/signout.ts`**:
    *   **Proces**: Wywołanie `supabase.auth.signOut()`. Usunięcie ciasteczek sesyjnych.
    *   **Output**: Przekierowanie do `/login`.

### 2.2. Modele Danych i Walidacja

Rozszerzenie pliku `src/lib/validation/auth.validation.ts` oraz `src/types.ts`.

*   **Schematy Zod**:
    *   `SignUpSchema`: Rozszerzenie `SignInSchema` o `confirmPassword` (z `refine` do sprawdzania zgodności) oraz opcjonalne `companyName`.
    *   `ResetPasswordSchema`: Walidacja emaila.
    *   `UpdatePasswordSchema`: Walidacja nowego hasła i jego powtórzenia.

### 2.3. Konfiguracja Astro (`astro.config.mjs`)

*   Upewnienie się, że `output: 'server'` jest ustawione (jest w obecnej konfiguracji).
*   Weryfikacja czy middleware poprawnie przekazuje ciasteczka do klienta Supabase w trybie SSR (obecna implementacja w `src/middleware/index.ts` wygląda poprawnie).

---

## 3. System Autentykacji (Supabase Integration)

Wykorzystanie istniejącej instancji Supabase Auth.

### 3.1. Konfiguracja Supabase

*   **Email Templates**: Konfiguracja szablonów wiadomości email dla "Confirm Your Email" i "Reset Password" w panelu Supabase (poza kodem aplikacji).
*   **Redirect URLs**: Dodanie adresu produkcyjnego i lokalnego (np. `http://localhost:3000/auth/callback`) do listy dozwolonych adresów przekierowań w Supabase.

### 3.2. Zarządzanie Sesją

*   Sesja jest zarządzana poprzez ciasteczka (access_token, refresh_token).
*   Middleware (`src/middleware/index.ts`) odświeża sesję i udostępnia obiekt `user` w `Astro.locals`.
*   **Bezpieczeństwo**:
    *   HttpOnly cookies (obsługiwane przez Supabase SSR helpery lub ręczną konfigurację).
    *   CSRF protection (Astro posiada wbudowane mechanizmy, warto zweryfikować `checkOrigin`).
*   **Tryb Demo (Wymóg US-001 pkt 13)**:
    *   Middleware nie może blokować dostępu do strony głównej (`/`) lub widoku scenariusza dla niezalogowanych użytkowników.
    *   W przypadku braku sesji, aplikacja powinna serwować widok w trybie "Demo" (dane mock-up), zamiast wymuszać przekierowanie do `/login` (chyba że użytkownik próbuje wykonać akcję wymagającą autoryzacji, np. zapis).

### 3.3. Tworzenie Danych Użytkownika (Triggers vs API)

Zgodnie z PRD (US-001 pkt 4), po rejestracji system ma utworzyć profil i firmę.
*   **Rekomendacja**: Wykorzystanie **Supabase Database Triggers** (PostgreSQL) na tabeli `auth.users`.
    *   Trigger `on_auth_user_created`:
        1.  Wstawia rekord do `public.user_profiles`.
        2.  Jeśli w metadanych użytkownika (`raw_user_meta_data`) przekazano `company_name`, tworzy rekord w `public.companies` i dodaje wpis do `public.company_members` z rolą 'owner'.
    *   Dzięki temu logika biznesowa spójności danych jest blisko bazy i działa niezależnie od klienta API.
    *   W `SignUpForm` należy przekazać `companyName` w `options.data` do `signUp()`.

## 4. Plan Wdrożenia

1.  **Backend**:
    *   Aktualizacja typów i schematów walidacji (`types.ts`, `auth.validation.ts`).
    *   Implementacja endpointów API (`signup.ts`, `reset-password.ts`, `update-password.ts`, `signout.ts`, `callback.ts`).
    *   Weryfikacja/Dodanie triggerów w bazie danych (SQL).

2.  **Frontend**:
    *   Stworzenie komponentów formularzy (`RegisterForm`, `ForgotPasswordForm`, `UpdatePasswordForm`).
    *   Stworzenie stron Astro (`register.astro`, `forgot-password.astro`, `update-password.astro`).
    *   Aktualizacja `LoginForm` i strony logowania.

3.  **Integracja**:
    *   Testy manualne przepływów: Rejestracja -> Auto-login, Reset hasła -> Link -> Zmiana hasła.
