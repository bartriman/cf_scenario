# Plan implementacji widoku Import CSV

## 1. Przegląd
Widok Import CSV (`Import Wizard`) to wieloetapowy kreator przeprowadzający użytkownika przez proces importu danych finansowych z pliku CSV. Kreator obsługuje upload pliku, walidację danych oraz tworzenie bazowego scenariusza. System zapewnia pełną transparentność procesu, pokazując błędy walidacji, postęp przetwarzania i umożliwiając pobranie raportu błędów w przypadku problemów z importem.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką: `/import`

## 3. Struktura komponentów
Hierarchia komponentów dla widoku `Import Wizard`:

```
/src/pages/import.astro
└── ImportWizard (React Island)
    ├── ProgressBar (Shadcn/ui)
    ├── [Krok 1] FileUploadZone (React)
    ├── [Krok 2] ValidationStatusPanel (React)
    │   ├── ProcessingSpinner (React)
    │   ├── ValidationSummary (React)
    │   └── ValidationErrorTable (React)
    └── [Krok 3] CompletionPanel (React)
```

## 4. Szczegóły komponentów

### ImportWizard (React Island)
- **Opis komponentu**: Główny komponent-orkiestrator zarządzający logiką kroków (step-by-step wizard). Odpowiada za przechodzenie między krokami, zarządzanie stanem globalnym importu oraz obsługę komunikacji z API.
- **Główne elementy**: 
  - Kontener `div` dla całego kreatora z określoną szerokością (max-w-4xl)
  - Nagłówek z tytułem kreatora i opisem aktualnego kroku
  - Komponent `ProgressBar` wskazujący aktualny krok (1/3, 2/3, 3/3)
  - Warunkowe renderowanie komponentów kroku w zależności od `currentStep`
  - Sekcja z przyciskami nawigacji (Wstecz/Dalej/Anuluj/Zakończ)
- **Obsługiwane interakcje**:
  - Przejście do kolejnego kroku po pomyślnym uploaderze pliku
  - Automatyczne przejście do kroku 2 po rozpoczęciu przetwarzania
  - Polling statusu importu (co 2-3 sekundy) w kroku 2
  - Przejście do kroku 3 po zakończeniu przetwarzania (status: completed/failed)
  - Przekierowanie do widoku scenariusza po kliknięciu "Przejdź do scenariusza"
  - Możliwość anulowania procesu i powrotu do dashboardu
- **Obsługiwana walidacja**:
  - Krok 1: Czy plik został wybrany i dataset_code jest niepusty
  - Krok 2: Czy import zakończył się sukcesem (status === 'completed')
  - Zablokowanie przycisków nawigacji w trakcie przetwarzania
- **Typy**: 
  - `ImportDetailsResponseDTO`
  - `ImportStatusType`
  - `CreateImportResponseDTO`
- **Propsy**: 
  - `companyId: string` (przekazany z Astro przez props)

### FileUploadZone (React)
- **Opis komponentu**: Komponent do przesyłania plików CSV z interfejsem "przeciągnij i upuść" oraz standardowym wyborem pliku. Waliduje format i rozmiar pliku po stronie klienta przed wysłaniem.
- **Główne elementy**:
  - Strefa upuszczania (`div` z obramowaniem i ikoną uploadu)
  - Input typu file (ukryty, aktywowany przez kliknięcie w strefę)
  - Pole tekstowe dla `dataset_code` (Label + Input z Shadcn/ui)
  - Informacje o ograniczeniach (format: .csv, max 10MB)
  - Przycisk "Rozpocznij import" (disabled gdy brak pliku lub dataset_code)
  - Komunikaty błędów walidacji klienta (za duży plik, zły format)
- **Obsługiwane interakcje**:
  - Przeciągnięcie pliku nad strefę (highlight border)
  - Upuszczenie pliku (walidacja + ustawienie w stanie)
  - Kliknięcie w strefę upuszczania (otwarcie dialogu wyboru pliku)
  - Wprowadzenie dataset_code (walidacja niepustego pola)
  - Kliknięcie "Rozpocznij import" (wywołanie API POST /api/companies/{companyId}/imports)
- **Obsługiwana walidacja**:
  - Format pliku: musi być .csv (sprawdzenie rozszerzenia i MIME type)
  - Rozmiar pliku: max 10MB (10 * 1024 * 1024 bytes)
  - dataset_code: niepuste, min 1 znak, max 50 znaków, alphanumeryczne + podkreślenia
  - Plik nie może być pusty (size > 0)
