# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard to główny widok aplikacji CashFlow Scenarios MVP, dostępny zaraz po zalogowaniu użytkownika. Jego głównym celem jest wyświetlenie listy wszystkich scenariuszy (roboczych i zablokowanych) należących do firmy użytkownika oraz umożliwienie szybkiego dostępu do kluczowych akcji: tworzenie nowego scenariusza, duplikowanie istniejącego, blokowanie scenariusza, edycja i usuwanie.

Widok wspiera historyjki użytkownika:
- **US-004**: Tworzenie nowego scenariusza poprzez duplikację istniejącego
- **US-005**: Blokowanie scenariusza w celu wykorzystania w analizach i wykresach

## 2. Routing widoku

**Ścieżka**: `/`

**Plik strony**: `src/pages/index.astro`

**Middleware**: Automatyczna weryfikacja sesji użytkownika (middleware w `src/middleware/index.ts`) - przekierowanie do `/login` jeśli użytkownik nie jest zalogowany.

## 3. Struktura komponentów

```
index.astro (Astro Page)
├── Layout.astro (Astro Layout)
│   └── Dashboard Content
│       ├── Header Section
│       │   ├── <h1> Dashboard
│       │   └── Filters (React Island)
│       │       ├── StatusFilter (Select/Buttons)
│       │       └── SortControl (Select)
│       ├── ScenarioGrid (Astro Component)
│       │   └── ScenarioCard[] (Astro Component)
│       │       ├── Card Header (nazwa, status badge)
│       │       ├── Card Content (dataset_code, data utworzenia, autor)
│       │       └── DropdownMenu (Shadcn/ui - React Island)
│       │           ├── Edit action
│       │           ├── Duplicate action
│       │           ├── Lock/Unlock action
│       │           └── Delete action
│       └── FloatingActionButton (React Island)
│           ├── "Nowy Import" button
│           └── "Nowy Scenariusz" button
```

## 4. Szczegóły komponentów

### 4.1. `index.astro` (Główna strona Dashboard)

**Opis**: Strona główna aplikacji, punkt wejścia do Dashboard. Odpowiedzialna za pobranie danych scenariuszy z API oraz renderowanie układu strony.

**Główne elementy**:
- Layout wrapper (`Layout.astro`)
- Nagłówek strony z tytułem "Dashboard"
- Komponent `Filters` (React Island) do filtrowania i sortowania
- Komponent `ScenarioGrid` wyświetlający karty scenariuszy
- Komponent `FloatingActionButton` (React Island) z akcjami szybkimi
- Komunikaty błędów (jeśli nie udało się pobrać danych)

**Logika server-side (w Astro frontmatter)**:
1. Pobranie `companyId` z sesji użytkownika (`context.locals.supabase`)
2. Wywołanie GET `/api/companies/{companyId}/scenarios` z domyślnymi parametrami
3. Obsługa błędów (401, 403, 500)
4. Przekazanie danych do komponentów

**Obsługiwane interakcje**: Brak (strona jest statyczna, interakcje w komponentach React)

**Obsługiwana walidacja**: Brak (walidacja w API i komponentach React)

**Typy**:
- `ScenarioListResponseDTO` (response z API)
- `ScenarioDTO[]` (lista scenariuszy)
- `PaginationDTO` (informacje o paginacji)

**Propsy**: Brak (strona główna)

---

### 4.2. `ScenarioGrid.astro` (Siatka scenariuszy)

**Opis**: Komponent Astro wyświetlający siatkę kart scenariuszy w responsywnym układzie. Jeśli lista scenariuszy jest pusta, wyświetla komunikat zachęcający do utworzenia pierwszego scenariusza.

**Główne elementy**:
- `<div>` z klasami Tailwind dla responsive grid (grid, grid-cols-1, md:grid-cols-2, lg:grid-cols-3, gap-6)
- Iteracja po `scenarios` i renderowanie `ScenarioCard` dla każdego elementu
- Empty state (gdy `scenarios.length === 0`):
  - Ikona (np. pustego folderu)
  - Komunikat: "Nie masz jeszcze żadnych scenariuszy"
  - Przycisk "Utwórz pierwszy scenariusz" przekierowujący do `/import`

**Obsługiwane interakcje**: Brak (komponent prezentacyjny)

**Obsługiwana walidacja**: Brak

**Typy**:
- `ScenarioDTO[]` (przekazane jako props)

**Propsy**:
```typescript
interface Props {
  scenarios: ScenarioDTO[];
}
```

---

### 4.3. `ScenarioCard.astro` (Karta scenariusza)

**Opis**: Komponent Astro prezentujący pojedynczy scenariusz w formie karty. Karta jest interaktywna - kliknięcie przenosi do szczegółów scenariusza. Menu akcji dostępne w prawym górnym rogu.

**Główne elementy**:
- `<a>` wrapper z `href="/scenarios/{scenarioId}"` (semantyczny link dla accessibility)
- `Card` z Shadcn/ui (struktura: CardHeader, CardContent)
- **CardHeader**:
  - Nazwa scenariusza (`scenario.name`)
  - Status badge (Draft - żółty, Locked - zielony)
  - `DropdownMenu` (React Island) z akcjami (pozycjonowane absolute w prawym górnym rogu)
- **CardContent**:
  - Kod zestawu danych: `scenario.dataset_code`
  - Data utworzenia: `formatDate(scenario.created_at)` (np. "2 stycznia 2026")
  - Autor: `scenario.created_by` (jeśli dostępne, inaczej "—")
  - Liczba override'ów: `scenario.overrides_count` (opcjonalnie, jeśli dostępne)

**Obsługiwane interakcje**:
- Kliknięcie karty → przekierowanie do `/scenarios/{scenarioId}`
- Kliknięcie menu akcji → otworzenie `DropdownMenu` (obsługa w komponencie React)

