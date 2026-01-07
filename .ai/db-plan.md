# CashFlow Scenarios MVP — PostgreSQL Schema Plan (Supabase)

> Konwencje
>
> - Wszystkie znaczące pola czasowe: `timestamp without time zone`, interpretowane jako UTC.
> - Wszystkie tabele domenowe mają `company_id NOT NULL` (multi-tenant) i RLS oparty o `company_members`.
> - Kwoty pieniężne: `bigint` w centach (wartości nieujemne); znak przepływu wynika wyłącznie z `direction`.
> - Dane bazowe `transactions` są append-only z perspektywy użytkownika (UPDATE/DELETE zablokowane przez RLS).
> - Brak osobnej tabeli FX — kurs przechowywany w `transactions.fx_rate`.

---

## 1. Lista tabel (kolumny, typy, ograniczenia)

### 1.1. `companies`

**Cel:** Tenant (firma) i konfiguracja waluty bazowej.

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `name text NOT NULL CHECK (length(trim(name)) > 0)`
- `base_currency char(3) NOT NULL CHECK (base_currency ~ '^[A-Z]{3}$')`
- `timezone text NOT NULL DEFAULT 'UTC' CHECK (length(trim(timezone)) > 0)`
- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Uwagi:

- Brak soft-delete (usuwanie fizyczne). `ON DELETE CASCADE` usuwa wszystkie dane firmy.

---

### 1.2. `company_members`

**Cel:** Relacja wielu użytkowników do wielu firm; fundament RLS.

- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL` _(Supabase Auth: `auth.users.id`)_
- `joined_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia:

- `PRIMARY KEY (company_id, user_id)`
- `UNIQUE (user_id, company_id)` _(dla FK z `user_profiles`)_

---

### 1.3. `user_profiles`

**Cel:** Lekki profil użytkownika + domyślna firma.

- `user_id uuid PRIMARY KEY` _(Supabase Auth: `auth.users.id`)_
- `default_company_id uuid NULL`
- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia:

- `FOREIGN KEY (user_id, default_company_id) REFERENCES company_members(user_id, company_id) ON DELETE RESTRICT` _(wymusza, że domyślna firma jest firmą, do której user należy)_

---

### 1.4. `imports`

**Cel:** Jedno ładowanie CSV (batch), statusy, statystyki i raport błędów.

- `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `dataset_code text NOT NULL CHECK (length(trim(dataset_code)) > 0)`
- `status text NOT NULL CHECK (status IN ('pending','processing','completed','failed'))`
- `total_rows integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0)`
- `valid_rows integer NOT NULL DEFAULT 0 CHECK (valid_rows >= 0)`
- `invalid_rows integer NOT NULL DEFAULT 0 CHECK (invalid_rows >= 0)`
- `inserted_transactions_count integer NOT NULL DEFAULT 0 CHECK (inserted_transactions_count >= 0)`
- `error_report_json jsonb NULL`
- `error_report_url text NULL`
- `file_name text NULL`
- `uploaded_by uuid NULL` _(zwykle `auth.uid()` podczas uploadu)_
- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia/spójność:

- `dataset_code` stabilny identyfikator logicznego zbioru; po `status='completed'` jego zmiana jest blokowana (trigger — patrz sekcja 5).

---

### 1.5. `import_rows`

**Cel:** Pełny log wierszy CSV (również błędnych) + surowe dane.

- `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `import_id bigint NOT NULL REFERENCES imports(id) ON DELETE CASCADE`
- `row_number integer NOT NULL CHECK (row_number > 0)`
- `raw_data jsonb NOT NULL`
- `is_valid boolean NOT NULL DEFAULT false`
- `error_message text NULL`
- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia:

- `UNIQUE (import_id, row_number)`

---

### 1.6. `accounts`

**Cel:** Opcjonalne konta finansowe.

- `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `name text NOT NULL CHECK (length(trim(name)) > 0)`
- `currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$')`
- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia:

- `UNIQUE (company_id, name)`

---

### 1.7. `transactions`

**Cel:** Bazowe przepływy (immutable z perspektywy usera), identyfikowane przez `(company_id, dataset_code, flow_id)`.

