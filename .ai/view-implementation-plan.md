# API Endpoint Implementation Plan: GET Weekly Aggregates

## 1. Przegląd punktu końcowego

**Endpoint:** `GET /api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates`

**Cel:** Zwrócenie tygodniowych agregacji dla konkretnego scenariusza z Top-5 transakcjami inflow/outflow dla każdego tygodnia. Endpoint ten służy do wizualizacji danych w interfejsie użytkownika, umożliwiając wyświetlenie podsumowania przepływów finansowych w podziale na tygodnie.

**Funkcjonalność:**
- Pobiera dane z widoku `weekly_aggregates_v` dla danego scenariusza
- Zwraca agregacje tygodniowe w walucie bazowej firmy
- Zawiera Top-5 największych transakcji (inflow i outflow) dla każdego tygodnia
- Oblicza sumę pozostałych transakcji jako "Other"
- Tydzień 0 (week_index = 0) reprezentuje Initial Balance (IB)

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
`/api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates`

### Parametry

#### Wymagane (Path Parameters):
- **companyId** (string, UUID): Identyfikator firmy, do której należy scenariusz
- **scenarioId** (number, integer, positive): Identyfikator scenariusza

#### Opcjonalne:
- Brak parametrów query dla tego endpointu w MVP

### Headers
- **Authorization**: `Bearer {access_token}` (wymagany) - JWT token z Supabase Auth
- **Content-Type**: nie dotyczy (GET request)

### Request Body
Brak (GET request)

### Przykład żądania
```
GET /api/companies/550e8400-e29b-41d4-a716-446655440000/scenarios/789/weekly-aggregates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

#### Response DTOs:
1. **WeeklyAggregatesResponseDTO** - główna struktura odpowiedzi
   - Lokalizacja: `src/types.ts` (już zdefiniowany)
   - Pola:
     - `scenario_id: number` - ID scenariusza
     - `base_currency: string` - waluta bazowa firmy (3-literowy kod ISO)
     - `weeks: WeekAggregateDTO[]` - tablica tygodniowych agregacji

2. **WeekAggregateDTO** - agregacja dla pojedynczego tygodnia
   - Lokalizacja: `src/types.ts` (już zdefiniowany)
   - Pola:
     - `week_index: number` - numer tygodnia (0 dla IB, 1+ dla rzeczywistych tygodni)
     - `week_label: string` - etykieta tygodnia (np. "Initial Balance", "W1 2025")
     - `week_start_date: string | null` - data rozpoczęcia tygodnia (ISO 8601), null dla IB
     - `inflow_total_book_cents: number` - suma wszystkich wpływów w centach
     - `outflow_total_book_cents: number` - suma wszystkich wypływów w centach
     - `inflow_top5: TopTransactionItemDTO[]` - Top-5 największych wpływów
     - `outflow_top5: TopTransactionItemDTO[]` - Top-5 największych wypływów
     - `inflow_other_book_cents: number` - suma pozostałych wpływów (poza Top-5)
     - `outflow_other_book_cents: number` - suma pozostałych wypływów (poza Top-5)

3. **TopTransactionItemDTO** - pojedyncza transakcja w Top-5
   - Lokalizacja: `src/types.ts` (już zdefiniowany)
   - Pola:
     - `flow_id: string` - unikalny identyfikator przepływu
     - `amount_book_cents: number` - kwota w walucie bazowej (centy)
     - `counterparty: string` - kontrahent
     - `description: string` - opis transakcji
     - `date_due: string` - data wymagalności (ISO 8601)

4. **ErrorResponseDTO** - odpowiedź błędu
   - Lokalizacja: `src/types.ts` (już zdefiniowany)
   - Struktura zgodna ze standardem API

### Validation Schemas (Zod)

Do utworzenia w `src/lib/validation/weekly-aggregates.validation.ts`:

```typescript
import { z } from 'zod';

export const GetWeeklyAggregatesParamsSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
  scenarioId: z.coerce.number().int().positive('Scenario ID must be a positive integer')
});

export type GetWeeklyAggregatesParams = z.infer<typeof GetWeeklyAggregatesParamsSchema>;
```

### Command Models

Dla tego endpointu (GET) **nie są wymagane Command Models**, ponieważ nie wykonujemy operacji modyfikujących dane.

### Database View Type

Wykorzystanie istniejącego typu z `src/types.ts`:
- **WeeklyAggregateRow** - typ z widoku `weekly_aggregates_v` generowany automatycznie przez Supabase

**Uwaga:** Należy upewnić się, że widok `weekly_aggregates_v` został dodany do `database.types.ts` poprzez regenerację typów Supabase:
```bash
npm run db:types
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Headers:**
- `Content-Type: application/json`

