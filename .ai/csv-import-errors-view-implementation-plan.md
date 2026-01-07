# Plan implementacji widoku Obsługi błędów importu CSV

## 1. Przegląd

Widok obsługi błędów importu CSV stanowi integralną część procesu importowania danych z plików CSV. Jest to czwarty krok (ValidationStep) w wieloetapowym kreatorze ImportWizard. Głównym celem tego widoku jest prezentacja wyników walidacji importowanego pliku CSV, wyświetlenie szczegółowych informacji o błędach walidacji oraz umożliwienie użytkownikowi podjęcia decyzji o dalszych działaniach - kontynuacji importu z pominięciem błędnych wierszy lub powrotu do poprzedniego kroku w celu poprawienia pliku źródłowego.

Widok zapewnia przejrzystą wizualizację statystyk importu (całkowita liczba wierszy, wiersze poprawne, wiersze błędne), szczegółową tabelę błędów z paginacją oraz możliwość eksportu raportu błędów do formatu CSV. Komponent jest zaprojektowany zgodnie z zasadami dostępności (ARIA, nawigacja klawiaturowa) i wykorzystuje komponenty z biblioteki shadcn/ui dla spójności wizualnej z resztą aplikacji.

## 2. Routing widoku

Widok nie ma dedykowanej ścieżki URL - jest renderowany jako krok w kreatorze importu w ramach strony `/import`. Jest wyświetlany, gdy użytkownik przejdzie do kroku `WizardStep.Validation` (krok 3) w komponencie `ImportWizard`.

Struktura nawigacji:
- Strona: `/import`
- Komponent nadrzędny: `ImportWizard.tsx`
- Aktywny krok: `WizardStep.Validation` (wartość 3 z enum)
- Renderowany komponent: `ValidationStep.tsx`

## 3. Struktura komponentów

Widok składa się z hierarchii następujących komponentów:

```
ValidationStep (główny kontener widoku)
├── ValidationSummary (podsumowanie statystyk)
│   ├── Ikona statusu (success/warning/error)
│   ├── Grid statystyk (3 kolumny)
│   └── Pasek procentowy poprawności
│
├── Sekcja szczegółów błędów (warunkowe renderowanie)
│   ├── Header z tytułem i akcjami
│   │   └── DownloadErrorReportButton
│   └── ValidationErrorTable
│       ├── Tabela HTML (<table>)
│       │   ├── <thead> (nagłówki kolumn)
│       │   └── <tbody> (wiersze błędów)
│       │       └── ErrorRow (dla każdego błędu)
│       │           ├── Numer wiersza
│       │           ├── Nazwa kolumny
│       │           ├── Nieprawidłowa wartość
│       │           └── Komunikat błędu + kod
│       └── Paginacja (przyciski prev/next)
│
├── Komunikaty informacyjne (warunkowe renderowanie)
│   ├── Info box - możliwość kontynuacji (niebieski)
│   └── Warning box - brak możliwości kontynuacji (czerwony)
│
└── Przyciski akcji
    ├── Button "Wróć i popraw plik" (variant: outline)
    └── Button "Kontynuuj import" / "Pomiń błędy..." (variant: default)
```

## 4. Szczegóły komponentów

### ValidationStep

**Opis komponentu:**
ValidationStep to główny komponent widoku walidacji w kreatorze importu CSV. Jego zadaniem jest kompleksowa prezentacja wyników walidacji zaimportowanego pliku, w tym wyświetlenie podsumowania statystycznego, szczegółowej listy błędów oraz opcji dalszego postępowania. Komponent agreguje dane z rezultatu walidacji i koordynuje wyświetlanie podkomponentów oraz obsługuje akcje użytkownika.

**Główne elementy HTML i komponenty dzieci:**
- `<div>` (kontener główny z `space-y-6`)
- Header sekcji (`<h2>`, `<p>`)
- `ValidationSummary` - komponent wizualizujący statystyki
- Sekcja błędów (warunkowa):
  - `<div>` z nagłówkiem i przyciskiem
  - `<h3>` "Szczegóły błędów"
  - `DownloadErrorReportButton` - przycisk eksportu
  - `ValidationErrorTable` - tabela z błędami
- Info boxy (warunkowe):
  - `<div>` z komunikatem o możliwości kontynuacji (niebieski)
  - `<div>` z ostrzeżeniem o braku możliwości kontynuacji (czerwony)
- Przyciski akcji:
  - `Button` "Wróć i popraw plik"
  - `Button` "Kontynuuj import" lub "Pomiń błędy..."

**Obsługiwane zdarzenia:**
- `onBack()` - wywoływane po kliknięciu przycisku powrotu
- `onContinueWithErrors()` - wywoływane po kliknięciu przycisku kontynuacji

**Warunki walidacji:**
- `hasErrors` - czy istnieją błędne wiersze (`invalid_rows > 0`)
- `canProceed` - czy można kontynuować import (`valid_rows > 0`)
- Sekcja błędów renderowana tylko gdy `hasErrors === true`
- Info box o kontynuacji renderowany gdy `hasErrors && canProceed`
- Warning box renderowany gdy `!canProceed`
- Przycisk kontynuacji aktywny tylko gdy `canProceed === true`

**Typy:**
- `ValidationStepProps` (interfejs propsów)
- `ValidationResult` (typ danych walidacji)

**Propsy:**
```typescript
interface ValidationStepProps {
  validationResult: ValidationResult;
  onContinueWithErrors: () => void;
  onBack: () => void;
}
```

---

### ValidationSummary

