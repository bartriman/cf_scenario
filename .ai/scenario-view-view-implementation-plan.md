## Plan implementacji widoku Scenario View

### 1. Przegląd
Widok Scenariusza (`Scenario View`) jest głównym obszarem roboczym aplikacji, przeznaczonym do interaktywnej analizy i modyfikacji scenariuszy przepływów pieniężnych. Umożliwia użytkownikom wizualizację tygodniowych agregatów finansowych na osi czasu, analizę wykresu salda bieżącego oraz symulowanie zmian poprzez przesuwanie transakcji między tygodniami i edycję ich szczegółów.

### 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką: `/scenarios/[scenarioId]`, gdzie `[scenarioId]` jest identyfikatorem wybranego scenariusza.

### 3. Struktura komponentów
Hierarchia komponentów dla widoku `Scenario View` przedstawia się następująco:

```
/src/pages/scenarios/[scenarioId].astro
└── ScenarioView (React Island)
    ├── RunningBalanceChart (React Island)
    ├── Timeline (React)
    │   ├── WeekCard (React)
    │   │   ├── TransactionCard (React)
    │   │   └── TransactionCard (React) [dla "Other"]
    │   └── ... (kolejne WeekCard)
    ├── EditTransactionModal (React)
    └── ExportDialog (React)
```

### 4. Szczegóły komponentów

#### ScenarioView (React Island)
- **Opis komponentu**: Główny kontener widoku, zarządzający stanem i orkiestrujący interakcje między komponentami podrzędnymi. Odpowiedzialny za pobieranie danych scenariusza, agregatów tygodniowych i salda bieżącego.
- **Główne elementy**: Kontener `div` dla całego widoku, zawierający komponenty `RunningBalanceChart` i `Timeline`. Renderuje także modale `EditTransactionModal` i `ExportDialog`.
- **Obsługiwane interakcje**:
  - Inicjalizacja pobierania danych po załadowaniu.
  - Otwarcie `EditTransactionModal` po otrzymaniu zdarzenia `onTransactionClick`.
  - Obsługa zdarzenia `onTransactionDrop` z `Timeline` w celu wywołania API.
- **Obsługiwana walidacja**: Brak bezpośredniej walidacji; przekazuje dane do komponentów podrzędnych.
- **Typy**: `Scenario`, `WeeklyAggregateVM`, `RunningBalancePoint`, `ScenarioTransaction`.
- **Propsy**: `scenarioId: string`.

#### Timeline (React)
- **Opis komponentu**: Interaktywna, horyzontalna oś czasu wyświetlająca tygodnie. Implementuje logikę "przeciągnij i upuść" dla transakcji przy użyciu `dnd-kit`.
- **Główne elementy**: Kontener `div` z przewijaniem horyzontalnym. Mapuje dane `weeklyAggregates` na komponenty `WeekCard`. Otacza karty kontekstem `DndContext`.
- **Obsługiwane interakcje**:
  - Przewijanie horyzontalne z przyciąganiem do tygodni (`scroll-snap`).
  - Przeciąganie komponentów `TransactionCard`.
- **Obsługiwana walidacja**: Sprawdza, czy upuszczenie transakcji nastąpiło w innej kolumnie (`WeekCard`), aby uniknąć zbędnych wywołań API.
- **Typy**: `WeeklyAggregateVM`, `TransactionVM`.
- **Propsy**:
  - `weeklyAggregates: WeeklyAggregateVM[]`
  - `onTransactionDrop: (flowId: string, newWeekStartDate: string) => void`
  - `onTransactionClick: (transaction: TransactionVM) => void`

#### WeekCard (React)
- **Opis komponentu**: Reprezentuje pojedynczą kolumnę tygodnia na osi czasu. Wyświetla podsumowanie (wpływy/wypływy) oraz listy transakcji Top 5 i "Inne".
- **Główne elementy**: Nagłówek z datą tygodnia, dwie sekcje (wpływy i wypływy), każda zawierająca listę komponentów `TransactionCard`. Definiuje obszar upuszczania (`droppable`) dla `dnd-kit`.
- **Obsługiwane interakcje**: Służy jako cel dla upuszczanych transakcji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `WeeklyAggregateVM`, `TransactionVM`.
- **Propsy**:
  - `week: WeeklyAggregateVM`
  - `onTransactionClick: (transaction: TransactionVM) => void`