- **Typy**:
  - `CreateImportRequestDTO` (dla payload API)
  - `CreateImportResponseDTO` (odpowiedź z API)
- **Propsy**:
  - `companyId: string`
  - `onUploadSuccess: (importData: CreateImportResponseDTO) => void`
  - `onUploadError: (error: string) => void`

### ValidationStatusPanel (React)
- **Opis komponentu**: Panel wyświetlający status przetwarzania importu. Pokazuje spinner podczas przetwarzania, podsumowanie wyników po zakończeniu oraz tabelę błędów jeśli wystąpiły problemy.
- **Główne elementy**:
  - Warunkowe renderowanie w zależności od statusu:
    - `status === 'pending' || 'processing'`: `ProcessingSpinner`
    - `status === 'completed' || 'failed'`: `ValidationSummary` + opcjonalnie `ValidationErrorTable`
  - Card (Shadcn/ui) jako kontener
- **Obsługiwane interakcje**:
  - Wyświetlanie animowanego spinnera podczas przetwarzania
  - Aktualizacja danych po każdym polling (odbierane z rodzica)
  - Kliknięcie "Pobierz raport błędów" (jeśli error_report_url dostępny)
- **Obsługiwana walidacja**: Brak - komponent tylko wyświetla dane
- **Typy**:
  - `ImportDetailsResponseDTO`
- **Propsy**:
  - `importDetails: ImportDetailsResponseDTO`

### ProcessingSpinner (React)
- **Opis komponentu**: Prosty komponent wizualny pokazujący animowany spinner z komunikatem o przetwarzaniu.
- **Główne elementy**:
  - Kontener `div` z wycentrowaną zawartością
  - SVG spinner lub komponent Loader z Shadcn/ui
  - Tekst "Przetwarzanie pliku CSV..."
  - Opcjonalnie: subtext z informacją o możliwym czasie oczekiwania
- **Obsługiwane interakcje**: Brak - komponent statyczny
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### ValidationSummary (React)
- **Opis komponentu**: Podsumowanie wyników walidacji importu z wyświetleniem statystyk i statusu końcowego.
- **Główne elementy**:
  - Card header z ikoną statusu (✓ success lub ✗ error)
  - Statystyki w siatce (grid):
    - Całkowita liczba wierszy: `total_rows`
    - Prawidłowe wiersze: `valid_rows` (zielony)
    - Nieprawidłowe wiersze: `invalid_rows` (czerwony)
    - Zaimportowane transakcje: `inserted_transactions_count`
  - Komunikat tekstowy w zależności od statusu:
    - `status === 'completed' && invalid_rows === 0`: "Import zakończony sukcesem!"
    - `status === 'completed' && invalid_rows > 0`: "Import zakończony z ostrzeżeniami"
    - `status === 'failed'`: "Import zakończony błędem"
  - Przycisk "Pobierz raport błędów" (jeśli error_report_url)
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku "Pobierz raport błędów" (otwarcie URL w nowej karcie)
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `ImportDetailsResponseDTO`
- **Propsy**:
  - `importDetails: ImportDetailsResponseDTO`

### ValidationErrorTable (React)
- **Opis komponentu**: Tabela prezentująca szczegółowe błędy walidacji dla nieprawidłowych wierszy CSV. Wyświetla informacje o numerze wiersza, surowych danych i opisie błędu.
- **Główne elementy**:
  - Table (Shadcn/ui) z odpowiednią strukturą semantyczną
  - `<thead>` z nagłówkami kolumn:
    - Nr wiersza
    - Surowe dane (JSON lub sformatowane pola)
    - Opis błędu
  - `<tbody>` z wierszami błędów
  - Paginacja (jeśli więcej niż 50 błędów)
  - Przycisk "Załaduj więcej" lub nawigacja stronami
- **Obsługiwane interakcje**:
  - Przewijanie tabeli (jeśli wiele błędów)
  - Kliknięcie przycisku paginacji (załadowanie kolejnej strony błędów)
  - Możliwość rozwinięcia surowych danych (jeśli są długie)
- **Obsługiwana walidacja**: Brak - komponent tylko wyświetla dane
- **Typy**:
  - `ImportErrorRowDTO`
  - `ImportErrorRowsResponseDTO`
  - `PaginationDTO`
- **Propsy**:
  - `importId: number`
  - `companyId: string`

