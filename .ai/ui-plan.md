# Architektura UI dla CashFlow Scenarios MVP

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji CashFlow Scenarios MVP została zaprojektowana w oparciu o filozofię "server-first" z wykorzystaniem Astro 5. Statyczne layouty, strony i treści są renderowane po stronie serwera, co zapewnia maksymalną wydajność. Interaktywność jest dodawana w sposób selektywny za pomocą "wysp" (islands) React 19, które są ładowane tylko tam, gdzie jest to konieczne (np. w widoku osi czasu, na wykresach, w kreatorze importu).

Struktura opiera się na kilku kluczowych widokach:
- **Dashboard**: Punkt startowy, prezentujący listę scenariuszy.
- **Import**: Wielokrokowy kreator do importowania danych z plików CSV.
- **Widok Scenariusza**: Główne środowisko pracy do analizy i modyfikacji prognoz, składające się z interaktywnej osi czasu i zsynchronizowanego wykresu salda bieżącego.

Nawigacja jest prosta i skupiona na zadaniach, z wyraźnym podziałem na główne sekcje. Do zarządzania stanem globalnym (np. dane zalogowanego użytkownika) wykorzystywane będą Nano Stores, natomiast stan lokalny komponentów będzie zarządzany przez hooki React. Styling oparty jest na Tailwind CSS 4 i predefiniowanych komponentach z biblioteki Shadcn/ui, co gwarantuje spójność wizualną i przyspiesza rozwój.

## 2. Lista widoków

### Widok 1: Logowanie
- **Nazwa widoku**: Login
- **Ścieżka widoku**: `/login`
- **Główny cel**: Uwierzytelnienie użytkownika za pomocą Supabase Auth.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty widoku**:
    - `LoginForm` (React Island): Interaktywny formularz z walidacją po stronie klienta.
    - `Button` (Shadcn/ui): Przycisk do przesłania formularza.
    - `Input` (Shadcn/ui): Pola do wprowadzania danych.
- **UX, dostępność i względy bezpieczeństwa**:
    - **UX**: Jasne komunikaty o błędach (np. "Nieprawidłowe hasło"). Automatyczne przekierowanie do Dashboardu po pomyślnym logowaniu.
    - **Dostępność**: Poprawne etykiety (`<label>`) dla pól formularza, obsługa nawigacji klawiaturą, wyraźny stan `:focus-visible`.
    - **Bezpieczeństwo**: Komunikacja z API przez HTTPS. Token JWT jest bezpiecznie przechowywany (preferowana opcja `httpOnly cookie`).

### Widok 2: Dashboard
- **Nazwa widoku**: Dashboard
- **Ścieżka widoku**: `/`
- **Główny cel**: Wyświetlenie listy wszystkich scenariuszy (roboczych i zablokowanych), umożliwienie szybkiego dostępu do głównych akcji.
- **Kluczowe informacje do wyświetlenia**: Siatka kart scenariuszy, każda zawierająca: nazwę, status, kod zestawu danych, autora i datę utworzenia.
- **Kluczowe komponenty widoku**:
    - `ScenarioCard` (Astro): Statyczny komponent prezentujący dane pojedynczego scenariusza.
    - `ScenarioGrid` (Astro): Siatka wyświetlająca `ScenarioCard`.
    - `FloatingActionButton` (React Island): Przycisk "pływający" z opcjami "Nowy Import" i "Nowy Scenariusz".
    - `DropdownMenu` (Shadcn/ui): Menu akcji (Edytuj, Duplikuj, Usuń, Zablokuj) na każdej karcie.
    - `Filters` (React Island): Kontrolki do filtrowania (po statusie) i sortowania listy scenariuszy.
- **UX, dostępność i względy bezpieczeństwa**:
    - **UX**: Czytelny układ siatki, szybkie filtrowanie bez przeładowania strony, intuicyjne menu akcji. Kliknięcie karty przenosi bezpośrednio do widoku scenariusza.
    - **Dostępność**: Karty scenariuszy są linkami (`<a>`), co ułatwia nawigację. Menu akcji jest w pełni dostępne z klawiatury.
    - **Bezpieczeństwo**: Wszystkie akcje modyfikujące dane (usuwanie, blokowanie) wymagają potwierdzenia od użytkownika. API Supabase zapewnia, że użytkownik widzi tylko scenariusze należące do jego organizacji (RLS).

