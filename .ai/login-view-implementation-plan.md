# Plan implementacji widoku Login

## 1. Przegląd
Widok Login to strona uwierzytelniania użytkownika, która umożliwia bezpieczne logowanie do aplikacji CashFlow Scenarios przy użyciu Supabase Auth. Po pomyślnym zalogowaniu użytkownik jest automatycznie przekierowywany do głównego dashboardu dla firmy, do której jest przyporządkowany. Widok zawiera interaktywny formularz z walidacją po stronie klienta i obsługą błędów.

## 2. Routing widoku
- **Ścieżka:** `/login`
- **Plik:** `src/pages/login.astro`
- **Typ renderowania:** Server-side rendering (SSR) z React Island dla formularza

## 3. Struktura komponentów

```
login.astro (Astro Page)
└── LoginForm.tsx (React Island)
    ├── Card (shadcn/ui)
    │   ├── CardHeader
    │   │   └── CardTitle
    │   └── CardContent
    │       ├── Form Element
    │       │   ├── Label (shadcn/ui) - Email
    │       │   ├── Input (shadcn/ui) - Email field
    │       │   ├── Label (shadcn/ui) - Password
    │       │   ├── Input (shadcn/ui) - Password field
    │       │   └── ErrorMessage - Validation errors
    │       └── Button (shadcn/ui) - Submit
    └── ErrorAlert - API error messages
```

## 4. Szczegóły komponentów

### 4.1. login.astro (Strona Astro)
- **Opis komponentu:** Główna strona logowania, która sprawdza czy użytkownik jest już zalogowany i w razie potrzeby przekierowuje do dashboardu. Renderuje layout oraz komponent LoginForm jako React Island.
- **Główne elementy:**
  - Layout wrapper (`<Layout>`)
  - Container div z centrowaniem pionowym i poziomym
  - Client-side React Island `<LoginForm client:only="react" />`
- **Logika server-side:**
  - Sprawdzenie sesji użytkownika przez `locals.supabase.auth.getUser()`
  - Jeśli użytkownik zalogowany, pobranie profilu i przekierowanie do dashboardu domyślnej firmy
  - Jeśli nie zalogowany, renderowanie formularza
- **Obsługiwane zdarzenia:** Brak (tylko server-side logic)
- **Warunki walidacji:** Brak (walidacja w LoginForm)
- **Typy:** 
  - `UserProfileResponseDTO` (do sprawdzenia profilu)
  - `SupabaseClient` (z locals)
- **Props:** Brak (strona główna)

### 4.2. LoginForm.tsx (React Component)
- **Opis komponentu:** Interaktywny formularz logowania z walidacją po stronie klienta, obsługą błędów i komunikacją z API. Zarządza stanem formularza, walidacją pól oraz procesem uwierzytelniania.
- **Główne elementy:**
  - `Card` - kontener formularza
  - `CardHeader` z `CardTitle` - nagłówek "Zaloguj się"
  - `CardContent` z formularzem:
    - Email input field (Label + Input)
    - Password input field (Label + Input)
    - Error messages dla każdego pola
    - Submit Button
  - Alert z błędem API (jeśli występuje)
- **Obsługiwane interakcje:**
  - `onChange` dla pól email i password (aktualizacja stanu + walidacja błyskawiczna)
  - `onBlur` dla pól (walidacja po opuszczeniu pola)
  - `onSubmit` formularza (walidacja pełna + wysłanie żądania API)
  - Obsługa Enter w polach (natywne submit)
- **Obsługiwana walidacja:**
  - **Email:**
    - Wymagane pole (nie może być puste)
    - Format email (regex lub HTML5 validation)
    - Komunikat błędu: "Nieprawidłowy format email"
  - **Password:**
    - Wymagane pole (nie może być puste)
    - Minimalna długość: 8 znaków
    - Komunikat błędu: "Hasło musi mieć co najmniej 8 znaków"
  - **Walidacja przed submit:** Oba pola muszą być wypełnione i poprawne