**Body Structure:**
```json
{
  "scenario_id": 790,
  "base_currency": "EUR",
  "weeks": [
    {
      "week_index": 0,
      "week_label": "Initial Balance",
      "week_start_date": null,
      "inflow_total_book_cents": 0,
      "outflow_total_book_cents": 0,
      "inflow_top5": [],
      "outflow_top5": [],
      "inflow_other_book_cents": 0,
      "outflow_other_book_cents": 0
    },
    {
      "week_index": 1,
      "week_label": "W1 2025",
      "week_start_date": "2025-01-06",
      "inflow_total_book_cents": 500000,
      "outflow_total_book_cents": 300000,
      "inflow_top5": [
        {
          "flow_id": "INV-2025-001",
          "amount_book_cents": 108500,
          "counterparty": "Client ABC",
          "description": "Payment for services",
          "date_due": "2025-01-08"
        }
      ],
      "outflow_top5": [
        {
          "flow_id": "BILL-2025-001",
          "amount_book_cents": 50000,
          "counterparty": "Supplier XYZ",
          "description": "Office supplies",
          "date_due": "2025-01-07"
        }
      ],
      "inflow_other_book_cents": 391500,
      "outflow_other_book_cents": 250000
    }
  ]
}
```

### Error Responses

#### 400 Bad Request
**Sytuacje:**
- Nieprawidłowy format UUID dla companyId
- Nieprawidłowa wartość scenarioId (nie jest liczbą lub jest ujemna)

**Body:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "companyId",
        "message": "Invalid company ID format"
      }
    ]
  }
}
```

#### 401 Unauthorized
**Sytuacje:**
- Brak tokenu JWT w nagłówku Authorization
- Token JWT jest nieprawidłowy lub wygasł

**Body:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
**Sytuacje:**
- Użytkownik nie jest członkiem firmy o podanym companyId
- Automatycznie obsługiwane przez RLS Supabase

**Body:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User not a member of company"
  }
}
```

#### 404 Not Found
**Sytuacje:**
- Scenariusz o podanym ID nie istnieje
- Scenariusz nie należy do podanej firmy
- Scenariusz jest soft-deleted (deleted_at IS NOT NULL)

**Body:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Scenario not found"
  }
}
```

#### 500 Internal Server Error
**Sytuacje:**
- Błąd połączenia z bazą danych
- Nieobsłużony wyjątek w kodzie aplikacji
- Błąd widoku bazy danych

**Body:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal error occurred"
  }
}
```

## 5. Przepływ danych

### Architektura warstw
```
Client Request
    ↓
Astro API Route (/src/pages/api/companies/[companyId]/scenarios/[scenarioId]/weekly-aggregates.ts)
    ↓
Middleware (Authentication & RLS Setup)
    ↓
Validation Layer (Zod schemas)
    ↓
Service Layer (/src/lib/services/scenario-analytics.service.ts)
    ↓
Supabase Client (with RLS)
    ↓
PostgreSQL View (weekly_aggregates_v)
    ↓
Response Transformation
    ↓
Client Response (JSON)
```

### Szczegółowy przepływ

#### 1. Request Handling (Astro API Route)
- Wyodrębnienie parametrów ścieżki: `companyId`, `scenarioId`
- Pobranie klienta Supabase z `context.locals.supabase`
- Wywołanie walidacji parametrów

#### 2. Authentication & Authorization (Middleware)
- Middleware Astro (`src/middleware/index.ts`) automatycznie:
  - Weryfikuje JWT token z nagłówka Authorization
  - Tworzy sesję użytkownika w Supabase
  - Ustawia kontekst użytkownika dla RLS
- RLS w PostgreSQL automatycznie filtruje dane według `company_members`

#### 3. Validation
- Walidacja parametrów ścieżki za pomocą Zod schema
- Zwrócenie 400 Bad Request przy błędach walidacji

#### 4. Service Layer Operations
- Wywołanie `getWeeklyAggregates(supabase, companyId, scenarioId)`
- Weryfikacja istnienia scenariusza i przynależności do firmy
- Zapytanie do widoku `weekly_aggregates_v` z filtrowaniem:
  - `company_id = companyId`
  - `scenario_id = scenarioId`
- Sortowanie wyników po `week_index ASC`

#### 5. Database View Query
Widok `weekly_aggregates_v` wykonuje:
- Join `scenario_transactions_v` z `scenarios`
- Grupowanie transakcji po tygodniach (obliczenie week_index)
- Ranking transakcji w każdym tygodniu (RANK() OVER ... ORDER BY amount DESC)
- Wyodrębnienie Top-5 dla każdego kierunku (inflow/outflow)
- Agregacja sum total i "other" dla każdego tygodnia
- Wszystko w walucie bazowej firmy (`base_currency`)

#### 6. Response Transformation
- Mapowanie wyników z widoku na DTO
- Parsowanie JSONB (top5 arrays) na właściwe typy TypeScript
- Pobranie `base_currency` z tabeli `companies`
- Konstrukcja `WeeklyAggregatesResponseDTO`

#### 7. Error Handling
- Obsługa błędów na każdym etapie
- Transformacja błędów do standardowego formatu `ErrorResponseDTO`
- Zwrócenie odpowiedniego kodu statusu HTTP

### Interakcje z zewnętrznymi systemami