**Opis komponentu:**
ValidationSummary prezentuje wizualne podsumowanie wyników walidacji w formie karty z ikoną statusu, statystykami numerycznymi oraz paskiem procentowym poprawności danych. Komponent automatycznie określa status walidacji (success/warning/error) na podstawie proporcji błędnych wierszy i dostosowuje kolory oraz ikonografię.

**Główne elementy HTML i komponenty dzieci:**
- `<div>` - kontener główny (card z kolorowym tłem)
- `<div>` - flex container dla zawartości
- Ikona SVG (warunkowa na podstawie statusu)
- `<h3>` - tytuł statusu
- `<div>` - grid 3 kolumny ze statystykami:
  - Kolumna 1: Wszystkie wiersze (`totalRows`)
  - Kolumna 2: Prawidłowe wiersze (`validRows`, kolor zielony)
  - Kolumna 3: Błędne wiersze (`invalidRows`, kolor czerwony)
- `<div>` - sekcja paska procentowego:
  - Label i wartość procentowa
  - Pasek progress (background + fill)

**Obsługiwane zdarzenia:**
Komponent jest prezentacyjny - nie obsługuje zdarzeń użytkownika.

**Obsługiwana walidacja:**
- Obliczanie `validPercentage` = `(validRows / totalRows) * 100`
- Określanie `status`:
  - `"success"` gdy `invalidRows === 0`
  - `"error"` gdy `validRows === 0`
  - `"warning"` w pozostałych przypadkach
- Kolorystyka paska procentowego:
  - Zielony gdy `validPercentage === 100`
  - Bursztynowy gdy `validPercentage > 50`
  - Czerwony gdy `validPercentage <= 50`

**Typy:**
- `ValidationSummaryProps`

**Propsy:**
```typescript
interface ValidationSummaryProps {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}
```

---

### ValidationErrorTable

**Opis komponentu:**
ValidationErrorTable to komponent tabelaryczny wyświetlający szczegółową listę błędów walidacji z funkcjonalnością paginacji. Tabela prezentuje każdy błąd w osobnym wierszu z informacjami o numerze wiersza w pliku CSV, nazwie kolumny, nieprawidłowej wartości oraz komunikacie błędu. Komponent obsługuje dużą liczbę błędów poprzez podział na strony.

**Główne elementy HTML i komponenty dzieci:**
- `<div>` - główny kontener (`space-y-4`)
- `<div>` - kontener tabeli z obramowaniem i overflow
- `<table>` - tabela HTML:
  - `<thead>` - nagłówki kolumn:
    - Nr wiersza
    - Kolumna
    - Wartość
    - Komunikat błędu
  - `<tbody>` - wiersze z danymi:
    - `ErrorRow` (dla każdego błędu na bieżącej stronie)
- Sekcja paginacji (warunkowa, gdy `totalPages > 1`):
  - Informacja "Strona X z Y"
  - `Button` "Poprzednia" (`variant: outline`)
  - `Button` "Następna" (`variant: outline`)

**Obsługiwane zdarzenia:**
- `handlePreviousPage()` - przejście do poprzedniej strony
- `handleNextPage()` - przejście do następnej strony

**Obsługiwana walidacja:**
- Walidacja numeru strony: `currentPage >= 1` i `currentPage <= totalPages`
- Obliczanie `totalPages = Math.ceil(errors.length / itemsPerPage)`
- Obliczanie zakresu wyświetlanych błędów: `startIndex`, `endIndex`
- Wyłączanie przycisków:
  - "Poprzednia" gdy `currentPage === 1`
  - "Następna" gdy `currentPage === totalPages`

**Typy:**
- `ValidationErrorTableProps`
- `ValidationError` (typ pojedynczego błędu)

**Propsy:**
```typescript
interface ValidationErrorTableProps {
  errors: ValidationError[];
  itemsPerPage?: number; // domyślnie: 10
}
```

---

### ErrorRow

**Opis komponentu:**
ErrorRow to komponent prezentacyjny reprezentujący pojedynczy wiersz w tabeli błędów. Wyświetla szczegółowe informacje o konkretnym błędzie walidacji, w tym numer wiersza źródłowego, nazwę pola, nieprawidłową wartość oraz komunikat opisujący problem wraz z opcjonalnym kodem błędu.

**Główne elementy HTML i komponenty dzieci:**
- `<tr>` - wiersz tabeli z klasami interaktywnymi (hover, border)
- `<td>` - numer wiersza (`error.row_number`)
- `<td>` - nazwa kolumny (`error.field_name`) z `font-medium`
- `<td>` - nieprawidłowa wartość:
  - Tekst z `truncate` i `title` dla pełnej wartości
  - Placeholder "-" gdy wartość pusta
- `<td>` - komunikat błędu:
  - `<div>` kontener flex
  - `<span>` komunikat (`error.error_message`) w kolorze destructive
  - `<span>` kod błędu (`error.error_code`) jako monospace, jeśli istnieje

**Obsługiwane zdarzenia:**
Komponent jest prezentacyjny - nie obsługuje zdarzeń użytkownika.

**Obsługiwana walidacja:**
- Wyświetlanie placeholdera gdy `error.invalid_value` jest pusty
- Warunkowe renderowanie kodu błędu (tylko jeśli `error.error_code` istnieje)

**Typy:**
- `ErrorRowProps`
- `ValidationError`

**Propsy:**
```typescript
interface ErrorRowProps {
  error: ValidationError;
}
```

---

### DownloadErrorReportButton