### CompletionPanel (React)
- **Opis komponentu**: Panel podsumowujący zakończony proces importu i prezentujący następne kroki użytkownikowi.
- **Główne elementy**:
  - Card z ikoną sukcesu
  - Podsumowanie:
    - Nazwa pliku
    - Dataset code
    - Liczba zaimportowanych transakcji
    - ID utworzonego scenariusza bazowego
  - Przyciski akcji:
    - "Przejdź do scenariusza" (primary) - przekierowanie do `/scenarios/[base_scenario_id]`
    - "Rozpocznij nowy import" (secondary) - reset kreatora
    - "Wróć do dashboardu" (tertiary)
- **Obsługiwane interakcje**:
  - Kliknięcie "Przejdź do scenariusza" - nawigacja do widoku scenariusza
  - Kliknięcie "Rozpocznij nowy import" - reset stanu kreatora do kroku 1
  - Kliknięcie "Wróć do dashboardu" - nawigacja do strony głównej
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `ImportDetailsResponseDTO`
- **Propsy**:
  - `importDetails: ImportDetailsResponseDTO`
  - `onStartNewImport: () => void`

### ProgressBar (Shadcn/ui)
- **Opis komponentu**: Komponent wizualny wskazujący postęp w kreatorze (3 kroki).
- **Główne elementy**:
  - Kontener z trzema segmentami
  - Każdy segment ma label: "Upload", "Walidacja", "Zakończenie"
  - Aktywny krok jest podświetlony
  - Ukończone kroki mają ikonę ✓
- **Obsługiwane interakcje**: Brak - komponent tylko wizualny
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `currentStep: 1 | 2 | 3`
  - `completedSteps: number[]`

## 5. Typy

### Nowe typy specyficzne dla widoku Import CSV

```typescript
// Stan kroku w kreatorze
export type ImportWizardStep = 1 | 2 | 3;

// Stan walidacji pliku po stronie klienta
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

// Model widoku dla danych importu w kreatorze
export interface ImportWizardState {
  currentStep: ImportWizardStep;
  completedSteps: number[];
  selectedFile: File | null;
  datasetCode: string;
  importId: number | null;
  importDetails: ImportDetailsResponseDTO | null;
  isProcessing: boolean;
  error: string | null;
}

// Rozszerzenie ImportErrorRowDTO dla lepszej prezentacji w tabeli
export interface ImportErrorRowVM extends ImportErrorRowDTO {
  formattedData: string; // Sformatowane JSON dla lepszej czytelności
}
```

### Typy z types.ts używane w widoku

- `ImportDetailsResponseDTO` - główny typ dla danych importu
- `CreateImportRequestDTO` - typ dla payload uploadu
- `CreateImportResponseDTO` - typ odpowiedzi po utworzeniu importu
- `ImportErrorRowDTO` - typ pojedynczego błędu walidacji
- `ImportErrorRowsResponseDTO` - typ dla listy błędów z paginacją
- `ImportStatusType` - enum statusów importu: 'pending' | 'processing' | 'completed' | 'failed'
- `PaginationDTO` - typ dla paginacji
- `ErrorResponseDTO` - typ dla błędów API

## 6. Zarządzanie stanem

### Custom hook: useImportWizard

Główny hook zarządzający stanem kreatora importu:

```typescript
interface UseImportWizardReturn {
  // Stan
  state: ImportWizardState;
  
  // Akcje
  setFile: (file: File | null) => void;
  setDatasetCode: (code: string) => void;
  startImport: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
  
  // Walidacja
  canProceedToNextStep: boolean;
  fileValidation: FileValidationResult;
}
```

**Logika hooka:**
1. Zarządza stanem `ImportWizardState`
2. Waliduje plik po stronie klienta (format, rozmiar)
3. Wywołuje POST /api/companies/{companyId}/imports z FormData
4. Przechodzi automatycznie do kroku 2 po otrzymaniu odpowiedzi
5. Rozpoczyna polling GET /api/companies/{companyId}/imports/{importId}
6. Aktualizuje stan po każdym pollingu
7. Kończy polling gdy status !== 'pending' && status !== 'processing'
8. Przechodzi do kroku 3 po zakończeniu przetwarzania

### Custom hook: useImportPolling

Hook odpowiedzialny za polling statusu importu:

```typescript
interface UseImportPollingParams {
  companyId: string;
  importId: number | null;
  enabled: boolean;
  onUpdate: (details: ImportDetailsResponseDTO) => void;
  onComplete: () => void;
}

interface UseImportPollingReturn {
  isPolling: boolean;
  error: string | null;
}
```

**Logika hooka:**
1. Używa `setInterval` dla regularnego odpytywania API (co 2-3 sekundy)
2. Wywołuje GET /api/companies/{companyId}/imports/{importId}
3. Przekazuje zaktualizowane dane przez callback `onUpdate`
4. Kończy polling gdy status === 'completed' || 'failed'
5. Wywołuje callback `onComplete` po zakończeniu

