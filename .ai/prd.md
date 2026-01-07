# Dokument wymagań produktu (PRD) - CashFlow Scenarios MVP

## 1. Przegląd produktu
CashFlow Scenarios MVP to narzędzie webowe przeznaczone do zarządzania i prognozowania przepływów pieniężnych (cash flow) w oparciu o dane importowane z plików CSV. System umożliwia użytkownikom wizualizację przychodów i wydatków w ujęciu tygodniowym, tworzenie alternatywnych scenariuszy poprzez przesuwanie płatności w czasie (drag & drop) oraz analizę wpływu tych zmian na saldo końcowe i saldo narastające. Aplikacja obsługuje wiele walut z przeliczaniem w czasie rzeczywistym na walutę bazową. Projekt skupia się na interaktywności oraz prostocie obsługi dla pojedynczego użytkownika, z wykorzystaniem nowoczesnego stosu technologicznego (Astro, React, Supabase).

## 2. Problem użytkownika
Zarządzanie płynnością finansową w firmach często opiera się na statycznych arkuszach kalkulacyjnych (Excel), które są podatne na błędy i trudne w utrzymaniu przy dużej liczbie transakcji.
- Użytkownicy mają trudność z szybką symulacją scenariuszy "co by było, gdyby" (np. co się stanie z saldem, jeśli przesunę tę dużą płatność o tydzień?).
- Brak czytelnej wizualizacji tygodniowych przepływów z wyróżnieniem najważniejszych transakcji (Top-5).
- Trudność w zarządzaniu transakcjami wielowalutowymi i ich wpływem na saldo w walucie bazowej.
- Ryzyko utraty spójności danych przy ręcznym kopiowaniu i modyfikowaniu zestawów danych dla różnych scenariuszy.

## 3. Wymagania funkcjonalne

### 3.1. Uwierzytelnianie i Bezpieczeństwo
- Logowanie użytkownika za pomocą Supabase Auth.
- Row Level Security (RLS) zapewniające dostęp tylko do własnych danych (mimo założenia single-user w MVP, architektura musi być gotowa na multi-tenancy).
- Ekran główny aplikacji (landing page) to widok tygodniowy Top-5 z danymi mock-up dostępny dla wszystkich użytkowników.
- Niezalogowany użytkownik ma pełny dostęp do interakcji Drag & Drop na danych demonstracyjnych, ale nie może zapisywać zmian do bazy.
- Na ekranie głównym widoczne są przyciski umożliwiające zalogowanie się lub rejestrację nowego użytkownika.

### 3.2. Zarządzanie Danymi (Import)
- Import transakcji z plików CSV (inflow/outflow).
- Obsługa dużych plików (do 50k wierszy) poprzez przetwarzanie wsadowe (batch insert) i Edge Functions.
- Mapowanie kolumn CSV: firma, data płatności, kwota, waluta, kierunek, projekt, nr dokumentu, kontrahent, opis, żródło płatności.
- Walidacja danych wejściowych.

### 3.3. Zarządzanie Scenariuszami
- Tworzenie scenariusza bazowego z zaimportowanych danych.
- Tworzenie scenariuszy pochodnych (kopii logicznych).
- Mechanizm "Override": zapisywanie zmian (nowa data, nowa kwota) w oddzielnej tabeli `scenario_overrides` z duplikowaniem transakcji bazowych.
- Statusy scenariuszy: Draft (edycja możliwa), Locked (tylko odczyt).

### 3.4. Widok i Edycja (Interfejs)
- Ekran główny aplikacji (/) to widok tygodniowy Top-5 z danymi mock-up (demonstracyjnymi).
- Widok tygodniowy z agregacją danych.
- Wyświetlanie 5 największych transakcji (Top-5) oraz sumy pozostałych ("Other") dla wpływów i wypływów.
- Interakcja Drag & Drop: przesuwanie kafelków transakcji między dniami/tygodniami.
- Natychmiastowe przeliczanie agregatów po przesunięciu transakcji.
- Natychmistowe przeliczenie i wyświetlenie wykresu z saldem narastająco.
- Przyciski nawigacyjne w interfejsie:
  - "Zaloguj się" - widoczny w prawym górnym rogu, przekierowuje do formularza logowania
  - "Zarejestruj się" - widoczny w prawym górnym rogu, przekierowuje do formularza rejestracji
