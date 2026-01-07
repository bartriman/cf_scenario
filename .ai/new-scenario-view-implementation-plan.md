# Plan implementacji widoku Tworzenia Nowego Scenariusza

## 1. Przegląd

Widok tworzenia nowego scenariusza umożliwia użytkownikom zarówno tworzenie zupełnie nowych scenariuszy, jak i duplikowanie istniejących. Widok składa się z dwóch głównych komponentów:
1. **Lista scenariuszy** - strona `/scenarios` prezentująca wszystkie scenariusze użytkownika z opcjami zarządzania
2. **Dialog tworzenia scenariusza** - modalny formularz umożliwiający utworzenie nowego scenariusza lub duplikację istniejącego

Funkcjonalność pozwala użytkownikom testować różne warianty przepływów pieniężnych bez naruszania oryginalnych danych. Nowo utworzone scenariusze otrzymują automatycznie status "Draft", co umożliwia ich edycję przed finalnym zatwierdzeniem.

## 2. Routing widoku

Główny widok listy scenariuszy będzie dostępny pod ścieżką:
- **`/scenarios`** - lista wszystkich scenariuszy użytkownika

Dodatkowo system wykorzystuje istniejący routing:
- **`/scenarios/[scenarioId]`** - szczegółowy widok scenariusza (już istniejący)

Dialogi tworzenia/duplikacji będą osadzone w stronie `/scenarios` jako komponenty modalne i nie wymagają dedykowanego routingu.

## 3. Struktura komponentów

```
ScenarioListPage (Astro)
├── Header (Astro) - nawigacja aplikacji
├── ScenarioListContainer (React Island)
│   ├── ScenarioListHeader (React)
│   │   ├── Title + Filters/Search
│   │   └── CreateScenarioButton (React)
│   │       └── otwiera CreateScenarioDialog
│   ├── ScenarioGrid (React)
│   │   └── ScenarioCard[] (React)
│   │       ├── Card (Shadcn/ui)
│   │       ├── Badge (Shadcn/ui) - status Draft/Locked
│   │       └── DropdownMenu (Shadcn/ui)
│   │           ├── View
│   │           ├── Duplicate → otwiera DuplicateScenarioDialog
│   │           ├── Lock
│   │           └── Delete
│   └── EmptyState (React) - gdy brak scenariuszy
└── CreateScenarioDialog (React)
    ├── Dialog (Shadcn/ui)
    ├── Tabs (Shadcn/ui)
    │   ├── Tab: "Nowy scenariusz"
    │   │   └── CreateScenarioForm (React)
    │   └── Tab: "Z istniejącego importu"
    │       └── CreateFromImportForm (React)
    └── DuplicateScenarioDialog (React)
        ├── Dialog (Shadcn/ui)
        └── DuplicateScenarioForm (React)
```

## 4. Szczegóły komponentów

### 4.1. ScenarioListPage (Astro)

- **Opis**: Główna strona serwerowa renderująca kontener dla listy scenariuszy. Odpowiada za pobranie danych użytkownika i przekazanie kontekstu do komponentów React.
- **Główne elementy**:
  - Layout aplikacji z nagłówkiem
  - Hydratowany komponent `<ScenarioListContainer client:load />`
  - Obsługa stanów ładowania i błędów
- **Obsługiwane zdarzenia**: Brak (strona serwerowa)
- **Warunki walidacji**: 
  - Weryfikacja sesji użytkownika (redirect do `/login` jeśli niezalogowany)
  - Weryfikacja przynależności do firmy
- **Typy**: 
  - `Astro.locals.supabase` - klient Supabase
  - `Astro.locals.user` - zalogowany użytkownik
- **Propsy**: Brak (komponent Astro)

### 4.2. ScenarioListContainer (React Island)

- **Opis**: Główny kontener zarządzający logiką listy scenariuszy, stanem dialogów i komunikacją z API. To "inteligentny" komponent koordynujący wszystkie interakcje.
- **Główne elementy**:
  - `<ScenarioListHeader />` - nagłówek z przyciskiem "Nowy scenariusz"
  - `<ScenarioGrid />` - siatka kart scenariuszy
  - `<CreateScenarioDialog />` - dialog tworzenia
  - `<DuplicateScenarioDialog />` - dialog duplikacji
  - `<EmptyState />` - stan pusty
- **Obsługiwane zdarzenia**:
  - Otwieranie/zamykanie dialogów tworzenia i duplikacji
  - Obsługa sukcesu/błędu operacji API
  - Odświeżanie listy po utworzeniu/duplikacji/usunięciu scenariusza
  - Nawigacja do szczegółów scenariusza
- **Warunki walidacji**: Brak (deleguje do dzieci)
- **Typy**:
  - `ScenarioListItemDTO[]` - lista scenariuszy
  - `CreateScenarioDialogState` - stan dialogu tworzenia
  - `DuplicateScenarioDialogState` - stan dialogu duplikacji
- **Propsy**:
  ```typescript
  interface ScenarioListContainerProps {
    companyId: string;
    initialScenarios?: ScenarioListItemDTO[];
  }
  ```

### 4.3. ScenarioListHeader (React)

- **Opis**: Nagłówek sekcji listy scenariuszy zawierający tytuł, opcjonalne filtry i przycisk głównej akcji.
- **Główne elementy**:
  - `<h1>` - tytuł "Moje scenariusze"
  - `<Input />` (Shadcn/ui) - pole wyszukiwania (opcjonalnie w MVP)
  - `<Select />` (Shadcn/ui) - filtr po statusie (Draft/Locked)
  - `<Button />` (Shadcn/ui) - "Nowy scenariusz"