- **Typy:**
  - `SignInRequestDTO` - typ wysyłanych danych
  - `SignInResponseDTO` - typ odpowiedzi sukcesu
  - `ErrorResponseDTO` - typ odpowiedzi błędu
  - `LoginFormState` - stan komponentu (ViewModel)
  - `LoginFormErrors` - błędy walidacji (ViewModel)
- **Propsy:** Brak (standalone component)

### 4.3. Input (shadcn/ui)
- **Opis komponentu:** Komponent pola tekstowego z shadcn/ui, stylizowany zgodnie z Tailwind CSS.
- **Główne elementy:** `<input>` element z klasami Tailwind
- **Obsługiwane interakcje:** onChange, onBlur, onFocus (przekazane przez props)
- **Obsługiwana walidacja:** Brak (walidacja w rodzicu)
- **Typy:** 
  - `InputProps` (React.InputHTMLAttributes)
- **Props:**
  - `type: "email" | "password" | "text"`
  - `value: string`
  - `onChange: (e: React.ChangeEvent<HTMLInputElement>) => void`
  - `onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void`
  - `placeholder?: string`
  - `disabled?: boolean`
  - `aria-label?: string`
  - `aria-invalid?: boolean`
  - `aria-describedby?: string`

### 4.4. Button (shadcn/ui)
- **Opis komponentu:** Przycisk z shadcn/ui z różnymi wariantami stylizacji.
- **Główne elementy:** `<button>` element z klasami Tailwind
- **Obsługiwane interakcje:** onClick (przekazany przez props)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `ButtonProps` (React.ButtonHTMLAttributes)
- **Props:**
  - `type: "submit" | "button" | "reset"`
  - `variant?: "default" | "destructive" | "outline" | "ghost"`
  - `size?: "default" | "sm" | "lg"`
  - `disabled?: boolean`
  - `children: React.ReactNode`

### 4.5. Label (shadcn/ui)
- **Opis komponentu:** Etykieta dla pól formularza z shadcn/ui.
- **Główne elementy:** `<label>` element z klasami Tailwind
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `LabelProps` (React.LabelHTMLAttributes)
- **Props:**
  - `htmlFor: string`
  - `children: React.ReactNode`

### 4.6. Card, CardHeader, CardTitle, CardContent (shadcn/ui)
- **Opis komponentu:** Komponenty kontenera karty z shadcn/ui dla wizualnego grupowania formularza.
- **Główne elementy:** `<div>` elementy z odpowiednimi klasami Tailwind
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Standardowe React props
- **Props:**
  - `children: React.ReactNode`
  - `className?: string`

## 5. Typy

### 5.1. Typy Request/Response (już zdefiniowane w types.ts)

```typescript
// Request DTO
export interface SignInRequestDTO {
  email: string;
  password: string;
}

// Response DTO - Success
export interface SignInResponseDTO {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// Response DTO - User Profile
export interface UserProfileResponseDTO {
  user_id: string;
  default_company_id: string | null;
  created_at: string;
  companies: UserCompanyDTO[];
}

export interface UserCompanyDTO {
  company_id: string;
  name: string;
  base_currency: string;
  joined_at: string;
}

// Response DTO - Error
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

### 5.2. Nowe typy ViewModel (do utworzenia)

**Lokalizacja:** `src/components/auth/LoginForm.tsx` (inline lub w oddzielnym pliku `src/components/auth/types.ts`)

```typescript
// Stan formularza logowania
export interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  apiError: string | null;
}

// Błędy walidacji formularza
export interface LoginFormErrors {
  email: string | null;
  password: string | null;
}

// Typ dla statusu pola (do wizualizacji stanu)
export interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

// Kompleksowy stan formularza z polami
export interface LoginFormViewModel {
  fields: {
    email: FieldState;
    password: FieldState;
  };
  isSubmitting: boolean;
  apiError: string | null;
  isValid: boolean;
}
```

### 5.3. Typy walidacji (do utworzenia)

**Lokalizacja:** `src/lib/validation/auth.validation.ts` (częściowo już istnieje)

```typescript
import { z } from 'zod';

