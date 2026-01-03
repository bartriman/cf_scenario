# Diagram Architektury Autentykacji - CashFlow Scenarios

## Przepływ Autentykacji w Aplikacji

Ten diagram przedstawia szczegółowy przepływ autentykacji w systemie 
CashFlow Scenarios, wykorzystującym Astro, React i Supabase Auth.

```mermaid
sequenceDiagram
    autonumber
    
    participant Przeglądarka
    participant Middleware
    participant AstroAPI as Astro API
    participant SupabaseAuth as Supabase Auth
    participant Database as PostgreSQL
    participant EmailService as Email Service
    
    %% ===================================================================
    %% SCENARIUSZ 1: LOGOWANIE UŻYTKOWNIKA
    %% ===================================================================
    
    Note over Przeglądarka,Database: 1. LOGOWANIE UŻYTKOWNIKA
    
    Przeglądarka->>Przeglądarka: Użytkownik wypełnia formularz<br/>(email, hasło)
    activate Przeglądarka
    Przeglądarka->>Przeglądarka: Walidacja client-side<br/>(Zod Schema)
    
    Przeglądarka->>Middleware: POST /api/auth/signin
    deactivate Przeglądarka
    
    activate Middleware
    Middleware->>Middleware: Tworzenie klienta Supabase<br/>z cookies
    Middleware->>AstroAPI: Przekazanie żądania
    deactivate Middleware
    
    activate AstroAPI
    AstroAPI->>AstroAPI: Walidacja danych (Zod)
    
    AstroAPI->>SupabaseAuth: signInWithPassword(email, password)
    activate SupabaseAuth
    
    SupabaseAuth->>Database: Weryfikacja użytkownika
    activate Database
    Database-->>SupabaseAuth: Potwierdzenie
    deactivate Database
    
    alt Dane poprawne
        SupabaseAuth-->>AstroAPI: Sesja (access_token, refresh_token)
        deactivate SupabaseAuth
        
        AstroAPI->>AstroAPI: Zapis sesji w cookies
        AstroAPI-->>Przeglądarka: 200 OK + dane sesji
        deactivate AstroAPI
        
        activate Przeglądarka
        Przeglądarka->>Middleware: GET /api/profile
        deactivate Przeglądarka
        
        activate Middleware
        Middleware->>Middleware: Odczyt sesji z cookies
        Middleware->>AstroAPI: Przekazanie żądania + sesja
        deactivate Middleware
        
        activate AstroAPI
        AstroAPI->>SupabaseAuth: getUser()
        activate SupabaseAuth
        SupabaseAuth-->>AstroAPI: Dane użytkownika
        deactivate SupabaseAuth
        
        AstroAPI->>Database: SELECT user_profiles<br/>WHERE user_id = auth.uid()
        activate Database
        Database->>Database: Sprawdzenie RLS
        Database-->>AstroAPI: Profil użytkownika
        
        AstroAPI->>Database: SELECT company_members<br/>JOIN companies
        Database-->>AstroAPI: Lista firm użytkownika
        deactivate Database
        
        AstroAPI-->>Przeglądarka: 200 OK + profil + firmy
        deactivate AstroAPI
        
        activate Przeglądarka
        Przeglądarka->>Przeglądarka: Przekierowanie do<br/>/companies/{id}/dashboard
        deactivate Przeglądarka
        
    else Dane niepoprawne
        SupabaseAuth-->>AstroAPI: Błąd autoryzacji
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 401 Nieprawidłowy email lub hasło
        deactivate AstroAPI
        activate Przeglądarka
        Przeglądarka->>Przeglądarka: Wyświetlenie błędu
        deactivate Przeglądarka
    end
    
    %% ===================================================================
    %% SCENARIUSZ 2: REJESTRACJA UŻYTKOWNIKA
    %% ===================================================================
    
    Note over Przeglądarka,Database: 2. REJESTRACJA UŻYTKOWNIKA
    
    Przeglądarka->>Przeglądarka: Użytkownik wypełnia<br/>formularz rejestracji
    activate Przeglądarka
    Przeglądarka->>Przeglądarka: Walidacja (email, hasło,<br/>powtórz hasło, nazwa firmy)
    
    Przeglądarka->>Middleware: POST /api/auth/signup
    deactivate Przeglądarka
    
    activate Middleware
    Middleware->>AstroAPI: Przekazanie żądania
    deactivate Middleware
    
    activate AstroAPI
    AstroAPI->>AstroAPI: Walidacja danych (Zod)
    
    AstroAPI->>SupabaseAuth: signUp(email, password,<br/>metadata: {company_name})
    activate SupabaseAuth
    
    SupabaseAuth->>Database: INSERT auth.users
    activate Database
    
    Database->>Database: Trigger: on_auth_user_created
    Database->>Database: INSERT user_profiles
    
    alt Nazwa firmy podana
        Database->>Database: INSERT companies
        Database->>Database: INSERT company_members<br/>(role: owner)
    end
    
    Database-->>SupabaseAuth: Użytkownik utworzony
    deactivate Database
    
    alt Weryfikacja email wyłączona (MVP)
        SupabaseAuth-->>AstroAPI: Sesja + dane użytkownika
        deactivate SupabaseAuth
        
        AstroAPI->>AstroAPI: Automatyczne logowanie<br/>(zapis sesji)
        AstroAPI-->>Przeglądarka: 200 OK + sesja
        deactivate AstroAPI
        
        activate Przeglądarka
        Przeglądarka->>Przeglądarka: Przekierowanie do dashboardu
        deactivate Przeglądarka
        
    else Weryfikacja email włączona
        SupabaseAuth->>EmailService: Wyślij email weryfikacyjny
        activate EmailService
        EmailService-->>Przeglądarka: Email wysłany
        deactivate EmailService
        deactivate SupabaseAuth
        
        AstroAPI-->>Przeglądarka: 200 OK<br/>(sprawdź email)
        deactivate AstroAPI
    end
    
    %% ===================================================================
    %% SCENARIUSZ 3: ODZYSKIWANIE HASŁA
    %% ===================================================================
    
    Note over Przeglądarka,EmailService: 3. ODZYSKIWANIE HASŁA
    
    Przeglądarka->>Przeglądarka: Kliknięcie<br/>"Nie pamiętam hasła"
    activate Przeglądarka
    Przeglądarka->>Przeglądarka: Wprowadzenie emaila
    
    Przeglądarka->>Middleware: POST /api/auth/reset-password
    deactivate Przeglądarka
    
    activate Middleware
    Middleware->>AstroAPI: Przekazanie żądania
    deactivate Middleware
    
    activate AstroAPI
    AstroAPI->>SupabaseAuth: resetPasswordForEmail(email,<br/>redirectTo: /auth/callback)
    activate SupabaseAuth
    
    SupabaseAuth->>EmailService: Wyślij link resetujący
    activate EmailService
    EmailService-->>SupabaseAuth: Email wysłany
    deactivate EmailService
    
    SupabaseAuth-->>AstroAPI: OK (niezależnie czy email istnieje)
    deactivate SupabaseAuth
    
    AstroAPI-->>Przeglądarka: 200 OK<br/>(sprawdź email)
    deactivate AstroAPI
    
    activate Przeglądarka
    Note over Przeglądarka: Użytkownik klika link w emailu
    Przeglądarka->>Middleware: GET /auth/callback?code=...&<br/>next=/update-password
    deactivate Przeglądarka
    
    activate Middleware
    Middleware->>SupabaseAuth: exchangeCodeForSession(code)
    activate SupabaseAuth
    SupabaseAuth-->>Middleware: Sesja (użytkownik zalogowany)
    deactivate SupabaseAuth
    
    Middleware->>Middleware: Zapis sesji w cookies
    Middleware-->>Przeglądarka: Przekierowanie do<br/>/update-password
    deactivate Middleware
    
    activate Przeglądarka
    Przeglądarka->>Przeglądarka: Wprowadzenie nowego hasła
    
    Przeglądarka->>Middleware: POST /api/auth/update-password
    deactivate Przeglądarka
    
    activate Middleware
    Middleware->>Middleware: Weryfikacja sesji
    Middleware->>AstroAPI: Przekazanie żądania
    deactivate Middleware
    
    activate AstroAPI
    AstroAPI->>SupabaseAuth: updateUser({password})
    activate SupabaseAuth
    
    SupabaseAuth->>Database: UPDATE auth.users
    activate Database
    Database-->>SupabaseAuth: Hasło zaktualizowane
    deactivate Database
    
    SupabaseAuth-->>AstroAPI: OK
    deactivate SupabaseAuth
    
    AstroAPI-->>Przeglądarka: 200 OK
    deactivate AstroAPI
    
    activate Przeglądarka
    Przeglądarka->>Przeglądarka: Przekierowanie do<br/>dashboardu lub logowania
    deactivate Przeglądarka
    
    %% ===================================================================
    %% SCENARIUSZ 4: ODŚWIEŻANIE TOKENU (Middleware)
    %% ===================================================================
    
    Note over Przeglądarka,SupabaseAuth: 4. AUTOMATYCZNE ODŚWIEŻANIE TOKENU
    
    Przeglądarka->>Middleware: Dowolne żądanie HTTP<br/>(z wygasłym access_token)
    activate Middleware
    
    Middleware->>Middleware: Odczyt cookies<br/>(access_token, refresh_token)
    Middleware->>Middleware: Tworzenie klienta Supabase<br/>(autoRefreshToken: true)
    
    Middleware->>SupabaseAuth: Wykrycie wygasłego tokenu
    activate SupabaseAuth
    
    SupabaseAuth->>SupabaseAuth: refreshSession(refresh_token)
    SupabaseAuth-->>Middleware: Nowy access_token
    deactivate SupabaseAuth
    
    Middleware->>Middleware: Aktualizacja cookies
    Middleware->>AstroAPI: Przekazanie żądania<br/>(z aktywną sesją)
    deactivate Middleware
    
    activate AstroAPI
    AstroAPI->>AstroAPI: Przetworzenie żądania
    AstroAPI-->>Przeglądarka: Odpowiedź
    deactivate AstroAPI
    
    %% ===================================================================
    %% SCENARIUSZ 5: DOSTĘP DO CHRONIONYCH ZASOBÓW (RLS)
    %% ===================================================================
    
    Note over Przeglądarka,Database: 5. WERYFIKACJA DOSTĘPU (RLS)
    
    Przeglądarka->>Middleware: GET /companies/{id}/scenarios
    activate Middleware
    
    Middleware->>Middleware: Weryfikacja sesji
    
    alt Brak sesji
        Middleware-->>Przeglądarka: 401 Unauthorized<br/>lub przekierowanie do /login
        deactivate Middleware
        
    else Sesja aktywna
        Middleware->>AstroAPI: Przekazanie żądania + sesja
        deactivate Middleware
        
        activate AstroAPI
        AstroAPI->>Database: SELECT scenarios<br/>WHERE company_id = {id}
        activate Database
        
        Database->>Database: Polityka RLS:<br/>Sprawdź czy auth.uid() w<br/>company_members dla {id}
        
        alt Użytkownik należy do firmy
            Database-->>AstroAPI: Lista scenariuszy
            deactivate Database
            AstroAPI-->>Przeglądarka: 200 OK + dane
            deactivate AstroAPI
            
        else Użytkownik nie należy do firmy
            Database-->>AstroAPI: Pusty wynik lub błąd
            deactivate Database
            AstroAPI-->>Przeglądarka: 403 Forbidden
            deactivate AstroAPI
        end
    end
    
    %% ===================================================================
    %% SCENARIUSZ 6: TRYB DEMO (bez logowania)
    %% ===================================================================
    
    Note over Przeglądarka,Middleware: 6. TRYB DEMO (MOCK DATA)
    
    Przeglądarka->>Middleware: GET / lub /scenarios/demo
    activate Middleware
    
    Middleware->>Middleware: Sprawdzenie sesji
    
    alt Brak sesji
        Middleware->>AstroAPI: Przekazanie żądania<br/>(tryb demo)
        deactivate Middleware
        
        activate AstroAPI
        AstroAPI->>AstroAPI: Załadowanie danych mock-up
        AstroAPI-->>Przeglądarka: 200 OK + dane demo<br/>(tylko odczyt)
        deactivate AstroAPI
        
        activate Przeglądarka
        Note over Przeglądarka: Użytkownik widzi demo,<br/>nie może zapisywać zmian
        deactivate Przeglądarka
        
    else Sesja aktywna
        Middleware->>AstroAPI: Przekazanie do<br/>normalnego flow
        deactivate Middleware
        deactivate AstroAPI
    end
```

