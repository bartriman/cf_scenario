# Tech Stack & Architecture - CashFlow Scenarios MVP

## 1. Frontend
- **Framework:** Astro 5 (Server-First approach with Islands Architecture)
- **UI Library:** React 19 (for interactive islands)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Component Library:** shadcn/ui
- **State Management:** Nano Stores (for sharing state between islands) or React Context within islands.
- **Visualization:** visx or Recharts (for charts and timeline axis)
- **Drag & Drop:** dnd-kit (for interactive transaction shifting)

## 2. Backend & Database
- **Platform:** Supabase
- **Database:** PostgreSQL
- **Auth:** Supabase Auth
- **Logic:**
  - **Row Level Security (RLS):** Data isolation and security.
  - **Edge Functions:** For heavy operations like CSV import (batch processing) and complex aggregations if needed.
  - **Database Functions (PL/pgSQL):** For efficient data manipulation close to the data.

## 3. Data Architecture
### Database Schema (Core Tables)
- `scenarios`: Stores scenario metadata (id, name, status, base_scenario_id).
- `accounts`: Financial accounts (id, company_id, name, currency).
- `transactions`: Base transactions imported from CSV (immutable for scenarios).
- `scenario_overrides`: Stores deltas/changes for scenarios (new_date, new_amount) to avoid data duplication.
- `fx_rates`: Currency exchange rates (date, from_ccy, to_ccy, rate).

### SQL Views & Aggregations
- `scenario_transactions_v`: Merges base transactions with overrides using `COALESCE`.
- `weekly_aggregates_v`: Calculates weekly sums, Top-5 inflows/outflows, and "Other" category.
- `running_balance_v`: Computes running balance in base currency.

### Data Types
- **Monetary Values:** `INTEGER` (cents) to avoid floating-point errors.
- **Exchange Rates:** `NUMERIC(18,6)` for high precision.

## 4. Infrastructure & DevOps
- **Hosting:** DigitalOcean (App Platform or Droplet).
- **Containerization:** Docker.
- **CI/CD:** GitHub Actions (Build -> Push Docker Image -> Deploy to DO).

## 5. Key Technical Decisions & Mitigations
- **Performance:** Heavy aggregations (Top-5 ranking) performed in SQL (CTE + Indexes) rather than client-side.
- **Rendering:** Virtualization for long lists of transactions to maintain UI responsiveness.
- **Scenario Logic:** "Copy-on-write" approach using `scenario_overrides` table instead of duplicating all transactions for every scenario.