- **Obsługiwane zdarzenia**:
  - `onCreateClick` - kliknięcie przycisku "Nowy scenariusz"
  - `onFilterChange` - zmiana filtra statusu
  - `onSearchChange` - zmiana zapytania wyszukiwania
- **Warunki walidacji**: Brak
- **Typy**: 
  - `ScenarioStatusType` - typ filtru
- **Propsy**:
  ```typescript
  interface ScenarioListHeaderProps {
    onCreateClick: () => void;
    onFilterChange?: (status: ScenarioStatusType | 'all') => void;
    onSearchChange?: (query: string) => void;
  }
  ```

### 4.4. ScenarioGrid (React)

- **Opis**: Siatka responsywna wyświetlająca karty scenariuszy w układzie kafelkowym. Obsługuje stan pusty i ładowanie.
- **Główne elementy**:
  - Grid container (Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
  - `<ScenarioCard />` dla każdego scenariusza
  - `<Skeleton />` (Shadcn/ui) podczas ładowania
- **Obsługiwane zdarzenia**:
  - Przekazywanie zdarzeń z kart do kontenera nadrzędnego
- **Warunki walidacji**: Brak
- **Typy**: 
  - `ScenarioListItemDTO[]`
- **Propsy**:
  ```typescript
  interface ScenarioGridProps {
    scenarios: ScenarioListItemDTO[];
    isLoading?: boolean;
    onScenarioClick: (scenarioId: number) => void;
    onDuplicateClick: (scenario: ScenarioListItemDTO) => void;
    onLockClick: (scenarioId: number) => void;
    onDeleteClick: (scenarioId: number) => void;
  }
  ```

### 4.5. ScenarioCard (React)

- **Opis**: Karta przedstawiająca pojedynczy scenariusz z podstawowymi informacjami i menu akcji.
- **Główne elementy**:
  - `<Card />` (Shadcn/ui) - kontener karty
  - `<CardHeader />` - nazwa scenariusza i badge statusu
  - `<CardContent />` - informacje: kod datasetu, daty, autor
  - `<CardFooter />` - data utworzenia i menu akcji
  - `<Badge />` (Shadcn/ui) - status (Draft/Locked)
  - `<DropdownMenu />` (Shadcn/ui) - menu akcji
- **Obsługiwane zdarzenia**:
  - `onClick` - kliknięcie karty → nawigacja do widoku scenariusza
  - Menu akcje: View, Duplicate, Lock, Delete
- **Warunki walidacji**:
  - Lock dostępny tylko dla statusu Draft
  - Delete niedostępny jeśli scenariusz ma potomków (sprawdzane przez API)
- **Typy**: 
  - `ScenarioListItemDTO`
- **Propsy**:
  ```typescript
  interface ScenarioCardProps {
    scenario: ScenarioListItemDTO;
    onClick: () => void;
    onDuplicate: () => void;
    onLock: () => void;
    onDelete: () => void;
  }
  ```

### 4.6. CreateScenarioDialog (React)

- **Opis**: Modalny dialog z zakładkami umożliwiający utworzenie nowego pustego scenariusza lub scenariusza na podstawie istniejącego importu.
- **Główne elementy**:
  - `<Dialog />` (Shadcn/ui) - kontener modalny
  - `<DialogHeader />` - tytuł "Nowy scenariusz"
  - `<Tabs />` (Shadcn/ui)
    - Tab 1: "Pusty scenariusz" → `<CreateScenarioForm />`
    - Tab 2: "Z importu" → `<CreateFromImportForm />`
  - `<DialogFooter />` - przyciski Anuluj/Utwórz
- **Obsługiwane zdarzenia**:
  - `onOpenChange` - otwarcie/zamknięcie dialogu
  - `onSubmit` - wysłanie formularza
  - `onSuccess` - po pomyślnym utworzeniu scenariusza
  - `onError` - obsługa błędów API
- **Warunki walidacji**: Delegowane do formularzy w zakładkach
- **Typy**:
  - `CreateScenarioRequestDTO`
  - `CreateScenarioResponseDTO`
- **Propsy**:
  ```typescript
  interface CreateScenarioDialogProps {
    companyId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (scenario: CreateScenarioResponseDTO) => void;
  }
  ```

### 4.7. CreateScenarioForm (React)

- **Opis**: Formularz do tworzenia nowego pustego scenariusza z podstawowymi parametrami.
- **Główne elementy**:
  - `<Form />` - kontener formularza (React Hook Form)
  - `<Input />` (Shadcn/ui) - nazwa scenariusza (wymagane)
  - `<Input />` (Shadcn/ui) - kod datasetu (wymagane)
  - `<DatePicker />` (Shadcn/ui) - data rozpoczęcia
  - `<DatePicker />` (Shadcn/ui) - data zakończenia
  - `<Select />` (Shadcn/ui) - scenariusz bazowy (opcjonalny)
- **Obsługiwane zdarzenia**:
  - `onSubmit` - walidacja i wysłanie danych do API
  - Walidacja w czasie rzeczywistym (React Hook Form)
- **Warunki walidacji**:
  - Nazwa: niepusta, max 255 znaków
  - Kod datasetu: niepusty, tylko alfanumeryczne znaki i myślniki
  - Data rozpoczęcia: wymagana, poprawny format ISO
  - Data zakończenia: wymagana, późniejsza niż data rozpoczęcia
  - Scenariusz bazowy: opcjonalny, musi istnieć w systemie
- **Typy**:
  - `CreateScenarioFormData` (lokalny interfejs formularza)
  - `CreateScenarioRequestDTO`
- **Propsy**:
  ```typescript
  interface CreateScenarioFormProps {
    companyId: string;
    onSubmit: (data: CreateScenarioRequestDTO) => Promise<void>;
    isSubmitting: boolean;
  }
  ```

### 4.8. CreateFromImportForm (React)

- **Opis**: Formularz do tworzenia scenariusza na podstawie istniejącego importu CSV.
- **Główne elementy**:
  - `<Form />` - kontener formularza
  - `<Select />` (Shadcn/ui) - wybór importu z listy
  - `<Input />` (Shadcn/ui) - nazwa scenariusza
  - Podgląd wybranego importu (liczba transakcji, daty)
- **Obsługiwane zdarzenia**:
  - `onImportSelect` - wybór importu → automatyczne uzupełnienie dat i kodu datasetu
  - `onSubmit` - walidacja i utworzenie scenariusza
- **Warunki walidacji**:
  - Import: wymagany wybór z listy
  - Nazwa: niepusta, max 255 znaków
  - Daty: automatycznie pobrane z importu, możliwość modyfikacji
- **Typy**:
  - `ImportListItemDTO[]` - lista importów
  - `CreateScenarioRequestDTO`
- **Propsy**:
  ```typescript
  interface CreateFromImportFormProps {
    companyId: string;
    imports: ImportListItemDTO[];
    onSubmit: (data: CreateScenarioRequestDTO) => Promise<void>;
    isSubmitting: boolean;
  }
  ```

### 4.9. DuplicateScenarioDialog (React)

- **Opis**: Uproszczony dialog do duplikacji istniejącego scenariusza wraz ze wszystkimi jego override'ami.
- **Główne elementy**:
  - `<Dialog />` (Shadcn/ui) - kontener modalny
  - `<DialogHeader />` - tytuł "Duplikuj scenariusz: [nazwa oryginału]"
  - `<DuplicateScenarioForm />` - formularz z nazwą nowego scenariusza
  - `<DialogFooter />` - przyciski Anuluj/Duplikuj
  - Informacja o źródłowym scenariuszu (liczba override'ów)
- **Obsługiwane zdarzenia**:
  - `onOpenChange` - otwarcie/zamknięcie dialogu
  - `onSubmit` - duplikacja scenariusza
  - `onSuccess` - po pomyślnej duplikacji
- **Warunki walidacji**: Delegowane do formularza
- **Typy**:
  - `DuplicateScenarioRequestDTO`
  - `DuplicateScenarioResponseDTO`
- **Propsy**:
  ```typescript
  interface DuplicateScenarioDialogProps {
    companyId: string;
    sourceScenario: ScenarioListItemDTO | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (scenario: DuplicateScenarioResponseDTO) => void;
  }
  ```

### 4.10. DuplicateScenarioForm (React)

- **Opis**: Formularz do wprowadzenia nazwy dla duplikowanego scenariusza.
- **Główne elementy**:
  - `<Form />` - kontener formularza
  - `<Input />` (Shadcn/ui) - nazwa nowego scenariusza
  - Informacja tekstowa: "Nowy scenariusz będzie zawierał wszystkie transakcje i modyfikacje z oryginału"
- **Obsługiwane zdarzenia**:
  - `onSubmit` - walidacja i wysłanie
- **Warunki walidacji**:
  - Nazwa: wymagana, niepusta, max 255 znaków
  - Nazwa: różna od oryginału (sugestia: dodanie "(kopia)" jeśli taka sama)
- **Typy**:
  - `DuplicateScenarioRequestDTO`
- **Propsy**:
  ```typescript
  interface DuplicateScenarioFormProps {
    sourceScenarioName: string;
    onSubmit: (data: DuplicateScenarioRequestDTO) => Promise<void>;
    isSubmitting: boolean;
  }
  ```

### 4.11. EmptyState (React)

- **Opis**: Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych scenariuszy.
- **Główne elementy**:
  - Ilustracja/ikona
  - Tytuł: "Brak scenariuszy"
  - Opis: "Rozpocznij od zaimportowania danych lub stworzenia nowego scenariusza"
  - `<Button />` - "Importuj dane" (link do `/import`)
  - `<Button />` - "Utwórz scenariusz"
- **Obsługiwane zdarzenia**:
  - `onCreateClick` - otwarcie dialogu tworzenia
- **Warunki walidacji**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**:
  ```typescript
  interface EmptyStateProps {
    onCreateClick: () => void;
  }
  ```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Scenariusz - podstawowe typy encji
export type Scenario = Tables<"scenarios">;
export type ScenarioInsert = TablesInsert<"scenarios">;

// Enumeracje
export const ScenarioStatus = {
  DRAFT: "Draft",
  LOCKED: "Locked",
} as const;
export type ScenarioStatusType = (typeof ScenarioStatus)[keyof typeof ScenarioStatus];

// DTOs dla API
export type ScenarioListItemDTO = Pick<
  Scenario,
  | "id"
  | "company_id"
  | "import_id"
  | "dataset_code"
  | "name"
  | "status"
  | "base_scenario_id"
  | "start_date"
  | "end_date"
  | "locked_at"
  | "locked_by"
  | "created_at"
>;

export interface ScenarioListResponseDTO {
  scenarios: ScenarioListItemDTO[];
  pagination: PaginationDTO;
}

export interface CreateScenarioRequestDTO {
  dataset_code: string;
  name: string;
  base_scenario_id?: number;
  start_date: string;
  end_date: string;
}

export type CreateScenarioResponseDTO = Pick<
  Scenario,
  | "id"
  | "company_id"
  | "import_id"
  | "dataset_code"
  | "name"
  | "status"
  | "base_scenario_id"
  | "start_date"
  | "end_date"
  | "created_at"
>;

export interface DuplicateScenarioRequestDTO {
  name: string;
}

export type DuplicateScenarioResponseDTO = CreateScenarioResponseDTO & {
  overrides_count: number;
};

// Typy dla importów (używane w CreateFromImportForm)
export type ImportListItemDTO = Pick<
  Import,
  | "id"
  | "company_id"
  | "dataset_code"
  | "status"
  | "total_rows"
  | "valid_rows"
  | "invalid_rows"
  | "inserted_transactions_count"
  | "file_name"
  | "uploaded_by"
  | "created_at"
>;

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

### 5.2. Nowe typy (ViewModels i lokalne interfejsy)

```typescript
// ViewModel dla stanu dialogu tworzenia scenariusza
export interface CreateScenarioDialogState {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
}

// ViewModel dla stanu dialogu duplikacji
export interface DuplicateScenarioDialogState {
  open: boolean;
  sourceScenario: ScenarioListItemDTO | null;
  isSubmitting: boolean;
  error: string | null;
}

// Dane formularza tworzenia scenariusza (przed transformacją do DTO)
export interface CreateScenarioFormData {
  name: string;
  dataset_code: string;
  start_date: Date;
  end_date: Date;
  base_scenario_id?: number;
}

// Dane formularza duplikacji
export interface DuplicateScenarioFormData {
  name: string;
}

// Dane formularza tworzenia z importu
export interface CreateFromImportFormData {
  import_id: number;
  name: string;
  start_date: Date;
  end_date: Date;
}

// ViewModel dla karty scenariusza (rozszerzenie DTO o dane UI)
export interface ScenarioCardViewModel extends ScenarioListItemDTO {
  canLock: boolean; // true jeśli status === "Draft"
  canEdit: boolean; // true jeśli status === "Draft"
  canDelete: boolean; // true - sprawdzane przez API
  formattedCreatedAt: string; // np. "2 dni temu"
  statusBadgeVariant: 'default' | 'secondary'; // dla Badge component
}

// Typ dla filtrów listy scenariuszy
export type ScenarioFilterStatus = ScenarioStatusType | 'all';

export interface ScenarioListFilters {
  status: ScenarioFilterStatus;
  searchQuery: string;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan globalny

**Nie wymagany** - wszystkie dane są specyficzne dla widoku i nie muszą być współdzielone między komponentami aplikacji.

### 6.2. Stan lokalny (React)

Stan będzie zarządzany w głównym komponencie `ScenarioListContainer` za pomocą hooków React:

```typescript
// Stan listy scenariuszy
const [scenarios, setScenarios] = useState<ScenarioListItemDTO[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [filters, setFilters] = useState<ScenarioListFilters>({
  status: 'all',
  searchQuery: ''
});

// Stan dialogu tworzenia
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [isCreating, setIsCreating] = useState(false);

// Stan dialogu duplikacji
const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
const [scenarioToDuplicate, setScenarioToDuplicate] = useState<ScenarioListItemDTO | null>(null);
const [isDuplicating, setIsDuplicating] = useState(false);
```

### 6.3. Customowy hook: useScenarios

Utworzymy dedykowany hook do zarządzania operacjami na scenariuszach:

```typescript
function useScenarios(companyId: string) {
  const [scenarios, setScenarios] = useState<ScenarioListItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobranie listy scenariuszy
  const fetchScenarios = async (filters?: ScenarioListFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/companies/${companyId}/scenarios?${buildQueryParams(filters)}`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data: ScenarioListResponseDTO = await response.json();
      setScenarios(data.scenarios);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Utworzenie scenariusza
  const createScenario = async (data: CreateScenarioRequestDTO): Promise<CreateScenarioResponseDTO> => {
    const response = await fetch(`/api/companies/${companyId}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create scenario');
    const newScenario = await response.json();
    setScenarios(prev => [...prev, newScenario]);
    return newScenario;
  };

  // Duplikacja scenariusza
  const duplicateScenario = async (scenarioId: number, name: string): Promise<DuplicateScenarioResponseDTO> => {
    const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to duplicate scenario');
    const duplicated = await response.json();
    setScenarios(prev => [...prev, duplicated]);
    return duplicated;
  };

  // Zablokowanie scenariusza
  const lockScenario = async (scenarioId: number): Promise<void> => {
    const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/lock`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to lock scenario');
    await fetchScenarios(); // Odśwież listę
  };

  // Usunięcie scenariusza
  const deleteScenario = async (scenarioId: number): Promise<void> => {
    const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete scenario');
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
  };

  return {
    scenarios,
    isLoading,
    error,
    fetchScenarios,
    createScenario,
    duplicateScenario,
    lockScenario,
    deleteScenario
  };
}
```

### 6.4. Formularze

Do zarządzania stanem formularzy użyjemy **React Hook Form** z integracją **Zod** do walidacji:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schemat walidacji dla tworzenia scenariusza
const createScenarioSchema = z.object({
  name: z.string()
    .min(1, 'Nazwa jest wymagana')
    .max(255, 'Nazwa nie może przekraczać 255 znaków'),
  dataset_code: z.string()
    .min(1, 'Kod datasetu jest wymagany')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Kod może zawierać tylko litery, cyfry, myślniki i podkreślenia'),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), 'Nieprawidłowa data'),
  end_date: z.string().refine(val => !isNaN(Date.parse(val)), 'Nieprawidłowa data'),
  base_scenario_id: z.number().optional()
}).refine(data => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return start < end;
}, {
  message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
  path: ['end_date']
});

// W komponencie formularza
const form = useForm<CreateScenarioRequestDTO>({
  resolver: zodResolver(createScenarioSchema),
  defaultValues: {
    name: '',
    dataset_code: '',
    start_date: '',
    end_date: ''
  }
});
```

## 7. Integracja API

### 7.1. Endpoint: Lista scenariuszy

**Request:**
- **Method:** GET
- **Path:** `/api/companies/{companyId}/scenarios`
- **Query params:**
  - `status` (optional): "Draft" | "Locked"
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)

**Response (200):**
```typescript
{
  scenarios: ScenarioListItemDTO[];
  pagination: PaginationDTO;
}
```

**Wywołanie z frontendu:**
```typescript
const response = await fetch(`/api/companies/${companyId}/scenarios?status=${status}&page=${page}`);
const data: ScenarioListResponseDTO = await response.json();
```

### 7.2. Endpoint: Tworzenie scenariusza

**Request:**
- **Method:** POST
- **Path:** `/api/companies/{companyId}/scenarios`
- **Body:** `CreateScenarioRequestDTO`

```typescript
{
  dataset_code: string;
  name: string;
  base_scenario_id?: number;
  start_date: string; // ISO format YYYY-MM-DD
  end_date: string;   // ISO format YYYY-MM-DD
}
```

**Response (201):**
```typescript
CreateScenarioResponseDTO
```

**Wywołanie z frontendu:**
```typescript
const response = await fetch(`/api/companies/${companyId}/scenarios`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
});
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}
const newScenario: CreateScenarioResponseDTO = await response.json();
```

### 7.3. Endpoint: Duplikacja scenariusza

**Request:**
- **Method:** POST
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/duplicate`
- **Body:** `DuplicateScenarioRequestDTO`

```typescript
{
  name: string; // Nazwa nowego scenariusza
}
```

**Response (201):**
```typescript
DuplicateScenarioResponseDTO
```

**Wywołanie z frontendu:**
```typescript
const response = await fetch(
  `/api/companies/${companyId}/scenarios/${scenarioId}/duplicate`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  }
);
const duplicatedScenario: DuplicateScenarioResponseDTO = await response.json();
```

### 7.4. Endpoint: Blokowanie scenariusza

**Request:**
- **Method:** POST
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/lock`
- **Body:** brak

**Response (200):**
```typescript
{
  id: number;
  status: "Locked";
  locked_at: string;
  locked_by: string;
}
```

### 7.5. Endpoint: Usuwanie scenariusza

**Request:**
- **Method:** DELETE
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}`

**Response (204):** No content

**Obsługa błędów:**
- 409 Conflict: Scenariusz ma scenariusze pochodne (wyświetl komunikat: "Nie można usunąć scenariusza, który ma scenariusze pochodne")

## 8. Interakcje użytkownika

### 8.1. Przeglądanie listy scenariuszy

**Przepływ:**
1. Użytkownik wchodzi na `/scenarios`
2. System pobiera listę scenariuszy z API
3. Wyświetla się siatka kart scenariuszy
4. Każda karta pokazuje: nazwę, status (badge), kod datasetu, daty, ikonę menu akcji

**Interakcje:**
- **Kliknięcie karty** → nawigacja do `/scenarios/{scenarioId}`
- **Hover na kartę** → subtelne podświetlenie (elevation)
- **Filtry** → natychmiastowe przeliczenie widocznych kart (client-side)

### 8.2. Tworzenie nowego scenariusza

**Przepływ:**
1. Użytkownik klika przycisk "Nowy scenariusz"
2. Otwiera się dialog z zakładkami
3. Użytkownik wybiera zakładkę:
   - **"Pusty scenariusz"**: wypełnia formularz (nazwa, kod datasetu, daty, opcjonalnie scenariusz bazowy)
   - **"Z importu"**: wybiera import z listy, nazwa i daty uzupełniają się automatycznie
4. Kliknięcie "Utwórz" → walidacja formularza
5. Jeśli walidacja OK → wywołanie API POST `/api/companies/{companyId}/scenarios`
6. Po sukcesie:
   - Toast: "Scenariusz utworzony pomyślnie"
   - Zamknięcie dialogu
   - Dodanie nowego scenariusza do listy (optimistic update)
   - **Opcjonalnie**: automatyczne przekierowanie do `/scenarios/{newScenarioId}`

**Obsługa błędów:**
- Błędy walidacji → wyświetlenie pod polami formularza
- Błąd API (409 - nazwa już istnieje) → Toast z komunikatem błędu
- Błąd sieciowy → Toast "Nie udało się utworzyć scenariusza. Spróbuj ponownie."

### 8.3. Duplikacja scenariusza

**Przepływ:**
1. Użytkownik klika ikonę menu (⋮) na karcie scenariusza
2. Wybiera "Duplikuj" z menu dropdown
3. Otwiera się dialog duplikacji z nazwą "Duplikuj scenariusz: [nazwa oryginału]"
4. Wyświetla się informacja: "Scenariusz zawiera X modyfikacji, które zostaną skopiowane"
5. Użytkownik wpisuje nazwę nowego scenariusza (domyślnie: "[oryginał] (kopia)")
6. Kliknięcie "Duplikuj" → wywołanie API POST `/api/companies/{companyId}/scenarios/{scenarioId}/duplicate`
7. Po sukcesie:
   - Toast: "Scenariusz zduplikowany pomyślnie"
   - Zamknięcie dialogu
   - Dodanie nowego scenariusza do listy
   - **Opcjonalnie**: automatyczne przekierowanie do nowego scenariusza

**Obsługa błędów:**
- Błąd 404 (scenariusz źródłowy nie istnieje) → Toast + zamknięcie dialogu + odświeżenie listy
- Błąd 409 (nazwa już istnieje) → Komunikat pod polem formularza

### 8.4. Blokowanie scenariusza

**Przepływ:**
1. Użytkownik klika menu na karcie scenariusza ze statusem "Draft"
2. Wybiera "Zablokuj" z menu
3. **Dialog potwierdzenia**: "Czy na pewno chcesz zablokować scenariusz? Po zablokowaniu nie będzie można go edytować."
4. Potwierdzenie → wywołanie API POST `/api/companies/{companyId}/scenarios/{scenarioId}/lock`
5. Po sukcesie:
   - Toast: "Scenariusz zablokowany"
   - Aktualizacja karty (badge zmienia się na "Locked", menu traci opcję "Lock")

### 8.5. Usuwanie scenariusza

**Przepływ:**
1. Użytkownik klika menu → "Usuń"
2. **Dialog potwierdzenia**: "Czy na pewno chcesz usunąć scenariusz '[nazwa]'? Ta operacja jest nieodwracalna."
3. Potwierdzenie → wywołanie API DELETE `/api/companies/{companyId}/scenarios/{scenarioId}`
4. Po sukcesie:
   - Toast: "Scenariusz usunięty"
   - Usunięcie karty z listy (animacja fade-out)

**Obsługa błędów:**
- Błąd 409 (ma scenariusze potomne) → Toast: "Nie można usunąć scenariusza, który ma scenariusze pochodne. Usuń najpierw scenariusze zależne."

### 8.6. Filtrowanie i wyszukiwanie

**Przepływ:**
1. Użytkownik wybiera status z dropdown ("Wszystkie" / "Draft" / "Locked")
2. Lub wpisuje zapytanie w pole wyszukiwania
3. Lista filtruje się **client-side** w czasie rzeczywistym (debounce 300ms dla wyszukiwania)
4. Jeśli brak wyników → wyświetla się komunikat "Brak scenariuszy spełniających kryteria"

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie frontendu

#### Formularz tworzenia scenariusza:

| Pole | Warunki | Komunikat błędu |
|------|---------|-----------------|
| `name` | Niepuste, 1-255 znaków | "Nazwa jest wymagana" / "Nazwa nie może przekraczać 255 znaków" |
| `dataset_code` | Niepuste, tylko alfanumeryczne i `-_` | "Kod datasetu jest wymagany" / "Kod może zawierać tylko litery, cyfry, myślniki i podkreślenia" |
| `start_date` | Poprawna data ISO | "Nieprawidłowa data" |
| `end_date` | Poprawna data ISO, późniejsza niż start_date | "Data zakończenia musi być późniejsza niż data rozpoczęcia" |
| `base_scenario_id` | Opcjonalny, musi istnieć (sprawdzane przez API) | - |

#### Formularz duplikacji:

| Pole | Warunki | Komunikat błędu |
|------|---------|-----------------|
| `name` | Niepuste, 1-255 znaków | "Nazwa jest wymagana" / "Nazwa nie może przekraczać 255 znaków" |

### 9.2. Warunki wyświetlania elementów UI

| Element | Warunek | Komponent |
|---------|---------|-----------|
| Przycisk "Zablokuj" w menu karty | `scenario.status === "Draft"` | `ScenarioCard` |
| Badge "Draft" / "Locked" | Zawsze widoczny, kolor zależny od statusu | `ScenarioCard` |
| EmptyState | `scenarios.length === 0 && !isLoading` | `ScenarioListContainer` |
| Skeleton cards | `isLoading === true` | `ScenarioGrid` |
| Dialog duplikacji | `duplicateDialogOpen === true && scenarioToDuplicate !== null` | `DuplicateScenarioDialog` |

### 9.3. Walidacja po stronie API

API zwraca błędy walidacji w formacie:

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Walidacja nie powiodła się",
    details: [
      {
        field: "name",
        message: "Scenariusz o tej nazwie już istnieje"
      }
    ]
  }
}
```

Frontend wyświetla te błędy:
- Przy konkretnych polach formularza (jeśli `field` wskazuje na pole)
- Jako ogólny Toast (jeśli błąd globalny)

## 10. Obsługa błędów

### 10.1. Błędy sieciowe

**Sytuacja:** Brak połączenia z API lub timeout

**Obsługa:**
- Wyświetlenie Toast: "Wystąpił problem z połączeniem. Spróbuj ponownie."
- Przycisk "Ponów" w Toast pozwalający na retry operacji
- Logowanie błędu do konsoli (w trybie development)

**Implementacja:**
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Network error');
  return await response.json();
} catch (error) {
  console.error('[API Error]', error);
  toast({
    variant: 'destructive',
    title: 'Błąd połączenia',
    description: 'Wystąpił problem z połączeniem. Spróbuj ponownie.',
    action: <ToastAction altText="Ponów">Ponów</ToastAction>
  });
}
```

