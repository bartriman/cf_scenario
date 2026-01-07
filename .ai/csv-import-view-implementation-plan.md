# Plan implementacji widoku importu CSV

## 1. Przegląd

Widok importu CSV to wielokrokowy kreator (wizard), który przeprowadza użytkownika przez proces importowania danych finansowych z plików CSV do systemu. Kreator składa się z czterech głównych kroków: wybór i upload pliku, podgląd i mapowanie kolumn, walidacja danych oraz przetwarzanie i przekierowanie do nowo utworzonego scenariusza bazowego. Widok obsługuje duże pliki (do 50k wierszy) poprzez przetwarzanie wsadowe wykorzystujące Edge Functions Supabase. System zapewnia szczegółową walidację danych oraz raportowanie błędów na poziomie pojedynczych wierszy CSV.

## 2. Routing widoku

- **Ścieżka główna**: `/import`
- **Metoda renderowania**: Client-side (React Island w Astro)
- **Wymagania dostępu**: Użytkownik musi być zalogowany i mieć przypisaną firmę (company)
- **Przekierowania**:
  - Jeśli użytkownik niezalogowany → `/auth/login`
  - Po pomyślnym imporcie → `/scenarios/{newScenarioId}`

## 3. Struktura komponentów

```
ImportPage (Astro SSR)
└── ImportWizard (React Island) - główny komponent zarządzający stanem kreatora
    ├── WizardProgress - wskaźnik postępu (kroków)
    ├── Step 1: FileUploadStep
    │   ├── FileUploadZone - strefa drag & drop
    │   ├── DatasetCodeInput - pole tekstowe dla kodu zestawu danych
    │   └── Button (Shadcn/ui) - "Dalej"
    ├── Step 2: ColumnMappingStep
    │   ├── CSVPreview - podgląd pierwszych 5 wierszy
    │   ├── ColumnMapper - mapowanie kolumn CSV na pola systemowe
    │   │   └── MappingRow[] - wiersz dla każdej kolumny systemowej
    │   └── Button - "Dalej"
    ├── Step 3: ValidationStep
    │   ├── ValidationSummary - podsumowanie (prawidłowe/błędne wiersze)
    │   ├── ValidationErrorTable - tabela błędów
    │   │   └── ErrorRow[] - pojedynczy błąd
    │   ├── DownloadErrorReportButton
    │   └── ButtonGroup - "Pomiń błędy i importuj" / "Wróć"
    └── Step 4: ProcessingStep
        ├── ProgressBar - pasek postępu
        ├── ProcessingStatus - komunikat o statusie
        └── AutoRedirect - automatyczne przekierowanie po zakończeniu
```

## 4. Szczegóły komponentów

### 4.1. ImportWizard (React Island)

**Opis komponentu**: Główny kontener kreatora zarządzający stanem wielokrokowego procesu importu. Odpowiada za przechowywanie danych między krokami, nawigację między krokami oraz koordynację wywołań API.

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener z nawigacją kroków (WizardProgress)
- Warunkowe renderowanie aktualnego kroku (FileUploadStep | ColumnMappingStep | ValidationStep | ProcessingStep)
- Przyciski nawigacyjne ("Wstecz", "Dalej", "Anuluj")

**Obsługiwane zdarzenia**:
- `onStepChange(step: number)` - zmiana aktywnego kroku
- `onFileUpload(file: File, datasetCode: string)` - upload pliku i przejście do kroku 2
- `onMappingComplete(mapping: ColumnMapping)` - zakończenie mapowania kolumn
- `onValidationComplete(validRows: number, invalidRows: number)` - zakończenie walidacji
- `onImportStart()` - rozpoczęcie importu
- `onImportComplete(scenarioId: number)` - zakończenie importu i przekierowanie
- `onCancel()` - anulowanie procesu

**Warunki walidacji**:
- Krok 1 → 2: Plik musi być przesłany, datasetCode nie może być pusty
- Krok 2 → 3: Wszystkie wymagane pola systemowe muszą być zmapowane
- Krok 3 → 4: Użytkownik musi wybrać opcję ("Pomiń błędy" lub "Popraw plik")

**Typy**:
- `ImportWizardState`
- `WizardStep` (enum: FileUpload, ColumnMapping, Validation, Processing)
- `ColumnMapping`
- `ValidationResult`

**Propsy**:
```typescript
interface ImportWizardProps {
  companyId: string;
  onComplete?: (scenarioId: number) => void;
  onCancel?: () => void;
}
```

### 4.2. WizardProgress

**Opis komponentu**: Wizualny wskaźnik postępu pokazujący wszystkie kroki kreatora oraz aktualną pozycję użytkownika.

**Główne elementy HTML**:
- `<ol>` lista kroków
- `<li>` dla każdego kroku z ikoną statusu (ukończony/aktywny/nieaktywny)
- Linie łączące między krokami

**Obsługiwane zdarzenia**:
- Brak (komponent prezentacyjny)

**Warunki walidacji**: N/A

**Typy**: `WizardProgressProps`

**Propsy**:
```typescript
interface WizardProgressProps {
  steps: Array<{ label: string; status: 'completed' | 'active' | 'inactive' }>;
  currentStep: number;
}
```