- Banner informacyjny dla niezalogowanych użytkowników: "Testujesz wersję demo. Zaloguj się lub zarejestruj, aby pracować na własnych danych."
- Zmiany wprowadzone w trybie demo są przechowywane w localStorage przeglądarki.
- Opcjonalny przycisk "Reset demo" przywracający dane mock-up do stanu początkowego.

### 3.5. Obsługa Walut (Multi-currency)
- Definiowanie waluty bazowej (np. EUR).
- Tabela kursów walut (FX Rates).
- Przeliczanie kwot transakcji na walutę bazową w locie (on-the-fly) na potrzeby widoków i wykresów.
- Precyzja: kwoty przechowywane jako INTEGER (centy), kursy jako NUMERIC(18,6).

### 3.6. Raportowanie i Eksport
- Wykres salda kroczącego (Running Balance) w czasie dla zablokowanych scenariuszy.
- Możliwość porównania wykresu scenariusza z bazowym.
- Eksport przetworzonego scenariusza (z uwzględnieniem przesunięć) oraz wykresu do pliku Excela.

## 4. Granice produktu
Poniższe funkcjonalności są świadomie wyłączone z zakresu MVP:
- Bezpośrednie integracje z bankami (API PSD2) lub systemami ERP.
- Obsługa płatności cyklicznych (automatyczne generowanie).
- Zaawansowane zarządzanie użytkownikami i rolami (tylko podstawowy single-user).
- Prognozowanie oparte na AI/ML.
- Rozbudowane dashboardy analityczne (poza wykresem salda i widokiem tygodniowym).
- Edycja danych historycznych (skupienie na prognozie future cash flow).

## 5. Historyjki użytkowników

### Demo i Onboarding
- ID: US-000
- Tytuł: Demo aplikacji dla niezalogowanych użytkowników
- Opis: Jako niezalogowany użytkownik chcę móc przetestować kluczowe funkcje aplikacji (widok tygodniowy + Drag & Drop) na danych przykładowych, aby ocenić wartość produktu przed rejestracją.
- Kryteria akceptacji:
  1. **Ekran główny jako demo:**
     - Ekranem głównym aplikacji (/) jest widok tygodniowy z danymi mock-up
     - Dane demonstracyjne zawierają przykładową firmę z około 3-4 tygodniami transakcji
     - Transakcje obejmują zróżnicowane kwoty, waluty i typy płatności
     
  2. **Pełna funkcjonalność Drag & Drop:**
     - Użytkownik może swobodnie przesuwać transakcje między dniami/tygodniami
     - System natychmiastowo przelicza agregaty tygodniowe po każdej zmianie
     - Wykres salda narastającego aktualizuje się w czasie rzeczywistym
     
  3. **Przechowywanie zmian lokalnie:**
     - Wszystkie zmiany są zapisywane w localStorage przeglądarki
     - Po odświeżeniu strony wprowadzone zmiany są zachowane
     - Dane nie są wysyłane do bazy danych (brak persystencji serwerowej)
     
  4. **Elementy nawigacyjne do rejestracji/logowania:**
     - W prawym górnym rogu ekranu widoczne są przyciski:
       - "Zaloguj się" - przekierowuje do /login
       - "Zarejestruj się" - przekierowuje do /register
     - Przyciski są wyraźnie widoczne i zawsze dostępne
     
  5. **Komunikacja z użytkownikiem:**
     - Banner/komunikat informuje: "Testujesz wersję demo. Zaloguj się lub zarejestruj, aby pracować na własnych danych."
     - Banner jest widoczny, ale nie zasłania kluczowych elementów interfejsu
     - Opcjonalnie: możliwość zamknięcia bannera (zostanie ponownie wyświetlony po odświeżeniu)
     
  6. **Reset danych demo:**
     - Przycisk "Reset demo" przywraca dane mock-up do stanu początkowego
     - Przed resetem system pyta o potwierdzenie
     - Po resecie wszystkie lokalne zmiany są usuwane
     
  7. **Ograniczenia funkcjonalne:**
     - Użytkownik NIE MOŻE zapisać zmian permanentnie bez logowania
     - Użytkownik NIE MOŻE importować własnych danych CSV
     - Użytkownik NIE MOŻE tworzyć nowych scenariuszy
     - Użytkownik NIE MOŻE eksportować danych do Excela
     - Próba dostępu do tych funkcji wyświetla komunikat: "Ta funkcja wymaga logowania. Zarejestruj się lub zaloguj."
     
  8. **Doświadczenie użytkownika:**
     - Interfejs demo jest identyczny z wersją dla zalogowanych użytkowników (minus niedostępne funkcje)
     - Wszystkie interakcje działają płynnie bez opóźnień
     - Użytkownik może spędzić dowolnie dużo czasu w trybie demo