### Custom hook: useImportErrors

Hook do pobierania i zarządzania błędami walidacji:

```typescript
interface UseImportErrorsParams {
  companyId: string;
  importId: number | null;
  enabled: boolean;
}

interface UseImportErrorsReturn {
  errors: ImportErrorRowVM[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
}
```

**Logika hooka:**
1. Pobiera błędy z GET /api/companies/{companyId}/imports/{importId}/errors
2. Obsługuje paginację (strona po stronie)
3. Formatuje surowe dane dla lepszej prezentacji
4. Cache'uje załadowane strony

### Lokalne stany komponentów

- `FileUploadZone`: 
  - `isDragActive: boolean` - czy plik jest przeciągany nad strefą
  - `uploadError: string | null` - błąd walidacji klienta
  
- `ValidationErrorTable`:
  - `currentPage: number` - aktualna strona paginacji
  - `expandedRows: Set<number>` - rozwinięte wiersze z długimi danymi

## 7. Integracja API

### Endpoint 1: POST /api/companies/{companyId}/imports

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body (FormData):
  ```typescript
  {
    file: File,
    dataset_code: string
  }
  ```

**Response (202 Accepted):**
```typescript
CreateImportResponseDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  status: 'pending';
  file_name: string;
  created_at: string;
}
```

**Wywołanie w UI:**
- Komponent: `FileUploadZone`
- Moment: Po kliknięciu "Rozpocznij import" i walidacji klienta
- Obsługa odpowiedzi: Przekazanie danych do `ImportWizard` przez callback `onUploadSuccess`

**Obsługa błędów:**
- 400 Bad Request: Wyświetlenie błędów walidacji (zły format, za duży plik)
- 401 Unauthorized: Przekierowanie do logowania
- 403 Forbidden: Komunikat o braku dostępu do firmy
- 500 Internal Server Error: Komunikat o błędzie serwera

### Endpoint 2: GET /api/companies/{companyId}/imports/{importId}

**Request:**
- Method: GET
- No body

**Response (200 OK):**
```typescript
ImportDetailsResponseDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  inserted_transactions_count: number;
  error_report_json: object | null;
  error_report_url: string | null;
  file_name: string;
  uploaded_by: string;
  created_at: string;
  base_scenario_id?: number;
}
```

**Wywołanie w UI:**
- Hook: `useImportPolling`
- Moment: Polling co 2-3 sekundy w kroku 2
- Warunek: `importId !== null && status in ['pending', 'processing']`
- Obsługa odpowiedzi: Aktualizacja `importDetails` w stanie

**Obsługa błędów:**
- 404 Not Found: Import nie istnieje - komunikat błędu
- 401/403: Problemy z autoryzacją
- 500: Błąd serwera

### Endpoint 3: GET /api/companies/{companyId}/imports/{importId}/errors

**Request:**
- Method: GET
- Query params: `page?: number, limit?: number`

**Response (200 OK):**
```typescript
ImportErrorRowsResponseDTO {
  import_id: number;
  errors: ImportErrorRowDTO[];
  pagination: PaginationDTO;
}
```

**Wywołanie w UI:**
- Hook: `useImportErrors`
- Moment: Po zakończeniu przetwarzania jeśli `invalid_rows > 0`
- Obsługa odpowiedzi: Wyświetlenie w `ValidationErrorTable`

**Obsługa błędów:**
- 404 Not Found: Import nie istnieje
- 401/403: Problemy z autoryzacją

## 8. Interakcje użytkownika

### Krok 1: Upload pliku

1. **Przeciągnięcie pliku nad strefę upuszczania**
   - Akcja: Użytkownik przeciąga plik CSV nad `FileUploadZone`
   - Reakcja: Border strefy zmienia kolor (highlight), pokazuje się tekst "Upuść plik tutaj"
   - Walidacja: Brak na tym etapie

2. **Upuszczenie pliku**
   - Akcja: Użytkownik upuszcza plik w strefie
   - Reakcja: 
     - Walidacja formatu (.csv) i rozmiaru (max 10MB)
     - Jeśli OK: Pokazanie nazwy pliku, ustawienie w stanie
     - Jeśli błąd: Pokazanie komunikatu błędu pod strefą
   - Walidacja: Format i rozmiar pliku