#### TransactionCard (React)
- **Opis komponentu**: Karta reprezentująca pojedynczą transakcję lub zagregowaną grupę "Inne". Jest elementem przeciąganym (`draggable`).
- **Główne elementy**: `div` z informacjami o transakcji (kontrahent, kwota). Klikalny, jeśli nie jest to grupa "Inne".
- **Obsługiwane interakcje**:
  - Kliknięcie w celu edycji (dla transakcji, nie dla "Inne").
  - Rozpoczęcie przeciągania.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `TransactionVM`.
- **Propsy**:
  - `transaction: TransactionVM`
  - `onClick: (transaction: TransactionVM) => void`

#### RunningBalanceChart (React Island)
- **Opis komponentu**: Wykres liniowy przedstawiający saldo bieżące w czasie. Zbudowany przy użyciu `Recharts`.
- **Główne elementy**: Komponent `LineChart` z `Recharts` z odpowiednio skonfigurowanymi osiami (`XAxis`, `YAxis`), linią (`Line`) i podpowiedziami (`Tooltip`).
- **Obsługiwane interakcje**: Wyświetlanie `Tooltip` z danymi po najechaniu na punkt danych.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `RunningBalancePoint`.
- **Propsy**: `data: RunningBalancePoint[]`, `baseCurrency: string`.

#### EditTransactionModal (React)
- **Opis komponentu**: Modal do edycji daty i kwoty transakcji.
- **Główne elementy**: Formularz z polami `input[type=date]` i `input[type=number]`. Przyciski "Zapisz" i "Anuluj".
- **Obsługiwane interakcje**:
  - Wprowadzanie danych w polach formularza.
  - Przesłanie formularza w celu zapisu zmian.
- **Obsługiwana walidacja**:
  - `new_date_due`: Musi być prawidłową datą.
  - `new_amount_book_cents`: Musi być liczbą całkowitą.
  - Co najmniej jedno z pól musi być wypełnione.
- **Typy**: `TransactionVM`, `ScenarioOverridePutBody`.
- **Propsy**:
  - `isOpen: boolean`
  - `transaction: TransactionVM | null`
  - `onSave: (flowId: string, data: ScenarioOverridePutBody) => void`
  - `onClose: () => void`

### 5. Typy
Do implementacji widoku wymagane będą następujące nowe typy ViewModel, które transformują dane z API na potrzeby UI:

```typescript
// Plik: src/types.ts lub dedykowany plik dla widoku scenariusza

// Reprezentuje pojedynczą transakcję na karcie (Top5 lub "Other")
export interface TransactionVM {
  id: string; // flow_id lub syntetyczny ID dla "Other"
  type: 'transaction' | 'other';
  direction: 'INFLOW' | 'OUTFLOW';
  amount_book_cents: number;
  counterparty: string | null; // null dla "Other"
  description: string; // "Other" dla grupy
  date_due: string;
}

// Reprezentuje pojedynczy tydzień w komponencie Timeline
export interface WeeklyAggregateVM {
  week_index: number;
  week_label: string;
  week_start_date: string | null;
  inflow_total_book_cents: number;
  outflow_total_book_cents: number;
  transactions: TransactionVM[]; // Połączone wpływy i wypływy
}

// Reprezentuje punkt danych na wykresie RunningBalanceChart
export interface RunningBalancePoint {
  date: string; // as_of_date
  balance: number; // running_balance_book_cents / 100
}
```

### 6. Zarządzanie stanem
Zarządzanie stanem zostanie zaimplementowane w głównym komponencie `ScenarioView` przy użyciu hooków React. Wskazane jest stworzenie customowego hooka `useScenarioData`, aby hermetyzować logikę pobierania danych, obsługi ładowania, błędów oraz aktualizacji.