**Obsługiwana walidacja**: Brak (komponent prezentacyjny)

**Typy**:
- `ScenarioDTO` (przekazane jako props)

**Propsy**:
```typescript
interface Props {
  scenario: ScenarioDTO;
  onDuplicate?: (scenarioId: number) => void; // callback dla duplikacji
  onLock?: (scenarioId: number) => void; // callback dla blokowania
  onDelete?: (scenarioId: number) => void; // callback dla usuwania
}
```

**Uwagi**:
- Menu akcji musi zatrzymać propagację kliknięcia (event.stopPropagation()), aby nie aktywować linku do szczegółów
- Status badge używa warunkowego stylowania: Draft (bg-yellow-100, text-yellow-800), Locked (bg-green-100, text-green-800)

---

### 4.4. `DropdownMenu` (Menu akcji scenariusza)

**Opis**: Komponent React (Shadcn/ui) wyświetlający menu kontekstowe z akcjami dostępnymi dla scenariusza. Menu jest aktywowane przez przycisk "three dots" (⋮) w prawym górnym rogu karty scenariusza.

**Główne elementy**:
- `DropdownMenuTrigger` (Button z ikoną ⋮)
- `DropdownMenuContent` z pozycjonowaniem `align="end"`
- **DropdownMenuItems**:
  1. "Edytuj" → przekierowanie do `/scenarios/{scenarioId}`
  2. "Duplikuj" → wywołanie akcji duplikacji
  3. "Zablokuj" / "Odblokuj" (warunkowe, widoczne tylko dla Draft) → wywołanie akcji blokowania
  4. `DropdownMenuSeparator`
  5. "Usuń" (text-red-600) → wywołanie akcji usuwania z potwierdzeniem

**Obsługiwane interakcje**:
- Kliknięcie "Edytuj" → `window.location.href = '/scenarios/{scenarioId}'`
- Kliknięcie "Duplikuj" → wywołanie `onDuplicate(scenarioId)` i otwarcie modalu z nazwą
- Kliknięcie "Zablokuj" → wywołanie `onLock(scenarioId)` z potwierdzeniem
- Kliknięcie "Usuń" → wywołanie `onDelete(scenarioId)` z potwierdzeniem (modal)

**Obsługiwana walidacja**:
- Akcja "Zablokuj" widoczna tylko gdy `scenario.status === 'Draft'`
- Akcja "Usuń" wymaga potwierdzenia w modalu (dialog z Shadcn/ui)
- Przed duplikacją wymagane wprowadzenie nazwy nowego scenariusza (walidacja: min 1 znak, max 255)

**Typy**:
- `ScenarioDTO` (dane scenariusza)
- `DuplicateScenarioRequestDTO` (dla akcji duplikacji)
- `LockScenarioCommand` (dla akcji blokowania)
- `SoftDeleteScenarioCommand` (dla akcji usuwania)

**Propsy**:
```typescript
interface Props {
  scenario: ScenarioDTO;
  onDuplicate: (scenarioId: number, newName: string) => Promise<void>;
  onLock: (scenarioId: number) => Promise<void>;
  onDelete: (scenarioId: number) => Promise<void>;
}
```

**Uwagi**:
- Wszystkie akcje modyfikujące (duplikuj, zablokuj, usuń) powinny być asynchroniczne
- W trakcie wykonywania akcji wyświetlać spinner/loading state
- Po pomyślnej akcji odświeżyć listę scenariuszy (lub zaktualizować stan lokalny)

---

### 4.5. `Filters` (React Island - Filtrowanie i sortowanie)

**Opis**: Komponent React odpowiedzialny za filtrowanie scenariuszy po statusie oraz sortowanie listy. Zmiany filtrów/sortowania aktualizują URL query params i wyzwalają reload strony (lub client-side filtering jeśli lista jest mała).

**Główne elementy**:
- **Status Filter**:
  - Buttony toggle (All, Draft, Locked) lub Select z Shadcn/ui
  - Domyślnie: "All"
- **Sort Control**:
  - Select z opcjami:
    - "Najnowsze" (created_at DESC) - domyślne
    - "Najstarsze" (created_at ASC)
    - "Nazwa A-Z" (name ASC)
    - "Nazwa Z-A" (name DESC)

**Obsługiwane interakcje**:
- Zmiana status filter → aktualizacja URL query param `?status=Draft|Locked` → reload lub client-side filter
- Zmiana sort → aktualizacja URL query param `?sort=created_at_desc|created_at_asc|name_asc|name_desc` → reload lub client-side sort

**Obsługiwana walidacja**:
- Status musi być jednym z: `null | "Draft" | "Locked"`
- Sort musi być jednym z: `"created_at_desc" | "created_at_asc" | "name_asc" | "name_desc"`

**Typy**:
- `ScenarioStatus` (enum: "Draft" | "Locked")
- `SortOption` (enum: "created_at_desc" | "created_at_asc" | "name_asc" | "name_desc")

**Propsy**:
```typescript
interface Props {
  initialStatus?: ScenarioStatus | null;
  initialSort?: SortOption;
  onFilterChange?: (status: ScenarioStatus | null, sort: SortOption) => void;
}
```

**Implementacja**:
- Wariant 1 (Server-side): Zmiana filtrów aktualizuje URL i reload strony z nowymi query params
- Wariant 2 (Client-side): Filtrowanie i sortowanie w przeglądarce na pobranej liście (preferowane dla MVP przy małych listach)

---

### 4.6. `FloatingActionButton` (React Island - Szybkie akcje)

**Opis**: Pływający przycisk akcji (FAB) w prawym dolnym rogu ekranu z menu rozwijanym zawierającym opcje "Nowy Import" i "Nowy Scenariusz". Używa Shadcn/ui DropdownMenu lub Button + Popover.