## Legenda i Wyjaśnienia

### Uczestnicy Systemu

- **Przeglądarka**: Interfejs użytkownika (komponenty React + strony Astro)
- **Middleware**: Warstwa pośrednia Astro (`src/middleware/index.ts`)
- **Astro API**: Endpointy API (`src/pages/api/auth/*`, `/api/profile`)
- **Supabase Auth**: Zewnętrzny serwis autentykacji
- **PostgreSQL**: Baza danych z RLS i triggerami
- **Email Service**: Serwis wysyłki emaili (zarządzany przez Supabase)

### Kluczowe Mechanizmy

1. **PKCE Flow**: Bezpieczny przepływ autoryzacji OAuth 2.0
2. **Automatyczne odświeżanie tokenu**: Middleware transparentnie odświeża wygasłe tokeny
3. **RLS (Row Level Security)**: Polityki PostgreSQL zabezpieczające dane na poziomie wiersza
4. **Triggery bazy danych**: Automatyczne tworzenie profilu i firmy przy rejestracji
5. **Tryb Demo**: Dostęp do aplikacji bez logowania (tylko odczyt, dane mock)

### Przepływy Bezpieczeństwa

- **Sesja**: Przechowywana w HttpOnly cookies (access_token, refresh_token)
- **Walidacja**: Dwustopniowa - client-side (React) i server-side (API)
- **Polityki RLS**: Każde zapytanie weryfikuje `auth.uid()` w kontekście `company_members`
- **Ogólne komunikaty błędów**: System nie ujawnia czy email istnieje w bazie

### Stany Błędów

- **401 Unauthorized**: Brak lub niewłaściwa sesja
- **403 Forbidden**: Brak uprawnień do zasobu (RLS)
- **400 Validation Error**: Błędne dane wejściowe
- **500 Internal Error**: Błąd serwera lub bazy danych