// Zod schema dla logowania (już istnieje)
export const SignInSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków')
});

export type SignInInput = z.infer<typeof SignInSchema>;

// Funkcja walidująca pojedyncze pole
export function validateField(
  field: 'email' | 'password',
  value: string
): string | null {
  try {
    if (field === 'email') {
      SignInSchema.shape.email.parse(value);
    } else if (field === 'password') {
      SignInSchema.shape.password.parse(value);
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Nieprawidłowa wartość';
    }
    return 'Błąd walidacji';
  }
}
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny w LoginForm.tsx

Komponent `LoginForm` wykorzystuje React hooks do zarządzania stanem:

**Stan formularza (useState):**
```typescript
const [formState, setFormState] = useState<LoginFormState>({
  email: '',
  password: '',
  isSubmitting: false,
  apiError: null,
});

const [errors, setErrors] = useState<LoginFormErrors>({
  email: null,
  password: null,
});

const [touched, setTouched] = useState({
  email: false,
  password: false,
});
```

**Funkcje zarządzania stanem:**
- `handleEmailChange(value: string)` - aktualizuje pole email i waliduje
- `handlePasswordChange(value: string)` - aktualizuje pole password i waliduje
- `handleBlur(field: 'email' | 'password')` - oznacza pole jako dotknięte
- `validateForm()` - waliduje cały formularz przed submit
- `handleSubmit(e: FormEvent)` - obsługuje wysłanie formularza

### 6.2. Custom Hook (opcjonalnie, do rozważenia)

**Lokalizacja:** `src/components/hooks/useLoginForm.ts`

Można wyodrębnić logikę formularza do custom hooka dla lepszej separacji:

```typescript
export function useLoginForm() {
  const [formState, setFormState] = useState<LoginFormState>({...});
  const [errors, setErrors] = useState<LoginFormErrors>({...});
  const [touched, setTouched] = useState({...});

  const handleFieldChange = (field: 'email' | 'password', value: string) => {
    // Logika aktualizacji i walidacji
  };

  const handleSubmit = async (onSuccess: (data: SignInResponseDTO) => void) => {
    // Logika submit
  };

  return {
    formState,
    errors,
    touched,
    handleFieldChange,
    handleSubmit,
    isValid: !errors.email && !errors.password,
  };
}
```

### 6.3. Stan sesji (Supabase)

Sesja użytkownika jest zarządzana przez Supabase Auth:
- Po pomyślnym logowaniu, Supabase automatycznie przechowuje session w localStorage
- Token JWT jest przechowywany w httpOnly cookie (konfiguracja Supabase)
- Middleware sprawdza sesję przy każdym żądaniu

## 7. Integracja API

### 7.1. Endpoint Sign In

**URL:** `POST /api/auth/signin`

**Request:**
- **Typ:** `SignInRequestDTO`
- **Body:**
```typescript
{
  email: string;    // Format email
  password: string; // Min. 8 znaków
}
```