### 10.2. Błędy walidacji (400 Bad Request)

**Sytuacja:** Dane formularza nie przeszły walidacji API

**Obsługa:**
- Parsowanie odpowiedzi JSON i wyświetlenie komunikatów przy polach formularza
- Użycie `setError` z React Hook Form do podpięcia błędów pod konkretne pola

**Implementacja:**
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  errorData.details?.forEach(({ field, message }) => {
    form.setError(field, { message });
  });
}
```

### 10.3. Błędy autoryzacji (401/403)

**Sytuacja:** Użytkownik nie jest zalogowany lub nie ma dostępu

**Obsługa:**
- Redirect do `/login` z parametrem `redirect` zawierającym aktualny URL
- Wyświetlenie Toast: "Sesja wygasła. Zaloguj się ponownie."

**Implementacja:**
```typescript
if (response.status === 401 || response.status === 403) {
  const currentPath = window.location.pathname;
  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
}
```

### 10.4. Błędy konfliktu (409 Conflict)

**Sytuacja:** 
- Scenariusz o podanej nazwie już istnieje
- Próba usunięcia scenariusza z potomkami

**Obsługa:**
- Wyświetlenie precyzyjnego komunikatu błędu pod polem `name` lub jako Toast
- Dla usuwania: wyświetlenie dialogu informacyjnego z sugestią usunięcia zależnych scenariuszy

**Implementacja:**
```typescript
if (response.status === 409) {
  const errorData = await response.json();
  if (errorData.code === 'NAME_CONFLICT') {
    form.setError('name', { message: 'Scenariusz o tej nazwie już istnieje' });
  } else if (errorData.code === 'HAS_DEPENDENTS') {
    toast({
      variant: 'destructive',
      title: 'Nie można usunąć scenariusza',
      description: 'Scenariusz ma scenariusze pochodne. Usuń najpierw scenariusze zależne.'
    });
  }
}
```

### 10.5. Błędy wewnętrzne serwera (500)

**Sytuacja:** Nieoczekiwany błąd serwera

**Obsługa:**
- Wyświetlenie Toast: "Wystąpił błąd serwera. Nasz zespół został powiadomiony."
- Logowanie pełnego błędu do systemu monitoringu (np. Sentry)

### 10.6. Błędy podczas ładowania listy

**Sytuacja:** Nie udało się pobrać listy scenariuszy

**Obsługa:**
- Wyświetlenie komunikatu w miejscu listy: "Nie udało się załadować scenariuszy"
- Przycisk "Spróbuj ponownie" wywołujący `fetchScenarios()`

**Implementacja:**
```typescript
{error && (
  <div className="flex flex-col items-center gap-4 py-8">
    <p className="text-destructive">Nie udało się załadować scenariuszy</p>
    <Button onClick={() => fetchScenarios()}>Spróbuj ponownie</Button>
  </div>
)}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików
1. Utworzyć strukturę katalogów:
   ```
   src/pages/scenarios/index.astro
   src/components/scenario/ScenarioListContainer.tsx
   src/components/scenario/ScenarioCard.tsx
   src/components/scenario/ScenarioGrid.tsx
   src/components/scenario/ScenarioListHeader.tsx
   src/components/scenario/CreateScenarioDialog.tsx
   src/components/scenario/CreateScenarioForm.tsx
   src/components/scenario/CreateFromImportForm.tsx
   src/components/scenario/DuplicateScenarioDialog.tsx
   src/components/scenario/DuplicateScenarioForm.tsx
   src/components/scenario/EmptyState.tsx
   src/components/hooks/useScenarios.ts
   ```