#### Supabase PostgreSQL
- **Połączenie:** Przez Supabase Client z user context
- **Zabezpieczenie:** Row Level Security (RLS) aktywny
- **Timeout:** Domyślny timeout połączenia (konfigurowalne)
- **Connection Pooling:** Zarządzane automatycznie przez Supabase

#### Widok `weekly_aggregates_v`
- Zoptymalizowany widok z indeksami na:
  - `(company_id, scenario_id)`
  - `(company_id, scenario_id, week_index)`
- Używa CTE i window functions dla efektywności
- Zwraca pre-obliczone agregacje (nie wymaga dodatkowych obliczeń w aplikacji)

## 6. Względy bezpieczeństwa

### Authentication (Uwierzytelnianie)
- **Mechanizm:** JWT tokens z Supabase Auth
- **Weryfikacja:** Automatyczna przez middleware Astro
- **Token Lifetime:** 1 godzina (domyślnie, konfigurowalne w Supabase)
- **Refresh Strategy:** Automatyczne odświeżanie przez Supabase client
- **Headers:** `Authorization: Bearer {access_token}`

### Authorization (Autoryzacja)
- **Row Level Security (RLS):** Włączone na wszystkich tabelach
- **Membership Check:** Automatyczny filtr przez `company_members` table
  ```sql
  EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.company_id = <row>.company_id 
    AND cm.user_id = auth.uid()
  )
  ```
- **Scenario Access:** Tylko scenariusze należące do firm użytkownika
- **Soft Delete Filter:** Automatyczne wykluczenie scenariuszy z `deleted_at IS NOT NULL`

### Input Validation
- **Schema Validation:** Zod schemas dla wszystkich parametrów
- **UUID Validation:** Sprawdzenie formatu UUID dla companyId
- **Type Safety:** TypeScript strict mode
- **SQL Injection Prevention:** Parametryzowane zapytania przez Supabase client
- **XSS Prevention:** Automatyczne escapowanie przez Astro/React

### Data Protection
- **Principle of Least Privilege:** Użytkownik widzi tylko dane swoich firm
- **No Direct Table Access:** Dostęp tylko przez widoki z RLS
- **Company Isolation:** Pełna izolacja danych między firmami (multi-tenancy)
- **Read-Only Operations:** Endpoint GET nie modyfikuje danych
- **No PII Exposure:** Zwracane tylko niezbędne dane biznesowe

### Rate Limiting (zgodnie z API Plan)
- **Limit:** 100 requests per minute per user (ogólny API limit)
- **Response:** 429 Too Many Requests
- **Headers:** `Retry-After: {seconds}`
- **Implementation:** Middleware-based (do zaimplementowania w przyszłości)

### CORS
- **Allowed Origins:** Tylko produkcyjna domena i localhost:4321
- **Credentials:** Allowed (dla JWT cookies jeśli używane)
- **Methods:** GET (dla tego endpointu)

### Audit & Logging
- **Request Logging:** IP, user_id, timestamp, endpoint
- **Error Logging:** Stack traces tylko dla dev environment
- **No Sensitive Data:** Nie logować tokenów ani danych osobowych
- **Performance Metrics:** Query execution time tracking

## 7. Obsługa błędów

### Kategorie błędów i ich obsługa

#### 1. Validation Errors (400 Bad Request)

**Przyczyny:**
- Nieprawidłowy format UUID dla `companyId`
- `scenarioId` nie jest dodatnią liczbą całkowitą
- Brakujące parametry ścieżki

**Obsługa:**
```typescript
// W route handler
try {
  const params = GetWeeklyAggregatesParamsSchema.parse({
    companyId,
    scenarioId
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Logowanie:** Warning level, zawiera szczegóły błędów walidacji

#### 2. Authentication Errors (401 Unauthorized)

**Przyczyny:**
- Brak nagłówka Authorization
- Nieprawidłowy format tokenu
- Token wygasł
- Token został unieważniony

**Obsługa:**
```typescript
// W middleware
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Logowanie:** Info level, bez szczegółów tokenu

#### 3. Authorization Errors (403 Forbidden)

**Przyczyny:**
- Użytkownik nie jest członkiem firmy
- RLS zablokował dostęp do danych

**Obsługa:**
Automatyczna przez RLS - zapytanie zwróci puste wyniki.
Endpoint interpretuje brak danych jako 404 (scenariusz nie znaleziony).

**Alternatywnie** - explicit check:
```typescript
// W service
const { data: membership } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('company_id', companyId)
  .eq('user_id', user.id)
  .single();

if (!membership) {
  throw new Error('FORBIDDEN');
}
```

**Logowanie:** Warning level, zawiera user_id i company_id

#### 4. Not Found Errors (404 Not Found)

**Przyczyny:**
- Scenariusz nie istnieje
- Scenariusz należy do innej firmy
- Scenariusz jest soft-deleted

**Obsługa:**
```typescript
// W service
const { data, error } = await supabase
  .from('scenarios')
  .select('id, company_id')
  .eq('id', scenarioId)
  .eq('company_id', companyId)
  .is('deleted_at', null)
  .single();

if (error || !data) {
  throw new Error('NOT_FOUND');
}
```