**Główne elementy**:
- **FAB Trigger**: Okrągły przycisk z ikoną "+" (fixed position, bottom-right)
- **Menu**:
  1. "Nowy Import" → przekierowanie do `/import`
  2. "Nowy Scenariusz" → otwarcie modalu tworzenia scenariusza

**Obsługiwane interakcje**:
- Kliknięcie FAB → otworzenie menu
- Kliknięcie "Nowy Import" → `window.location.href = '/import'`
- Kliknięcie "Nowy Scenariusz" → otwarcie `CreateScenarioDialog` (modal z formularzem)

**Obsługiwana walidacja**: Brak (walidacja w modalu tworzenia scenariusza)

**Typy**: Brak specyficznych typów

**Propsy**:
```typescript
interface Props {
  onCreateScenario?: () => void; // callback do otwarcia modalu
}
```

**Uwagi**:
- Pozycja: `fixed bottom-8 right-8 z-50`
- Przycisk powinien być dobrze widoczny (duży, kontrastowy kolor, np. bg-primary)
- Accessibility: aria-label="Szybkie akcje"

---

### 4.7. `CreateScenarioDialog` (Modal tworzenia scenariusza)

**Opis**: Modal (Dialog z Shadcn/ui) do tworzenia nowego scenariusza bazowego. Formularz zbiera podstawowe informacje: nazwę, dataset_code, zakres dat.

**Główne elementy**:
- `Dialog` z Shadcn/ui
- **DialogHeader**: Tytuł "Utwórz nowy scenariusz"
- **DialogContent**: Formularz z polami:
  1. **Nazwa scenariusza** (Input, required, max 255 znaków)
  2. **Kod zestawu danych** (Input, required, max 100 znaków)
  3. **Data rozpoczęcia** (DatePicker, required)
  4. **Data zakończenia** (DatePicker, required, musi być >= data rozpoczęcia)
- **DialogFooter**: Przyciski "Anuluj" i "Utwórz"

**Obsługiwane interakcje**:
- Wypełnienie formularza → walidacja w czasie rzeczywistym (onBlur)
- Kliknięcie "Utwórz" → walidacja, POST do `/api/companies/{companyId}/scenarios`, przekierowanie do `/scenarios/{newScenarioId}`
- Kliknięcie "Anuluj" → zamknięcie modalu

**Obsługiwana walidacja**:
- Nazwa: wymagane, 1-255 znaków
- Dataset code: wymagane, 1-100 znaków, alfanumeryczne + podkreślenia
- Start date: wymagane, format ISO date
- End date: wymagane, musi być >= start_date
- Walidacja server-side (Zod schema w API)

**Typy**:
- `CreateScenarioRequestDTO`
- `CreateScenarioResponseDTO`

**Propsy**:
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess?: (scenario: ScenarioDTO) => void;
}
```

---

### 4.8. `DuplicateScenarioDialog` (Modal duplikacji scenariusza)

**Opis**: Modal do duplikacji istniejącego scenariusza. Wymaga tylko podania nazwy dla nowego scenariusza, pozostałe dane (dataset_code, daty, override'y) są kopiowane.

**Główne elementy**:
- `Dialog` z Shadcn/ui
- **DialogHeader**: Tytuł "Duplikuj scenariusz: {originalName}"
- **DialogContent**: Formularz z polami:
  1. **Nowa nazwa** (Input, required, max 255 znaków, domyślnie: "{originalName} (kopia)")
- **DialogFooter**: Przyciski "Anuluj" i "Duplikuj"

**Obsługiwane interakcje**:
- Wypełnienie nazwy → walidacja w czasie rzeczywistym
- Kliknięcie "Duplikuj" → POST do `/api/companies/{companyId}/scenarios/{scenarioId}/duplicate`, przekierowanie do `/scenarios/{newScenarioId}`
- Kliknięcie "Anuluj" → zamknięcie modalu

**Obsługiwana walidacja**:
- Nazwa: wymagane, 1-255 znaków
- Walidacja server-side (Zod schema w API)

**Typy**:
- `DuplicateScenarioRequestDTO`
- `DuplicateScenarioResponseDTO`

**Propsy**:
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: ScenarioDTO;
  companyId: string;
  onSuccess?: (newScenario: ScenarioDTO) => void;
}
```

---

### 4.9. `ConfirmDialog` (Modal potwierdzenia akcji)

**Opis**: Generyczny modal potwierdzenia dla destruktywnych akcji (usuwanie, blokowanie). Używa AlertDialog z Shadcn/ui.

**Główne elementy**:
- `AlertDialog` z Shadcn/ui
- **AlertDialogHeader**: Tytuł akcji (np. "Usuń scenariusz?")
- **AlertDialogDescription**: Opis konsekwencji (np. "Ta akcja jest nieodwracalna")
- **AlertDialogFooter**: Przyciski "Anuluj" i "Potwierdź" (destructive)

**Obsługiwane interakcje**:
- Kliknięcie "Potwierdź" → wywołanie callback `onConfirm`
- Kliknięcie "Anuluj" → zamknięcie modalu

**Obsługiwana walidacja**: Brak

**Typy**: Brak specyficznych typów

**Propsy**:
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string; // domyślnie "Potwierdź"
  cancelLabel?: string; // domyślnie "Anuluj"
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive"; // domyślnie "default"
}
```

## 5. Typy

### 5.1. Istniejące typy (z `src/types.ts`)

```typescript
// DTO dla pojedynczego scenariusza
export interface ScenarioDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  name: string;
  status: "Draft" | "Locked";
  base_scenario_id: number | null;
  import_id: number;
  start_date: string; // ISO date
  end_date: string; // ISO date
  created_at: string; // ISO timestamp
  created_by: string; // UUID
  locked_at: string | null; // ISO timestamp
  locked_by: string | null; // UUID
  deleted_at: string | null; // ISO timestamp
}