- `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `import_id bigint NOT NULL REFERENCES imports(id) ON DELETE CASCADE`
- `dataset_code text NOT NULL CHECK (length(trim(dataset_code)) > 0)`
- `flow_id text NOT NULL CHECK (length(trim(flow_id)) > 0)`
- `account_id bigint NULL REFERENCES accounts(id) ON DELETE SET NULL`
- `is_active boolean NOT NULL DEFAULT true`

Kwoty/waluty:

- `amount_tx_cents bigint NOT NULL CHECK (amount_tx_cents >= 0)`
- `currency_tx char(3) NOT NULL CHECK (currency_tx ~ '^[A-Z]{3}$')`
- `fx_rate numeric(18,6) NULL CHECK (fx_rate IS NULL OR fx_rate > 0)`
- `amount_book_cents bigint NOT NULL CHECK (amount_book_cents >= 0)` _(zawsze w `companies.base_currency`)_

Daty i kategoryzacja:

- `date_due date NOT NULL`
- `direction text NOT NULL CHECK (direction IN ('INFLOW','OUTFLOW'))`
- `time_slot text NOT NULL CHECK (time_slot ~ '^(IB|[0-9]{4})$')` _(IB albo YYWW)_

Metadane:

- `project text NULL`
- `counterparty text NULL`
- `document text NULL`
- `description text NULL`
- `payment_source text NOT NULL CHECK (length(trim(payment_source)) > 0)`

Audyt:

- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia kluczowe (model „jedna aktywna wersja”):

- Unikalność utrzymywana **tylko** dla rekordów aktywnych: `(company_id, dataset_code, flow_id) WHERE is_active = true` (indeks częściowy; patrz sekcja 3).

---

### 1.8. `scenarios`

**Cel:** Scenariusze „what-if” na danych `dataset_code`, zawsze wskazujące najnowszy import dla tego `dataset_code` w firmie.

- `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `import_id bigint NOT NULL REFERENCES imports(id) ON DELETE CASCADE`
- `dataset_code text NOT NULL CHECK (length(trim(dataset_code)) > 0)`

- `name text NOT NULL CHECK (length(trim(name)) > 0)`
- `status text NOT NULL CHECK (status IN ('Draft','Locked'))`
- `base_scenario_id bigint NULL REFERENCES scenarios(id) ON DELETE SET NULL`

Zakres analizy:

- `start_date date NOT NULL`
- `end_date date NOT NULL`
- `CONSTRAINT scenarios_date_range_ck CHECK (start_date <= end_date)`

Locking / soft-delete:

- `locked_at timestamp without time zone NULL`
- `locked_by uuid NULL`
- `deleted_at timestamp without time zone NULL`

Audyt:

- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Unikalność (bez soft-deleted):

- `UNIQUE (company_id, import_id, name) WHERE deleted_at IS NULL` (indeks częściowy; patrz sekcja 3).

---

### 1.9. `scenario_overrides`

**Cel:** Nadpisania per `(scenario_id, flow_id)`; brak wersjonowania historii (nadpisywanie rekordu).

- `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
- `scenario_id bigint NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE`
- `flow_id text NOT NULL CHECK (length(trim(flow_id)) > 0)`

Oryginał (zamrażany przy pierwszym override):

- `original_date_due date NOT NULL`
- `original_amount_book_cents bigint NOT NULL CHECK (original_amount_book_cents >= 0)`

Nowe wartości (użytkownik edytuje tylko bazową kwotę i datę):

- `new_date_due date NULL`
- `new_amount_book_cents bigint NULL CHECK (new_amount_book_cents >= 0)`

Audyt:

- `created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`
- `updated_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')`

Ograniczenia:

- `UNIQUE (company_id, scenario_id, flow_id)`

---

## 2. Relacje między tabelami (kardynalność)

- `companies (1) -> (N) company_members`
  - `company_members.company_id -> companies.id`
- `auth.users (1) -> (N) company_members` _(po `user_id`)_
- `auth.users (1) -> (1) user_profiles` _(po `user_id`)_
- `company_members (N) -> (1) companies` i `(N) -> (1) auth.users`
- `user_profiles (1) -> (0..1) default_company` przez wymuszenie członkostwa:
  - `user_profiles(user_id, default_company_id) -> company_members(user_id, company_id)`