### Uwierzytelnianie
- ID: US-001
- Tytuł: Uwierzytelnianie użytkownika (Rejestracja i Logowanie)
- Opis: Jako nowy użytkownik chcę móc zarejestrować się w systemie i bezpiecznie logować, aby mieć dostęp do moich danych finansowych.

#### Kryteria akceptacji - Rejestracja nowego użytkownika:
  1. **Dostęp do formularza rejestracji:**
     - Użytkownik może przejść do formularza rejestracji z poziomu strony logowania poprzez wyraźny link/przycisk "Zarejestruj się" lub "Stwórz konto".
     
  2. **Wymagane dane rejestracyjne:**
     - Email (pole tekstowe, walidacja formatu email)
     - Hasło (pole tekstowe typu password, minimalna długość 8 znaków)
     - Potwierdzenie hasła (pole tekstowe typu password, musi być identyczne z polem hasło)
     - Nazwa firmy (pole tekstowe, opcjonalne przy rejestracji - może być uzupełnione później)
     
  3. **Walidacja danych wejściowych:**
     - Email musi być w poprawnym formacie i unikalny w systemie
     - Hasło musi spełniać minimalne wymagania bezpieczeństwa (min. 8 znaków, zalecane: wielkie i małe litery, cyfry, znaki specjalne)
     - Potwierdzenie hasła musi być identyczne z hasłem
     - System wyświetla komunikaty błędów walidacji w czasie rzeczywistym (przy opuszczeniu pola) i przed wysłaniem formularza
     
  4. **Proces rejestracji:**
     - Po wypełnieniu formularza i kliknięciu "Zarejestruj" system tworzy konto użytkownika w Supabase Auth
     - System automatycznie tworzy profil użytkownika w tabeli `user_profiles`
     - System automatycznie tworzy domyślną firmę dla użytkownika w tabeli `companies` (jeśli nazwa firmy została podana)
     - System automatycznie powiązuje użytkownika z firmą w tabeli `company_members` z rolą "owner"
     
  5. **Weryfikacja email (opcjonalnie w MVP):**
     - System wysyła email weryfikacyjny na podany adres
     - Użytkownik musi kliknąć link weryfikacyjny przed pełnym dostępem do systemu
     - Alternatywnie: weryfikacja może być pominięta w MVP, ale architektura musi to umożliwiać
     
  6. **Obsługa błędów rejestracji:**
     - System wyświetla czytelne komunikaty w przypadku:
       - Email już istnieje w systemie (sugestia: "Użyj funkcji logowania lub odzyskiwania hasła")
       - Błąd połączenia z serwerem
       - Inne błędy techniczne
       
  7. **Przekierowanie po rejestracji:**
     - Po pomyślnej rejestracji użytkownik jest automatycznie logowany
     - Przekierowanie do strony głównej/dashboardu (jeśli firma została utworzona) lub do kreatora konfiguracji firmy
     
  8. **UI/UX formularza rejestracji:**
     - Formularz jest responsywny i działa poprawnie na urządzeniach mobilnych
     - Wyraźne wskazówki dotyczące wymagań dla każdego pola
     - Wskaźnik siły hasła (opcjonalnie)
     - Link powrotny do formularza logowania dla użytkowników, którzy już posiadają konto