// Response dla listy scenariuszy
export interface ScenarioListResponseDTO {
  scenarios: ScenarioDTO[];
  pagination: PaginationDTO;
}

// DTO dla paginacji
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Request dla tworzenia scenariusza
export interface CreateScenarioRequestDTO {
  dataset_code: string;
  name: string;
  base_scenario_id?: number | null;
  start_date: string; // ISO date
  end_date: string; // ISO date
}

// Response dla utworzenia scenariusza
export interface CreateScenarioResponseDTO {
  scenario: ScenarioDTO;
}

// Request dla duplikacji scenariusza
export interface DuplicateScenarioRequestDTO {
  name: string;
}

// Response dla duplikacji scenariusza
export interface DuplicateScenarioResponseDTO {
  scenario: ScenarioDTO;
  overrides_count: number;
}

// Response dla zablokowania scenariusza
export interface LockScenarioResponseDTO {
  id: number;
  status: "Locked";
  locked_at: string;
  locked_by: string;
}

// Response dla szczegółów scenariusza
export interface ScenarioDetailsResponseDTO extends ScenarioDTO {
  overrides_count: number;
}
```

### 5.2. Nowe typy ViewModels dla komponentów

```typescript
// ViewModel dla karty scenariusza (rozszerzenie DTO o pola formatowane)
export interface ScenarioCardViewModel extends ScenarioDTO {
  formattedCreatedAt: string; // "2 stycznia 2026"
  statusBadgeColor: "yellow" | "green";
  statusLabel: string; // "Roboczy" | "Zablokowany"
  canEdit: boolean; // status === "Draft"
  canLock: boolean; // status === "Draft"
  canDelete: boolean; // zawsze true w MVP
  overridesCount?: number; // opcjonalnie, jeśli pobrane
}

// Enum dla statusu scenariusza
export enum ScenarioStatus {
  Draft = "Draft",
  Locked = "Locked"
}

// Enum dla opcji sortowania
export enum SortOption {
  CreatedAtDesc = "created_at_desc",
  CreatedAtAsc = "created_at_asc",
  NameAsc = "name_asc",
  NameDesc = "name_desc"
}

// Stan filtrów i sortowania
export interface FiltersState {
  status: ScenarioStatus | null; // null = "All"
  sort: SortOption;
}

// Akcje API (typy command)
export interface LockScenarioCommand {
  companyId: string;
  scenarioId: number;
}

export interface SoftDeleteScenarioCommand {
  companyId: string;
  scenarioId: number;
}

export interface DuplicateScenarioCommand {
  companyId: string;
  scenarioId: number;
  name: string;
}

export interface CreateScenarioCommand {
  companyId: string;
  data: CreateScenarioRequestDTO;
}

// Typ błędu API
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Dane początkowe** pobierane w `index.astro` (server-side):
- Lista scenariuszy z API: `GET /api/companies/{companyId}/scenarios`
- Paginacja
- Filtry z URL query params (`?status=`, `?sort=`)

**Reload strategia**:
- Po pomyślnej akcji (duplikacja, blokowanie, usuwanie) → odświeżenie strony lub aktualizacja client-side state

### 6.2. Stan client-side (React Islands)

**Custom hook: `useDashboard`** (utworzony w `src/components/hooks/useDashboard.ts`)

**Odpowiedzialności**:
- Zarządzanie stanem filtrów i sortowania
- Operacje na scenariuszach (duplikacja, blokowanie, usuwanie)
- Komunikacja z API
- Obsługa błędów
- Optymistic updates (opcjonalnie)

**Stan hooka**:
```typescript
interface DashboardState {
  scenarios: ScenarioDTO[];
  filters: FiltersState;
  loading: boolean;
  error: ApiError | null;
  
  // Stany modali
  createDialogOpen: boolean;
  duplicateDialogOpen: boolean;
  confirmDialogOpen: boolean;
  
  // Scenariusz obecnie przetwarzany (dla modali)
  selectedScenario: ScenarioDTO | null;
  
  // Typ akcji do potwierdzenia
  confirmAction: "lock" | "delete" | null;
}
```

**Metody hooka**:
```typescript
interface UseDashboardReturn {
  // Stan
  scenarios: ScenarioDTO[];
  filteredScenarios: ScenarioDTO[];
  filters: FiltersState;
  loading: boolean;
  error: ApiError | null;
  
  // Akcje filtrowania
  setStatusFilter: (status: ScenarioStatus | null) => void;
  setSortOption: (sort: SortOption) => void;
  
  // Akcje scenariuszy
  createScenario: (data: CreateScenarioRequestDTO) => Promise<void>;
  duplicateScenario: (scenarioId: number, name: string) => Promise<void>;
  lockScenario: (scenarioId: number) => Promise<void>;
  deleteScenario: (scenarioId: number) => Promise<void>;
  
  // Zarządzanie modalami
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openDuplicateDialog: (scenario: ScenarioDTO) => void;
  closeDuplicateDialog: () => void;
  openConfirmDialog: (scenario: ScenarioDTO, action: "lock" | "delete") => void;
  closeConfirmDialog: () => void;
  
  // Stan modali
  createDialogOpen: boolean;
  duplicateDialogOpen: boolean;
  confirmDialogOpen: boolean;
  selectedScenario: ScenarioDTO | null;
  confirmAction: "lock" | "delete" | null;
}
```