**Opis komponentu:**
DownloadErrorReportButton to przycisk umożliwiający pobranie raportu błędów w formacie CSV. Komponent generuje plik CSV zawierający wszystkie błędy walidacji, formatuje dane (z uwzględnieniem escapowania cudzysłowów) i inicjuje pobieranie pliku przez przeglądarkę. Przycisk jest wyłączony gdy brak błędów do eksportu.

**Główne elementy HTML i komponenty dzieci:**
- `Button` (z shadcn/ui, `variant: outline`)
- Ikona SVG (strzałka w dół) z marginesem
- Tekst "Pobierz raport błędów" (nie widoczny w kodzie, ale standardowo dodawany)

**Obsługiwane zdarzenia:**
- `handleDownload()` - generowanie i pobieranie pliku CSV

**Obsługiwana walidacja:**
- Przycisk wyłączony (`disabled`) gdy `errors.length === 0`
- Escapowanie cudzysłowów w wartościach CSV: `value.replace(/"/g, '""')`
- Generowanie prawidłowego formatu CSV (nagłówki + wiersze)

**Typy:**
- `DownloadErrorReportButtonProps`
- `ValidationError[]`

**Propsy:**
```typescript
interface DownloadErrorReportButtonProps {
  errors: ValidationError[];
  fileName?: string; // domyślnie: "import-errors.csv"
}
```

## 5. Typy

### Typy podstawowe (istniejące w types.ts)

```typescript
// Wynik walidacji całego pliku
export interface ValidationResult {
  import_id: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: ValidationError[];
  status: 'success' | 'warning' | 'error';
}

// Pojedynczy błąd walidacji
export interface ValidationError {
  row_number: number;        // Numer wiersza w pliku CSV
  field_name: string;         // Nazwa pola/kolumny z błędem
  invalid_value: string;      // Nieprawidłowa wartość
  error_message: string;      // Czytelny komunikat błędu
  error_code?: string;        // Opcjonalny kod błędu (np. INVALID_DATE_FORMAT)
}

// Kody błędów walidacji
export enum ValidationErrorCode {
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_AMOUNT_FORMAT = 'INVALID_AMOUNT_FORMAT',
  INVALID_DIRECTION = 'INVALID_DIRECTION',
  INVALID_CURRENCY_CODE = 'INVALID_CURRENCY_CODE',
  NEGATIVE_AMOUNT = 'NEGATIVE_AMOUNT',
  DUPLICATE_FLOW_ID = 'DUPLICATE_FLOW_ID',
}
```

### Typy komponentów (interfejsy props)

```typescript
// Props głównego widoku walidacji
interface ValidationStepProps {
  validationResult: ValidationResult;
  onContinueWithErrors: () => void;
  onBack: () => void;
}

// Props komponentu podsumowania
interface ValidationSummaryProps {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

// Props tabeli błędów
interface ValidationErrorTableProps {
  errors: ValidationError[];
  itemsPerPage?: number;
}

// Props wiersza błędu
interface ErrorRowProps {
  error: ValidationError;
}

// Props przycisku pobierania raportu
interface DownloadErrorReportButtonProps {
  errors: ValidationError[];
  fileName?: string;
}
```

### Typy pomocnicze (ViewModels)

```typescript
// Konfiguracja wizualizacji statusu
type ValidationStatus = 'success' | 'warning' | 'error';

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Typ dla konfiguracji statusów (używany wewnętrznie w ValidationSummary)
type StatusConfigMap = Record<ValidationStatus, StatusConfig>;
```

## 6. Zarządzanie stanem

### Stan w ValidationStep
ValidationStep jest komponentem prezentacyjnym - nie zarządza własnym stanem globalnym. Otrzymuje dane poprzez props:
- `validationResult` - kompletny wynik walidacji z backendu
- Callbacks dla akcji użytkownika (`onBack`, `onContinueWithErrors`)

### Stan w ValidationErrorTable
Komponent zarządza lokalnym stanem paginacji:
```typescript
const [currentPage, setCurrentPage] = useState(1);
```

Stan jest aktualizowany przez:
- `handlePreviousPage()` - dekrementacja strony
- `handleNextPage()` - inkrementacja strony
- Walidacja: strona nie może być < 1 ani > totalPages

### Stan w DownloadErrorReportButton
Komponent bezstanowy - całą logikę eksportu wykonuje synchronicznie w handleDownload().

### Stan w komponencie nadrzędnym (ImportWizard)

Pełny stan kreatora jest zarządzany w `ImportWizard` poprzez custom hook `useImportWizard`:

```typescript
interface ImportWizardState {
  currentStep: WizardStep;
  companyId: string;
  file: File | null;
  datasetCode: string;
  csvHeaders: string[];
  previewRows: string[][];
  columnMapping: ColumnMapping;
  validationResult: ValidationResult | null; // ← używane w ValidationStep
  importId: number | null;
  scenarioId: number | null;
  error: string | null;
}
```

Walidacja jest wykonywana w kroku ColumnMapping poprzez wywołanie API endpoint:
- `POST /api/companies/{companyId}/imports` - wysyła plik i mapowanie
- Backend zwraca `ValidationResult` zawierający błędy
- Wynik jest zapisywany w `validationResult` state
- ValidationStep otrzymuje go jako prop

## 7. Integracja API

### Endpoint walidacji importu

**Endpoint:** `POST /api/companies/{companyId}/imports`