### Krok 2: Implementacja typów
1. Sprawdzić czy wszystkie wymagane typy są dostępne w `src/types.ts`
2. Dodać nowe ViewModels do `src/types.ts`:
   - `CreateScenarioDialogState`
   - `DuplicateScenarioDialogState`
   - `CreateScenarioFormData`
   - `DuplicateScenarioFormData`
   - `CreateFromImportFormData`
   - `ScenarioCardViewModel`
   - `ScenarioFilterStatus`
   - `ScenarioListFilters`

### Krok 3: Utworzenie schematu walidacji
1. Utworzyć plik `src/lib/validation/scenario.validation.ts`
2. Zdefiniować schemat Zod dla formularzy:
   - `createScenarioSchema`
   - `duplicateScenarioSchema`
   - `createFromImportSchema`

### Krok 4: Implementacja custom hooka useScenarios
1. Utworzyć `src/components/hooks/useScenarios.ts`
2. Zaimplementować funkcje:
   - `fetchScenarios`
   - `createScenario`
   - `duplicateScenario`
   - `lockScenario`
   - `deleteScenario`
3. Dodać obsługę błędów dla każdej funkcji

### Krok 5: Implementacja komponentów podstawowych (bottom-up)

**5.1. EmptyState**
- Zaimplementować komponent z ilustracją i przyciskami
- Dodać obsługę `onCreateClick`