**Implementacja logiki filtrowania**:
```typescript
const filteredScenarios = useMemo(() => {
  let result = [...scenarios];
  
  // Filtrowanie po statusie
  if (filters.status) {
    result = result.filter(s => s.status === filters.status);
  }
  
  // Sortowanie
  result.sort((a, b) => {
    switch (filters.sort) {
      case SortOption.CreatedAtDesc:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case SortOption.CreatedAtAsc:
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case SortOption.NameAsc:
        return a.name.localeCompare(b.name);
      case SortOption.NameDesc:
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  return result;
}, [scenarios, filters]);
```

### 6.3. Synchronizacja z URL (opcjonalna)

**URL query params**:
- `?status=Draft|Locked` - filtr statusu
- `?sort=created_at_desc|created_at_asc|name_asc|name_desc` - sortowanie

**Implementacja**:
- Hook `useSearchParams` (React Router) lub własna implementacja
- Aktualizacja URL przy zmianie filtrów (bez reload strony)
- Odczyt filtrów z URL przy inicjalizacji

## 7. Integracja API

### 7.1. Fetch helper

**Utworzenie helpers w `src/lib/api-client.ts`**:

```typescript
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: 'Wystąpił błąd serwera',
    }));
    throw error;
  }

  return response.json();
}
```

### 7.2. Endpoint: Lista scenariuszy

**GET `/api/companies/{companyId}/scenarios`**

**Request**:
```typescript
const params = new URLSearchParams({
  status: filters.status || '',
  sort: filters.sort,
  page: '1',
  limit: '50',
});

const response = await apiRequest<ScenarioListResponseDTO>(
  `/api/companies/${companyId}/scenarios?${params}`
);
```

**Response**: `ScenarioListResponseDTO`

**Obsługa błędów**:
- 401 Unauthorized → przekierowanie do `/login`
- 403 Forbidden → komunikat "Brak dostępu"
- 500 Internal Server Error → komunikat "Wystąpił błąd, spróbuj ponownie"

### 7.3. Endpoint: Tworzenie scenariusza

**POST `/api/companies/{companyId}/scenarios`**

**Request**:
```typescript
const response = await apiRequest<CreateScenarioResponseDTO>(
  `/api/companies/${companyId}/scenarios`,
  {
    method: 'POST',
    body: JSON.stringify(data), // CreateScenarioRequestDTO
  }
);
```

**Response**: `CreateScenarioResponseDTO` (status 201)

**Post-action**: Przekierowanie do `/scenarios/{newScenarioId}`

### 7.4. Endpoint: Duplikacja scenariusza

**POST `/api/companies/{companyId}/scenarios/{scenarioId}/duplicate`**

**Request**:
```typescript
const response = await apiRequest<DuplicateScenarioResponseDTO>(
  `/api/companies/${companyId}/scenarios/${scenarioId}/duplicate`,
  {
    method: 'POST',
    body: JSON.stringify({ name }), // DuplicateScenarioRequestDTO
  }
);
```

**Response**: `DuplicateScenarioResponseDTO` (status 201)

**Post-action**: 
- Dodanie nowego scenariusza do lokalnego stanu (optimistic update)
- Komunikat sukcesu: "Scenariusz został zduplikowany"
- Przekierowanie do `/scenarios/{newScenarioId}` (opcjonalnie)

### 7.5. Endpoint: Blokowanie scenariusza

**POST `/api/companies/{companyId}/scenarios/{scenarioId}/lock`**

**Request**:
```typescript
const response = await apiRequest<LockScenarioResponseDTO>(
  `/api/companies/${companyId}/scenarios/${scenarioId}/lock`,
  {
    method: 'POST',
  }
);
```

**Response**: `LockScenarioResponseDTO` (status 200)

**Post-action**: 
- Aktualizacja scenariusza w lokalnym stanie (zmiana statusu na "Locked")
- Komunikat sukcesu: "Scenariusz został zablokowany"

### 7.6. Endpoint: Usuwanie scenariusza

**DELETE `/api/companies/{companyId}/scenarios/{scenarioId}`**

**Request**:
```typescript
await apiRequest<void>(
  `/api/companies/${companyId}/scenarios/${scenarioId}`,
  {
    method: 'DELETE',
  }
);
```

**Response**: 204 No Content

**Post-action**: 
- Usunięcie scenariusza z lokalnego stanu
- Komunikat sukcesu: "Scenariusz został usunięty"

## 8. Interakcje użytkownika

### 8.1. Przeglądanie listy scenariuszy

**Przepływ**:
1. Użytkownik wchodzi na `/`
2. System pobiera listę scenariuszy z API
3. Wyświetla siatkę kart scenariuszy
4. Użytkownik może przewijać listę

**Obsługa edge cases**:
- Brak scenariuszy → empty state z przyciskiem "Utwórz pierwszy scenariusz"
- Błąd API → komunikat błędu z możliwością ponowienia próby

### 8.2. Filtrowanie scenariuszy

**Przepływ**:
1. Użytkownik klika przycisk filtra statusu (All / Draft / Locked)
2. System filtruje listę po stronie klienta
3. Siatka odświeża się natychmiastowo

**Obsługa edge cases**:
- Pusty wynik filtrowania → komunikat "Brak scenariuszy spełniających kryteria"

### 8.3. Sortowanie scenariuszy

**Przepływ**:
1. Użytkownik wybiera opcję sortowania z dropdown
2. System sortuje listę po stronie klienta
3. Siatka odświeża się natychmiastowo

### 8.4. Kliknięcie karty scenariusza

**Przepływ**:
1. Użytkownik klika kartę scenariusza
2. System przekierowuje do `/scenarios/{scenarioId}`

**Accessibility**: Karta jest elementem `<a>`, więc działa z klawiatury (Enter, Ctrl+Click)

### 8.5. Duplikacja scenariusza