#### Kryteria akceptacji - Logowanie:
  9. **Formularz logowania:**
     - Użytkownik widzi formularz logowania z polami: email i hasło
     
  10. **Proces logowania:**
      - Poprawne dane uwierzytelniające przekierowują do głównego dashboardu dla firmy, do której użytkownik jest przyporządkowany
      - Błędne dane wyświetlają komunikat o błędzie: "Nieprawidłowy email lub hasło"
      - System nie ujawnia, czy email istnieje w bazie (bezpieczeństwo)
      
  11. **Sesja użytkownika:**
      - Sesja użytkownika jest zachowana po odświeżeniu strony
      - Opcja "Zapamiętaj mnie" (opcjonalnie w MVP) przedłuża sesję
      
  12. **Odzyskiwanie hasła:**
      - Link "Nie pamiętam hasła" widoczny na formularzu logowania
      - Użytkownik podaje email, system wysyła link do resetowania hasła
      - Link resetujący jest ważny przez określony czas (np. 24h)
      - Po kliknięciu w link użytkownik może ustawić nowe hasło
      
  13. **Ograniczenia dostępu:**
      - Użytkownik bez logowania MOŻE korzystać z widoku Scenariusza wyłącznie z danymi mock-up (demo)
      - Użytkownik NIE MOŻE korzystać z żadnych innych funkcji (import, tworzenie scenariuszy, zapisywanie zmian) bez logowania się do systemu
      - System przekierowuje do strony logowania przy próbie dostępu do chronionych zasobów

#### Bezpieczeństwo i RLS:
  14. **Row Level Security:**
      - RLS jest aktywne dla wszystkich tabel zawierających dane użytkownika
      - Użytkownik ma dostęp tylko do danych firm, do których jest przypisany w `company_members`
      - Polityki RLS weryfikują `auth.uid()` przy każdym zapytaniu do bazy danych

### Import Danych
- ID: US-002
- Tytuł: Import transakcji z CSV
- Opis: Jako użytkownik chcę zaimportować plik CSV z historią i planem transakcji, aby zasilić system danymi.
- Kryteria akceptacji:
  1. Możliwość wyboru pliku CSV z dysku.
  2. Interfejs mapowania kolumn pliku na pola systemowe.
  3. System waliduje format danych (daty, kwoty).
  4. Po imporcie tworzony jest domyślny scenariusz bazowy.

- ID: US-003
- Tytuł: Obsługa błędów importu
- Opis: Jako użytkownik chcę otrzymać informację o błędach w pliku CSV, aby móc je poprawić.
- Kryteria akceptacji:
  1. System wskazuje wiersze, które nie przeszły walidacji.
  2. Import jest wstrzymany lub błędne wiersze są pomijane (zależnie od decyzji użytkownika/konfiguracji).

### Zarządzanie Scenariuszami
- ID: US-004
- Tytuł: Tworzenie nowego scenariusza
- Opis: Jako użytkownik chcę utworzyć nowy scenariusz na podstawie istniejącego, aby testować zmiany bez naruszania oryginału.
- Kryteria akceptacji:
  1. Opcja "Duplikuj scenariusz" lub "Utwórz scenariusz".
  2. Nowy scenariusz dziedziczy wszystkie transakcje i override'y scenariusza źródłowego.
  3. Nowy scenariusz ma status "Draft".