**5.2. ScenarioCard**
- Zaimplementować layout karty z użyciem Shadcn/ui `Card`
- Dodać `Badge` dla statusu
- Zaimplementować `DropdownMenu` z akcjami (View, Duplicate, Lock, Delete)
- Dodać warunkowe wyświetlanie opcji Lock (tylko dla Draft)
- Dodać hover effects i animacje

**5.3. ScenarioGrid**
- Zaimplementować grid layout (Tailwind)
- Dodać renderowanie `ScenarioCard` dla każdego scenariusza
- Dodać skeleton placeholders podczas ładowania
- Obsłużyć stan pusty (delegacja do `EmptyState`)

**5.4. ScenarioListHeader**
- Zaimplementować tytuł i przyciski akcji
- Dodać filtry (Select dla statusu)
- Dodać pole wyszukiwania (Input z debounce)
- Przycisk "Nowy scenariusz" otwierający dialog

### Krok 6: Implementacja formularzy

**6.1. DuplicateScenarioForm**
- Najprostszy formularz - tylko pole name
- Integracja React Hook Form + Zod
- Przycisk submit z obsługą stanu loading

**6.2. CreateScenarioForm**
- Pola: name, dataset_code, start_date, end_date, base_scenario_id
- Integracja DatePicker dla dat
- Walidacja cross-field (end_date > start_date)
- Select dla base_scenario_id (opcjonalny)