**Przepływ**:
1. Użytkownik klika "⋮" na karcie scenariusza
2. Wybiera "Duplikuj" z menu
3. System otwiera modal `DuplicateScenarioDialog`
4. Użytkownik wprowadza nazwę nowego scenariusza (domyślnie: "{originalName} (kopia)")
5. Użytkownik klika "Duplikuj"
6. System wysyła POST do API
7. Loading state (spinner na przycisku)
8. Sukces → komunikat, przekierowanie do `/scenarios/{newScenarioId}`
9. Błąd → wyświetlenie komunikatu błędu w modalu

**Obsługa błędów**:
- 400 Bad Request → walidacja: "Nazwa jest wymagana"
- 409 Conflict → "Scenariusz o tej nazwie już istnieje"
- 500 Internal Server Error → "Wystąpił błąd, spróbuj ponownie"

### 8.6. Blokowanie scenariusza

**Przepływ**:
1. Użytkownik klika "⋮" na karcie scenariusza (Draft)
2. Wybiera "Zablokuj" z menu
3. System otwiera modal potwierdzenia `ConfirmDialog`
4. Tytuł: "Zablokować scenariusz?"
5. Opis: "Po zablokowaniu nie będzie można edytować transakcji. Operacja jest nieodwracalna."
6. Użytkownik klika "Potwierdź"
7. System wysyła POST do API
8. Loading state (spinner)
9. Sukces → aktualizacja karty (zmiana statusu na "Locked"), komunikat "Scenariusz został zablokowany"
10. Błąd → wyświetlenie komunikatu błędu

**Obsługa błędów**:
- 409 Conflict → "Scenariusz jest już zablokowany"
- 500 Internal Server Error → "Wystąpił błąd, spróbuj ponownie"

### 8.7. Usuwanie scenariusza

**Przepływ**:
1. Użytkownik klika "⋮" na karcie scenariusza
2. Wybiera "Usuń" z menu
3. System otwiera modal potwierdzenia `ConfirmDialog`
4. Tytuł: "Usunąć scenariusz?"
5. Opis: "Ta akcja jest nieodwracalna. Scenariusz zostanie trwale usunięty."
6. Użytkownik klika "Usuń" (przycisk destructive, czerwony)
7. System wysyła DELETE do API
8. Loading state
9. Sukces → usunięcie karty z siatki, komunikat "Scenariusz został usunięty"
10. Błąd → wyświetlenie komunikatu błędu

**Obsługa błędów**:
- 409 Conflict → "Nie można usunąć scenariusza, ponieważ istnieją scenariusze pochodne"
- 500 Internal Server Error → "Wystąpił błąd, spróbuj ponownie"

### 8.8. Tworzenie nowego scenariusza

**Przepływ**:
1. Użytkownik klika FAB w prawym dolnym rogu
2. Wybiera "Nowy Scenariusz" z menu
3. System otwiera modal `CreateScenarioDialog`
4. Użytkownik wypełnia formularz (nazwa, dataset_code, daty)
5. Walidacja w czasie rzeczywistym (onBlur)
6. Użytkownik klika "Utwórz"
7. System wysyła POST do API
8. Loading state
9. Sukces → przekierowanie do `/scenarios/{newScenarioId}`
10. Błąd → wyświetlenie komunikatu błędu w modalu

**Obsługa błędów**:
- 400 Bad Request → walidacja pól (podświetlenie błędnych pól)
- 409 Conflict → "Scenariusz o tej nazwie już istnieje"
- 500 Internal Server Error → "Wystąpił błąd, spróbuj ponownie"

### 8.9. Przejście do importu

**Przepływ**:
1. Użytkownik klika FAB
2. Wybiera "Nowy Import"
3. System przekierowuje do `/import`

## 9. Warunki i walidacja

### 9.1. Walidacja na poziomie komponentów

#### `ScenarioCard`
- **Wyświetlanie akcji "Zablokuj"**: `scenario.status === "Draft"`
- **Wyświetlanie akcji "Edytuj"**: zawsze (nawet dla Locked, przekierowanie do read-only view)
- **Wyświetlanie akcji "Duplikuj"**: zawsze
- **Wyświetlanie akcji "Usuń"**: zawsze (w MVP, później: weryfikacja zależności)

#### `CreateScenarioDialog`
- **Nazwa**: 
  - Wymagane: `name.length > 0`
  - Maksymalna długość: `name.length <= 255`
  - Błąd: "Nazwa jest wymagana" / "Nazwa jest za długa (max 255 znaków)"
- **Dataset Code**:
  - Wymagane: `dataset_code.length > 0`
  - Maksymalna długość: `dataset_code.length <= 100`
  - Format: alfanumeryczne + podkreślenia (`/^[a-zA-Z0-9_]+$/`)
  - Błąd: "Kod zestawu danych jest wymagany" / "Nieprawidłowy format kodu"
- **Data rozpoczęcia**:
  - Wymagane: `start_date` niepuste
  - Format: ISO date (`YYYY-MM-DD`)
  - Błąd: "Data rozpoczęcia jest wymagana" / "Nieprawidłowy format daty"
- **Data zakończenia**:
  - Wymagane: `end_date` niepuste
  - Format: ISO date (`YYYY-MM-DD`)
  - Warunek: `end_date >= start_date`
  - Błąd: "Data zakończenia jest wymagana" / "Data zakończenia musi być późniejsza niż data rozpoczęcia"

#### `DuplicateScenarioDialog`
- **Nazwa**:
  - Wymagane: `name.length > 0`
  - Maksymalna długość: `name.length <= 255`
  - Błąd: "Nazwa jest wymagana" / "Nazwa jest za długa (max 255 znaków)"

#### `Filters`
- **Status filter**: wartość musi być jedną z: `null | "Draft" | "Locked"`
- **Sort**: wartość musi być jedną z opcji `SortOption`

### 9.2. Warunki biznesowe (weryfikowane przez API)