3. **Kliknięcie w strefę upuszczania**
   - Akcja: Użytkownik klika w strefę (gdy brak pliku)
   - Reakcja: Otwarcie natywnego dialogu wyboru pliku
   - Po wyborze: Jak w punkcie 2

4. **Wpisanie dataset_code**
   - Akcja: Użytkownik wpisuje kod w pole tekstowe
   - Reakcja: 
     - Walidacja w czasie rzeczywistym (min 1 znak)
     - Aktywacja przycisku "Rozpocznij import" gdy plik + kod OK
   - Walidacja: Niepuste pole, max 50 znaków, alphanumeryczne

5. **Kliknięcie "Rozpocznij import"**
   - Akcja: Użytkownik klika przycisk
   - Reakcja:
     - Przycisk disabled + spinner
     - Wywołanie API POST /api/companies/{companyId}/imports
     - Po sukcesie: Automatyczne przejście do kroku 2
     - Po błędzie: Pokazanie komunikatu błędu
   - Walidacja: Weryfikacja odpowiedzi API

### Krok 2: Walidacja i przetwarzanie

6. **Automatyczne przejście do kroku 2**
   - Akcja: System po otrzymaniu odpowiedzi z API
   - Reakcja: 
     - Zmiana `currentStep` na 2
     - Pokazanie `ProcessingSpinner`
     - Rozpoczęcie pollingu statusu
   - Walidacja: Brak

7. **Polling statusu**
   - Akcja: Hook `useImportPolling` co 2-3 sekundy
   - Reakcja:
     - Podczas 'pending'/'processing': Pokazywanie spinnera
     - Po 'completed'/'failed': Zmiana widoku na `ValidationSummary`
   - Walidacja: Sprawdzenie statusu

8. **Wyświetlenie podsumowania**
   - Akcja: System po otrzymaniu statusu 'completed' lub 'failed'
   - Reakcja:
     - Pokazanie statystyk (total_rows, valid_rows, invalid_rows)
     - Jeśli invalid_rows > 0: Pokazanie tabeli błędów
     - Jeśli error_report_url: Pokazanie przycisku "Pobierz raport"
   - Walidacja: Brak

9. **Kliknięcie "Pobierz raport błędów"**
   - Akcja: Użytkownik klika przycisk w `ValidationSummary`
   - Reakcja: Otwarcie URL w nowej karcie (window.open)
   - Walidacja: Sprawdzenie czy URL istnieje

10. **Paginacja w tabeli błędów**
    - Akcja: Użytkownik klika "Następna strona" w `ValidationErrorTable`
    - Reakcja: Wywołanie API z page=2, zaktualizowanie tabeli
    - Walidacja: Sprawdzenie czy kolejna strona istnieje

11. **Kliknięcie "Dalej" (do kroku 3)**
    - Akcja: Użytkownik klika przycisk nawigacji
    - Reakcja: Przejście do `CompletionPanel`
    - Walidacja: Status === 'completed'

### Krok 3: Zakończenie

12. **Kliknięcie "Przejdź do scenariusza"**
    - Akcja: Użytkownik klika główny przycisk CTA
    - Reakcja: Nawigacja do `/scenarios/[base_scenario_id]`
    - Walidacja: Sprawdzenie czy base_scenario_id istnieje

13. **Kliknięcie "Rozpocznij nowy import"**
    - Akcja: Użytkownik klika przycisk secondary
    - Reakcja: Reset stanu kreatora, powrót do kroku 1
    - Walidacja: Brak

14. **Kliknięcie "Wróć do dashboardu"**
    - Akcja: Użytkownik klika przycisk tertiary
    - Reakcja: Nawigacja do `/` lub `/companies/[companyId]`
    - Walidacja: Brak

## 9. Warunki i walidacja

### Walidacja po stronie klienta (FileUploadZone)

1. **Format pliku**
   - Warunek: `file.name.endsWith('.csv') && file.type === 'text/csv'`
   - Komponent: `FileUploadZone`
   - Wpływ: Jeśli false, pokazanie błędu "Nieprawidłowy format pliku. Dozwolone tylko .csv"
   - Moment: Po wyborze/upuszczeniu pliku

2. **Rozmiar pliku**
   - Warunek: `file.size <= 10 * 1024 * 1024` (10MB)
   - Komponent: `FileUploadZone`
   - Wpływ: Jeśli false, pokazanie błędu "Plik za duży. Maksymalny rozmiar to 10MB"
   - Moment: Po wyborze/upuszczeniu pliku

3. **Plik nie pusty**
   - Warunek: `file.size > 0`
   - Komponent: `FileUploadZone`
   - Wpływ: Jeśli false, pokazanie błędu "Plik jest pusty"
   - Moment: Po wyborze/upuszczeniu pliku