### 4.3. FileUploadStep

**Opis komponentu**: Pierwszy krok kreatora umożliwiający wybór pliku CSV oraz wprowadzenie kodu zestawu danych (dataset_code).

**Główne elementy HTML i komponenty dzieci**:
- `FileUploadZone` - strefa drag & drop
- `Input` (Shadcn/ui) - pole dla dataset_code
- `Label` (Shadcn/ui) - etykiety pól
- `Button` - "Dalej"

**Obsługiwane zdarzenia**:
- `onFileSelect(file: File)` - wybór pliku przez input lub drag & drop
- `onDatasetCodeChange(value: string)` - zmiana kodu zestawu danych
- `onNext()` - przejście do następnego kroku

**Warunki walidacji**:
- Plik musi być formatu `.csv`
- Rozmiar pliku <= 10MB
- dataset_code: min 1 znak, max 50 znaków, tylko znaki alfanumeryczne i `-_`

**Typy**: `FileUploadStepProps`, `FileValidationError`

**Propsy**:
```typescript
interface FileUploadStepProps {
  onNext: (file: File, datasetCode: string) => void;
  onCancel: () => void;
}
```

### 4.4. FileUploadZone

**Opis komponentu**: Interaktywna strefa pozwalająca na przesłanie pliku metodą przeciągnij i upuść lub poprzez tradycyjny selektor plików.

**Główne elementy HTML**:
- `<div>` z event listenerami (onDragOver, onDrop)
- `<input type="file" accept=".csv">` ukryty
- Ikona upload
- Instrukcje dla użytkownika
- Wyświetlanie nazwy wybranego pliku

**Obsługiwane zdarzenia**:
- `onDragOver(e: DragEvent)` - wizualna zmiana podczas przeciągania
- `onDrop(e: DragEvent)` - upuszczenie pliku
- `onClick()` - otwarcie selektora plików
- `onFileChange(e: ChangeEvent<HTMLInputElement>)` - wybór pliku

**Warunki walidacji**:
- Format: `.csv`
- Rozmiar: max 10MB
- Tylko jeden plik jednocześnie

**Typy**: `FileUploadZoneProps`

**Propsy**:
```typescript
interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // w bajtach
  disabled?: boolean;
}
```

### 4.5. ColumnMappingStep

**Opis komponentu**: Drugi krok kreatora pozwalający na mapowanie kolumn z pliku CSV na pola systemowe oraz podgląd pierwszych wierszy danych.

**Główne elementy HTML i komponenty dzieci**:
- `CSVPreview` - podgląd pierwszych 5 wierszy
- `ColumnMapper` - lista mapowań kolumn
- `Button` - "Wstecz", "Dalej"

**Obsługiwane zdarzenia**:
- `onMappingChange(mapping: ColumnMapping)` - zmiana mapowania
- `onNext()` - potwierdzenie mapowania
- `onBack()` - powrót do poprzedniego kroku

**Warunki walidacji**:
- Wszystkie wymagane pola muszą być zmapowane:
  - `date_due` (data płatności) - WYMAGANE
  - `amount` (kwota) - WYMAGANE
  - `direction` (kierunek: INFLOW/OUTFLOW) - WYMAGANE
  - `currency` (waluta) - WYMAGANE
  - `flow_id` (identyfikator transakcji) - opcjonalne (generowane auto)
  - `counterparty` (kontrahent) - opcjonalne
  - `description` (opis) - opcjonalne
  - `project` (projekt) - opcjonalne
  - `document` (nr dokumentu) - opcjonalne
  - `payment_source` (źródło płatności) - opcjonalne

**Typy**: `ColumnMappingStepProps`, `ColumnMapping`

**Propsy**:
```typescript
interface ColumnMappingStepProps {
  csvHeaders: string[];
  previewRows: string[][];
  onNext: (mapping: ColumnMapping) => void;
  onBack: () => void;
}
```

### 4.6. CSVPreview

**Opis komponentu**: Tabela prezentująca pierwsze 5 wierszy z przesłanego pliku CSV w celu weryfikacji danych przez użytkownika.

**Główne elementy HTML**:
- `<table>` z Tailwind CSS
- `<thead>` z nagłówkami kolumn
- `<tbody>` z wierszami danych
- `<td>` komórki z ograniczoną długością tekstu (truncate)

**Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

**Warunki walidacji**: N/A

**Typy**: `CSVPreviewProps`

**Propsy**:
```typescript
interface CSVPreviewProps {
  headers: string[];
  rows: string[][];
  maxRows?: number; // domyślnie 5
}
```

### 4.7. ColumnMapper

**Opis komponentu**: Interfejs do mapowania kolumn CSV na pola systemowe. Dla każdego pola systemowego użytkownik wybiera odpowiadającą mu kolumnę z CSV.

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener dla listy mapowań
- `MappingRow[]` - wiersz dla każdego pola systemowego
- Wskazanie pól wymaganych (*)

**Obsługivane zdarzenia**:
- `onMappingChange(systemField: string, csvColumn: string | null)` - zmiana mapowania pojedynczego pola

**Warunki walidacji**:
- Wymagane pola: date_due, amount, direction, currency
- Każda kolumna CSV może być zmapowana maksymalnie raz
- Pola opcjonalne mogą pozostać niezmapowane