- **Blokowanie scenariusza**: możliwe tylko dla statusu "Draft"
- **Edycja scenariusza**: możliwa tylko dla statusu "Draft"
- **Duplikacja**: możliwa dla każdego scenariusza
- **Usuwanie**: możliwe tylko jeśli brak scenariuszy pochodnych (weryfikacja w API)

### 9.3. Wpływ na UI

- **Scenariusz Locked**:
  - Akcja "Zablokuj" ukryta w menu
  - Badge statusu: zielony (bg-green-100)
  - Link do szczegółów prowadzi do read-only view
- **Scenariusz Draft**:
  - Akcja "Zablokuj" widoczna w menu
  - Badge statusu: żółty (bg-yellow-100)
  - Link do szczegółów prowadzi do editable view

## 10. Obsługa błędów

### 10.1. Błędy API (server-side)

**401 Unauthorized**:
- Brak sesji użytkownika
- **Obsługa**: Przekierowanie do `/login` (middleware)

**403 Forbidden**:
- Użytkownik nie jest członkiem firmy
- **Obsługa**: Wyświetlenie komunikatu "Brak dostępu do tej firmy" i przekierowanie do `/`

**404 Not Found**:
- Scenariusz nie istnieje lub został usunięty
- **Obsługa**: Komunikat "Scenariusz nie został znaleziony" i usunięcie karty z widoku

**409 Conflict**:
- Scenariusz o tej nazwie już istnieje (duplikacja/tworzenie)
- Scenariusz jest już zablokowany (blokowanie)
- Istnieją scenariusze pochodne (usuwanie)
- **Obsługa**: Wyświetlenie komunikatu szczegółowego błędu w modalu

**500 Internal Server Error**:
- Nieoczekiwany błąd serwera
- **Obsługa**: Komunikat "Wystąpił błąd serwera. Spróbuj ponownie później." + przycisk "Spróbuj ponownie"

### 10.2. Błędy walidacji (client-side)

**Formularz tworzenia/duplikacji**:
- Walidacja w czasie rzeczywistym (onBlur)
- Wyświetlanie błędów pod polami (text-red-600, text-sm)
- Blokowanie przycisku "Utwórz"/"Duplikuj" jeśli formularz niepoprawny

**Przykład komunikatów**:
- "To pole jest wymagane"
- "Maksymalna długość to 255 znaków"
- "Data zakończenia musi być późniejsza niż data rozpoczęcia"

### 10.3. Błędy sieci

**Brak połączenia**:
- **Obsługa**: Komunikat "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."

**Timeout**:
- **Obsługa**: Komunikat "Żądanie trwa zbyt długo. Spróbuj ponownie."

### 10.4. Komponenty obsługi błędów

**`ErrorBoundary`** (React Error Boundary):
- Przechwytywanie błędów renderowania w komponentach React
- Wyświetlanie fallback UI: "Coś poszło nie tak. Odśwież stronę."

**`Toast` / `Notification`** (Shadcn/ui):
- Wyświetlanie komunikatów sukcesu/błędu po akcjach
- Automatyczne znikanie po 5 sekundach
- Możliwość manualnego zamknięcia

**Przykład użycia**:
```typescript
try {
  await duplicateScenario(scenarioId, name);
  toast.success("Scenariusz został zduplikowany");
} catch (error) {
  toast.error(error.message || "Wystąpił błąd");
}
```

### 10.5. Strategia retry

**Dla operacji GET** (pobieranie listy):
- Automatyczny retry 1x po 2 sekundach w przypadku błędu sieci
- Wyświetlenie przycisku "Spróbuj ponownie" w przypadku trwałego błędu

**Dla operacji POST/DELETE** (akcje):
- Brak automatycznego retry (ryzyko duplikacji)
- Użytkownik musi manualnie powtórzyć akcję

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików
1. Utworzenie pliku strony: `src/pages/index.astro`
2. Utworzenie komponentów Astro:
   - `src/components/dashboard/ScenarioGrid.astro`
   - `src/components/dashboard/ScenarioCard.astro`
3. Utworzenie komponentów React:
   - `src/components/dashboard/Filters.tsx`
   - `src/components/dashboard/FloatingActionButton.tsx`
   - `src/components/dashboard/CreateScenarioDialog.tsx`
   - `src/components/dashboard/DuplicateScenarioDialog.tsx`
   - `src/components/dashboard/ConfirmDialog.tsx`
4. Utworzenie custom hooka: `src/components/hooks/useDashboard.ts`
5. Utworzenie API helpers: `src/lib/api-client.ts`

### Krok 2: Implementacja typów
1. Dodanie nowych typów do `src/types.ts`:
   - `ScenarioCardViewModel`
   - `ScenarioStatus` (enum)
   - `SortOption` (enum)
   - `FiltersState`
   - `LockScenarioCommand`, `SoftDeleteScenarioCommand`, `DuplicateScenarioCommand`, `CreateScenarioCommand`
   - `ApiError`

### Krok 3: Implementacja pomocniczych funkcji
1. W `src/lib/utils.ts` dodać:
   - `formatDate(date: string): string` - formatowanie daty na "2 stycznia 2026"
   - `getStatusBadgeColor(status: ScenarioStatus): "yellow" | "green"`
   - `getStatusLabel(status: ScenarioStatus): string` - "Roboczy" | "Zablokowany"

### Krok 4: Implementacja API client
1. W `src/lib/api-client.ts`:
   - Funkcja `apiRequest<T>()` - generyczna funkcja fetch z obsługą błędów
   - Funkcje specyficzne dla Dashboard:
     - `fetchScenarios(companyId, params)`
     - `createScenario(companyId, data)`
     - `duplicateScenario(companyId, scenarioId, name)`
     - `lockScenario(companyId, scenarioId)`
     - `deleteScenario(companyId, scenarioId)`