**6.3. CreateFromImportForm**
- Select z listą importów
- Auto-fill dat i dataset_code po wyborze importu
- Pole name do edycji

### Krok 7: Implementacja dialogów

**7.1. DuplicateScenarioDialog**
- Integracja Shadcn/ui Dialog
- Osadzenie `DuplicateScenarioForm`
- Obsługa submit i wywołanie API
- Toast notifications
- Obsługa błędów

**7.2. CreateScenarioDialog**
- Integracja Shadcn/ui Dialog i Tabs
- Tab 1: Osadzenie `CreateScenarioForm`
- Tab 2: Osadzenie `CreateFromImportForm`
- Wspólna obsługa submit dla obu zakładek
- Toast notifications

### Krok 8: Implementacja głównego kontenera

**8.1. ScenarioListContainer**
- Zaimplementować zarządzanie stanem (useState)
- Zintegrować `useScenarios` hook
- Zaimplementować `useEffect` do initial fetch
- Obsługa filtrów i wyszukiwania (client-side)
- Zarządzanie otwarciem/zamknięciem dialogów
- Przekazanie callbacks do komponentów dzieci
- Obsługa nawigacji po kliknięciu karty
- Implementacja optimistic updates

### Krok 9: Utworzenie strony Astro

**9.1. src/pages/scenarios/index.astro**
- Layout z Header
- Sprawdzenie sesji użytkownika (middleware)
- Pobranie companyId z profilu użytkownika
- Opcjonalnie: server-side fetch listy scenariuszy (SSR)
- Hydratacja `ScenarioListContainer` z `client:load`
- Obsługa błędów autoryzacji (redirect do /login)