**Typy**: `ColumnMapperProps`, `MappingRow`

**Propsy**:
```typescript
interface ColumnMapperProps {
  csvHeaders: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}
```

### 4.8. MappingRow

**Opis komponentu**: Pojedynczy wiersz mapowania składający się z nazwy pola systemowego i selektora kolumny CSV.

**Główne elementy HTML**:
- `<div>` kontener flex
- `<span>` nazwa pola systemowego z etykietą (*)
- `<select>` dropdown z kolumnami CSV
- Badge "Wymagane" dla wymaganych pól

**Obsługiwane zdarzenia**:
- `onChange(csvColumn: string | null)` - wybór kolumny CSV

**Warunki walidacji**:
- Jeśli pole wymagane: kolumna musi być wybrana

**Typy**: `MappingRowProps`

**Propsy**:
```typescript
interface MappingRowProps {
  systemField: string;
  label: string;
  required: boolean;
  csvHeaders: string[];
  selectedColumn: string | null;
  onChange: (csvColumn: string | null) => void;
}
```

### 4.9. ValidationStep

**Opis komponentu**: Trzeci krok kreatora wyświetlający wyniki walidacji danych CSV oraz umożliwiający podjęcie decyzji o dalszym procesie importu.

**Główne elementy HTML i komponenty dzieci**:
- `ValidationSummary` - podsumowanie statystyk walidacji
- `ValidationErrorTable` - tabela z błędami (jeśli istnieją)
- `DownloadErrorReportButton` - przycisk do pobrania raportu błędów
- `ButtonGroup` - "Pomiń błędy i importuj" / "Wróć i popraw plik"

**Obsługiwane zdarzenia**:
- `onContinueWithErrors()` - kontynuacja importu pomijając błędne wiersze
- `onBack()` - powrót do poprzedniego kroku
- `onDownloadErrorReport()` - pobranie raportu błędów w formacie CSV

**Warunki walidacji**:
- Jeśli wszystkie wiersze błędne (valid_rows = 0): blokada importu
- Jeśli część wierszy błędna: możliwość kontynuacji z pominięciem

**Typy**: `ValidationStepProps`, `ValidationResult`

**Propsy**:
```typescript
interface ValidationStepProps {
  validationResult: ValidationResult;
  onContinueWithErrors: () => void;
  onBack: () => void;
  onDownloadErrorReport: () => void;
}
```

### 4.10. ValidationSummary

**Opis komponentu**: Wizualne podsumowanie wyników walidacji z wyróżnieniem liczby prawidłowych i błędnych wierszy.

**Główne elementy HTML**:
- `<div>` kontener Card (Shadcn/ui)
- Ikona statusu (sukces/ostrzeżenie/błąd)
- Statystyki: total_rows, valid_rows, invalid_rows
- Wskaźnik procentowy poprawnych wierszy

**Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

**Warunki walidacji**: N/A

**Typy**: `ValidationSummaryProps`

**Propsy**:
```typescript
interface ValidationSummaryProps {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}
```

### 4.11. ValidationErrorTable

**Opis komponentu**: Tabela prezentująca szczegółowe informacje o błędach walidacji dla poszczególnych wierszy CSV.

**Główne elementy HTML i komponenty dzieci**:
- `<table>` z kolumnami: Nr wiersza, Kolumna, Wartość, Komunikat błędu
- `<thead>` nagłówki
- `<tbody>` z `ErrorRow[]`
- Paginacja (jeśli błędów > 50)

**Obsługiwane zdarzenia**:
- `onPageChange(page: number)` - zmiana strony paginacji

**Warunki walidacji**: N/A

**Typy**: `ValidationErrorTableProps`, `ValidationError`

**Propsy**:
```typescript
interface ValidationErrorTableProps {
  errors: ValidationError[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

### 4.12. ErrorRow

**Opis komponentu**: Pojedynczy wiersz w tabeli błędów prezentujący szczegóły konkretnego błędu walidacji.

**Główne elementy HTML**:
- `<tr>` wiersz tabeli
- `<td>` komórki: row_number, field_name, invalid_value, error_message
- Badge z kodem błędu

**Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

**Warunki walidacji**: N/A

**Typy**: `ErrorRowProps`

**Propsy**:
```typescript
interface ErrorRowProps {
  error: ValidationError;
}
```

### 4.13. ProcessingStep

**Opis komponentu**: Czwarty i ostatni krok kreatora pokazujący postęp przetwarzania importu oraz automatycznie przekierowujący po zakończeniu.

**Główne elementy HTML i komponenty dzieci**:
- `ProgressBar` (Shadcn/ui) - pasek postępu
- `ProcessingStatus` - komunikat o aktualnym statusie
- Spinner/loader animacja
- `AutoRedirect` - logika automatycznego przekierowania

**Obsługiwane zdarzenia**:
- `onComplete(scenarioId: number)` - wywołane po zakończeniu importu

**Warunki walidacji**: N/A (tylko prezentacja statusu)

**Typy**: `ProcessingStepProps`, `ImportStatus`

**Propsy**:
```typescript
interface ProcessingStepProps {
  importId: number;
  onComplete: (scenarioId: number) => void;
  onError: (error: string) => void;
}
```

### 4.14. DownloadErrorReportButton

**Opis komponentu**: Przycisk umożliwiający pobranie raportu błędów w formacie CSV.

**Główne elementy HTML**:
- `Button` (Shadcn/ui) z ikoną download
- Link do pliku CSV (dynamicznie generowany)

**Obsługiwane zdarzenia**:
- `onClick()` - generowanie i pobranie pliku CSV z błędami

**Warunki walidacji**: 
- Przycisk aktywny tylko gdy invalid_rows > 0

**Typy**: `DownloadErrorReportButtonProps`

**Propsy**:
```typescript
interface DownloadErrorReportButtonProps {
  errors: ValidationError[];
  fileName?: string;
}
```

## 5. Typy

### 5.1. Typy kreatora (Wizard)

```typescript
// Enum dla kroków kreatora
enum WizardStep {
  FileUpload = 1,
  ColumnMapping = 2,
  Validation = 3,
  Processing = 4,
}