### Krok 5: Implementacja custom hooka `useDashboard`
1. W `src/components/hooks/useDashboard.ts`:
   - Stan: `scenarios`, `filters`, `loading`, `error`, stany modali
   - Metody filtrowania: `setStatusFilter`, `setSortOption`
   - Logika filtrowania i sortowania (useMemo)
   - Metody akcji: `createScenario`, `duplicateScenario`, `lockScenario`, `deleteScenario`
   - Metody zarządzania modalami
   - Obsługa błędów (try-catch, toast notifications)

### Krok 6: Implementacja komponentów prezentacyjnych (Astro)
1. `ScenarioCard.astro`:
   - Struktura HTML (Card z Shadcn/ui)
   - Wyświetlanie danych scenariusza
   - Badge statusu (warunkowe stylowanie)
   - Link do szczegółów scenariusza
   - Slot dla menu akcji (DropdownMenu)
2. `ScenarioGrid.astro`:
   - Grid layout (Tailwind: grid, grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
   - Iteracja po `scenarios` i renderowanie `ScenarioCard`
   - Empty state (gdy `scenarios.length === 0`)

### Krok 7: Implementacja komponentów interaktywnych (React Islands)
1. `Filters.tsx`:
   - UI: Toggle buttons dla statusu, Select dla sortowania
   - Integracja z hookiem `useDashboard`
   - Wywołanie `setStatusFilter`, `setSortOption` przy zmianie
2. `FloatingActionButton.tsx`:
   - FAB z ikoną "+"
   - Menu dropdown (Shadcn/ui)
   - Akcje: przekierowanie do `/import`, otwarcie `CreateScenarioDialog`
3. `CreateScenarioDialog.tsx`:
   - Formularz z polami: nazwa, dataset_code, start_date, end_date
   - Walidacja w czasie rzeczywistym (React Hook Form + Zod)
   - Wywołanie `createScenario` z hooka przy submit
   - Obsługa loading state, błędów
4. `DuplicateScenarioDialog.tsx`:
   - Formularz z polem: nazwa
   - Domyślna wartość: "{originalName} (kopia)"
   - Wywołanie `duplicateScenario` przy submit
5. `ConfirmDialog.tsx`:
   - AlertDialog z Shadcn/ui
   - Propsy: title, description, onConfirm, variant
   - Obsługa akcji blokowania i usuwania

### Krok 8: Implementacja menu akcji (DropdownMenu)
1. W `ScenarioCard.astro` dodać slot dla menu
2. Przekazać menu jako React Island do Astro:
   ```astro
   <ScenarioCardActionsMenu scenario={scenario} client:load />
   ```
3. W `ScenarioCardActionsMenu.tsx`:
   - DropdownMenu z Shadcn/ui
   - Elementy: Edytuj, Duplikuj, Zablokuj (warunkowe), Usuń
   - Wywołanie odpowiednich metod z hooka `useDashboard`
   - Otwarcie modali potwierdzenia

### Krok 9: Implementacja strony `index.astro`
1. W frontmatter (server-side):
   - Pobranie `companyId` z `context.locals.supabase` (sesja użytkownika)
   - Wywołanie GET `/api/companies/{companyId}/scenarios`
   - Obsługa błędów (401 → redirect `/login`, 403 → komunikat)
2. W HTML:
   - Wrapper: `Layout.astro`
   - Header z tytułem i komponentem `Filters`
   - Komponent `ScenarioGrid` z przekazanymi scenariuszami
   - Komponent `FloatingActionButton`
   - Modaly (CreateScenarioDialog, DuplicateScenarioDialog, ConfirmDialog) - renderowane warunkowo

### Krok 10: Stylowanie i responsywność
1. Wykorzystanie Tailwind 4 dla layoutu:
   - Grid: responsive (1 col mobile, 2 tablet, 3 desktop)
   - FAB: fixed position, dostosowanie na mobile
2. Używanie komponentów Shadcn/ui dla spójności:
   - Card, Button, Dialog, AlertDialog, DropdownMenu, Select, Input, Label
3. Accessibility:
   - ARIA labels dla przycisków bez tekstu
   - Keyboard navigation dla menu i modali
   - Focus management w modalach

### Krok 11: Obsługa błędów i edge cases
1. Dodanie ErrorBoundary dla React Islands
2. Dodanie Toast notifications (Shadcn/ui Sonner)
3. Obsługa stanów:
   - Loading state (skeleton cards podczas ładowania)
   - Empty state (brak scenariuszy)
   - Error state (błąd API)
4. Retry logic dla operacji GET

### Krok 12: Testowanie
1. Test przepływów użytkownika:
   - Przeglądanie listy scenariuszy
   - Filtrowanie i sortowanie
   - Tworzenie nowego scenariusza
   - Duplikacja scenariusza
   - Blokowanie scenariusza
   - Usuwanie scenariusza
2. Test edge cases:
   - Pusta lista scenariuszy
   - Błędy API (401, 403, 404, 409, 500)
   - Walidacja formularzy
   - Responsywność (mobile, tablet, desktop)
3. Test accessibility:
   - Keyboard navigation
   - Screen reader compatibility
   - Focus management

### Krok 13: Optymalizacje
1. Lazy loading obrazków i komponentów React (client:visible, client:idle)
2. Memoizacja danych w hooku `useDashboard` (useMemo, useCallback)
3. Debouncing dla filtrów (opcjonalnie)
4. Pagination (jeśli lista scenariuszy jest bardzo długa)

### Krok 14: Dokumentacja
1. Dodanie JSDoc comments do komponentów
2. Aktualizacja README z opisem Dashboard view
3. Dokumentacja API endpoints (OpenAPI/Swagger - opcjonalnie)

---

**Koniec planu implementacji**