**Response - Success (200 OK):**
- **Typ:** `SignInResponseDTO`
- **Body:**
```typescript
{
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Response - Error:**
- **400 Bad Request:** `ErrorResponseDTO` - błąd walidacji
- **401 Unauthorized:** `ErrorResponseDTO` - błędne dane logowania

### 7.2. Endpoint Profile

**URL:** `GET /api/profile`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response - Success (200 OK):**
- **Typ:** `UserProfileResponseDTO`
- **Body:**
```typescript
{
  user_id: string;
  default_company_id: string | null;
  created_at: string;
  companies: UserCompanyDTO[];
}
```

**Response - Error:**
- **401 Unauthorized:** Brak lub nieprawidłowy token
- **404 Not Found:** Profil nie istnieje

### 7.3. Implementacja w LoginForm

```typescript
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  
  // 1. Walidacja formularza
  const isValid = validateForm();
  if (!isValid) return;
  
  // 2. Ustawienie stanu loading
  setFormState(prev => ({ ...prev, isSubmitting: true, apiError: null }));
  
  try {
    // 3. Wywołanie API Sign In
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formState.email,
        password: formState.password,
      } as SignInRequestDTO),
    });
    
    // 4. Obsługa odpowiedzi
    if (!response.ok) {
      const errorData: ErrorResponseDTO = await response.json();
      
      // Obsługa błędów walidacji (400)
      if (response.status === 400 && errorData.error.details) {
        const newErrors: LoginFormErrors = { email: null, password: null };
        errorData.error.details.forEach(detail => {
          if (detail.field === 'email') newErrors.email = detail.message;
          if (detail.field === 'password') newErrors.password = detail.message;
        });
        setErrors(newErrors);
      } else {
        // Obsługa błędów uwierzytelniania (401) i innych
        setFormState(prev => ({ 
          ...prev, 
          apiError: errorData.error.message || 'Wystąpił błąd podczas logowania'
        }));
      }
      
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      return;
    }
    
    // 5. Sukces - parsowanie odpowiedzi
    const data: SignInResponseDTO = await response.json();
    
    // 6. Pobranie profilu użytkownika
    const profileResponse = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`,
      },
    });
    
    if (!profileResponse.ok) {
      throw new Error('Nie udało się pobrać profilu użytkownika');
    }
    
    const profile: UserProfileResponseDTO = await profileResponse.json();
    
    // 7. Przekierowanie do dashboardu
    if (profile.default_company_id) {
      window.location.href = `/companies/${profile.default_company_id}/dashboard`;
    } else if (profile.companies.length > 0) {
      // Jeśli brak default_company_id, przekieruj do pierwszej firmy
      window.location.href = `/companies/${profile.companies[0].company_id}/dashboard`;
    } else {
      // Użytkownik nie ma przypisanych firm
      setFormState(prev => ({
        ...prev,
        apiError: 'Brak przypisanych firm. Skontaktuj się z administratorem.',
        isSubmitting: false,
      }));
    }
    
  } catch (error) {
    console.error('Login error:', error);
    setFormState(prev => ({
      ...prev,
      apiError: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
      isSubmitting: false,
    }));
  }
}
```

## 8. Interakcje użytkownika

### 8.1. Wprowadzanie danych w pola formularza

**Interakcja:**
- Użytkownik klika w pole Email lub Password
- Wpisuje tekst w pole

**Obsługa:**
1. Pole otrzymuje focus (`:focus-visible` style)
2. Event `onChange` wywołuje `handleEmailChange` lub `handlePasswordChange`
3. Wartość jest zapisywana w stanie formularza
4. Pole jest oznaczane jako "dirty" (zmodyfikowane)
5. Walidacja w czasie rzeczywistym (opcjonalnie) - pokazanie błędu po wpisaniu nieprawidłowej wartości

**Rezultat:**
- Pole wyświetla wprowadzoną wartość
- Jeśli błąd walidacji, pole otrzymuje czerwoną ramkę i komunikat błędu poniżej

### 8.2. Opuszczanie pola (blur)

**Interakcja:**
- Użytkownik klika poza pole lub naciska Tab

**Obsługa:**
1. Event `onBlur` wywołuje `handleBlur`
2. Pole jest oznaczane jako "touched" (dotknięte)
3. Uruchamiana jest walidacja pola
4. Jeśli wartość nieprawidłowa, wyświetlany jest komunikat błędu

**Rezultat:**
- Wyświetlenie komunikatu błędu (jeśli pole niepoprawne)
- Wizualne wskazanie błędu (czerwona ramka)

### 8.3. Wysłanie formularza (Submit)

**Interakcja:**
- Użytkownik klika przycisk "Zaloguj się"
- Lub naciska Enter w jednym z pól

**Obsługa:**
1. Event `onSubmit` wywołuje `handleSubmit`
2. `preventDefault()` zapobiega przeładowaniu strony
3. Walidacja wszystkich pól
4. Jeśli błędy, wyświetlenie komunikatów i przerwanie
5. Jeśli OK, wysłanie żądania POST do `/api/auth/signin`
6. Wyświetlenie wskaźnika ładowania (przycisk disabled, spinner)
7. Obsługa odpowiedzi API
8. W przypadku sukcesu: przekierowanie do dashboardu
9. W przypadku błędu: wyświetlenie komunikatu błędu