4. **Dataset code niepusty**
   - Warunek: `datasetCode.trim().length > 0`
   - Komponent: `FileUploadZone`
   - Wpływ: Jeśli false, przycisk "Rozpocznij import" disabled
   - Moment: Przy każdej zmianie inputu

5. **Dataset code długość**
   - Warunek: `datasetCode.length <= 50`
   - Komponent: `FileUploadZone`
   - Wpływ: Jeśli false, pokazanie błędu "Maksymalnie 50 znaków"
   - Moment: Przy każdej zmianie inputu

### Walidacja stanu kreatora (ImportWizard)

6. **Możliwość przejścia do kroku 2**
   - Warunek: `selectedFile !== null && datasetCode.trim().length > 0 && importId !== null`
   - Komponent: `ImportWizard`
   - Wpływ: Automatyczne przejście po uploaderze
   - Moment: Po otrzymaniu odpowiedzi z API

7. **Możliwość przejścia do kroku 3**
   - Warunek: `status === 'completed' || status === 'failed'`
   - Komponent: `ImportWizard`
   - Wpływ: Przycisk "Dalej" staje się aktywny
   - Moment: Po zakończeniu pollingu

8. **Pokazanie tabeli błędów**
   - Warunek: `status === 'completed' && invalid_rows > 0`
   - Komponent: `ValidationStatusPanel`
   - Wpływ: Renderowanie `ValidationErrorTable`
   - Moment: Po zakończeniu przetwarzania

9. **Dostępność przycisku "Pobierz raport"**
   - Warunek: `error_report_url !== null && error_report_url !== undefined`
   - Komponent: `ValidationSummary`
   - Wpływ: Pokazanie/ukrycie przycisku
   - Moment: Zawsze gdy dane są dostępne

10. **Dostępność przycisku "Przejdź do scenariusza"**
    - Warunek: `status === 'completed' && base_scenario_id !== null`
    - Komponent: `CompletionPanel`
    - Wpływ: Przycisk aktywny/nieaktywny
    - Moment: W kroku 3

### Walidacja po stronie serwera (obsługa w UI)

11. **Błędy walidacji API**
    - Warunek: Response status 400 z ErrorResponseDTO
    - Komponent: `FileUploadZone`
    - Wpływ: Wyświetlenie szczegółowych komunikatów błędów pod formularzem
    - Moment: Po odpowiedzi z POST /api/companies/{companyId}/imports

12. **Brak autoryzacji**
    - Warunek: Response status 401 lub 403
    - Komponent: `ImportWizard`
    - Wpływ: Przekierowanie do strony logowania lub komunikat o braku dostępu
    - Moment: Przy każdym wywołaniu API

## 10. Obsługa błędów

### Błędy walidacji klienta

1. **Nieprawidłowy format pliku**
   - Scenariusz: Użytkownik wybiera plik .xlsx zamiast .csv
   - Obsługa: Komunikat błędu pod strefą upuszczania: "Nieprawidłowy format pliku. Dozwolone tylko .csv"
   - UI: Czerwony border strefy, ikona błędu, tekst błędu

2. **Plik za duży**
   - Scenariusz: Użytkownik wybiera plik > 10MB
   - Obsługa: Komunikat błędu: "Plik za duży. Maksymalny rozmiar to 10MB. Twój plik: {size}MB"
   - UI: Czerwony border, tekst błędu, sugestia kompresji/podziału pliku

3. **Pusty dataset_code**
   - Scenariusz: Użytkownik próbuje rozpocząć import bez kodu
   - Obsługa: Przycisk "Rozpocznij import" disabled, tooltip "Podaj kod zbioru danych"
   - UI: Disabled button, opacity 0.5, cursor not-allowed

### Błędy API

4. **Błąd uploadu (400 Bad Request)**
   - Scenariusz: Serwer odrzuca plik (np. zła struktura CSV)
   - Obsługa: 
     - Parsowanie ErrorResponseDTO
     - Wyświetlenie listy błędów walidacji pod formularzem
     - Plik pozostaje wybrany, możliwość wyboru innego
   - UI: Alert (Shadcn/ui) z typem "error", lista błędów

5. **Brak autoryzacji (401)**
   - Scenariusz: Sesja wygasła podczas importu
   - Obsługa: 
     - Zapisanie stanu w localStorage
     - Przekierowanie do /login z parametrem returnUrl
   - UI: Toast "Sesja wygasła. Zaloguj się ponownie"