**Request:**
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: multipart/form-data`
- **Body (multipart/form-data):**
  ```typescript
  {
    file: File,              // Plik CSV
    dataset_code: string     // Kod zestawu danych
  }
  ```

**Response (202 Accepted):**
```typescript
{
  id: number,              // ID importu
  company_id: string,
  dataset_code: string,
  status: 'pending',
  file_name: string,
  created_at: string
}
```

Backend rozpoczyna asynchroniczne przetwarzanie pliku. Frontend powinien następnie odpytywać o status.

### Endpoint szczegółów importu (polling)

**Endpoint:** `GET /api/companies/{companyId}/imports/{importId}`

**Request:**
- **Method:** GET
- **Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
{
  id: number,
  company_id: string,
  dataset_code: string,
  status: 'completed' | 'processing' | 'failed',
  total_rows: number,
  valid_rows: number,
  invalid_rows: number,
  inserted_transactions_count: number,
  error_report_json: {
    errors: Array<{
      row: number,
      field: string,
      message: string
    }>
  },
  error_report_url: string | null,
  file_name: string,
  uploaded_by: string,
  created_at: string
}
```

**Mapowanie na ValidationResult:**
```typescript
const validationResult: ValidationResult = {
  import_id: response.id,
  total_rows: response.total_rows,
  valid_rows: response.valid_rows,
  invalid_rows: response.invalid_rows,
  errors: response.error_report_json.errors.map(e => ({
    row_number: e.row,
    field_name: e.field,
    invalid_value: '', // może być w raw_data
    error_message: e.message,
    error_code: undefined
  })),
  status: response.invalid_rows === 0 ? 'success' 
    : response.valid_rows === 0 ? 'error' 
    : 'warning'
};
```

### Endpoint błędów importu (szczegółowe)

**Endpoint:** `GET /api/companies/{companyId}/imports/{importId}/errors`

**Request:**
- **Method:** GET
- **Headers:** `Authorization: Bearer {token}`
- **Query params:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 50, max: 200)

**Response (200 OK):**
```typescript
{
  import_id: number,
  errors: Array<{
    row_number: number,
    raw_data: object,        // Surowe dane wiersza
    error_message: string,
    created_at: string
  }>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    total_pages: number
  }
}
```

**Uwaga:** Ten endpoint jest używany opcjonalnie dla bardzo dużych zbiorów błędów, gdzie paginacja po stronie serwera jest konieczna. W MVP ValidationStep otrzymuje wszystkie błędy z poprzedniego endpointu i paginuje lokalnie.

## 8. Interakcje użytkownika

### Interakcja 1: Przegląd statystyk walidacji
**Opis:** Użytkownik wchodzi do kroku walidacji i od razu widzi podsumowanie wyników.

**Przepływ:**
1. Użytkownik kończy mapowanie kolumn i klika "Waliduj"
2. System wysyła plik do API (POST /imports)
3. System odpytuje endpoint szczegółów importu (GET /imports/{id})
4. Po otrzymaniu statusu "completed", frontend wyświetla ValidationStep
5. Użytkownik widzi ValidationSummary z:
   - Ikoną statusu (✓ / ⚠ / ✗)
   - Liczbami: wszystkie / prawidłowe / błędne wiersze
   - Paskiem procentowym poprawności

**Oczekiwany wynik:** Natychmiastowa wizualizacja jakości danych z użyciem kolorów i ikon.

---

### Interakcja 2: Przeglądanie szczegółów błędów
**Opis:** Użytkownik przegląda listę błędów walidacji, aby zidentyfikować problemy.

**Przepływ:**
1. W sekcji "Szczegóły błędów" użytkownik widzi tabelę z błędami
2. Każdy wiersz zawiera:
   - Numer wiersza w pliku CSV (np. 15)
   - Nazwę kolumny z błędem (np. "date_due")
   - Nieprawidłową wartość (np. "invalid-date")
   - Komunikat błędu (np. "Nieprawidłowy format daty")
   - Opcjonalny kod błędu (np. "INVALID_DATE_FORMAT")
3. Jeśli błędów jest więcej niż 10, użytkownik widzi paginację
4. Użytkownik może klikać "Następna" / "Poprzednia" dla nawigacji

**Oczekiwany wynik:** Użytkownik identyfikuje konkretne wiersze i problemy do naprawienia w pliku źródłowym.

---

### Interakcja 3: Eksport raportu błędów
**Opis:** Użytkownik pobiera raport błędów w formacie CSV do analizy offline.

**Przepływ:**
1. Użytkownik klika przycisk "Pobierz raport błędów" (z ikoną strzałki w dół)
2. System generuje plik CSV z nagłówkami:
   - Nr wiersza, Kolumna, Wartość, Komunikat błędu, Kod błędu
3. Przeglądarka inicjuje pobieranie pliku "import-errors.csv"
4. Użytkownik otwiera plik w edytorze CSV/Excel

**Oczekiwany wynik:** Plik CSV zawierający wszystkie błędy, gotowy do analizy i przekazania osobom odpowiedzialnym za przygotowanie danych.

---

### Interakcja 4: Powrót do poprawy pliku
**Opis:** Użytkownik decyduje się poprawić plik źródłowy i rozpocząć import od nowa.

**Przepływ:**
1. Po przejrzeniu błędów użytkownik klika "Wróć i popraw plik"
2. System wywołuje callback `onBack()`
3. Kreator wraca do kroku FileUpload (krok 1)
4. Użytkownik może załadować poprawiony plik CSV

**Oczekiwany wynik:** Reset kreatora do początku, umożliwienie upload nowego pliku.

---

### Interakcja 5: Kontynuacja importu z pominięciem błędów
**Opis:** Użytkownik akceptuje pominięcie błędnych wierszy i kontynuuje import tylko poprawnych danych.