**Rezultat sukcesu:**
- Przekierowanie do `/companies/{company_id}/dashboard`
- Sesja użytkownika jest zapisana

**Rezultat błędu:**
- Wyświetlenie komunikatu błędu nad formularzem
- Przycisk wraca do stanu aktywnego
- Pola pozostają wypełnione (użytkownik może poprawić dane)

### 8.4. Nawigacja klawiaturą

**Interakcja:**
- Użytkownik używa klawisza Tab do nawigacji między polami
- Enter w polu uruchamia submit formularza
- Escape w polu czyści fokus (opcjonalnie)

**Obsługa:**
- Natywna obsługa HTML (tabindex)
- Focus styles (`:focus-visible`)
- Enter obsługiwany przez natywny submit formularza

**Rezultat:**
- Pełna dostępność dla użytkowników klawiatury
- Wyraźne wskazanie fokusa

## 9. Warunki i walidacja

### 9.1. Walidacja pola Email

**Komponenty:** LoginForm > Input (email)

**Warunki:**
1. Pole nie może być puste
   - Komunikat: "Email jest wymagany"
   - Kiedy sprawdzać: onBlur, onSubmit
2. Musi być poprawnym formatem email
   - Komunikat: "Nieprawidłowy format email"
   - Regex lub HTML5 validation
   - Kiedy sprawdzać: onChange (po wpisaniu @), onBlur, onSubmit

**Wpływ na UI:**
- Pole z błędem: czerwona ramka (`border-red-500`)
- Komunikat błędu: czerwony tekst poniżej pola
- Ikona błędu obok pola (opcjonalnie)
- Przycisk Submit nieaktywny jeśli email niepoprawny (opcjonalnie)

**Atrybuty ARIA:**
- `aria-invalid="true"` gdy błąd
- `aria-describedby="email-error"` wskazuje na komunikat błędu

### 9.2. Walidacja pola Password

**Komponenty:** LoginForm > Input (password)

**Warunki:**
1. Pole nie może być puste
   - Komunikat: "Hasło jest wymagane"
   - Kiedy sprawdzać: onBlur, onSubmit
2. Minimalna długość 8 znaków
   - Komunikat: "Hasło musi mieć co najmniej 8 znaków"
   - Kiedy sprawdzać: onChange (po wpisaniu), onBlur, onSubmit

**Wpływ na UI:**
- Pole z błędem: czerwona ramka (`border-red-500`)
- Komunikat błędu: czerwony tekst poniżej pola
- Ikona błędu obok pola (opcjonalnie)
- Wskaźnik siły hasła (opcjonalnie, poza MVP)

**Atrybuty ARIA:**
- `aria-invalid="true"` gdy błąd
- `aria-describedby="password-error"` wskazuje na komunikat błędu

### 9.3. Walidacja całego formularza przed Submit

**Komponenty:** LoginForm

**Warunki:**
1. Oba pola muszą być wypełnione
2. Oba pola muszą być poprawne (przejść walidację indywidualną)
3. Nie może trwać inny proces logowania (isSubmitting === false)

**Wpływ na UI:**
- Przycisk Submit disabled gdy formularz niepoprawny lub isSubmitting
- Spinner w przycisku podczas wysyłania
- Tekst przycisku zmienia się na "Logowanie..." podczas wysyłania

### 9.4. Walidacja odpowiedzi API

**Komponenty:** LoginForm

**Warunki sprawdzane:**
1. Status 400 (Bad Request) - błędy walidacji po stronie serwera
   - Wyświetlenie konkretnych błędów pod polami
2. Status 401 (Unauthorized) - błędne dane logowania
   - Komunikat: "Nieprawidłowy email lub hasło"
   - Wyświetlenie jako apiError nad formularzem
3. Status 500 lub inne - błąd serwera
   - Komunikat: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
   - Wyświetlenie jako apiError nad formularzem