**Custom Hook: `useScenarioData(scenarioId: string)`**
- **Cel**: Zarządzanie całym cyklem życia danych dla widoku scenariusza.
- **Zarządzane stany**:
  - `scenario: Scenario | null`
  - `weeklyAggregates: WeeklyAggregateVM[]`
  - `runningBalance: RunningBalancePoint[]`
  - `isLoading: boolean`
  - `error: Error | null`
- **Funkcje udostępniane**:
  - `refetch()`: Funkcja do ponownego pobrania wszystkich danych.
  - `updateTransaction(overrideData)`: Funkcja do wywołania API (PUT lub POST) i optymistycznej aktualizacji UI, a następnie odświeżenia danych.

### 7. Integracja API
Integracja z API będzie realizowana poprzez wywołania `fetch` do odpowiednich endpointów z poziomu hooka `useScenarioData`.

1.  **Pobieranie danych inicjalnych (równolegle)**:
    - `GET /api/companies/{companyId}/scenarios/{scenarioId}`
      - Pobiera szczegóły scenariusza.
    - `GET /api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates`
      - **Odpowiedź**: `WeeklyAggregatesResponse`. Dane zostaną zmapowane na `WeeklyAggregateVM[]`.
    - `GET /api/companies/{companyId}/scenarios/{scenarioId}/running-balance`
      - **Odpowiedź**: `RunningBalanceResponse`. Dane zostaną zmapowane na `RunningBalancePoint[]`.

2.  **Aktualizacja transakcji (Drag & Drop)**:
    - `POST /api/companies/{companyId}/scenarios/{scenarioId}/overrides/batch`
      - **Żądanie**: `BatchUpdateOverridesBody` z jednym elementem w tablicy `overrides`.
      - **Logika**: Wywoływane po upuszczeniu transakcji. UI zostanie zaktualizowane optymistycznie, a następnie wszystkie dane zostaną odświeżone.

3.  **Edycja transakcji (Modal)**:
    - `PUT /api/companies/{companyId}/scenarios/{scenarioId}/overrides/{flowId}`
      - **Żądanie**: `ScenarioOverridePutBody`.
      - **Logika**: Wywoływane po zapisaniu zmian w modalu. UI zostanie zaktualizowane optymistycznie, a następnie dane zostaną odświeżone.

### 8. Interakcje użytkownika
- **Przeciągnięcie i upuszczenie transakcji**:
  - Użytkownik chwyta `TransactionCard`.
  - UI pokazuje wizualny wskaźnik przeciągania.
  - Użytkownik upuszcza kartę na inny `WeekCard`.
  - Wywoływana jest akcja `onTransactionDrop`.
  - UI jest aktualizowane optymistycznie (transakcja pojawia się w nowym miejscu).
  - Wysyłane jest żądanie `POST .../overrides/batch`.
  - Po odpowiedzi API, dane są odświeżane w celu uzyskania spójności.
- **Kliknięcie transakcji**:
  - Użytkownik klika `TransactionCard` (która nie jest typu "Other").
  - Wywoływana jest akcja `onTransactionClick`.
  - Otwiera się `EditTransactionModal` z danymi klikniętej transakcji.
- **Edycja w modalu**:
  - Użytkownik zmienia datę lub kwotę i klika "Zapisz".
  - Wywoływana jest akcja `onSave`.
  - Wysyłane jest żądanie `PUT .../overrides/{flowId}`.
  - Modal się zamyka, a UI jest aktualizowane (optymistycznie + odświeżenie).

### 9. Warunki i walidacja
- **Przeciąganie i upuszczanie**:
  - **Warunek**: Przeciągać można tylko `TransactionCard`, które nie są typu "Other".
  - **Walidacja**: Akcja zapisu (`onTransactionDrop`) jest wywoływana tylko wtedy, gdy `flow_id` istnieje i transakcja została upuszczona w innej kolumnie tygodnia.
- **Edycja transakcji**:
  - **Warunek**: Scenariusz nie może mieć statusu `Locked`. Przycisk edycji i możliwość przeciągania powinny być zablokowane, jeśli scenariusz jest zablokowany.
  - **Walidacja (w `EditTransactionModal`)**:
    - `new_date_due` i `new_amount_book_cents` nie mogą być jednocześnie puste.
    - `new_amount_book_cents` musi być liczbą całkowitą.
    - Przycisk "Zapisz" jest nieaktywny, dopóki formularz nie jest poprawny i zmieniony.