### Krok 10: Utworzenie endpointów API

**10.1. GET /api/companies/[companyId]/scenarios/index.ts**
- Implementacja listy scenariuszy
- Obsługa filtrów (status, search)
- Paginacja
- RLS verification

**10.2. POST /api/companies/[companyId]/scenarios/index.ts**
- Implementacja tworzenia scenariusza
- Walidacja Zod
- Tworzenie rekordu w bazie
- Zwrócenie CreateScenarioResponseDTO

**10.3. POST /api/companies/[companyId]/scenarios/[scenarioId]/duplicate.ts**
- Implementacja duplikacji
- Kopiowanie metadanych scenariusza
- Kopiowanie wszystkich override'ów
- Zwrócenie DuplicateScenarioResponseDTO z overrides_count

**10.4. POST /api/companies/[companyId]/scenarios/[scenarioId]/lock.ts**
- Implementacja blokowania
- Sprawdzenie czy status = Draft
- Aktualizacja statusu na Locked
- Ustawienie locked_at i locked_by

**10.5. DELETE /api/companies/[companyId]/scenarios/[scenarioId].ts**
- Implementacja soft delete
- Sprawdzenie czy scenariusz nie ma potomków
- Zwrócenie 409 jeśli ma potomków

### Krok 11: Testowanie i poprawki