**Wpływ na UI:**
- Alert/Banner z błędem API nad formularzem
- Czerwone tło, ikona błędu
- Możliwość zamknięcia alertu (X button)

### 9.5. Warunki przekierowania

**Komponenty:** login.astro (server-side), LoginForm (client-side)

**Warunki:**
1. **Server-side (login.astro):**
   - Jeśli użytkownik zalogowany → redirect do `/companies/{company_id}/dashboard`
   
2. **Client-side (LoginForm po submit success):**
   - Jeśli `default_company_id` istnieje → redirect do `/companies/{default_company_id}/dashboard`
   - Jeśli brak `default_company_id` ale `companies.length > 0` → redirect do pierwszej firmy
   - Jeśli `companies.length === 0` → wyświetlenie błędu (brak przypisanych firm)

**Wpływ na UI:**
- Automatyczne przekierowanie (pełne przeładowanie strony)
- Brak widocznej akcji dla użytkownika (płynne przejście)

## 10. Obsługa błędów

### 10.1. Błędy walidacji (client-side)

**Scenariusz:** Użytkownik wprowadza nieprawidłowe dane w formularz

**Obsługa:**
1. Walidacja uruchamiana przez Zod schema
2. Błędy zapisywane w stanie `errors`
3. Wyświetlenie komunikatów pod konkretnymi polami
4. Blokada wysłania formularza

**Komunikaty:**
- "Email jest wymagany"
- "Nieprawidłowy format email"
- "Hasło jest wymagane"
- "Hasło musi mieć co najmniej 8 znaków"

**UI:**
- Czerwone ramki wokół pól
- Czerwone teksty błędów pod polami
- Ikona błędu (opcjonalnie)

### 10.2. Błędy walidacji (server-side - 400 Bad Request)

**Scenariusz:** Serwer zwraca błąd walidacji (400) z konkretnymi polami

**Obsługa:**
1. Parse response body jako `ErrorResponseDTO`
2. Iteracja przez `error.details`
3. Mapowanie błędów do odpowiednich pól w stanie `errors`
4. Wyświetlenie komunikatów pod polami

**Komunikaty:**
- Dynamiczne, z `detail.message` z API

**UI:**
- Jak w przypadku błędów client-side
- Dodatkowo możliwe wyświetlenie ogólnego komunikatu

### 10.3. Błędy uwierzytelniania (401 Unauthorized)

**Scenariusz:** Nieprawidłowe dane logowania (błędny email lub hasło)

**Obsługa:**
1. Sprawdzenie `response.status === 401`
2. Parse response body jako `ErrorResponseDTO`
3. Zapisanie `error.message` w stanie `apiError`
4. Wyświetlenie alertu/banneru nad formularzem
5. Wyczyszczenie pola hasła (opcjonalnie, dla bezpieczeństwa)

**Komunikaty:**
- "Nieprawidłowy email lub hasło"
- Lub dynamiczny komunikat z API

**UI:**
- Alert/Banner na górze formularza
- Czerwone tło, ikona błędu
- Możliwość zamknięcia (X button)

### 10.4. Błędy sieciowe (Network Error)

**Scenariusz:** Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa:**
1. Catch w bloku try-catch
2. Zapisanie ogólnego komunikatu w `apiError`
3. Wyświetlenie alertu

**Komunikaty:**
- "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."

**UI:**
- Alert/Banner jak w przypadku 401

### 10.5. Błędy serwera (500 Internal Server Error)

**Scenariusz:** Błąd po stronie serwera

**Obsługa:**
1. Sprawdzenie `response.status === 500`
2. Parse response body (jeśli dostępne) lub użycie domyślnego komunikatu
3. Zapisanie komunikatu w `apiError`
4. Logowanie błędu do konsoli (dla debugowania)

**Komunikaty:**
- "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."

**UI:**
- Alert/Banner jak powyżej

### 10.6. Brak profilu użytkownika (404 Not Found z /api/profile)

**Scenariusz:** Użytkownik zalogowany ale profil nie istnieje w bazie