**Przepływ:**
1. Użytkownik czyta info box: "Możesz kontynuować import pomijając błędne wiersze. Tylko poprawne wiersze (X) zostaną zaimportowane."
2. Użytkownik klika przycisk "Pomiń błędy i importuj (X wierszy)"
3. System wywołuje callback `onContinueWithErrors()`
4. Kreator przechodzi do kroku Processing (krok 4)
5. Backend importuje tylko `valid_rows`, pomijając błędne

**Oczekiwany wynik:** Import kontynuowany z częściowymi danymi, utworzenie scenariusza bazowego z poprawnymi transakcjami.

---

### Interakcja 6: Blokada kontynuacji przy 100% błędów
**Opis:** Użytkownik widzi komunikat, że nie może kontynuować gdy wszystkie wiersze są błędne.

**Przepływ:**
1. ValidationResult zawiera `valid_rows: 0`
2. System oblicza `canProceed = false`
3. Wyświetlany jest czerwony warning box: "Nie można kontynuować: Wszystkie wiersze zawierają błędy..."
4. Przycisk "Kontynuuj import" jest ukryty
5. Jedyna dostępna opcja to "Wróć i popraw plik"

**Oczekiwany wynik:** Użytkownik nie może kontynuować, jest zmuszony do naprawienia pliku.

## 9. Warunki i walidacja

### Warunki renderowania sekcji

#### Sekcja szczegółów błędów
**Warunek:** `hasErrors === true` (czyli `invalid_rows > 0`)

**Weryfikacja:**
```typescript
const hasErrors = validationResult.invalid_rows > 0;
```

**Wpływ na UI:**
- Gdy `true`: Renderowana sekcja z tabelą błędów i przyciskiem eksportu
- Gdy `false`: Sekcja ukryta, użytkownik widzi tylko pozytywne podsumowanie

#### Info box - możliwość kontynuacji
**Warunek:** `hasErrors && canProceed` (są błędy, ale są też poprawne wiersze)

**Weryfikacja:**
```typescript
const hasErrors = validationResult.invalid_rows > 0;
const canProceed = validationResult.valid_rows > 0;
```

**Wpływ na UI:**
- Niebieski info box z komunikatem o możliwości pominięcia błędów
- Wyświetla liczbę poprawnych wierszy do zaimportowania

#### Warning box - brak możliwości kontynuacji
**Warunek:** `!canProceed` (brak poprawnych wierszy, `valid_rows === 0`)

**Weryfikacja:**
```typescript
const canProceed = validationResult.valid_rows > 0;
```

**Wpływ na UI:**
- Czerwony warning box z komunikatem o niemożności kontynuacji
- Ukrycie przycisku "Kontynuuj import"
- Wymuszenie powrotu do kroku 1

#### Przycisk kontynuacji
**Warunek:** `canProceed === true`

**Weryfikacja:** j.w.

**Wpływ na UI:**
- Gdy `true`: Przycisk widoczny i aktywny
- Gdy `false`: Przycisk ukryty
- Tekst przycisku dynamiczny:
  - `hasErrors ? "Pomiń błędy i importuj (X wierszy)" : "Kontynuuj import"`

### Warunki walidacji danych

#### ValidationSummary - obliczanie statusu
**Walidacja:**
```typescript
const status = 
  invalidRows === 0 ? 'success' :
  validRows === 0 ? 'error' :
  'warning';
```

**Wpływ na UI:**
- Określa ikonę (✓ / ⚠ / ✗)
- Określa kolorystykę (zielona / bursztynowa / czerwona)
- Określa tekst nagłówka

#### ValidationSummary - kolorystyka paska
**Walidacja:**
```typescript
const validPercentage = totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0;

const barColor = 
  validPercentage === 100 ? 'bg-green-600' :
  validPercentage > 50 ? 'bg-amber-600' :
  'bg-red-600';
```

**Wpływ na UI:** Kolor paska procentowego

#### ValidationErrorTable - walidacja paginacji
**Walidacja:**
```typescript
const totalPages = Math.ceil(errors.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;

// Zabezpieczenia
const handlePreviousPage = () => {
  setCurrentPage(prev => Math.max(1, prev - 1));
};

const handleNextPage = () => {
  setCurrentPage(prev => Math.min(totalPages, prev + 1));
};
```

**Wpływ na UI:**
- Wyłączenie przycisku "Poprzednia" gdy `currentPage === 1`
- Wyłączenie przycisku "Następna" gdy `currentPage === totalPages`
- Ukrycie całej paginacji gdy `totalPages <= 1`

#### DownloadErrorReportButton - walidacja eksportu
**Walidacja:**
```typescript
disabled={errors.length === 0}
```

**Wpływ na UI:** Wyłączenie przycisku gdy brak błędów do eksportu

#### ErrorRow - walidacja wyświetlania wartości
**Walidacja:**
```typescript
{error.invalid_value || <span className="text-muted-foreground italic">-</span>}
```

**Wpływ na UI:** Wyświetlenie placeholdera "-" gdy wartość pusta

**Walidacja kodu błędu:**
```typescript
{error.error_code && <span className="text-xs text-muted-foreground font-mono">{error.error_code}</span>}
```

**Wpływ na UI:** Kod błędu wyświetlany tylko jeśli istnieje

### Warunki bezpieczeństwa i sanityzacji