6. **Brak dostępu do firmy (403)**
   - Scenariusz: Użytkownik nie jest członkiem firmy
   - Obsługa: 
     - Komunikat: "Nie masz dostępu do tej firmy"
     - Przycisk "Wróć do dashboardu"
   - UI: Alert z typem "warning", brak możliwości kontynuacji

7. **Błąd serwera (500)**
   - Scenariusz: Wewnętrzny błąd podczas przetwarzania
   - Obsługa:
     - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później"
     - Możliwość ponowienia próby (przycisk "Spróbuj ponownie")
   - UI: Alert z typem "error", przycisk retry

### Błędy przetwarzania

8. **Import failed**
   - Scenariusz: Status importu zmienia się na 'failed'
   - Obsługa:
     - Pokazanie komunikatu z error_report_json (jeśli dostępny)
     - Przycisk "Pobierz szczegóły błędu" (error_report_url)
     - Możliwość powrotu do kroku 1 i rozpoczęcia od nowa
   - UI: ValidationSummary z czerwoną ikoną, komunikat błędu, przyciski akcji

9. **Timeout pollingu**
   - Scenariusz: Polling trwa > 5 minut bez zmiany statusu
   - Obsługa:
     - Zatrzymanie pollingu
     - Komunikat: "Przetwarzanie trwa dłużej niż oczekiwano. Sprawdź status później"
     - Przekierowanie do listy importów z możliwością sprawdzenia statusu
   - UI: Alert z typem "warning", link do historii importów

10. **Błąd pobierania błędów walidacji**
    - Scenariusz: GET /errors zwraca błąd
    - Obsługa:
      - Pokazanie komunikatu: "Nie udało się pobrać szczegółów błędów"
      - Przycisk "Pobierz raport CSV" jako alternatywa
    - UI: Alert w miejscu tabeli, fallback do error_report_url

### Przypadki brzegowe

11. **Brak błędów w imporcie**
    - Scenariusz: import completed z invalid_rows = 0
    - Obsługa:
      - ValidationSummary z zieloną ikoną sukcesu
      - Brak tabeli błędów
      - Komunikat: "Wszystkie wiersze zostały zaimportowane poprawnie!"
    - UI: Pozytywny komunikat, statystyki, przycisk "Dalej"

12. **Częściowy sukces**
    - Scenariusz: import completed z invalid_rows > 0 ale valid_rows > 0
    - Obsługa:
      - ValidationSummary z żółtą ikoną ostrzeżenia
      - Pokazanie tabeli błędów
      - Komunikat: "Import zakończony z ostrzeżeniami. {valid_rows} wierszy zaimportowano, {invalid_rows} pominięto"
    - UI: Pomarańczowy alert, obie statystyki widoczne, tabela błędów

13. **Utrata połączenia podczas pollingu**
    - Scenariusz: Błąd sieci podczas pollingu
    - Obsługa:
      - Ponowienie próby 3 razy z exponential backoff
      - Jeśli nadal błąd: komunikat o utracie połączenia
      - Przycisk "Sprawdź status ręcznie"
    - UI: Toast "Utracono połączenie. Próba ponowienia...", retry indicator

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury i typów
1. Utworzenie pliku `/src/pages/import.astro` z podstawowym layoutem
2. Dodanie nowych typów do `/src/types.ts`:
   - `ImportWizardStep`
   - `FileValidationResult`
   - `ImportWizardState`
   - `ImportErrorRowVM`
3. Utworzenie katalogu `/src/components/import/` dla komponentów widoku

### Krok 2: Implementacja komponentów pomocniczych
4. Implementacja `ProgressBar` (Shadcn/ui) w `/src/components/import/ProgressBar.tsx`
5. Implementacja `ProcessingSpinner` w `/src/components/import/ProcessingSpinner.tsx`
6. Dodanie stylów i animacji dla spinnera

### Krok 3: Implementacja komponentów kroków
7. Implementacja `FileUploadZone` w `/src/components/import/FileUploadZone.tsx`:
   - Logika drag & drop (onDragEnter, onDragLeave, onDrop)
   - Walidacja klienta (format, rozmiar)
   - Input dla dataset_code z walidacją
   - Obsługa błędów walidacji
8. Implementacja `ValidationSummary` w `/src/components/import/ValidationSummary.tsx`:
   - Renderowanie statystyk
   - Kondycjonalne pokazywanie ikon statusu
   - Przycisk pobierania raportu
9. Implementacja `ValidationErrorTable` w `/src/components/import/ValidationErrorTable.tsx`:
   - Struktura tabeli z odpowiednimi nagłówkami
   - Formatowanie surowych danych JSON
   - Paginacja