### 10. Obsługa błędów
- **Błędy sieciowe / API**:
  - W przypadku niepowodzenia pobierania danych, `useScenarioData` ustawi stan `error`. Komponent `ScenarioView` wyświetli komunikat o błędzie z przyciskiem "Spróbuj ponownie", który wywoła `refetch()`.
  - W przypadku niepowodzenia operacji zapisu (PUT/POST), optymistyczna aktualizacja zostanie cofnięta, a użytkownikowi zostanie wyświetlony komunikat `toast` informujący o niepowodzeniu (np. "Nie udało się zaktualizować transakcji. Scenariusz może być zablokowany.").
- **Brak danych**:
  - Jeśli API zwróci puste listy dla agregatów lub salda, widok powinien wyświetlić odpowiedni komunikat (np. "Brak danych do wyświetlenia dla tego scenariusza.").
- **Scenariusz nie znaleziony (404)**:
  - Strona `/scenarios/[scenarioId].astro` powinna obsłużyć błąd 404 z API i zwrócić odpowiednią stronę błędu Astro.

### 11. Kroki implementacji
1.  **Struktura plików**: Utwórz plik strony `src/pages/scenarios/[scenarioId].astro` oraz pliki dla komponentów React: `src/components/scenario/ScenarioView.tsx`, `Timeline.tsx`, `WeekCard.tsx`, `TransactionCard.tsx`, `RunningBalanceChart.tsx`, `EditTransactionModal.tsx`.
2.  **Strona Astro**: W `[scenarioId].astro` pobierz `scenarioId` z parametrów URL i przekaż go jako prop do komponentu-wyspy `<ScenarioView client:load />`.
3.  **Typy i Hook**: Zdefiniuj typy `ViewModel` (`TransactionVM`, `WeeklyAggregateVM`, `RunningBalancePoint`). Zaimplementuj customowy hook `useScenarioData` z logiką pobierania danych (początkowo bez logiki zapisu).
4.  **Komponent `ScenarioView`**: Zbuduj główny layout komponentu. Użyj hooka `useScenarioData` do pobrania danych i obsługi stanów ładowania/błędu.
5.  **Komponenty `Timeline` i `WeekCard`**: Zaimplementuj statyczne renderowanie osi czasu na podstawie danych z `weeklyAggregates`. Dodaj style dla horyzontalnego przewijania i przyciągania.
6.  **Komponent `TransactionCard`**: Stwórz wygląd karty transakcji.
7.  **Implementacja Drag & Drop**: Zintegruj `dnd-kit` w komponencie `Timeline`, owijając go w `DndContext`. Użyj `useDraggable` w `TransactionCard` i `useDroppable` w `WeekCard`. Zaimplementuj logikę `onDragEnd` do wyzwalania aktualizacji.
8.  **Wykres `RunningBalanceChart`**: Zintegruj `Recharts`, przekaż dane `runningBalance` i skonfiguruj wygląd wykresu.
9.  **Modal `EditTransactionModal`**: Zbuduj formularz edycji i jego logikę walidacji.
10. **Integracja akcji zapisu**: Rozbuduj `useScenarioData` o funkcje do obsługi `PUT` i `POST` (batch update). Podłącz te funkcje do `onTransactionDrop` w `Timeline` i `onSave` w `EditTransactionModal`. Zaimplementuj logikę optymistycznych aktualizacji.
11. **Obsługa uprawnień**: Dodaj logikę blokującą edycję (ukrywanie przycisków, wyłączanie D&D) na podstawie pola `status` obiektu `scenario`.
12. **Dostępność (a11y)**: Dodaj atrybuty ARIA, zapewnij obsługę D&D z klawiatury zgodnie z zaleceniami `dnd-kit`.
13. **Testowanie i refaktoryzacja**: Przetestuj wszystkie interakcje, przypadki brzegowe i obsługę błędów. Dokonaj refaktoryzacji kodu w celu poprawy czytelności i wydajności.