#### CSV Export - escapowanie cudzysłowów
**Walidacja:**
```typescript
`"${error.invalid_value.replace(/"/g, '""')}"`
`"${error.error_message.replace(/"/g, '""')}"`
```

**Wpływ:** Zapobieganie błędom parsowania CSV i potencjalnym atakom CSV injection

## 10. Obsługa błędów

### Błędy API

#### Błąd podczas pobierania szczegółów importu
**Scenariusz:** Request `GET /api/companies/{companyId}/imports/{importId}` zwraca 404 lub 500

**Obsługa:**
1. Hook `useImportWizard` powinien wychwycić błąd w try-catch
2. Ustawić `error` state na komunikat błędu
3. Wyświetlić komponent błędu zamiast ValidationStep
4. Udostępnić opcję powrotu do kroku 1 lub wyjścia z kreatora

**Komunikat:** "Nie udało się pobrać wyników walidacji. Spróbuj ponownie lub skontaktuj się z administratorem."

#### Błąd autoryzacji (401/403)
**Scenariusz:** Token wygasł lub użytkownik nie ma dostępu do firmy

**Obsługa:**
1. Middleware powinien wychwycić błąd autoryzacji
2. Przekierować użytkownika do `/login`
3. Zachować parametr redirect: `/login?redirect=/import`

**Komunikat:** "Sesja wygasła. Zaloguj się ponownie."

### Błędy stanu aplikacji

#### Brak validationResult
**Scenariusz:** ValidationStep renderowany bez `validationResult` (błąd programisty)

**Obsługa:**
```typescript
if (!validationResult) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-800">Błąd: Brak danych walidacji</p>
      <Button onClick={onBack} className="mt-2">Wróć</Button>
    </div>
  );
}
```

#### Nieprawidłowa struktura błędów
**Scenariusz:** `validationResult.errors` nie jest tablicą lub zawiera nieprawidłowe dane

**Obsługa:**
```typescript
const safeErrors = Array.isArray(validationResult.errors) 
  ? validationResult.errors 
  : [];