- `companies (1) -> (N) imports`
- `imports (1) -> (N) import_rows`
- `imports (1) -> (N) transactions`
- `companies (1) -> (N) accounts`
- `accounts (1) -> (0..N) transactions` _(opcjonalny FK, `account_id` może być NULL)_

- `companies (1) -> (N) scenarios`
- `imports (1) -> (N) scenarios` _(scenarios.import_id wskazuje import będący „najnowszym” dla `dataset_code`)_
- `scenarios (1) -> (N) scenario_overrides`

Uwagi relacyjne:

- `scenario_overrides` nie ma FK do `transactions`, bo wiąże się logicznie po `flow_id` (aby działać przy nowszych importach tego samego `dataset_code`). Spójność `flow_id` dla danego scenariusza egzekwuje się przez logikę w widokach i/lub trigger (sekcja 5).

---

## 3. Indeksy (wydajność)

> Wszystkie indeksy powinny zawierać `company_id` jako pierwszy komponent, jeśli służą do filtrowania tenantowego.

### 3.1. `company_members`

- `PRIMARY KEY (company_id, user_id)` _(wspiera RLS EXISTS po company_id)_
- `UNIQUE (user_id, company_id)` _(wspiera zapytania „jakie firmy ma user” oraz FK z `user_profiles`)_

### 3.2. `imports`

- `INDEX imports_company_dataset_created_idx (company_id, dataset_code, created_at DESC)` _(wybór „najnowszego importu paczki”)_
- (opcjonalnie) `INDEX imports_company_status_created_idx (company_id, status, created_at DESC)`

### 3.3. `import_rows`

- `UNIQUE (import_id, row_number)`
- `INDEX import_rows_company_import_idx (company_id, import_id)`
- (opcjonalnie) `INDEX import_rows_import_is_valid_idx (import_id, is_valid)`

### 3.4. `accounts`

- `UNIQUE (company_id, name)`
- `INDEX accounts_company_currency_idx (company_id, currency)`

### 3.5. `transactions`

Klucz biznesowy (tylko aktywne):

- `UNIQUE INDEX transactions_active_key_ux ON transactions(company_id, dataset_code, flow_id) WHERE is_active = true`

Dostęp i agregacje:

- `INDEX transactions_company_date_idx (company_id, date_due)`
- `INDEX transactions_company_direction_date_idx (company_id, direction, date_due)`
- `INDEX transactions_company_time_slot_idx (company_id, time_slot)`
- `INDEX transactions_company_dataset_idx (company_id, dataset_code)`
- `INDEX transactions_company_import_idx (company_id, import_id)`

Filtrowania po polach tekstowych (MVP):

- `INDEX transactions_company_project_idx (company_id, project)` _(BTREE; działa też dla NULL, ale selektywność zależy od danych)_
- `INDEX transactions_company_counterparty_idx (company_id, counterparty)`

Wyszukiwanie pełnotekstowe:

- `GIN INDEX transactions_search_gin ON transactions USING gin (to_tsvector('simple', coalesce(description,'') || ' ' || coalesce(counterparty,'') || ' ' || coalesce(project,'') || ' ' || coalesce(document,'')))`

### 3.6. `scenarios`

- `INDEX scenarios_company_dataset_idx (company_id, dataset_code)`
- `INDEX scenarios_company_status_idx (company_id, status)`
- `INDEX scenarios_company_created_idx (company_id, created_at DESC)`
- `UNIQUE INDEX scenarios_name_ux ON scenarios(company_id, import_id, name) WHERE deleted_at IS NULL`

### 3.7. `scenario_overrides`

- `UNIQUE (company_id, scenario_id, flow_id)`
- `INDEX scenario_overrides_company_scenario_idx (company_id, scenario_id)`
- `INDEX scenario_overrides_company_flow_idx (company_id, flow_id)`

---

## 4. Zasady PostgreSQL (RLS)

> Poniższe polityki są w stylu Supabase:
>
> - członkostwo: `EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = <row>.company_id AND cm.user_id = auth.uid())`
> - rola serwisowa: `auth.role() = 'service_role'`

### 4.1. Wspólny predykat członkostwa (do użycia w politykach)

