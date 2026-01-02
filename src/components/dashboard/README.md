# Dashboard Components

Komponenty widoku Dashboard dla aplikacji CashFlow Scenarios.

## Struktura

### Główne komponenty

#### `Dashboard.tsx` (React)
Główny kontener zarządzający stanem i logiką Dashboard:
- Integracja z custom hook `useDashboard`
- Obsługa custom events z kart scenariuszy
- Zarządzanie modalami (create, duplicate, confirm)
- Renderowanie filtrów, siatki scenariuszy i FAB

#### `ScenarioGridReact.tsx` (React)
Siatka kart scenariuszy z responsive layout:
- Grid responsywny (1/2/3 kolumny)
- Empty state gdy brak scenariuszy
- Renderowanie `ScenarioCardReact` dla każdego scenariusza

#### `ScenarioCardReact.tsx` (React)
Karta pojedynczego scenariusza:
- Link do szczegółów scenariusza
- Badge statusu (Draft/Locked)
- Informacje: dataset_code, data utworzenia, duplikacja
- Menu akcji (ScenarioCardActions)

### Komponenty interaktywne

#### `Filters.tsx` (React)
Filtry i sortowanie:
- Filtrowanie po statusie (Wszystkie/Robocze/Zablokowane)
- Sortowanie (Najnowsze/Najstarsze/Nazwa A-Z/Z-A)

#### `FloatingActionButton.tsx` (React)
Floating Action Button z menu:
- Nowy Import
- Nowy Scenariusz

#### `ScenarioCardActions.tsx` (React)
Menu akcji dla karty scenariusza:
- Edytuj
- Duplikuj
- Zablokuj (tylko dla Draft)
- Usuń
- Używa custom events do komunikacji

### Dialogi

#### `CreateScenarioDialog.tsx` (React)
Dialog tworzenia nowego scenariusza:
- Formularz z walidacją
- Pola: nazwa, dataset_code, daty

#### `DuplicateScenarioDialog.tsx` (React)
Dialog duplikacji scenariusza:
- Formularz z nazwą nowego scenariusza
- Domyślna nazwa: "{original} (kopia)"

#### `ConfirmDialog.tsx` (React)
Uniwersalny dialog potwierdzenia:
- Używany dla Lock i Delete
- Warianty: default/destructive

### Komponenty Astro (legacy)

#### `ScenarioGrid.astro`
Legacy komponent (obecnie nieużywany, zastąpiony przez ScenarioGridReact)

#### `ScenarioCard.astro`
Legacy komponent (obecnie nieużywany, zastąpiony przez ScenarioCardReact)

## Custom Hook

### `useDashboard.ts`
Hook zarządzający stanem Dashboard:
- Filtrowanie i sortowanie scenariuszy
- CRUD operations (create, duplicate, lock, delete)
- Zarządzanie modalami
- Optimistic updates

## Custom Events

Komunikacja między komponentami przez custom events:

```typescript
// Duplikacja scenariusza
window.dispatchEvent(new CustomEvent("scenario:duplicate", {
  detail: { scenario }
}));

// Blokowanie scenariusza
window.dispatchEvent(new CustomEvent("scenario:lock", {
  detail: { scenario }
}));

// Usuwanie scenariusza
window.dispatchEvent(new CustomEvent("scenario:delete", {
  detail: { scenario }
}));
```

## Użycie w Astro

```astro
---
import { Dashboard } from "@/components/dashboard";
import type { ScenarioListItemDTO } from "@/types";

const scenarios: ScenarioListItemDTO[] = await fetchScenarios();
const companyId = "...";
---

<Dashboard 
  client:load 
  initialScenarios={scenarios} 
  companyId={companyId} 
/>
```

## API Endpoints (wymagane)

Dashboard wymaga następujących endpointów API:

- `POST /api/companies/{companyId}/scenarios` - tworzenie scenariusza
- `POST /api/companies/{companyId}/scenarios/{scenarioId}/duplicate` - duplikacja
- `POST /api/companies/{companyId}/scenarios/{scenarioId}/lock` - blokowanie
- `DELETE /api/companies/{companyId}/scenarios/{scenarioId}` - usuwanie

## Typy

Wszystkie typy znajdują się w `src/types.ts`:
- `ScenarioListItemDTO`
- `CreateScenarioRequestDTO`
- `DuplicateScenarioRequestDTO`
- `LockScenarioResponseDTO`
- `FiltersState`
- `SortOption`