**11.1. Testowanie ręczne przepływów**
- [ ] Utworzenie nowego pustego scenariusza
- [ ] Utworzenie scenariusza z importu
- [ ] Duplikacja scenariusza
- [ ] Blokowanie scenariusza Draft
- [ ] Próba usunięcia scenariusza z potomkami (błąd 409)
- [ ] Usunięcie scenariusza bez potomków
- [ ] Filtrowanie po statusie
- [ ] Wyszukiwanie po nazwie
- [ ] Nawigacja do szczegółów scenariusza

**11.2. Testowanie obsługi błędów**
- [ ] Tworzenie scenariusza z duplikatem nazwy
- [ ] Brak połączenia z API
- [ ] Walidacja dat (end_date < start_date)
- [ ] Puste wymagane pola

**11.3. Testowanie responsywności**
- [ ] Widok mobile (siatka 1 kolumna)
- [ ] Widok tablet (siatka 2 kolumny)
- [ ] Widok desktop (siatka 3 kolumny)
- [ ] Dialogi na małych ekranach

### Krok 12: Optymalizacja i finalizacja

**12.1. Performance**
- Sprawdzić czy wszystkie komponenty używają `React.memo` gdzie potrzeba
- Zoptymalizować re-renders (useCallback, useMemo)
- Dodać debounce do wyszukiwania (300ms)

**12.2. Accessibility**
- Sprawdzić nawigację klawiaturą
- Dodać odpowiednie aria-labels
- Sprawdzić kontrast kolorów
- Testować z czytnikiem ekranu

**12.3. UX polish**
- Dodać animacje (fade-in/out dla kart, slide dla dialogów)
- Loading states (szkielety, spinnery)
- Hover effects
- Focus states

**12.4. Dokumentacja**
- Dodać komentarze JSDoc do hooków
- Udokumentować propsy komponentów
- Utworzyć README w katalogu /scenarios z opisem struktury

### Krok 13: Code review i deployment
- Code review przed mergem
- Sprawdzenie zgodności z Copilot Instructions
- Deployment na środowisko staging
- Final QA testing
- Deployment na produkcję