**Obsługa:**
1. Sprawdzenie `profileResponse.status === 404`
2. Wyświetlenie komunikatu o błędzie konfiguracji konta
3. Możliwość wylogowania i kontaktu z supportem

**Komunikaty:**
- "Nie znaleziono profilu użytkownika. Skontaktuj się z administratorem."

**UI:**
- Alert/Banner z instrukcjami

### 10.7. Brak przypisanych firm

**Scenariusz:** Użytkownik zalogowany ale nie ma dostępu do żadnej firmy

**Obsługa:**
1. Sprawdzenie `profile.companies.length === 0`
2. Wyświetlenie komunikatu
3. Brak przekierowania (użytkownik pozostaje na stronie logowania lub przekierowanie do "onboarding")

**Komunikaty:**
- "Brak przypisanych firm. Skontaktuj się z administratorem."

**UI:**
- Alert/Banner z instrukcjami
- Przycisk "Wyloguj się"

### 10.8. Strategia retry (opcjonalnie)

**Scenariusz:** Tymczasowe problemy sieciowe

**Obsługa:**
1. Implementacja funkcji retry z exponential backoff
2. Maksymalnie 2-3 próby
3. Wyświetlenie komunikatu "Ponawiam próbę..."

**UI:**
- Spinner z tekstem "Ponawiam próbę..."

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików
1. Utworzenie strony `src/pages/login.astro`
2. Utworzenie komponentu `src/components/auth/LoginForm.tsx`
3. Utworzenie pliku z typami (jeśli nie inline): `src/components/auth/types.ts`

### Krok 2: Implementacja strony login.astro
1. Import niezbędnych typów i komponentów
2. Implementacja server-side logic:
   - Sprawdzenie sesji przez `locals.supabase.auth.getUser()`
   - Jeśli zalogowany, pobranie profilu z `/api/profile`
   - Przekierowanie do dashboardu jeśli profil istnieje
3. Renderowanie Layout
4. Renderowanie LoginForm jako React Island (`client:only="react"`)
5. Dodanie stylów (centrowanie, background)

### Krok 3: Implementacja komponentu LoginForm.tsx - struktura
1. Import React hooks (useState, FormEvent)
2. Import komponentów shadcn/ui (Card, Input, Button, Label)
3. Import typów (SignInRequestDTO, SignInResponseDTO, ErrorResponseDTO)
4. Definicja interfejsów ViewModel (LoginFormState, LoginFormErrors)
5. Utworzenie szkieletu komponentu z return JSX
6. Struktura HTML/JSX:
   - Card wrapper
   - CardHeader z tytułem
   - CardContent z formularzem
   - Pola Email i Password
   - Przycisk Submit

### Krok 4: Implementacja zarządzania stanem
1. Utworzenie state hooks:
   - `useState<LoginFormState>` dla formState
   - `useState<LoginFormErrors>` dla errors
   - `useState` dla touched fields
2. Implementacja funkcji handleFieldChange (email, password)
3. Implementacja funkcji handleBlur
4. Implementacja funkcji resetApiError (do czyszczenia błędów API)

### Krok 5: Implementacja walidacji
1. Import lub utworzenie walidacji Zod (SignInSchema)
2. Implementacja funkcji `validateField` dla pojedynczego pola
3. Implementacja funkcji `validateForm` dla całego formularza
4. Podpięcie walidacji do handleFieldChange i handleBlur
5. Wyświetlanie błędów w UI (komunikaty pod polami)

### Krok 6: Implementacja wysyłania formularza
1. Implementacja funkcji `handleSubmit`:
   - preventDefault
   - Walidacja formularza
   - Ustawienie isSubmitting na true
   - Wywołanie fetch do `/api/auth/signin`
   - Parse odpowiedzi
2. Obsługa sukcesu:
   - Wywołanie fetch do `/api/profile`
   - Parse profilu
   - Logika przekierowania
3. Obsługa błędów:
   - Mapowanie błędów 400 do pól
   - Wyświetlanie błędów 401 jako apiError
   - Obsługa błędów sieciowych