- **`is_company_member(company_id)` (logicznie):**
  - `EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_id AND cm.user_id = auth.uid())`

_(Można to zmaterializować jako SQL function, ale nie jest wymagane.)_

---

### 4.2. `companies`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: dozwolone, jeśli user jest członkiem firmy.
- `INSERT/UPDATE/DELETE`: rekomendacja MVP — tylko `service_role` (tworzenie/zarządzanie firmami przez Edge Function).
  - Uzasadnienie: tworzenie firmy wymaga atomowego dodania `company_members`; najprościej wykonywać jako operację serwisową.

---

### 4.3. `company_members`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: dozwolone, jeśli user jest członkiem tej samej firmy (widzi listę członków firmy).
- `INSERT/UPDATE/DELETE`: tylko `service_role`.

---

### 4.4. `user_profiles`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: `user_id = auth.uid()`
- `INSERT`: `user_id = auth.uid()`
- `UPDATE`: `user_id = auth.uid()`
- `DELETE`: opcjonalnie zablokowane (zwykle niepotrzebne w MVP).

---

### 4.5. `imports`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: członek firmy (`company_members`).
- `INSERT/UPDATE/DELETE`: tylko `service_role`.
- Dodatkowo: po `status='completed'` blokada modyfikacji nawet dla biznesowych (i tak nie mają uprawnień na write).

---

### 4.6. `import_rows`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: członek firmy.
- `INSERT/UPDATE/DELETE`: tylko `service_role`.

---

### 4.7. `accounts`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: członek firmy.
- `INSERT/UPDATE/DELETE`: członek firmy.

---

### 4.8. `transactions`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: członek firmy.
- `INSERT`: tylko `service_role`.
- `UPDATE/DELETE`: tylko `service_role`.

---

### 4.9. `scenarios`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: członek firmy **i** `deleted_at IS NULL`.
- `INSERT`: członek firmy.
- `UPDATE`: członek firmy **i** `deleted_at IS NULL`.
  - Rekomendacja dodatkowa: ograniczyć update pól biznesowych do `status='Draft'` (policy `WITH CHECK` lub trigger; patrz sekcja 5).
- `DELETE`: zablokowane dla userów (zamiast tego soft-delete przez `UPDATE deleted_at = now()`); fizyczne usuwanie tylko `service_role`.

---

### 4.10. `scenario_overrides`

- `ENABLE ROW LEVEL SECURITY`
- `SELECT`: członek firmy **i** powiązany scenariusz ma `deleted_at IS NULL`.
- `INSERT/UPDATE/DELETE`: dozwolone tylko jeśli:
  - user jest członkiem firmy, oraz
  - scenariusz istnieje i ma `status='Draft'`, oraz
  - scenariusz nie jest soft-deleted.

_(Najprościej: policy z `EXISTS (SELECT 1 FROM scenarios s WHERE s.id = scenario_id AND s.company_id = scenario_overrides.company_id AND s.status='Draft' AND s.deleted_at IS NULL AND EXISTS (...company_members...))`.)_

---

## 5. Dodatkowe uwagi / decyzje projektowe (zalecane triggery, widoki)

### 5.1. Zalecane triggery / constraints proceduralne

1. **Blokada zmiany `imports.dataset_code` po zakończeniu**

- Trigger `BEFORE UPDATE` na `imports`:
  - jeśli `OLD.status = 'completed'` i `NEW.dataset_code <> OLD.dataset_code` → `RAISE EXCEPTION`.

2. **`scenario_overrides.updated_at`**

- Trigger `BEFORE UPDATE` na `scenario_overrides` ustawiający `updated_at = now() at time zone 'utc'`.

3. **Spójność `company_id` w `scenario_overrides`**

- Trigger `BEFORE INSERT/UPDATE`:
  - wymuś `scenario_overrides.company_id = scenarios.company_id` dla `scenario_id`.

4. **Opcjonalna walidacja `flow_id` pod scenariusz**

- Trigger `BEFORE INSERT/UPDATE` na `scenario_overrides` (opcjonalny):
  - sprawdza istnienie aktywnej transakcji dla `(company_id, scenarios.dataset_code, flow_id)`.

5. **"Scenariusz zawsze na najnowszym imporcie"**