- ID: US-005
- Tytuł: Blokowanie scenariusza (Lock)
- Opis: Jako użytkownik chcę zatwierdzić scenariusz (status Lock), aby użyć go do finalnych analiz i wykresów.
- Kryteria akceptacji:
  1. Możliwość zmiany statusu z Draft na Locked.
  2. W statusie Locked edycja transakcji jest zablokowana.
  3. Tylko zablokowane scenariusze są dostępne w widoku wykresu salda (zgodnie z założeniami, choć podgląd draftu też może być przydatny - w MVP wymóg Lock dla wykresu).

### Widok i Edycja
- ID: US-006
- Tytuł: Widok tygodniowy Top-5
- Opis: Jako użytkownik chcę widzieć podsumowanie tygodniowe z wyróżnieniem 5 największych transakcji wpływów i 5 największych transakcji wypływów, aby skupić się na kluczowych przepływach.
- Kryteria akceptacji:
  1. Widok kalendarza/osi czasu podzielony na tygodnie.
  2. Dla każdego tygodnia lista 5 największych wpływów i 5 największych wypływów.
  3. Pozycja "Other" sumująca pozostałe transakcje.
  4. Kwoty przeliczone na walutę bazową.

- ID: US-007
- Tytuł: Przesuwanie transakcji (Drag & Drop)
- Opis: Jako użytkownik chcę przesuwać transakcje między dniami metodą przeciągnij i upuść, aby symulować opóźnienia lub przyspieszenia płatności.
- Kryteria akceptacji:
  1. Użytkownik może chwycić kafelek transakcji i upuścić go na inną datę.
  2. System wizualnie wskazuje miejsce upuszczenia.
  3. Po upuszczeniu data transakcji (date_due) jest aktualizowana w ramach override'u.
  4. Agregaty tygodniowe przeliczają się natychmiastowo.

- ID: US-008
- Tytuł: Edycja manualna transakcji
- Opis: Jako użytkownik chcę ręcznie zmienić kwotę lub datę transakcji w szczegółach, aby skorygować dane.
- Kryteria akceptacji:
  1. Kliknięcie w transakcję otwiera modal/panel edycji.
  2. Zmiana kwoty lub daty zapisuje się jako override.
  3. Historia zmian jest zachowana (oryginał vs nowa wartość).

### Waluty
- ID: US-009
- Tytuł: Zarządzanie kursami walut
- Opis: Jako użytkownik chcę, aby system przeliczał transakcje walutowe po zdefiniowanych kursach.
- Kryteria akceptacji:
  1. System przechowuje tabelę kursów walut.
  2. Transakcje w walucie innej niż bazowa są przeliczane w widokach.
  3. (Opcjonalnie w MVP) Możliwość ręcznej aktualizacji kursu dla danego dnia.

### Analiza i Eksport
- ID: US-010
- Tytuł: Wykres salda kroczącego
- Opis: Jako użytkownik chcę widzieć wykres salda w czasie dla wybranego scenariusza, aby ocenić płynność finansową.
- Kryteria akceptacji:
  1. Wykres liniowy prezentujący saldo dzień po dniu.
  2. Możliwość wyboru scenariusza do wyświetlenia.
  3. Oś X to czas, oś Y to kwota w walucie bazowej.

- ID: US-011
- Tytuł: Eksport scenariusza do Excela
- Opis: Jako użytkownik chcę wyeksportować zmodyfikowany scenariusz do pliku Excel, aby użyć danych w innych systemach.
- Kryteria akceptacji:
  1. Przycisk "Eksportuj" dostępny dla zablokowanych scenariuszy.
  2. Plik wynikowy zawiera tabelę z wypływami i wypływami wg ich typu (z pola opis) zsumowanych na tygodnie oraz wykres salda kroczącego.

## 6. Metryki sukcesu
- Responsywność UI: Czas reakcji na upuszczenie elementu (Drag & Drop) i przeliczenie widoku poniżej 200ms.
- Adopcja scenariuszy: Użytkownik tworzy średnio co najmniej 3 scenariusze na jeden zaimportowany zbiór danych.
- Użyteczność: Użytkownik jest w stanie wykonać pełną ścieżkę (Import -> Edycja -> Lock -> Wykres) bez pomocy zewnętrznej dokumentacji.