4. Ustawienie isSubmitting na false w finally/catch

### Krok 7: Implementacja UI błędów
1. Komponent/element wyświetlający apiError (Alert/Banner)
2. Style dla pól z błędami (czerwone ramki)
3. Komunikaty błędów pod polami
4. Ikony błędów (opcjonalnie)
5. Przycisk zamykania alertu apiError

### Krok 8: Implementacja stanu ładowania
1. Wyświetlanie spinnera w przycisku podczas isSubmitting
2. Zmiana tekstu przycisku na "Logowanie..." podczas isSubmitting
3. Disabled state dla przycisku i pól podczas isSubmitting
4. Wskaźnik ładowania (opcjonalnie, progress bar)

### Krok 9: Implementacja dostępności (a11y)
1. Dodanie `<label>` dla wszystkich pól z atrybutem `htmlFor`
2. Dodanie `aria-invalid` dla pól z błędami
3. Dodanie `aria-describedby` wskazującego na komunikaty błędów
4. Dodanie `role="alert"` dla komunikatów błędów
5. Zapewnienie prawidłowego focus order (tabindex)
6. Style `:focus-visible` dla wszystkich interaktywnych elementów
7. Testowanie nawigacji klawiaturą

### Krok 10: Stylizacja (Tailwind CSS)
1. Implementacja responsywnego layoutu (centrowanie)
2. Stylizacja Card (padding, shadow, border-radius)
3. Stylizacja pól Input (height, padding, border, focus states)
4. Stylizacja Button (colors, hover, active, disabled states)
5. Stylizacja komunikatów błędów (kolor, rozmiar czcionki)
6. Stylizacja alertu API error (background, border, padding)
7. Implementacja dark mode (opcjonalnie)
8. Responsive design (mobile-first)

### Krok 11: Testowanie manualne
1. Testowanie walidacji:
   - Puste pola
   - Nieprawidłowy email
   - Zbyt krótkie hasło
2. Testowanie wysyłania formularza:
   - Poprawne dane (sukces)
   - Niepoprawne dane (401)
   - Błędy sieciowe (offline)
3. Testowanie przekierowań:
   - Z default_company_id
   - Bez default_company_id ale z companies
   - Bez companies (edge case)
4. Testowanie dostępności:
   - Nawigacja klawiaturą
   - Screen reader (opcjonalnie)
5. Testowanie różnych rozdzielczości (mobile, tablet, desktop)

### Krok 12: Optymalizacje i poprawki
1. Code review
2. Refactoring (wyodrębnienie custom hooka jeśli potrzeba)
3. Optymalizacja re-renderów (React.memo, useCallback)
4. Dodanie komentarzy w kodzie
5. Usunięcie console.log (pozostawienie tylko w catch dla błędów)
6. Dodanie TODO dla przyszłych ulepszeń (np. "Remember me", "Forgot password")

### Krok 13: Dokumentacja
1. Dodanie komentarzy JSDoc do funkcji
2. Dokumentacja propsów komponentów
3. Aktualizacja README (jeśli potrzebna)
4. Dodanie przykładów użycia (jeśli komponent reużywalny)

### Krok 14: Deploy i testowanie produkcyjne
1. Build produkcyjny
2. Testowanie na środowisku staging
3. Weryfikacja HTTPS
4. Testowanie z prawdziwą bazą danych
5. Monitoring błędów (Sentry lub podobne, opcjonalnie)
6. Deploy na produkcję

---

**Uwagi końcowe:**
- Plan zakłada wykorzystanie istniejących endpointów API (już zaimplementowanych)
- Typy request/response już istnieją w `types.ts`
- Komponenty shadcn/ui (Button, Input, Label, Card) powinny już istnieć w projekcie
- Walidacja Zod już częściowo zaimplementowana w `src/lib/validation/auth.validation.ts`
- Należy upewnić się, że middleware poprawnie obsługuje Supabase Auth i udostępnia `locals.supabase`
- W przyszłości można rozszerzyć o funkcje: "Remember me", "Forgot password", "Sign up link", OAuth providers