**Odpowiedź:**
```typescript
return new Response(
  JSON.stringify({
    error: {
      code: 'NOT_FOUND',
      message: 'Scenario not found'
    }
  }),
  { status: 404, headers: { 'Content-Type': 'application/json' } }
);
```

**Logowanie:** Info level

#### 5. Database Errors (500 Internal Server Error)

**Przyczyny:**
- Błąd połączenia z bazą danych
- Timeout zapytania
- Błąd w widoku `weekly_aggregates_v`
- Constraint violations (nie powinny wystąpić dla GET)

**Obsługa:**
```typescript
try {
  const aggregates = await getWeeklyAggregates(supabase, companyId, scenarioId);
  // ...
} catch (error) {
  console.error('Database error:', error);
  
  return new Response(
    JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred'
      }
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Logowanie:** Error level, pełny stack trace w dev, bez szczegółów w production

#### 6. Unexpected Errors (500 Internal Server Error)

**Przyczyny:**
- Nieobsłużone wyjątki w kodzie
- Błędy transformacji danych
- Out of memory

**Obsługa:**
Global error handler w Astro route:
```typescript
export const GET: APIRoute = async (context) => {
  try {
    // ... main logic
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Logowanie:** Critical level, pełne szczegóły dla debugging

### Error Response Format

Wszystkie błędy zwracane w standardowym formacie `ErrorResponseDTO`:

```typescript
{
  error: {
    code: string;        // Stały kod błędu (VALIDATION_ERROR, NOT_FOUND, etc.)
    message: string;     // Czytelny komunikat dla użytkownika
    details?: Array<{    // Opcjonalne szczegóły (głównie dla VALIDATION_ERROR)
      field: string;
      message: string;
    }>;
  }
}
```

### Retry Strategy (Client Side)

Zalecana strategia retry dla clienta:
- **401 Unauthorized:** Nie retry, wymaga ponownego logowania
- **403 Forbidden:** Nie retry, problem z uprawnieniami
- **404 Not Found:** Nie retry, zasób nie istnieje
- **429 Too Many Requests:** Retry po czasie z `Retry-After` header
- **500 Internal Server Error:** Exponential backoff (max 3 próby)
- **503 Service Unavailable:** Exponential backoff (max 3 próby)

## 8. Wydajność

### Potencjalne wąskie gardła

#### 1. Database Query Performance
**Problem:** Widok `weekly_aggregates_v` może być kosztowny dla scenariuszy z dużą liczbą transakcji (>50k)

**Mitigacje:**
- Indeksy composite na `(company_id, scenario_id, week_index)`
- Wykorzystanie CTE (Common Table Expressions) w widoku dla optymalizacji
- EXPLAIN ANALYZE na produkcji dla monitorowania
- Potencjalnie: materialized view z refresh strategy

#### 2. Large Response Size
**Problem:** Scenariusze obejmujące wiele tygodni (>52) mogą generować duże odpowiedzi JSON

**Mitigacje:**
- Response compression (gzip) na poziomie serwera
- Opcjonalna pagination (w przyszłych wersjach)
- Limit maksymalnej liczby tygodni w widoku
- Client-side streaming dla bardzo dużych odpowiedzi

#### 3. N+1 Query Problem
**Problem:** Jeśli widok nie jest zoptymalizowany, mogą wystąpić wielokrotne podzapytania

**Mitigacje:**
- Widok używa window functions zamiast korelowanych podzapytań
- Single query do widoku zwraca wszystkie dane
- Brak dodatkowych zapytań dla company czy scenario metadata

#### 4. Memory Usage
**Problem:** Parsowanie i transformacja dużych JSONB arrays (top5) w pamięci

**Mitigacje:**
- Streaming JSON parsing (jeśli konieczne)
- Limit Top-5 (już zaimplementowany w widoku)
- Generator functions dla dużych data sets

### Strategie optymalizacji

#### Database Level

1. **Indexing Strategy:**
```sql
-- UWAGA: Nie można tworzyć indeksów bezpośrednio na widokach (views).
-- Indeksy muszą być utworzone na tabelach bazowych, z których widok korzysta.
-- Poniższe indeksy powinny być na tabelach: scenarios, transactions, scenario_overrides

-- Indeks na tabeli scenarios dla szybkiego wyszukiwania scenariuszy
CREATE INDEX IF NOT EXISTS idx_scenarios_company_id 
ON scenarios (company_id, id) WHERE deleted_at IS NULL;

-- Indeksy na tabeli transactions dla agregacji
CREATE INDEX IF NOT EXISTS idx_transactions_company_dataset 
ON transactions (company_id, dataset_code, date_due) WHERE is_active = true;

-- Indeks na scenario_overrides dla joinów w widoku
CREATE INDEX IF NOT EXISTS idx_overrides_scenario_flow 
ON scenario_overrides (scenario_id, flow_id);

-- Dla materialized view (opcjonalnie):
-- CREATE MATERIALIZED VIEW weekly_aggregates_mv AS SELECT * FROM weekly_aggregates_v;
-- CREATE UNIQUE INDEX ON weekly_aggregates_mv (company_id, scenario_id, week_index);
```

2. **Query Optimization:**
- Użycie EXPLAIN ANALYZE dla identyfikacji bottlenecks
- Limit na liczbie zwracanych tygodni (np. max 104 = 2 lata)
- Partial indexes na najczęściej używanych scenariuszach

3. **View Materialization (optional):**
```sql
-- Dla bardzo dużych scenariuszy
CREATE MATERIALIZED VIEW weekly_aggregates_mv AS
SELECT * FROM weekly_aggregates_v;

-- Refresh strategy przy zmianie overrides
CREATE OR REPLACE FUNCTION refresh_weekly_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_aggregates_mv;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Application Level

1. **Response Caching:**
```typescript
// Cache dla locked scenarios (immutable)
if (scenario.status === 'Locked') {
  const cacheKey = `weekly-agg:${scenarioId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  const result = await getWeeklyAggregates(...);
  await cache.set(cacheKey, result, { ttl: 3600 }); // 1 hour
  return result;
}
```

2. **Connection Pooling:**
- Supabase automatycznie zarządza poolingiem
- Konfiguracja max connections w Supabase dashboard
- Monitoring connection usage

3. **Lazy Loading (Future Enhancement):**
```typescript
// Opcja query param dla lazy loading tygodni
?weeks_from=0&weeks_to=12  // Tylko pierwsze 12 tygodni
```

#### Network Level

1. **Compression:**
```typescript
// W Astro config lub middleware
response.headers.set('Content-Encoding', 'gzip');
```

2. **CDN Caching:**
- Cache-Control headers dla locked scenarios
- Vary header na Authorization
- Edge caching dla często używanych scenariuszy

### Performance Metrics

**Target SLAs:**
- **Response Time (P95):** < 500ms dla scenariuszy z <10k transakcji
- **Response Time (P99):** < 1000ms
- **Database Query Time:** < 200ms
- **Throughput:** > 100 requests/second (przy cache)

**Monitoring:**
```typescript
const startTime = Date.now();
const result = await getWeeklyAggregates(...);
const duration = Date.now() - startTime;

// Log slow queries
if (duration > 500) {
  console.warn(`Slow query detected: ${duration}ms for scenario ${scenarioId}`);
}

// Metrics tracking
metrics.timing('api.weekly_aggregates.duration', duration);
metrics.increment('api.weekly_aggregates.requests');
```

### Load Testing

**Scenarios to test:**
1. Single user, single scenario (baseline)
2. 100 concurrent users, different scenarios
3. Single scenario, 1000 weeks (edge case)
4. Cold cache vs warm cache performance

**Tools:**
- k6 or Apache JMeter for load testing
- pg_stat_statements for database query analysis
- Supabase dashboard metrics

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury projektu
**Cel:** Utworzenie niezbędnych katalogów i plików oraz weryfikacja typów bazy danych

**Akcje:**
1. Weryfikacja typów bazy danych - upewnij się, że widok `weekly_aggregates_v` jest w `database.types.ts`:
   ```bash
   # Jeśli widok nie jest w typach, zregeneruj je:
   npx supabase gen types typescript --project-id "$PROJECT_ID" > src/db/database.types.ts
   # lub jeśli używasz lokalnego Supabase:
   npx supabase gen types typescript --local > src/db/database.types.ts
   ```

2. Utworzenie katalogu dla validation schemas:
   ```bash
   mkdir -p src/lib/validation
   ```

3. Utworzenie katalogu dla services:
   ```bash
   mkdir -p src/lib/services
   ```

4. Utworzenie katalogu dla API routes:
   ```bash
   mkdir -p src/pages/api/companies/[companyId]/scenarios/[scenarioId]
   ```

**Weryfikacja:** 
- Wszystkie katalogi istnieją w strukturze projektu
- Typ `Tables<'weekly_aggregates_v'>` jest dostępny w `src/types.ts`
- Import `WeeklyAggregateRow` działa poprawnie

### Krok 2: Implementacja Validation Schema
**Cel:** Definicja Zod schema dla walidacji parametrów

**Plik:** `src/lib/validation/weekly-aggregates.validation.ts`

**Kod:**
```typescript
import { z } from 'zod';

/**
 * Validation schema for GET weekly aggregates endpoint path parameters
 */
export const GetWeeklyAggregatesParamsSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
  scenarioId: z.coerce.number().int().positive('Scenario ID must be a positive integer')
});

/**
 * Inferred type from validation schema
 */
export type GetWeeklyAggregatesParams = z.infer<typeof GetWeeklyAggregatesParamsSchema>;
```

**Weryfikacja:**
- Plik kompiluje się bez błędów
- Schema exportuje poprawne typy
- Import z `zod` działa

### Krok 3: Implementacja Service Layer
**Cel:** Utworzenie logiki biznesowej do pobierania agregacji

**Plik:** `src/lib/services/scenario-analytics.service.ts`

**Kod:**
```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { WeeklyAggregatesResponseDTO, WeekAggregateDTO, TopTransactionItemDTO } from '../../types';
import { z } from 'zod';

/**
 * Custom error classes for better error handling
 */
export class ScenarioNotFoundError extends Error {
  constructor(message = 'Scenario not found') {
    super(message);
    this.name = 'ScenarioNotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'User not a member of company') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends Error {
  constructor(message = 'Database error occurred') {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Zod schema for validating Top-5 transaction items from JSONB
 */
const Top5ItemSchema = z.object({
  flow_id: z.string(),
  amount_book_cents: z.number(),
  counterparty: z.string(),
  description: z.string(),
  date_due: z.string()
});

/**
 * Get weekly aggregates for a scenario
 * 
 * @param supabase - Supabase client with user context
 * @param companyId - Company UUID
 * @param scenarioId - Scenario ID
 * @returns Weekly aggregates data
 * @throws ScenarioNotFoundError if scenario not found
 * @throws ForbiddenError if user not a member of company
 * @throws DatabaseError if database operation fails
 */
export async function getWeeklyAggregates(
  supabase: SupabaseClient,
  companyId: string,
  scenarioId: number
): Promise<WeeklyAggregatesResponseDTO> {
  // Step 1: Verify user is a member of the company (explicit check)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new ForbiddenError('User not authenticated');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    throw new ForbiddenError('User not a member of company');
  }

  // Step 2: Verify scenario exists and belongs to company
  const { data: scenario, error: scenarioError } = await supabase
    .from('scenarios')
    .select('id, company_id, dataset_code')
    .eq('id', scenarioId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .single();

  if (scenarioError || !scenario) {
    throw new ScenarioNotFoundError();
  }

  // Step 3: Get company base currency
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('base_currency')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    throw new ScenarioNotFoundError('Company not found');
  }

  // Step 4: Query weekly aggregates view
  const { data: weeklyData, error: aggregatesError } = await supabase
    .from('weekly_aggregates_v')
    .select('*')
    .eq('company_id', companyId)
    .eq('scenario_id', scenarioId)
    .order('week_index', { ascending: true });

  if (aggregatesError) {
    console.error('Error fetching weekly aggregates:', aggregatesError);
    throw new DatabaseError('Failed to fetch weekly aggregates');
  }

  // Step 5: Transform data to DTO format
  const weeks: WeekAggregateDTO[] = (weeklyData || []).map(week => ({
    week_index: week.week_index,
    week_label: week.week_label,
    week_start_date: week.week_start_date,
    inflow_total_book_cents: week.inflow_total_book_cents,
    outflow_total_book_cents: week.outflow_total_book_cents,
    inflow_top5: parseTop5Transactions(week.inflow_top5),
    outflow_top5: parseTop5Transactions(week.outflow_top5),
    inflow_other_book_cents: week.inflow_other_book_cents,
    outflow_other_book_cents: week.outflow_other_book_cents
  }));

  return {
    scenario_id: scenarioId,
    base_currency: company.base_currency,
    weeks
  };
}

/**
 * Parse JSONB top5 array to TopTransactionItemDTO[]
 * 
 * @param jsonbData - JSONB data from database view
 * @returns Parsed array of top transactions
 */
function parseTop5Transactions(jsonbData: unknown): TopTransactionItemDTO[] {
  if (!jsonbData || !Array.isArray(jsonbData)) {
    return [];
  }

  try {
    // Validate and parse each item using Zod schema
    return jsonbData
      .map(item => {
        const parsed = Top5ItemSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((item): item is TopTransactionItemDTO => item !== null);
  } catch (error) {
    console.error('Error parsing top5 transactions:', error);
    return [];
  }
}
```

**Weryfikacja:**
- Service kompiluje się bez błędów TypeScript
- Wszystkie importy są poprawne
- Logika obsługi błędów działa
- Unit testy dla `parseTop5Transactions` (opcjonalnie)

### Krok 4: Implementacja API Route
**Cel:** Utworzenie Astro endpoint handler

**Plik:** `src/pages/api/companies/[companyId]/scenarios/[scenarioId]/weekly-aggregates.ts`

**Kod:**
```typescript
import type { APIRoute } from 'astro';
import { GetWeeklyAggregatesParamsSchema } from '../../../../../../lib/validation/weekly-aggregates.validation';
import { 
  getWeeklyAggregates, 
  ScenarioNotFoundError, 
  ForbiddenError, 
  DatabaseError 
} from '../../../../../../lib/services/scenario-analytics.service';
import { z } from 'zod';

/**
 * GET /api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates
 * 
 * Returns weekly aggregates with Top-5 transactions for a scenario
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Validate path parameters
    let validatedParams;
    try {
      validatedParams = GetWeeklyAggregatesParamsSchema.parse({
        companyId: params.companyId,
        scenarioId: params.scenarioId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request parameters',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }
          }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      throw error;
    }

    // Step 3: Call service layer
    const result = await getWeeklyAggregates(
      supabase,
      validatedParams.companyId,
      validatedParams.scenarioId
    );

    // Step 4: Return success response
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Error handling
    console.error('Error in weekly-aggregates endpoint:', error);

    // Handle custom error types
    if (error instanceof ScenarioNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: error.message
          }
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred'
          }
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred'
        }
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Disable prerendering for API routes
export const prerender = false;
```

**Weryfikacja:**
- Route kompiluje się bez błędów
- Astro rozpoznaje endpoint
- Prerender jest wyłączony

### Krok 5: Testowanie lokalne
**Cel:** Weryfikacja działania endpointu w środowisku developerskim

**Akcje:**
1. Uruchomienie Supabase lokalnie:
   ```bash
   supabase start
   ```

2. Uruchomienie serwera Astro:
   ```bash
   npm run dev
   ```

3. Testowanie z curl lub Postman:
   ```bash
   # Pobierz token JWT z Supabase
   export TOKEN="your-jwt-token"
   
   # Test request
   curl -X GET \
     "http://localhost:4321/api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates" \
     -H "Authorization: Bearer $TOKEN"
   ```

4. Testowanie scenariuszy błędów:
   - Invalid UUID dla companyId
   - Nieprawidłowy scenarioId
   - Brak tokenu
   - Nieistniejący scenariusz

**Weryfikacja:**
- 200 OK dla prawidłowych requestów
- Odpowiednie kody błędów (400, 401, 404)
- Response zgodny ze specyfikacją DTO
- RLS działa poprawnie (user widzi tylko swoje dane)

### Krok 6: Implementacja testów jednostkowych
**Cel:** Zapewnienie jakości kodu przez testy

**Plik:** `src/lib/services/scenario-analytics.service.test.ts`

**Kod (przykład):**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWeeklyAggregates } from './scenario-analytics.service';

describe('getWeeklyAggregates', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      is: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      single: vi.fn()
    };
  });

  it('should return weekly aggregates for valid scenario', async () => {
    // Setup mocks
    mockSupabase.single
      .mockResolvedValueOnce({ 
        data: { id: 1, company_id: 'uuid', dataset_code: 'Q1' }, 
        error: null 
      })
      .mockResolvedValueOnce({ 
        data: { base_currency: 'EUR' }, 
        error: null 
      });

    mockSupabase.order.mockResolvedValueOnce({
      data: [
        {
          week_index: 0,
          week_label: 'IB',
          week_start_date: null,
          inflow_total_book_cents: 0,
          outflow_total_book_cents: 0,
          inflow_top5: [],
          outflow_top5: [],
          inflow_other_book_cents: 0,
          outflow_other_book_cents: 0
        }
      ],
      error: null
    });

    // Execute
    const result = await getWeeklyAggregates(mockSupabase, 'uuid', 1);

    // Assert
    expect(result.scenario_id).toBe(1);
    expect(result.base_currency).toBe('EUR');
    expect(result.weeks).toHaveLength(1);
  });

  it('should throw ScenarioNotFoundError for non-existent scenario', async () => {
    // Mock auth.getUser
    mockSupabase.auth = {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'user-uuid' } }, 
        error: null 
      })
    };

    // Mock membership check (success)
    mockSupabase.single.mockResolvedValueOnce({ 
      data: { company_id: 'uuid' }, 
      error: null 
    });

    // Mock scenario check (not found)
    mockSupabase.single.mockResolvedValueOnce({ 
      data: null, 
      error: { message: 'Not found' } 
    });

    await expect(
      getWeeklyAggregates(mockSupabase, 'uuid', 999)
    ).rejects.toThrow(ScenarioNotFoundError);
  });
});
```

**Weryfikacja:**
- Wszystkie testy przechodzą
- Coverage > 80% dla service layer
- Edge cases są pokryte

### Krok 7: Dokumentacja
**Cel:** Udokumentowanie endpointu dla zespołu

**Akcje:**
1. Dodanie komentarzy JSDoc do wszystkich funkcji publicznych
2. Aktualizacja README.md z przykładem użycia
3. Dodanie przykładów request/response do dokumentacji API

**Weryfikacja:**
- TypeScript generuje poprawne type hints
- Dokumentacja jest kompletna i zrozumiała

### Krok 8: Code Review
**Cel:** Weryfikacja jakości kodu przez zespół

**Checklist:**
- [ ] Kod zgodny z guidelines projektu (copilot-instructions.md)
- [ ] Wszystkie typy TypeScript są poprawne
- [ ] Obsługa błędów jest kompletna
- [ ] Bezpieczeństwo (RLS, walidacja) jest zapewnione
- [ ] Performance jest akceptowalna
- [ ] Testy są wystarczające
- [ ] Dokumentacja jest kompletna

### Krok 9: Integracja z frontendem
**Cel:** Umożliwienie wykorzystania endpointu w UI

**Akcje:**
1. Utworzenie React hook do pobierania danych:
   ```typescript
   // src/components/hooks/useWeeklyAggregates.ts
   export function useWeeklyAggregates(companyId: string, scenarioId: number) {
     // Implementation using fetch or Supabase client
   }
   ```

2. Implementacja komponentu wyświetlającego dane
3. Obsługa stanów ładowania i błędów w UI

**Weryfikacja:**
- Frontend poprawnie wywołuje endpoint
- Dane są wyświetlane zgodnie z UX
- Błędy są obsługiwane user-friendly

### Krok 10: Deployment
**Cel:** Wdrożenie na środowisko produkcyjne

**Akcje:**
1. Merge do main branch przez Pull Request
2. Uruchomienie CI/CD pipeline
3. Deployment na DigitalOcean
4. Smoke testing na produkcji
5. Monitoring metryk (response time, error rate)

**Weryfikacja:**
- Endpoint działa na produkcji
- Performance SLA są spełnione
- Monitoring i alerty działają
- Rollback plan jest gotowy

---

## 10. Checklisty i narzędzia pomocnicze

### Pre-implementation Checklist
- [ ] Przeczytano i zrozumiano API specification
- [ ] Przeczytano database schema (szczególnie `weekly_aggregates_v`)
- [ ] Zrozumiano flow danych i RLS policies
- [ ] Przygotowano środowisko deweloperskie (Supabase local, Astro dev)
- [ ] Zainstalowano wszystkie zależności (`npm install`)

### Implementation Checklist
- [ ] Utworzono validation schema z Zod
- [ ] Zaimplementowano service layer z proper error handling
- [ ] Utworzono API route w Astro
- [ ] Wyłączono prerendering (`export const prerender = false`)
- [ ] Dodano obsługę wszystkich error cases
- [ ] Zaimplementowano proper TypeScript typing
- [ ] Dodano JSDoc comments

### Testing Checklist
- [ ] Unit tests dla service layer (>80% coverage)
- [ ] Integration tests z mock Supabase
- [ ] Manual testing wszystkich happy paths
- [ ] Manual testing wszystkich error scenarios (400, 401, 403, 404, 500)
- [ ] Testing z różnymi rozmiarami danych (małe, średnie, duże scenariusze)
- [ ] Load testing (opcjonalnie dla production)

### Security Checklist
- [ ] JWT authentication jest wymagane
- [ ] RLS policies są aktywne na wszystkich tabelach/widokach
- [ ] Walidacja wszystkich parametrów wejściowych (Zod)
- [ ] Brak SQL injection vulnerabilities
- [ ] Brak data leakage między tenants
- [ ] Error messages nie ujawniają wrażliwych informacji
- [ ] Rate limiting jest skonfigurowany (opcjonalnie)

### Performance Checklist
- [ ] Database indexes są na miejscu
- [ ] Query performance jest mierzona (EXPLAIN ANALYZE)
- [ ] Response time < 500ms dla typowych scenariuszy
- [ ] Memory usage jest rozsądny
- [ ] Brak N+1 query problems
- [ ] Caching strategy (dla locked scenarios)

### Documentation Checklist
- [ ] JSDoc comments dla wszystkich funkcji publicznych
- [ ] README.md zawiera przykłady użycia
- [ ] API documentation jest aktualna
- [ ] Error codes są udokumentowane
- [ ] Performance characteristics są opisane

### Deployment Checklist
- [ ] Code review completed i approved
- [ ] Wszystkie testy przechodzą (CI green)
- [ ] Database migrations są applied (jeśli potrzebne)
- [ ] Environment variables są skonfigurowane
- [ ] Monitoring i logging są skonfigurowane
- [ ] Rollback plan jest przygotowany
- [ ] Smoke tests na production passed

---

## Dodatkowe uwagi

### Kolejne kroki po implementacji
1. **Caching Strategy:** Implementacja cache dla locked scenarios
2. **Pagination:** Dodanie opcjonalnej paginacji dla bardzo długich okresów
3. **Filtering:** Możliwość filtrowania tygodni (date_from, date_to)
4. **Performance Monitoring:** Integration z narzędziami jak DataDog, New Relic
5. **Rate Limiting:** Implementacja middleware dla rate limiting

### Potencjalne rozszerzenia
- Export agregacji do CSV/Excel
- Real-time updates przez WebSockets (dla Draft scenarios)
- Comparison endpoint (porównanie wielu scenariuszy)
- Advanced filtering i sorting
- Custom aggregation periods (daily, monthly, quarterly)

### Znane ograniczenia MVP
- Brak pagination (może być problem dla >100 tygodni)
- Brak caching (każde zapytanie idzie do DB)
- Brak rate limiting
- Brak compression (może być problem dla dużych odpowiedzi)
- Brak streaming responses

### Zalecana kolejność implementacji pozostałych endpointów
1. `GET /api/companies/{companyId}/scenarios/{scenarioId}/running-balance` - podobny pattern
2. `GET /api/companies/{companyId}/scenarios/{scenarioId}/transactions` - bazowy endpoint
3. `POST /api/companies/{companyId}/scenarios/{scenarioId}/overrides/batch` - bardziej złożony
4. Pozostałe endpointy według priorytetu biznesowego