10. Implementacja `ValidationStatusPanel` w `/src/components/import/ValidationStatusPanel.tsx`:
    - Warunkowe renderowanie w zależności od statusu
    - Kompozycja ProcessingSpinner, ValidationSummary i ValidationErrorTable
11. Implementacja `CompletionPanel` w `/src/components/import/CompletionPanel.tsx`:
    - Podsumowanie importu
    - Przyciski akcji z nawigacją

### Krok 4: Implementacja custom hooks
12. Implementacja `useImportPolling` w `/src/components/hooks/useImportPolling.ts`:
    - setInterval dla pollingu
    - Warunek zatrzymania (status !== pending/processing)
    - Cleanup na unmount
13. Implementacja `useImportErrors` w `/src/components/hooks/useImportErrors.ts`:
    - Fetch błędów z API
    - Paginacja
    - Formatowanie danych
14. Implementacja `useImportWizard` w `/src/components/hooks/useImportWizard.ts`:
    - Zarządzanie stanem kreatora
    - Logika walidacji
    - Integracja z API (POST import)
    - Orkiestracja hooków useImportPolling i useImportErrors

### Krok 5: Implementacja głównego komponentu
15. Implementacja `ImportWizard` w `/src/components/import/ImportWizard.tsx`:
    - Integracja useImportWizard
    - Logika kroków (step switching)
    - Warunkowe renderowanie komponentów kroków
    - Nawigacja między krokami
    - Obsługa błędów globalnych

### Krok 6: Implementacja endpointów API
16. Utworzenie `/src/lib/validation/import.validation.ts`:
    - Schemat Zod dla CreateImportRequestDTO
    - Schemat dla query params (paginacja błędów)
17. Utworzenie `/src/lib/services/import.service.ts`:
    - Funkcja do obsługi uploadu pliku do Supabase Storage
    - Funkcja do tworzenia rekordu importu
    - Funkcja do pobierania szczegółów importu
    - Funkcja do pobierania błędów importu
18. Utworzenie `/src/pages/api/companies/[companyId]/imports/index.ts`:
    - Endpoint POST do utworzenia importu
    - Walidacja multipart/form-data
    - Walidacja pliku i dataset_code
    - Wywołanie service layer
    - Zwrot CreateImportResponseDTO
19. Utworzenie `/src/pages/api/companies/[companyId]/imports/[importId]/index.ts`:
    - Endpoint GET do pobierania szczegółów importu
    - Walidacja uprawnień (RLS)
    - Zwrot ImportDetailsResponseDTO
20. Utworzenie `/src/pages/api/companies/[companyId]/imports/[importId]/errors.ts`:
    - Endpoint GET do pobierania błędów
    - Paginacja
    - Zwrot ImportErrorRowsResponseDTO

### Krok 7: Integracja i stylowanie
21. Podłączenie `ImportWizard` do `/src/pages/import.astro`:
    - Przekazanie companyId z Astro.locals
    - Obsługa braku autoryzacji
22. Dodanie stylów Tailwind dla wszystkich komponentów:
    - Responsywność (mobile-first)
    - Dark mode
    - Animacje i transycje
23. Implementacja ARIA attributes dla dostępności:
    - role="progressbar" dla ProgressBar
    - aria-live dla komunikatów błędów
    - Nawigacja klawiaturą w tabeli błędów
    - aria-label dla przycisków i inputów

### Krok 8: Testowanie i optymalizacja
24. Testowanie walidacji klienta:
    - Różne formaty plików
    - Różne rozmiary plików
    - Puste pola
25. Testowanie flow importu:
    - Import sukcesu (wszystkie wiersze OK)
    - Import z błędami (częściowy sukces)
    - Import failed
26. Testowanie pollingu:
    - Normalne zakończenie
    - Timeout
    - Utrata połączenia
27. Testowanie dostępności:
    - Nawigacja klawiaturą
    - Czytniki ekranu
    - Wysokie kontrasty
28. Optymalizacja wydajności:
    - Memoizacja komponentów (React.memo)
    - useCallback dla handlersów
    - Debouncing dla walidacji dataset_code
    - Lazy loading dla ValidationErrorTable (jeśli duża liczba błędów)

### Krok 9: Dokumentacja i finalizacja
29. Dodanie komentarzy JSDoc do komponentów i hooków
30. Utworzenie dokumentacji użytkownika (opcjonalne)
31. Code review i refaktoring
32. Deployment i monitoring