### Widok 3: Import CSV
- **Nazwa widoku**: Import Wizard
- **Ścieżka widoku**: `/import`
- **Główny cel**: Przeprowadzenie użytkownika krok po kroku przez proces importu danych z pliku CSV, walidacji i tworzenia bazowego scenariusza.
- **Kluczowe informacje do wyświetlenia**: Postęp w kreatorze, strefa do upuszczenia pliku, tabela z błędami walidacji, status przetwarzania.
- **Kluczowe komponenty widoku**:
    - `ImportWizard` (React Island): Główny komponent zarządzający logiką kroków.
    - `FileUploadZone` (React): Komponent do przesyłania plików metodą "przeciągnij i upuść".
    - `ValidationErrorTable` (React): Tabela prezentująca błędne wiersze z importowanego pliku wraz z opisem błędu.
    - `ProgressBar` (Shadcn/ui): Wskaźnik postępu dla poszczególnych kroków.
- **UX, dostępność i względy bezpieczeństwa**:
    - **UX**: Jasno zdefiniowane kroki. W przypadku błędów import jest blokowany, a użytkownik otrzymuje szczegółowe informacje i możliwość pobrania raportu błędów. Automatyczne przekierowanie do scenariusza po pomyślnym imporcie.
    - **Dostępność**: Obsługa przesyłania plików za pomocą klawiatury. Tabela błędów ma odpowiednią strukturę (`<thead>`, `<tbody>`) dla czytników ekranu.
    - **Bezpieczeństwo**: Walidacja typu (`.csv`) i rozmiaru pliku po stronie klienta i serwera.

### Widok 4: Widok Scenariusza
- **Nazwa widoku**: Scenario View
- **Ścieżka widoku**: `/scenarios/[scenarioId]`
- **Główny cel**: Główny obszar roboczy do analizy i modyfikacji scenariusza przepływów pieniężnych.
- **Kluczowe informacje do wyświetlenia**: Horyzontalna oś czasu z tygodniowymi agregatami (Top 5 wpływów/wypływów), wykres salda bieżącego (Running Balance).
- **Kluczowe komponenty widoku**:
    - `Timeline` (React Island): Interaktywna oś czasu z możliwością przewijania i przeciągania transakcji między tygodniami. Zbudowana z użyciem `dnd-kit`.
    - `WeekCard` (React): Kolumna reprezentująca tydzień na osi czasu.
    - `TransactionCard` (React): Karta reprezentująca pojedynczą transakcję (lub grupę "Inne"), którą można przeciągać.
    - `RunningBalanceChart` (React Island): Wykres liniowy zsynchronizowany z osią czasu. Zbudowany z użyciem `Recharts` lub `visx`.
    - `EditTransactionModal` (React): Modal do edycji szczegółów transakcji.
    - `ExportDialog` (React): Modal do konfiguracji i generowania eksportu.
- **UX, dostępność i względy bezpieczeństwa**:
    - **UX**: Płynne przewijanie osi czasu z przyciąganiem do tygodni (`snap-to-week`). Natychmiastowa aktualizacja UI po przeciągnięciu transakcji (optimistic updates) z wizualnym wskaźnikiem przeliczania. Synchronizacja hovera między wykresem a osią czasu.
    - **Dostępność**: Zapewnienie alternatywnej obsługi "przeciągnij i upuść" za pomocą klawiatury (np. Enter, aby wybrać, strzałki, aby przenieść, Enter, aby upuścić). Etykiety ARIA dla interaktywnych elementów.
    - **Bezpieczeństwo**: Walidacja danych wejściowych w modalu edycji. Wszystkie operacje są autoryzowane przez API.

## 3. Mapa podróży użytkownika

Główny przepływ pracy użytkownika (happy path) wygląda następująco:

1.  **Logowanie**: Użytkownik wchodzi na stronę `/login`, podaje swoje dane i zostaje pomyślnie uwierzytelniony.
2.  **Przekierowanie do Dashboardu**: Po zalogowaniu system automatycznie przenosi użytkownika na stronę główną (`/`).
3.  **Inicjowanie importu**: Na Dashboardzie użytkownik klika przycisk "Nowy Import".
4.  **Przejście do kreatora importu**: Użytkownik zostaje przeniesiony do widoku `/import`.
5.  **Krok 1: Upload pliku**: Użytkownik przeciąga plik CSV na wyznaczone pole i podaje kod zestawu danych.
6.  **Krok 2: Walidacja**: System przetwarza plik. Zakładając brak błędów, kreator automatycznie przechodzi do następnego kroku.
7.  **Krok 3: Przetwarzanie**: System importuje dane i tworzy bazowy scenariusz.
8.  **Krok 4: Zakończenie i przekierowanie**: Po zakończeniu importu system wyświetla podsumowanie i automatycznie przekierowuje użytkownika do nowo utworzonego **Widoku Scenariusza** (`/scenarios/[newScenarioId]`).
9.  **Analiza w Widoku Scenariusza**: Użytkownik widzi oś czasu z danymi z importu oraz wykres salda. Może przewijać oś czasu, aby analizować przepływy w poszczególnych tygodniach.
10. **Modyfikacja scenariusza**: Użytkownik identyfikuje transakcję, którą chce przenieść. Chwyta `TransactionCard` i przeciąga ją do innej `WeekCard`.
11. **Aktualizacja UI i danych**: Interfejs natychmiast odzwierciedla zmianę (optimistic update). W tle wysyłane jest żądanie do API w celu zapisania zmiany i przeliczenia agregatów. Zmienione tygodnie pokazują subtelny wskaźnik ładowania.
12. **Eksport wyników**: Po zakończeniu analizy użytkownik klika przycisk "Eksportuj", konfiguruje opcje w `ExportDialog` i pobiera plik XLSX ze swoją prognozą.

## 4. Układ i struktura nawigacji

Nawigacja jest zaprojektowana tak, aby była prosta i skoncentrowana na zadaniach.

- **Główna nawigacja**: Umieszczona w nagłówku aplikacji, składa się z trzech głównych linków/przycisków:
    - **Dashboard**: Link do strony głównej (`/`).
    - **Import**: Link do kreatora importu (`/import`).
    - **Scenarios**: Link do listy scenariuszy (tożsamy z Dashboardem).
    Na urządzeniach mobilnych nawigacja zwija się do menu hamburgerowego.

- **Nawigacja kontekstowa**:
    - **Karty scenariuszy**: Na Dashboardzie każda karta jest linkiem prowadzącym bezpośrednio do `Widoku Scenariusza`.
    - **Pływający przycisk akcji (FAB)**: Dostępny na Dashboardzie, oferuje skróty do "Nowego Importu" i "Nowego Scenariusza".
    - **Kontrolki w Widoku Scenariusza**: Przyciski takie jak "Jump to date" czy "Export" pozwalają na nawigację i akcje w obrębie bieżącego kontekstu (scenariusza).

- **Struktura URL**:
    - `/login`: Strona logowania.
    - `/`: Dashboard (lista scenariuszy).
    - `/import`: Kreator importu CSV.
    - `/scenarios/[scenarioId]`: Widok szczegółowy danego scenariusza.

Taka struktura zapewnia, że użytkownicy mogą łatwo poruszać się między głównymi sekcjami aplikacji, a jednocześnie mają szybki dostęp do kluczowych akcji z poziomu każdego widoku.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika.

- **`Button` (Shadcn/ui)**: Standardowy przycisk używany do wszystkich akcji (zapisywanie, anulowanie, przesyłanie formularzy). Dostępny w różnych wariantach (główny, drugorzędny, destrukcyjny).
- **`Input` (Shadcn/ui)**: Standardowe pole tekstowe używane w formularzach (logowanie, edycja).
- **`Card` (Shadcn/ui)**: Podstawowy kontener z obramowaniem i cieniem, używany do budowy `ScenarioCard` i `WeekCard`.
- **`DropdownMenu` (Shadcn/ui)**: Komponent do tworzenia menu kontekstowych (np. menu akcji na karcie scenariusza). W pełni dostępny z klawiatury.
- **`Dialog` / `Modal` (Shadcn/ui)**: Komponent do wyświetlania treści w oknie modalnym, używany dla `EditTransactionModal` i `ExportDialog`. Blokuje interakcję z tłem.
- **`Badge` (Shadcn/ui)**: Mały element do wyświetlania statusów (np. "Draft", "Locked") lub etykiet.
- **`Skeleton` (Shadcn/ui)**: Komponent do wyświetlania "szkieletu" interfejsu podczas ładowania danych, zapewniający lepsze wrażenia użytkownika (np. w `Timeline` i `RunningBalanceChart` podczas initial load).
- **`Toast` (Shadcn/ui)**: Komponent do wyświetlania krótkich, nietrwałych powiadomień (np. "Zmiany zapisane", "Błąd API", "Przeliczanie...").
- **`DatePicker` (Shadcn/ui)**: Komponent do wyboru daty, używany w modalu edycji transakcji oraz w kontrolce "Jump to date".