```

### Błędy interfejsu użytkownika

#### Błąd podczas generowania CSV
**Scenariusz:** Wyjątek podczas `handleDownload()` w DownloadErrorReportButton

**Obsługa:**
```typescript
const handleDownload = () => {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Error generating CSV:', error);
    // Opcjonalnie: wyświetlić toast z błędem
    alert('Nie udało się wygenerować raportu błędów. Spróbuj ponownie.');
  }
};
```

#### Przekroczenie limitów przeglądarki
**Scenariusz:** Zbyt duża liczba błędów (>100k) powoduje problemy z wydajnością

**Obsługa:**
1. Limit błędów wyświetlanych w tabeli: max 1000
2. Paginacja serwerowa dla bardzo dużych zbiorów
3. Komunikat: "Wyświetlono pierwsze 1000 błędów. Pobierz pełny raport CSV."

```typescript
const displayErrors = errors.slice(0, 1000);
const hasMoreErrors = errors.length > 1000;
```

### Przypadki brzegowe

#### Pusty plik CSV
**Scenariusz:** `total_rows === 0`

**Obsługa:**
- ValidationSummary wyświetla "0" we wszystkich polach
- Brak tabeli błędów
- Komunikat: "Plik CSV jest pusty. Sprawdź czy wybrałeś poprawny plik."
- Tylko przycisk "Wróć i popraw plik" jest dostępny

#### Wszystkie wiersze poprawne
**Scenariusz:** `invalid_rows === 0`, `valid_rows > 0`

**Obsługa:**
- Status "success" (zielony)
- Brak sekcji szczegółów błędów
- Brak info boxów
- Przycisk "Kontynuuj import" aktywny
- Automatyczne przejście do następnego kroku po 1s (opcjonalnie)

#### Wiersze bez numeru
**Scenariusz:** Backend zwraca błąd bez `row_number`

**Obsługa:**
```typescript
<td className="px-4 py-3 text-sm">{error.row_number || 'N/A'}</td>
```

## 11. Kroki implementacji

### Krok 1: Weryfikacja typów i struktur danych
**Czas:** 30 min

**Działania:**
1. Przejrzyj `src/types.ts` i upewnij się, że wszystkie potrzebne typy są zdefiniowane:
   - `ValidationResult`
   - `ValidationError`
   - `ValidationErrorCode`
   - Interfejsy props wszystkich komponentów
2. Jeśli brakuje typów, dodaj je w odpowiedniej sekcji pliku
3. Zweryfikuj zgodność typów z API (DTOs w `ImportDetailsResponseDTO`)

**Rezultat:** Kompletna definicja typów dla wszystkich komponentów

---

### Krok 2: Aktualizacja ErrorRow (jeśli potrzeba)
**Czas:** 15 min

**Działania:**
1. Otwórz `src/components/import/ErrorRow.tsx`
2. Zweryfikuj poprawność struktury (obecnie wygląda dobrze)
3. Dodaj obsługę przypadków brzegowych:
   - Placeholder dla pustego `invalid_value`
   - Warunkowe renderowanie `error_code`
4. Dodaj testy hover states i responsywności

**Rezultat:** Komponent ErrorRow gotowy do użycia

---

### Krok 3: Aktualizacja ValidationErrorTable (jeśli potrzeba)
**Czas:** 30 min

**Działania:**
1. Otwórz `src/components/import/ValidationErrorTable.tsx`
2. Zweryfikuj implementację paginacji
3. Dodaj aria-labels dla czytników ekranu:
   ```tsx
   <table aria-label="Tabela błędów walidacji">
   ```
4. Upewnij się, że przyciski paginacji są wyłączone odpowiednio
5. Dodaj wyświetlanie licznika "Strona X z Y"

**Rezultat:** Komponent ValidationErrorTable z pełną funkcjonalnością paginacji

---

### Krok 4: Aktualizacja DownloadErrorReportButton
**Czas:** 30 min

**Działania:**
1. Otwórz `src/components/import/DownloadErrorReportButton.tsx`
2. Dodaj try-catch dla obsługi błędów generowania CSV
3. Dodaj opcjonalny toast notification po udanym pobraniu (używając toast z shadcn/ui)
4. Rozważ dodanie opcji eksportu do XLSX (używając biblioteki `xlsx`):
   ```typescript
   import * as XLSX from 'xlsx';
   
   const handleDownloadXLSX = () => {
     const ws = XLSX.utils.json_to_sheet(errors);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Błędy");
     XLSX.writeFile(wb, "import-errors.xlsx");
   };
   ```
5. Dodaj dropdown menu z wyborem formatu (CSV/XLSX) - opcjonalnie

**Rezultat:** Funkcjonalny przycisk eksportu z obsługą błędów

---

### Krok 5: Implementacja/aktualizacja ValidationSummary
**Czas:** 45 min

**Działania:**
1. Otwórz `src/components/import/ValidationSummary.tsx` (już istnieje)
2. Zweryfikuj implementację logiki statusu
3. Sprawdź responsywność grid 3-kolumnowego (czy dobrze wygląda na mobile)
4. Dodaj animację paska procentowego:
   ```tsx
   <div 
     className="h-2 rounded-full transition-all duration-500"
     style={{ width: `${validPercentage}%` }}
   />
   ```
5. Przetestuj dla różnych scenariuszy:
   - 100% poprawnych
   - 100% błędnych
   - Mix (np. 80% poprawnych)

**Rezultat:** Komponent ValidationSummary z animacjami i responsywnością

---

### Krok 6: Implementacja/aktualizacja ValidationStep
**Czas:** 1h

**Działania:**
1. Otwórz `src/components/import/ValidationStep.tsx` (już istnieje)
2. Zweryfikuj wszystkie warunki renderowania:
   - Sekcja błędów tylko gdy `hasErrors`
   - Info box tylko gdy `hasErrors && canProceed`
   - Warning box tylko gdy `!canProceed`
   - Przycisk kontynuacji tylko gdy `canProceed`
3. Dodaj obsługę przypadku braku `validationResult`:
   ```tsx
   if (!validationResult) {
     return <div>Błąd: Brak danych walidacji</div>;
   }
   ```
4. Zweryfikuj callbacki `onBack` i `onContinueWithErrors`
5. Dodaj aria-live region dla komunikatów:
   ```tsx
   <div aria-live="polite" aria-atomic="true">
     {/* komunikaty info/warning */}
   </div>
   ```

**Rezultat:** Pełnofunkcjonalny ValidationStep z obsługą wszystkich przypadków

---

### Krok 7: Integracja z ImportWizard
**Czas:** 45 min

**Działania:**
1. Otwórz `src/components/import/ImportWizard.tsx`
2. Zaimportuj ValidationStep
3. Dodaj renderowanie ValidationStep w odpowiednim kroku:
   ```tsx
   {currentStep === WizardStep.Validation && validationResult && (
     <ValidationStep
       validationResult={validationResult}
       onContinueWithErrors={handleContinueWithErrors}
       onBack={handleBackToFileUpload}
     />
   )}
   ```
4. Zaimplementuj `handleContinueWithErrors`:
   ```tsx
   const handleContinueWithErrors = () => {
     setCurrentStep(WizardStep.Processing);
     // Przejdź do kroku przetwarzania
   };
   ```
5. Zaimplementuj `handleBackToFileUpload`:
   ```tsx
   const handleBackToFileUpload = () => {
     setCurrentStep(WizardStep.FileUpload);
     // Reset stanu (opcjonalnie)
   };
   ```

**Rezultat:** ValidationStep zintegrowany z flow kreatora

---

### Krok 8: Implementacja custom hook useImportWizard (jeśli nie istnieje)
**Czas:** 2h

**Działania:**
1. Utwórz `src/components/hooks/useImportWizard.ts`
2. Zdefiniuj stan kreatora (ImportWizardState)
3. Zaimplementuj funkcje:
   - `uploadFile()` - wysyłanie pliku do API
   - `pollImportStatus()` - odpytywanie o status
   - `fetchValidationResult()` - pobieranie wyników walidacji
   - `goToNextStep()`, `goToPreviousStep()`, `resetWizard()`
4. Obsługa błędów API
5. Przykładowa implementacja `fetchValidationResult`:
   ```typescript
   const fetchValidationResult = async (importId: number) => {
     try {
       const response = await fetch(
         `/api/companies/${companyId}/imports/${importId}`,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       
       if (!response.ok) throw new Error('Failed to fetch import details');
       
       const data = await response.json();
       
       const validationResult: ValidationResult = {
         import_id: data.id,
         total_rows: data.total_rows,
         valid_rows: data.valid_rows,
         invalid_rows: data.invalid_rows,
         errors: data.error_report_json?.errors.map(e => ({
           row_number: e.row,
           field_name: e.field,
           invalid_value: e.value || '',
           error_message: e.message,
           error_code: e.code
         })) || [],
         status: data.invalid_rows === 0 ? 'success' 
           : data.valid_rows === 0 ? 'error' 
           : 'warning'
       };
       
       setState(prev => ({ ...prev, validationResult }));
       
     } catch (error) {
       setState(prev => ({ 
         ...prev, 
         error: 'Nie udało się pobrać wyników walidacji' 
       }));
     }
   };
   ```

**Rezultat:** Hook zarządzający całym stanem kreatora importu

---

### Krok 9: Testy manualne - scenariusze użytkownika
**Czas:** 1.5h

**Działania:**
1. **Scenariusz 1: Wszystkie wiersze poprawne**
   - Przygotuj CSV z poprawnymi danymi
   - Przejdź przez cały flow kreatora
   - Sprawdź czy ValidationStep pokazuje status "success"
   - Sprawdź czy przycisk "Kontynuuj import" jest aktywny

2. **Scenariusz 2: Wszystkie wiersze błędne**
   - Przygotuj CSV z samymi błędami
   - Sprawdź czy ValidationStep pokazuje status "error"
   - Sprawdź czy przycisk kontynuacji jest ukryty
   - Sprawdź komunikat warning box

3. **Scenariusz 3: Mix poprawnych i błędnych (50/50)**
   - Przygotuj CSV z połową błędnych wierszy
   - Sprawdź status "warning"
   - Sprawdź czy tabela błędów się wyświetla
   - Sprawdź paginację (jeśli > 10 błędów)
   - Przetestuj eksport raportu CSV
   - Sprawdź przycisk "Pomiń błędy i importuj (X wierszy)"

4. **Scenariusz 4: Powrót do kroku 1**
   - Kliknij "Wróć i popraw plik"
   - Sprawdź czy kreator wraca do FileUpload
   - Sprawdź czy stan jest resetowany

5. **Scenariusz 5: Duża liczba błędów (> 100)**
   - Przygotuj CSV z > 100 błędami
   - Sprawdź wydajność renderowania
   - Sprawdź paginację (10 na stronę)
   - Przetestuj eksport dużego raportu

**Rezultat:** Zweryfikowana funkcjonalność we wszystkich scenariuszach

---

### Krok 10: Testy dostępności (a11y)
**Czas:** 1h

**Działania:**
1. Użyj narzędzia axe DevTools lub Lighthouse
2. Sprawdź nawigację klawiaturową:
   - Tab przez wszystkie elementy interaktywne
   - Enter/Space na przyciskach
   - Focus-visible states
3. Sprawdź aria-labels i role:
   - Tabela ma `<thead>` i `<tbody>`
   - Przyciski mają aria-labels
   - Status messages mają aria-live
4. Sprawdź kontrast kolorów:
   - Tekst błędów (czerwony)
   - Przyciski
   - Linki
5. Przetestuj z czytnikiem ekranu (NVDA/JAWS/VoiceOver)

**Rezultat:** Widok w pełni dostępny dla użytkowników z niepełnosprawnościami

---

### Krok 11: Testy responsywności
**Czas:** 45 min

**Działania:**
1. Przetestuj na różnych rozdzielczościach:
   - Mobile (320px, 375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)
2. Sprawdź:
   - Grid statystyk w ValidationSummary (czy się wrap'uje)
   - Tabela błędów (horizontal scroll na mobile)
   - Przyciski (czy nie są za małe na touch)
   - Paginacja (czy nie jest zbyt szeroka)
3. Poprawki CSS jeśli potrzeba:
   ```tsx
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
   ```

**Rezultat:** Widok responsywny na wszystkich urządzeniach

---

### Krok 12: Optymalizacja wydajności
**Czas:** 1h

**Działania:**
1. Dodaj React.memo dla komponentów prezentacyjnych:
   ```tsx
   export const ErrorRow = React.memo(({ error }: ErrorRowProps) => {
     // ...
   });
   ```
2. Użyj useMemo dla kosztownych obliczeń:
   ```tsx
   const displayErrors = useMemo(() => 
     errors.slice(startIndex, endIndex),
     [errors, startIndex, endIndex]
   );
   ```
3. Lazy load dla dużych list (opcjonalnie - virtualizacja):
   ```tsx
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```
4. Debounce dla search/filter (jeśli dodane)
5. Zmierz wydajność z React DevTools Profiler

**Rezultat:** Optymalna wydajność nawet dla dużych zbiorów błędów

---

### Krok 13: Dokumentacja i czyszczenie kodu
**Czas:** 30 min

**Działania:**
1. Dodaj JSDoc dla wszystkich komponentów:
   ```tsx
   /**
    * ValidationStep - Komponent wyświetlający wyniki walidacji CSV
    * @param validationResult - Wyniki walidacji z API
    * @param onContinueWithErrors - Callback dla kontynuacji z błędami
    * @param onBack - Callback dla powrotu do poprzedniego kroku
    */
   ```
2. Dodaj komentarze dla skomplikowanej logiki
3. Usuń console.log i debug code
4. Sprawdź czy wszystkie zmienne są właściwie nazwane
5. Uruchom linter i prettier:
   ```bash
   npm run lint
   npm run format
   ```

**Rezultat:** Czysty, dobrze udokumentowany kod

---

### Krok 14: Aktualizacja dokumentacji projektu
**Czas:** 15 min

**Działania:**
1. Zaktualizuj `status.md`:
   - Zmień status US-003 z "0% ❌" na "100% ✅"
   - Dodaj zrealizowane checklisty
   - Dodaj listę zaimplementowanych plików
2. Zaktualizuj README jeśli potrzeba
3. Dodaj screenshoty widoku do dokumentacji (opcjonalnie)

**Rezultat:** Aktualna dokumentacja projektu

---

### Szacowany całkowity czas implementacji: 11-14 godzin

**Podział:**
- Przygotowanie i weryfikacja typów: 30 min
- Implementacja/aktualizacja komponentów: 3-4h
- Integracja z kreator: 1h
- Hook useImportWizard: 2h
- Testy manualne: 1.5h
- Testy a11y i responsywności: 1.75h
- Optymalizacja: 1h
- Dokumentacja: 45 min

**Priorytet kroków:**
1. **Must have (MVP):** Kroki 1-7, 9
2. **Should have:** Kroki 8, 10-11
3. **Nice to have:** Kroki 12-14