- Funkcja / procedura (np. `get_latest_import_id(company_id, dataset_code)`), wybierająca `imports.id` po `(company_id, dataset_code, created_at DESC)` z `status='completed'`.
- Aktualizacja `scenarios.import_id` wykonywana przez Edge Function lub trigger (zależnie od preferencji wdrożeniowych).

### 5.2. Widoki analityczne (kontrakt + logika)

> Widoki są kluczowe dla UX (Top-5, running balance) i nie używają `SECURITY DEFINER`. Zawsze zwracają `company_id` i `scenario_id`.

#### 5.2.1. `scenario_transactions_v`

**Cel:** Scalenie transakcji z override’ami do „effective\_\*”.

Minimalny kontrakt kolumn:

- `company_id`
- `scenario_id`
- `transaction_id` _(opcjonalnie: `transactions.id` jako referencja debugowa)_
- `dataset_code`
- `flow_id`
- `direction`
- `time_slot`
- `currency_tx`, `amount_tx_cents`, `fx_rate`
- `amount_book_cents_original`, `date_due_original`
- `amount_book_cents_effective`, `date_due_effective`
- `project`, `counterparty`, `document`, `description`, `payment_source`

Zasady:

- Łączenie `transactions` z `scenario_overrides` po `(company_id, flow_id, scenario_id)`.
- `effective` używa `COALESCE(override.new_*, transactions.*)`.
- Filtr bazowy: `transactions.is_active = true` oraz `scenarios.deleted_at IS NULL`.
- Filtr zakresu dla non-IB:
  - jeśli `time_slot = 'IB'` → zawsze włączone,
  - inaczej → `date_due_effective BETWEEN scenarios.start_date AND scenarios.end_date`.

#### 5.2.2. `weekly_aggregates_v`

**Cel:** Agregacja tygodniowa + Top-5 inflow/outflow i „Other”.

Minimalny kontrakt kolumn:

- `company_id`, `scenario_id`
- `week_index integer` _(0 dla IB, 1..N dla pozostałych)_
- `week_start_date date` _(opcjonalnie, zależnie od UI)_
- `inflow_total_book_cents bigint`
- `outflow_total_book_cents bigint`
- `inflow_top5 jsonb` _(lista 5 największych pozycji; pola: flow_id, amount, counterparty/description)_
- `outflow_top5 jsonb`
- `inflow_other_book_cents bigint`
- `outflow_other_book_cents bigint`

Zasady:

- Top-5 liczone per `(scenario_id, week_index, direction)` po `amount_book_cents_effective DESC`.
- IB przypisany do `week_index = 0`.

#### 5.2.3. `running_balance_v`

**Cel:** Saldo narastająco w walucie bazowej.

Minimalny kontrakt kolumn:

- `company_id`, `scenario_id`
- `as_of_date date`
- `delta_book_cents bigint` _(signed: inflow dodatni, outflow ujemny)_
- `running_balance_book_cents bigint`

Zasady:

- Start od IB (czasem `as_of_date` może być np. `scenarios.start_date`; IB traktowane jako „week 0”).
- Dalsze dni po `date_due_effective`.

#### 5.2.4. `scenario_export_v`

**Cel:** Finalny stan scenariusza po override’ach (źródło do eksportu Excela).

Minimalny kontrakt kolumn:

- `company_id`, `scenario_id`
- `flow_id`, `direction`, `time_slot`
- `date_due_effective`, `amount_book_cents_effective`
- metadane: `project`, `counterparty`, `document`, `description`, `payment_source`
- (opcjonalnie) `running_balance_book_cents` przez join do `running_balance_v`

### 5.3. Otwarte decyzje (do dopięcia przed migracjami)

- Czy `scenario_overrides` może dotyczyć rekordów `time_slot='IB'` (korekta salda początkowego) — obecny plan technicznie to umożliwia; jeśli ma być zabronione, dodaj:
  - policy/trigger blokujący override dla `flow_id` wskazujących IB, albo
  - warunek w triggerze walidującym `transactions.time_slot <> 'IB'`.
- Wybór schematu (`public` vs dedykowany) — plan zakłada jeden spójny schemat; w Supabase typowo `public`.