// Stan kreatora
interface ImportWizardState {
  currentStep: WizardStep;
  companyId: string;
  file: File | null;
  datasetCode: string;
  csvHeaders: string[];
  previewRows: string[][];
  columnMapping: ColumnMapping;
  validationResult: ValidationResult | null;
  importId: number | null;
  scenarioId: number | null;
  error: string | null;
}
```

### 5.2. Typy mapowania kolumn

```typescript
// Mapowanie kolumn CSV na pola systemowe
interface ColumnMapping {
  date_due: string | null;       // WYMAGANE
  amount: string | null;          // WYMAGANE
  direction: string | null;       // WYMAGANE
  currency: string | null;        // WYMAGANE
  flow_id?: string | null;        // opcjonalne
  counterparty?: string | null;   // opcjonalne
  description?: string | null;    // opcjonalne
  project?: string | null;        // opcjonalne
  document?: string | null;       // opcjonalne
  payment_source?: string | null; // opcjonalne
}

// Definicja pola systemowego
interface SystemField {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
  description?: string;
}

// Konfiguracja pól systemowych
const SYSTEM_FIELDS: SystemField[] = [
  { key: 'date_due', label: 'Data płatności', required: true, description: 'Format: YYYY-MM-DD' },
  { key: 'amount', label: 'Kwota', required: true, description: 'Liczba dodatnia' },
  { key: 'direction', label: 'Kierunek', required: true, description: 'INFLOW lub OUTFLOW' },
  { key: 'currency', label: 'Waluta', required: true, description: 'Kod ISO (np. EUR, USD)' },
  { key: 'flow_id', label: 'ID transakcji', required: false },
  { key: 'counterparty', label: 'Kontrahent', required: false },
  { key: 'description', label: 'Opis', required: false },
  { key: 'project', label: 'Projekt', required: false },
  { key: 'document', label: 'Nr dokumentu', required: false },
  { key: 'payment_source', label: 'Źródło płatności', required: false },
];
```

### 5.3. Typy walidacji

```typescript
// Wynik walidacji całego pliku
interface ValidationResult {
  import_id: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: ValidationError[];
  status: 'success' | 'warning' | 'error';
}

// Pojedynczy błąd walidacji
interface ValidationError {
  row_number: number;
  field_name: string;
  invalid_value: string;
  error_message: string;
  error_code?: string;
}

// Kody błędów walidacji
enum ValidationErrorCode {
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_AMOUNT_FORMAT = 'INVALID_AMOUNT_FORMAT',
  INVALID_DIRECTION = 'INVALID_DIRECTION',
  INVALID_CURRENCY_CODE = 'INVALID_CURRENCY_CODE',
  NEGATIVE_AMOUNT = 'NEGATIVE_AMOUNT',
  DUPLICATE_FLOW_ID = 'DUPLICATE_FLOW_ID',
}
```

### 5.4. Typy DTO (z API)

```typescript
// Request: Upload CSV
interface CreateImportRequestDTO {
  file: File;
  dataset_code: string;
}

// Response: Upload CSV
interface CreateImportResponseDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  status: ImportStatusType; // 'pending' | 'processing' | 'completed' | 'failed'
  file_name: string;
  created_at: string;
}

// Response: Import details
interface ImportDetailsResponseDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  status: ImportStatusType;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  inserted_transactions_count: number;
  error_report_json: {
    errors: Array<{
      row: number;
      field: string;
      message: string;
    }>;
  } | null;
  error_report_url: string | null;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

// Response: Import error rows (paginowane)
interface ImportErrorRowsResponseDTO {
  import_id: number;
  errors: Array<{
    row_number: number;
    raw_data: Record<string, any>;
    error_message: string;
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Response: Created scenario
interface CreateScenarioResponseDTO {
  id: number;
  company_id: string;
  import_id: number;
  dataset_code: string;
  name: string;
  status: ScenarioStatusType; // 'Draft' | 'Locked'
  base_scenario_id: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
}
```

### 5.5. ViewModel types (wewnętrzne stany UI)

```typescript
// Stan uploadu pliku
interface FileUploadState {
  file: File | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
}

// Stan mapowania
interface MappingState {
  csvHeaders: string[];
  previewRows: string[][];
  mapping: ColumnMapping;
  isComplete: boolean;
}

// Stan walidacji
interface ValidationState {
  isValidating: boolean;
  result: ValidationResult | null;
  selectedAction: 'continue' | 'back' | null;
}

// Stan przetwarzania
interface ProcessingState {
  importId: number;
  status: ImportStatusType;
  progress: number; // 0-100
  message: string;
  scenarioId: number | null;
}
```

## 6. Zarządzanie stanem

### 6.1. Custom Hook: useImportWizard

Hook zarządzający całym stanem kreatora importu oraz logiką nawigacji między krokami.

```typescript
interface UseImportWizardReturn {
  // Stan
  state: ImportWizardState;
  
  // Akcje nawigacji
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Akcje kroków
  uploadFile: (file: File, datasetCode: string) => Promise<void>;
  setMapping: (mapping: ColumnMapping) => void;
  validateData: () => Promise<ValidationResult>;
  startImport: () => Promise<void>;
  
  // Pomocnicze
  canProceed: boolean;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

function useImportWizard(companyId: string): UseImportWizardReturn {
  const [state, setState] = useState<ImportWizardState>(initialState);
  
  // Implementacja logiki...
  
  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    uploadFile,
    setMapping,
    validateData,
    startImport,
    canProceed,
    isLoading,
    error,
    reset,
  };
}
```

### 6.2. Custom Hook: useFileUpload

Hook obsługujący logikę uploadu pliku, walidację formatu i rozmiaru.

```typescript
interface UseFileUploadReturn {
  file: File | null;
  selectFile: (file: File) => void;
  clearFile: () => void;
  error: string | null;
  isValid: boolean;
}

function useFileUpload(options: {
  maxSize?: number;
  acceptedFormats?: string[];
}): UseFileUploadReturn {
  // Implementacja...
}
```

### 6.3. Custom Hook: useCSVParser

Hook do parsowania pliku CSV i wyciągania nagłówków oraz podglądu wierszy.

```typescript
interface UseCSVParserReturn {
  parse: (file: File) => Promise<{ headers: string[]; rows: string[][] }>;
  isLoading: boolean;
  error: string | null;
}

function useCSVParser(): UseCSVParserReturn {
  // Implementacja przy użyciu biblioteki PapaParse
}
```

### 6.4. Stan globalny

Stan kreatora jest lokalny dla komponentu `ImportWizard`. Nie wymaga globalnego store (Nano Stores), ponieważ:
- Proces importu jest izolowany i nie dzieli stanu z innymi częściami aplikacji
- Po zakończeniu importu następuje przekierowanie do widoku scenariusza
- W przypadku anulowania kreatora stan jest resetowany

## 7. Integracja API

### 7.1. Endpoint: Upload CSV

**Endpoint**: `POST /api/companies/{companyId}/imports`

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: File (CSV)
  - `dataset_code`: string

**Response** (202 Accepted):
```typescript
{
  id: number;
  company_id: string;
  dataset_code: string;
  status: 'pending';
  file_name: string;
  created_at: string;
}
```

**Użycie w UI**:
- Wywoływane w `FileUploadStep` po kliknięciu "Dalej"
- Zwrócone `import_id` używane do pollingu statusu

**Obsługa błędów**:
- 400: Nieprawidłowy format pliku → komunikat użytkownikowi
- 413: Plik zbyt duży → komunikat użytkownikowi
- 403: Brak dostępu do firmy → przekierowanie do logowania

### 7.2. Endpoint: Get Import Details (Polling)

**Endpoint**: `GET /api/companies/{companyId}/imports/{importId}`

**Request**:
- Method: GET
- Headers: Authorization: Bearer {token}

**Response** (200 OK):
```typescript
{
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  inserted_transactions_count: number;
  error_report_json: { errors: [...] } | null;
  // ... pozostałe pola
}
```

**Użycie w UI**:
- Polling co 2 sekundy w `ProcessingStep`
- Status 'completed' → przejście do tworzenia scenariusza
- Status 'failed' → wyświetlenie błędu

### 7.3. Endpoint: Get Import Error Rows

**Endpoint**: `GET /api/companies/{companyId}/imports/{importId}/errors`

**Request**:
- Method: GET
- Query params: `page`, `limit`

**Response** (200 OK):
```typescript
{
  import_id: number;
  errors: Array<{
    row_number: number;
    raw_data: Record<string, any>;
    error_message: string;
    created_at: string;
  }>;
  pagination: { page, limit, total, total_pages };
}
```

**Użycie w UI**:
- Wywoływane w `ValidationStep` jeśli invalid_rows > 0
- Dane prezentowane w `ValidationErrorTable`

### 7.4. Endpoint: Create Base Scenario

**Endpoint**: `POST /api/companies/{companyId}/scenarios`

**Request**:
- Method: POST
- Body:
```typescript
{
  dataset_code: string;
  name: string; // np. "Scenariusz bazowy - {dataset_code}"
  start_date: string; // z pierwszej transakcji
  end_date: string;   // z ostatniej transakcji
}
```

**Response** (201 Created):
```typescript
{
  id: number;
  company_id: string;
  dataset_code: string;
  name: string;
  status: 'Draft';
  // ... pozostałe pola
}
```

**Użycie w UI**:
- Wywoływane automatycznie w `ProcessingStep` po zakończeniu importu (status 'completed')
- Zwrócone `scenario_id` używane do przekierowania

## 8. Interakcje użytkownika

### 8.1. Krok 1: Upload pliku

1. **Akcja**: Użytkownik przeciąga plik CSV na `FileUploadZone`
   - **Reakcja**: Wizualna zmiana (podświetlenie strefy)
   - **Walidacja**: Sprawdzenie formatu i rozmiaru
   - **Sukces**: Wyświetlenie nazwy pliku
   - **Błąd**: Komunikat "Nieprawidłowy format pliku" lub "Plik zbyt duży"

2. **Akcja**: Użytkownik wpisuje kod zestawu danych
   - **Reakcja**: Walidacja w czasie rzeczywistym
   - **Walidacja**: Min 1 znak, max 50, alfanumeryczne + `-_`
   - **Błąd**: Komunikat pod polem

3. **Akcja**: Kliknięcie "Dalej"
   - **Walidacja**: Plik i dataset_code muszą być wypełnione
   - **Sukces**: Upload pliku → parsowanie CSV → przejście do kroku 2
   - **Błąd**: Komunikat o brakujących danych

### 8.2. Krok 2: Mapowanie kolumn

1. **Akcja**: System automatycznie parsuje CSV i wyświetla podgląd
   - **Reakcja**: Renderowanie `CSVPreview` i `ColumnMapper`
   
2. **Akcja**: Użytkownik wybiera kolumnę CSV dla pola systemowego
   - **Reakcja**: Aktualizacja mapowania w stanie
   - **Walidacja**: Kolumna może być użyta tylko raz
   - **Błąd**: Wyłączenie opcji już zmapowanej kolumny

3. **Akcja**: Kliknięcie "Dalej"
   - **Walidacja**: Wszystkie wymagane pola zmapowane
   - **Sukces**: Zapisanie mapowania → przejście do kroku 3
   - **Błąd**: Podświetlenie niezmapowanych wymaganych pól

### 8.3. Krok 3: Walidacja

1. **Akcja**: System automatycznie waliduje dane z użyciem mapowania
   - **Reakcja**: Wyświetlenie `ValidationSummary` i (jeśli błędy) `ValidationErrorTable`
   
2. **Akcja**: Użytkownik przegląda błędy w tabeli
   - **Reakcja**: Paginacja (jeśli błędów > 50)
   
3. **Akcja**: Kliknięcie "Pobierz raport błędów"
   - **Reakcja**: Generowanie i download pliku CSV z błędami

4. **Akcja**: Kliknięcie "Pomiń błędy i importuj"
   - **Walidacja**: valid_rows > 0
   - **Sukces**: Przejście do kroku 4 (Processing)
   - **Błąd**: Jeśli valid_rows = 0 → komunikat "Brak prawidłowych wierszy do importu"

5. **Akcja**: Kliknięcie "Wróć i popraw plik"
   - **Reakcja**: Powrót do kroku 1

### 8.4. Krok 4: Przetwarzanie

1. **Akcja**: System automatycznie rozpoczyna przetwarzanie importu
   - **Reakcja**: Pasek postępu, komunikaty statusu
   - **Polling**: Co 2s zapytanie o status importu
   
2. **Akcja**: Import zakończony sukcesem
   - **Reakcja**: Automatyczne utworzenie scenariusza bazowego
   - **Reakcja**: Automatyczne przekierowanie do `/scenarios/{scenarioId}`
   
3. **Akcja**: Import zakończony błędem
   - **Reakcja**: Wyświetlenie komunikatu błędu
   - **Opcja**: Przycisk "Spróbuj ponownie" → powrót do kroku 1

## 9. Warunki i walidacja

### 9.1. Walidacja pliku (klient)

**Komponent**: `FileUploadZone`, `useFileUpload`

| Warunek | Sprawdzenie | Komunikat błędu |
|---------|-------------|-----------------|
| Format pliku | `file.name.endsWith('.csv')` | "Obsługiwane są tylko pliki CSV" |
| Rozmiar pliku | `file.size <= 10 * 1024 * 1024` | "Plik nie może być większy niż 10MB" |
| Jeden plik | Tylko jeden plik w drag & drop | "Można przesłać tylko jeden plik" |

### 9.2. Walidacja dataset_code (klient)

**Komponent**: `FileUploadStep`

| Warunek | Sprawdzenie | Komunikat błędu |
|---------|-------------|-----------------|
| Niepuste | `datasetCode.trim().length > 0` | "Kod zestawu danych jest wymagany" |
| Długość | `datasetCode.length <= 50` | "Maksymalna długość to 50 znaków" |
| Format | `/^[a-zA-Z0-9_-]+$/.test(datasetCode)` | "Dozwolone tylko litery, cyfry, '-' i '_'" |

### 9.3. Walidacja mapowania (klient)

**Komponent**: `ColumnMappingStep`, `ColumnMapper`

| Warunek | Sprawdzenie | Komunikat błędu |
|---------|-------------|-----------------|
| Wymagane pola | `date_due`, `amount`, `direction`, `currency` muszą być zmapowane | "Pole {nazwa} jest wymagane" |
| Unikalność | Każda kolumna CSV zmapowana max. 1 raz | "Kolumna już została zmapowana" |

### 9.4. Walidacja danych CSV (serwer)

**Komponent**: Edge Function / API endpoint

Walidacja wykonywana po stronie serwera dla każdego wiersza CSV:

| Pole | Walidacja | Kod błędu |
|------|-----------|-----------|
| `date_due` | Format YYYY-MM-DD, data poprawna | INVALID_DATE_FORMAT |
| `amount` | Liczba dodatnia, format dziesiętny | INVALID_AMOUNT_FORMAT, NEGATIVE_AMOUNT |
| `direction` | Wartość: "INFLOW" lub "OUTFLOW" | INVALID_DIRECTION |
| `currency` | Kod ISO 4217 (3 litery, wielkie) | INVALID_CURRENCY_CODE |
| `flow_id` | Unikalny w ramach dataset_code (jeśli podany) | DUPLICATE_FLOW_ID |

### 9.5. Warunki przejścia między krokami

| Przejście | Warunek | Akcja przy błędzie |
|-----------|---------|-------------------|
| Krok 1 → 2 | `file !== null && datasetCode.trim() !== ''` | Podświetlenie pustych pól |
| Krok 2 → 3 | Wszystkie wymagane pola zmapowane | Podświetlenie niezmapowanych pól |
| Krok 3 → 4 | `validationResult.valid_rows > 0` | Komunikat "Brak prawidłowych wierszy" |
| Krok 4 → Redirect | `importStatus === 'completed' && scenarioId !== null` | Wyświetlenie błędu importu |

## 10. Obsługa błędów

### 10.1. Błędy sieciowe

**Scenariusz**: Brak połączenia z API podczas uploadu pliku

**Obsługa**:
- Wyświetlenie Toast (Shadcn/ui) z komunikatem: "Błąd połączenia. Sprawdź połączenie internetowe."
- Retry button: "Spróbuj ponownie"
- Możliwość anulowania i powrotu do poprzedniego kroku

### 10.2. Błędy walidacji (400 Bad Request)

**Scenariusz**: API zwraca błąd walidacji (np. nieprawidłowy dataset_code)

**Obsługa**:
- Parsowanie odpowiedzi błędu z API
- Wyświetlenie komunikatu pod odpowiednim polem formularza
- Przykład: "Kod zestawu danych już istnieje w systemie"

### 10.3. Błędy autoryzacji (401/403)

**Scenariusz**: Token wygasł lub użytkownik nie ma dostępu do firmy

**Obsługa**:
- Automatyczne przekierowanie do `/auth/login`
- Query param `?redirect=/import` dla powrotu po zalogowaniu
- Toast: "Sesja wygasła. Zaloguj się ponownie."

### 10.4. Błędy przetwarzania importu (500)

**Scenariusz**: Błąd serwera podczas przetwarzania CSV (Edge Function)

**Obsługa**:
- Status importu zmienia się na 'failed'
- Wyświetlenie komunikatu: "Wystąpił błąd podczas przetwarzania pliku. Spróbuj ponownie później."
- Zapisanie error_report_json w bazie danych
- Opcje: "Spróbuj ponownie" (powrót do kroku 1), "Kontakt z supportem"

### 10.5. Przypadki brzegowe

**Scenariusz 1**: Plik CSV jest pusty (0 wierszy danych)

**Obsługa**:
- Walidacja po parsowaniu CSV
- Komunikat: "Plik CSV nie zawiera danych"
- Blokada przycisku "Dalej"

**Scenariusz 2**: Plik CSV zawiera tylko nagłówki (brak wierszy danych)

**Obsługa**:
- Jak wyżej, walidacja po parsowaniu
- Komunikat: "Plik CSV zawiera tylko nagłówki, brak danych"

**Scenariusz 3**: Wszystkie wiersze CSV są błędne (valid_rows = 0)

**Obsługa**:
- Wyświetlenie ValidationSummary ze statusem 'error'
- Blokada przycisku "Pomiń błędy i importuj"
- Aktywny tylko przycisk "Wróć i popraw plik"
- Możliwość pobrania raportu błędów

**Scenariusz 4**: Utrata połączenia podczas pollingu statusu importu

**Obsługa**:
- Retry mechanizm: 3 próby co 5 sekund
- Po wyczerpaniu prób: komunikat "Nie można pobrać statusu importu"
- Opcje: "Odśwież stronę", "Sprawdź w liście importów"

**Scenariusz 5**: Użytkownik zamyka kartę podczas przetwarzania

**Obsługa**:
- Import kontynuowany w tle (Edge Function)
- Po ponownym wejściu: możliwość sprawdzenia statusu w `/scenarios` (jeśli zakończony)
- Brak "porzuconych" importów dzięki async processing

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i zależności
1. Zainstaluj bibliotekę do parsowania CSV: `npm install papaparse @types/papaparse`
2. Dodaj endpoint API dla importów: utworzenie pliku `src/pages/api/companies/[companyId]/imports.ts`
3. Skonfiguruj Edge Function w Supabase: `supabase/functions/process-csv-import/index.ts`

### Krok 2: Utworzenie strony głównej i layoutu
1. Utwórz plik `src/pages/import.astro`
2. Dodaj sprawdzenie autoryzacji (middleware)
3. Sprawdź czy użytkownik ma przypisaną firmę
4. Renderuj komponent `ImportWizard` jako React Island

### Krok 3: Implementacja hooka useImportWizard
1. Utwórz plik `src/components/hooks/useImportWizard.ts`
2. Zaimplementuj stan kreatora (`ImportWizardState`)
3. Dodaj logikę nawigacji między krokami
4. Zaimplementuj akcje: `uploadFile`, `setMapping`, `validateData`, `startImport`

### Krok 4: Implementacja komponentu głównego ImportWizard
1. Utwórz plik `src/components/import/ImportWizard.tsx`
2. Zaimplementuj logikę renderowania kroków (switch case)
3. Dodaj komponent `WizardProgress`
4. Obsługa stanu z `useImportWizard`

### Krok 5: Implementacja kroku 1 - FileUploadStep
1. Utwórz plik `src/components/import/FileUploadStep.tsx`
2. Zaimplementuj komponent `FileUploadZone` z drag & drop
3. Dodaj pole dla `dataset_code` z walidacją
4. Zaimplementuj hook `useFileUpload`
5. Dodaj przyciski nawigacyjne

### Krok 6: Implementacja kroku 2 - ColumnMappingStep
1. Utwórz pliki:
   - `src/components/import/ColumnMappingStep.tsx`
   - `src/components/import/CSVPreview.tsx`
   - `src/components/import/ColumnMapper.tsx`
   - `src/components/import/MappingRow.tsx`
2. Zaimplementuj hook `useCSVParser` z PapaParse
3. Dodaj logikę mapowania kolumn
4. Walidacja wymaganych pól przed przejściem dalej

### Krok 7: Implementacja kroku 3 - ValidationStep
1. Utwórz pliki:
   - `src/components/import/ValidationStep.tsx`
   - `src/components/import/ValidationSummary.tsx`
   - `src/components/import/ValidationErrorTable.tsx`
   - `src/components/import/ErrorRow.tsx`
   - `src/components/import/DownloadErrorReportButton.tsx`
2. Wywołanie API do walidacji danych
3. Renderowanie tabeli błędów z paginacją
4. Implementacja funkcji generowania raportu CSV

### Krok 8: Implementacja kroku 4 - ProcessingStep
1. Utwórz plik `src/components/import/ProcessingStep.tsx`
2. Zaimplementuj mechanizm pollingu statusu importu
3. Dodaj pasek postępu i komunikaty statusu
4. Automatyczne przekierowanie po zakończeniu

### Krok 9: Implementacja API endpoints
1. `POST /api/companies/[companyId]/imports`
   - Obsługa multipart/form-data
   - Upload pliku do Supabase Storage
   - Wywołanie Edge Function do przetwarzania
2. `GET /api/companies/[companyId]/imports/[importId]`
   - Pobieranie szczegółów importu
3. `GET /api/companies/[companyId]/imports/[importId]/errors`
   - Pobieranie błędów walidacji z paginacją
4. `POST /api/companies/[companyId]/scenarios`
   - Tworzenie scenariusza bazowego po imporcie

### Krok 10: Implementacja Edge Function (Supabase)
1. Utwórz `supabase/functions/process-csv-import/index.ts`
2. Parsowanie CSV z Supabase Storage
3. Walidacja każdego wiersza według mapowania
4. Batch insert prawidłowych transakcji (użycie `.insert()` z arrays)
5. Zapisywanie błędów do `import_rows`
6. Aktualizacja statusu importu

### Krok 11: Dodanie walidacji Zod dla API
1. Utwórz plik `src/lib/validation/csv-import.validation.ts`
2. Schematy Zod dla:
   - `CreateImportRequestSchema`
   - `ColumnMappingSchema`
   - `CSVRowSchema` (dynamiczny, na podstawie mapowania)
3. Użyj schematów w endpointach API

### Krok 12: Stylowanie i responsywność
1. Zastosuj Tailwind CSS do wszystkich komponentów
2. Użyj komponentów Shadcn/ui: Button, Input, Card, Dialog, Badge, ProgressBar
3. Przetestuj responsywność na urządzeniach mobilnych
4. Dark mode support

### Krok 13: Obsługa błędów i edge cases
1. Dodaj komponent Toast (Shadcn/ui) do komunikatów
2. Implementacja retry logic dla API calls
3. Obsługa timeout'ów dla pollingu
4. Zabezpieczenie przed porzuceniem procesu (beforeunload warning)

### Krok 14: Testy i optymalizacja
1. Testy jednostkowe dla hooków (useImportWizard, useFileUpload, useCSVParser)
2. Testy integracyjne dla API endpoints
3. Test E2E dla całego flow importu
4. Optymalizacja: lazy loading kroków, memoizacja komponentów
5. Dodanie loading skeletons (Shadcn/ui Skeleton)

### Krok 15: Dokumentacja i finalizacja
1. Dodanie komentarzy JSDoc do kluczowych funkcji
2. Aktualizacja README z instrukcją użycia
3. Przygotowanie przykładowego pliku CSV dla użytkowników
4. Deploy i testy na środowisku produkcyjnym
