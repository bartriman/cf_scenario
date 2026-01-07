# REST API Plan - CashFlow Scenarios MVP

## 1. Resources

### Core Resources and Database Mapping

| Resource         | Database Table(s)                                                            | Description                                     |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| **Companies**    | `companies`                                                                  | Company tenant configuration and base currency  |
| **User Profile** | `user_profiles`, `company_members`                                           | User profile and company membership             |
| **Imports**      | `imports`, `import_rows`                                                     | CSV import batches and processing status        |
| **Accounts**     | `accounts`                                                                   | Financial accounts (optional)                   |
| **Transactions** | `transactions`                                                               | Base immutable transaction data                 |
| **Scenarios**    | `scenarios`, `scenario_overrides`                                            | What-if scenarios and transaction modifications |
| **Analytics**    | Views: `scenario_transactions_v`, `weekly_aggregates_v`, `running_balance_v` | Aggregated data for visualization               |

---

## 2. Endpoints

### 2.1. Authentication

Authentication is handled by Supabase Auth. All endpoints (except auth endpoints) require a valid JWT token in the `Authorization` header.

#### Sign Up

- **Method:** `POST`
- **Path:** `/api/auth/signup`
- **Description:** Register a new user and create their profile
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Success Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

- **Error Responses:**
  - `400`: Invalid email or password format
  - `409`: Email already registered

#### Sign In

- **Method:** `POST`
- **Path:** `/api/auth/signin`
- **Description:** Authenticate user and get session tokens
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Success Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

- **Error Responses:**
  - `400`: Invalid credentials
  - `401`: Authentication failed

#### Sign Out

- **Method:** `POST`
- **Path:** `/api/auth/signout`
- **Description:** Invalidate current session
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (204):** No content
- **Error Responses:**
  - `401`: Unauthorized

---

### 2.2. User Profile

#### Get Current User Profile

- **Method:** `GET`
- **Path:** `/api/profile`
- **Description:** Get current authenticated user's profile
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "user_id": "uuid",
  "default_company_id": "uuid",
  "created_at": "2025-01-15T10:30:00Z",
  "companies": [
    {
      "company_id": "uuid",
      "name": "Company Name",
      "base_currency": "EUR",
      "joined_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `404`: Profile not found

#### Update Default Company

- **Method:** `PATCH`
- **Path:** `/api/profile`
- **Description:** Update user's default company
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "default_company_id": "uuid"
}
```

- **Success Response (200):**

```json
{
  "user_id": "uuid",
  "default_company_id": "uuid",
  "updated_at": "2025-01-15T10:35:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid company ID
  - `401`: Unauthorized
  - `403`: User not a member of specified company

---

### 2.3. Companies

#### List User Companies

- **Method:** `GET`
- **Path:** `/api/companies`
- **Description:** Get list of companies the user is a member of
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Company Name",
      "base_currency": "EUR",
      "timezone": "UTC",
      "joined_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

- **Error Responses:**
  - `401`: Unauthorized

#### Get Company Details

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}`
- **Description:** Get detailed information about a specific company
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "id": "uuid",
  "name": "Company Name",
  "base_currency": "EUR",
  "timezone": "UTC",
  "created_at": "2025-01-15T10:30:00Z",
  "members_count": 5
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Company not found

---

### 2.4. Accounts

#### List Accounts

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/accounts`
- **Description:** Get all financial accounts for a company
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `currency` (optional): Filter by currency code (e.g., EUR, USD)
- **Success Response (200):**

```json
{
  "accounts": [
    {
      "id": 123,
      "company_id": "uuid",
      "name": "Main Bank Account",
      "currency": "EUR",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company

#### Create Account

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/accounts`
- **Description:** Create a new financial account
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "name": "Main Bank Account",
  "currency": "EUR"
}
```

- **Success Response (201):**

```json
{
  "id": 123,
  "company_id": "uuid",
  "name": "Main Bank Account",
  "currency": "EUR",
  "created_at": "2025-01-15T10:30:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid request (name empty, invalid currency)
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `409`: Account with same name already exists

#### Update Account

- **Method:** `PUT`
- **Path:** `/api/companies/{companyId}/accounts/{accountId}`
- **Description:** Update an existing account
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "name": "Updated Account Name",
  "currency": "EUR"
}
```

- **Success Response (200):**

```json
{
  "id": 123,
  "company_id": "uuid",
  "name": "Updated Account Name",
  "currency": "EUR",
  "updated_at": "2025-01-15T10:35:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid request
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Account not found
  - `409`: Account name conflict

#### Delete Account

- **Method:** `DELETE`
- **Path:** `/api/companies/{companyId}/accounts/{accountId}`
- **Description:** Delete an account
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (204):** No content
- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Account not found
  - `409`: Account has associated transactions

---

### 2.5. Imports

#### List Imports

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/imports`
- **Description:** Get all CSV imports for a company
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `status` (optional): Filter by status (pending, processing, completed, failed)
  - `dataset_code` (optional): Filter by dataset code
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
- **Success Response (200):**

```json
{
  "imports": [
    {
      "id": 123,
      "company_id": "uuid",
      "dataset_code": "Q1_2025",
      "status": "completed",
      "total_rows": 1000,
      "valid_rows": 980,
      "invalid_rows": 20,
      "inserted_transactions_count": 980,
      "file_name": "transactions_q1.csv",
      "uploaded_by": "uuid",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company

#### Get Import Details

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/imports/{importId}`
- **Description:** Get detailed information about a specific import
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "id": 123,
  "company_id": "uuid",
  "dataset_code": "Q1_2025",
  "status": "completed",
  "total_rows": 1000,
  "valid_rows": 980,
  "invalid_rows": 20,
  "inserted_transactions_count": 980,
  "error_report_json": {
    "errors": [
      {
        "row": 15,
        "field": "amount",
        "message": "Invalid amount format"
      }
    ]
  },
  "error_report_url": "https://storage.url/error-report.csv",
  "file_name": "transactions_q1.csv",
  "uploaded_by": "uuid",
  "created_at": "2025-01-15T10:30:00Z"
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Import not found

#### Create Import (Upload CSV)

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/imports`
- **Description:** Upload CSV file and initiate import process
- **Headers:**
  - `Authorization: Bearer {token}`
  - `Content-Type: multipart/form-data`
- **Request Body (multipart/form-data):**
  - `file`: CSV file
  - `dataset_code`: String identifier for this dataset
- **Success Response (202):**

```json
{
  "id": 123,
  "company_id": "uuid",
  "dataset_code": "Q1_2025",
  "status": "pending",
  "file_name": "transactions_q1.csv",
  "created_at": "2025-01-15T10:30:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid file format or missing dataset_code
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `413`: File too large (>10MB)

#### Get Import Error Rows

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/imports/{importId}/errors`
- **Description:** Get detailed error information for failed rows
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 50, max: 200): Items per page
- **Success Response (200):**

```json
{
  "import_id": 123,
  "errors": [
    {
      "row_number": 15,
      "raw_data": {
        "company": "ABC Corp",
        "date": "invalid-date",
        "amount": "1000"
      },
      "error_message": "Invalid date format",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 20,
    "total_pages": 1
  }
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Import not found

---

### 2.6. Transactions

#### List Transactions

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/transactions`
- **Description:** Get base transactions for a company
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `dataset_code` (optional): Filter by dataset code
  - `import_id` (optional): Filter by import ID
  - `direction` (optional): Filter by direction (INFLOW, OUTFLOW)
  - `date_from` (optional): Filter by date (ISO date, inclusive)
  - `date_to` (optional): Filter by date (ISO date, inclusive)
  - `project` (optional): Filter by project
  - `counterparty` (optional): Filter by counterparty
  - `search` (optional): Full-text search across description, counterparty, project, document
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 50, max: 200): Items per page
  - `sort` (optional, default: date_due): Sort field (date_due, amount_book_cents, created_at)
  - `order` (optional, default: asc): Sort order (asc, desc)
- **Success Response (200):**

```json
{
  "transactions": [
    {
      "id": 456,
      "company_id": "uuid",
      "import_id": 123,
      "dataset_code": "Q1_2025",
      "flow_id": "INV-2025-001",
      "account_id": 789,
      "is_active": true,
      "amount_tx_cents": 100000,
      "currency_tx": "USD",
      "fx_rate": 1.085,
      "amount_book_cents": 108500,
      "date_due": "2025-02-15",
      "direction": "INFLOW",
      "time_slot": "2501",
      "project": "Project Alpha",
      "counterparty": "Client ABC",
      "document": "INV-2025-001",
      "description": "Payment for services",
      "payment_source": "Bank Transfer",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 980,
    "total_pages": 20
  }
}
```

- **Error Responses:**
  - `400`: Invalid query parameters
  - `401`: Unauthorized
  - `403`: User not a member of company

#### Get Transaction Details

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/transactions/{transactionId}`
- **Description:** Get detailed information about a specific transaction
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "id": 456,
  "company_id": "uuid",
  "import_id": 123,
  "dataset_code": "Q1_2025",
  "flow_id": "INV-2025-001",
  "account_id": 789,
  "is_active": true,
  "amount_tx_cents": 100000,
  "currency_tx": "USD",
  "fx_rate": 1.085,
  "amount_book_cents": 108500,
  "date_due": "2025-02-15",
  "direction": "INFLOW",
  "time_slot": "2501",
  "project": "Project Alpha",
  "counterparty": "Client ABC",
  "document": "INV-2025-001",
  "description": "Payment for services",
  "payment_source": "Bank Transfer",
  "created_at": "2025-01-15T10:30:00Z"
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Transaction not found

---

### 2.7. Scenarios

#### List Scenarios

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/scenarios`
- **Description:** Get all scenarios for a company (excluding soft-deleted)
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `dataset_code` (optional): Filter by dataset code
  - `status` (optional): Filter by status (Draft, Locked)
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
- **Success Response (200):**

```json
{
  "scenarios": [
    {
      "id": 789,
      "company_id": "uuid",
      "import_id": 123,
      "dataset_code": "Q1_2025",
      "name": "Base Scenario",
      "status": "Locked",
      "base_scenario_id": null,
      "start_date": "2025-01-01",
      "end_date": "2025-03-31",
      "locked_at": "2025-01-20T14:30:00Z",
      "locked_by": "uuid",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "total_pages": 1
  }
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company

#### Get Scenario Details

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}`
- **Description:** Get detailed information about a specific scenario
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "id": 789,
  "company_id": "uuid",
  "import_id": 123,
  "dataset_code": "Q1_2025",
  "name": "Base Scenario",
  "status": "Locked",
  "base_scenario_id": null,
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "locked_at": "2025-01-20T14:30:00Z",
  "locked_by": "uuid",
  "created_at": "2025-01-15T10:30:00Z",
  "overrides_count": 15
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found

#### Create Scenario

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/scenarios`
- **Description:** Create a new scenario (base or derived)
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "dataset_code": "Q1_2025",
  "name": "Optimistic Scenario",
  "base_scenario_id": 789,
  "start_date": "2025-01-01",
  "end_date": "2025-03-31"
}
```

- **Success Response (201):**

```json
{
  "id": 790,
  "company_id": "uuid",
  "import_id": 123,
  "dataset_code": "Q1_2025",
  "name": "Optimistic Scenario",
  "status": "Draft",
  "base_scenario_id": 789,
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "created_at": "2025-01-15T10:35:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid request (name empty, invalid dates, start_date > end_date)
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Base scenario or dataset not found
  - `409`: Scenario with same name already exists

#### Update Scenario

- **Method:** `PATCH`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}`
- **Description:** Update scenario metadata (only for Draft status)
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "name": "Updated Scenario Name",
  "start_date": "2025-01-01",
  "end_date": "2025-03-31"
}
```

- **Success Response (200):**

```json
{
  "id": 790,
  "company_id": "uuid",
  "import_id": 123,
  "dataset_code": "Q1_2025",
  "name": "Updated Scenario Name",
  "status": "Draft",
  "base_scenario_id": 789,
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "updated_at": "2025-01-15T10:40:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid request
  - `401`: Unauthorized
  - `403`: User not a member of company or scenario is Locked
  - `404`: Scenario not found
  - `409`: Name conflict

#### Lock Scenario

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/lock`
- **Description:** Lock scenario to prevent further edits
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "id": 790,
  "status": "Locked",
  "locked_at": "2025-01-15T10:45:00Z",
  "locked_by": "uuid"
}
```

- **Error Responses:**
  - `400`: Scenario already locked
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found

#### Delete Scenario (Soft Delete)

- **Method:** `DELETE`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}`
- **Description:** Soft delete a scenario
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (204):** No content
- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found
  - `409`: Scenario has dependent scenarios

#### Duplicate Scenario

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/duplicate`
- **Description:** Create a copy of an existing scenario with all its overrides
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "name": "Copy of Optimistic Scenario"
}
```

- **Success Response (201):**

```json
{
  "id": 791,
  "company_id": "uuid",
  "import_id": 123,
  "dataset_code": "Q1_2025",
  "name": "Copy of Optimistic Scenario",
  "status": "Draft",
  "base_scenario_id": 790,
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "created_at": "2025-01-15T10:50:00Z",
  "overrides_count": 15
}
```

- **Error Responses:**
  - `400`: Invalid request (name empty)
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Source scenario not found
  - `409`: Scenario name conflict

---

### 2.8. Scenario Overrides

#### List Scenario Overrides

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/overrides`
- **Description:** Get all overrides for a scenario
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 50, max: 200): Items per page
- **Success Response (200):**

```json
{
  "scenario_id": 790,
  "overrides": [
    {
      "id": 1001,
      "company_id": "uuid",
      "scenario_id": 790,
      "flow_id": "INV-2025-001",
      "original_date_due": "2025-02-15",
      "original_amount_book_cents": 108500,
      "new_date_due": "2025-02-22",
      "new_amount_book_cents": null,
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "total_pages": 1
  }
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found

#### Create or Update Override

- **Method:** `PUT`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/overrides/{flowId}`
- **Description:** Create or update an override for a specific transaction (upsert)
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "new_date_due": "2025-02-22",
  "new_amount_book_cents": 120000
}
```

- **Success Response (200):**

```json
{
  "id": 1001,
  "company_id": "uuid",
  "scenario_id": 790,
  "flow_id": "INV-2025-001",
  "original_date_due": "2025-02-15",
  "original_amount_book_cents": 108500,
  "new_date_due": "2025-02-22",
  "new_amount_book_cents": 120000,
  "created_at": "2025-01-15T11:00:00Z",
  "updated_at": "2025-01-15T11:05:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid request (both new_date_due and new_amount_book_cents are null, or invalid values)
  - `401`: Unauthorized
  - `403`: User not a member of company or scenario is Locked
  - `404`: Scenario or transaction not found

#### Delete Override

- **Method:** `DELETE`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/overrides/{flowId}`
- **Description:** Remove an override for a specific transaction
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (204):** No content
- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company or scenario is Locked
  - `404`: Override not found

#### Batch Update Overrides

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/overrides/batch`
- **Description:** Create or update multiple overrides in a single request (optimized for drag & drop)
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "overrides": [
    {
      "flow_id": "INV-2025-001",
      "new_date_due": "2025-02-22",
      "new_amount_book_cents": null
    },
    {
      "flow_id": "INV-2025-002",
      "new_date_due": "2025-03-01",
      "new_amount_book_cents": 95000
    }
  ]
}
```

- **Success Response (200):**

```json
{
  "updated_count": 2,
  "overrides": [
    {
      "id": 1001,
      "flow_id": "INV-2025-001",
      "new_date_due": "2025-02-22"
    },
    {
      "id": 1002,
      "flow_id": "INV-2025-002",
      "new_date_due": "2025-03-01",
      "new_amount_book_cents": 95000
    }
  ]
}
```

- **Error Responses:**
  - `400`: Invalid request (empty array, invalid override data)
  - `401`: Unauthorized
  - `403`: User not a member of company or scenario is Locked
  - `404`: Scenario not found
  - `413`: Too many overrides in batch (max 100)

---

### 2.9. Analytics & Aggregations

#### Get Scenario Transactions (Effective View)

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/transactions`
- **Description:** Get all transactions with applied overrides (from scenario_transactions_v)
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `direction` (optional): Filter by direction (INFLOW, OUTFLOW)
  - `date_from` (optional): Filter by effective date (ISO date, inclusive)
  - `date_to` (optional): Filter by effective date (ISO date, inclusive)
  - `time_slot` (optional): Filter by time slot (IB or YYWW format)
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 50, max: 200): Items per page
- **Success Response (200):**

```json
{
  "scenario_id": 790,
  "transactions": [
    {
      "transaction_id": 456,
      "flow_id": "INV-2025-001",
      "dataset_code": "Q1_2025",
      "direction": "INFLOW",
      "time_slot": "2501",
      "currency_tx": "USD",
      "amount_tx_cents": 100000,
      "fx_rate": 1.085,
      "amount_book_cents_original": 108500,
      "date_due_original": "2025-02-15",
      "amount_book_cents_effective": 108500,
      "date_due_effective": "2025-02-22",
      "is_overridden": true,
      "project": "Project Alpha",
      "counterparty": "Client ABC",
      "document": "INV-2025-001",
      "description": "Payment for services",
      "payment_source": "Bank Transfer"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 980,
    "total_pages": 20
  }
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found

#### Get Weekly Aggregates

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates`
- **Description:** Get weekly aggregates with Top-5 transactions (from weekly_aggregates_v)
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

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

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found

#### Get Running Balance

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/running-balance`
- **Description:** Get daily running balance for chart visualization (from running_balance_v)
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "scenario_id": 790,
  "base_currency": "EUR",
  "balances": [
    {
      "as_of_date": "2025-01-01",
      "delta_book_cents": 100000,
      "running_balance_book_cents": 100000
    },
    {
      "as_of_date": "2025-01-02",
      "delta_book_cents": 50000,
      "running_balance_book_cents": 150000
    },
    {
      "as_of_date": "2025-01-03",
      "delta_book_cents": -30000,
      "running_balance_book_cents": 120000
    }
  ]
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Scenario not found

#### Compare Scenarios

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/scenarios/compare`
- **Description:** Compare running balance of two scenarios
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**

```json
{
  "scenario_ids": [789, 790]
}
```

- **Success Response (200):**

```json
{
  "base_currency": "EUR",
  "scenarios": [
    {
      "scenario_id": 789,
      "scenario_name": "Base Scenario",
      "balances": [
        {
          "as_of_date": "2025-01-01",
          "running_balance_book_cents": 100000
        }
      ]
    },
    {
      "scenario_id": 790,
      "scenario_name": "Optimistic Scenario",
      "balances": [
        {
          "as_of_date": "2025-01-01",
          "running_balance_book_cents": 100000
        }
      ]
    }
  ]
}
```

- **Error Responses:**
  - `400`: Invalid request (max 5 scenarios, scenarios must have same dataset_code)
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: One or more scenarios not found

---

### 2.10. Export

#### Export Scenario to Excel

- **Method:** `POST`
- **Path:** `/api/companies/{companyId}/scenarios/{scenarioId}/export`
- **Description:** Generate Excel file with scenario data and running balance chart
- **Headers:** `Authorization: Bearer {token}`
- **Request Body (optional):**

```json
{
  "include_chart": true,
  "include_transactions": true,
  "group_by": "week"
}
```

- **Success Response (202):**

```json
{
  "export_id": "uuid",
  "status": "processing",
  "created_at": "2025-01-15T12:00:00Z"
}
```

- **Error Responses:**
  - `400`: Invalid request
  - `401`: Unauthorized
  - `403`: User not a member of company or scenario not Locked
  - `404`: Scenario not found

#### Get Export Status

- **Method:** `GET`
- **Path:** `/api/companies/{companyId}/exports/{exportId}`
- **Description:** Check status of export job
- **Headers:** `Authorization: Bearer {token}`
- **Success Response (200):**

```json
{
  "export_id": "uuid",
  "scenario_id": 790,
  "status": "completed",
  "download_url": "https://storage.url/export-789-20250115.xlsx",
  "expires_at": "2025-01-22T12:00:00Z",
  "created_at": "2025-01-15T12:00:00Z",
  "completed_at": "2025-01-15T12:01:30Z"
}
```

- **Error Responses:**
  - `401`: Unauthorized
  - `403`: User not a member of company
  - `404`: Export not found

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Provider:** Supabase Auth

**Token Type:** JWT (JSON Web Token)

**Implementation:**

- All protected endpoints require a valid JWT token in the `Authorization` header
- Header format: `Authorization: Bearer {access_token}`
- Tokens are obtained through Supabase Auth endpoints (sign up, sign in)
- Access tokens expire after 1 hour (configurable in Supabase)
- Refresh tokens are used to obtain new access tokens without re-authentication

**Token Validation:**

- Astro middleware validates JWT signature using Supabase public key
- User ID is extracted from `auth.uid()` claim
- Invalid or expired tokens return `401 Unauthorized`

### 3.2. Authorization (Row Level Security)

**Multi-Tenancy Model:**

- All data is scoped to companies
- Users can be members of multiple companies
- Access is controlled via `company_members` table

**RLS Policies (enforced at PostgreSQL level):**

1. **Company Membership Check:**
   - Every query automatically filters by `company_id` where user is a member
   - Implemented via: `EXISTS (SELECT 1 FROM company_members WHERE company_id = <row>.company_id AND user_id = auth.uid())`

2. **Resource-Specific Rules:**
   - **Imports/Transactions:** Read-only for users; write operations only via service_role (Edge Functions)
   - **Scenarios (Draft):** Full CRUD for company members
   - **Scenarios (Locked):** Read-only for company members
   - **Scenario Overrides:** CRUD only when scenario status is 'Draft'

3. **Service Role:**
   - Special `service_role` bypasses RLS
   - Used by Edge Functions for system operations (CSV import, company creation)
   - Never exposed to client applications

**Supabase Client Usage:**

- In Astro endpoints: Access via `context.locals.supabase` (user-scoped client with RLS)
- Edge Functions: Use `supabaseAdmin` (service_role client, bypasses RLS)

### 3.3. Permission Matrix

| Resource               | Create   | Read   | Update   | Delete   | Notes                                  |
| ---------------------- | -------- | ------ | -------- | -------- | -------------------------------------- |
| **Companies**          | Service  | Member | Service  | Service  | Company management via admin functions |
| **User Profile**       | Self     | Self   | Self     | -        | Users manage own profile               |
| **Accounts**           | Member   | Member | Member   | Member   | Full CRUD for company members          |
| **Imports**            | Service  | Member | Service  | Service  | Import via Edge Function               |
| **Transactions**       | Service  | Member | Service  | Service  | Immutable from user perspective        |
| **Scenarios (Draft)**  | Member   | Member | Member   | Soft     | Full control in Draft status           |
| **Scenarios (Locked)** | -        | Member | -        | -        | Read-only when Locked                  |
| **Overrides**          | Member\* | Member | Member\* | Member\* | \*Only when scenario is Draft          |

### 3.4. Rate Limiting

**Implementation:** Middleware-based rate limiting per user/IP

**Limits:**

- **General API:** 100 requests per minute per user
- **CSV Import:** 5 requests per hour per company
- **Export:** 10 requests per hour per company
- **Auth Endpoints:** 10 requests per 15 minutes per IP

**Response for Rate Limit Exceeded:**

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

- **Status Code:** `429 Too Many Requests`
- **Header:** `Retry-After: {seconds}`

### 3.5. CORS Configuration

**Allowed Origins:**

- Production domain (e.g., `https://app.cashflow.example.com`)
- Development: `http://localhost:4321` (Astro default)

**Allowed Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`

**Allowed Headers:** `Authorization, Content-Type, X-Requested-With`

**Credentials:** Allowed (for cookie-based sessions if needed)

---

## 4. Validation and Business Logic

### 4.1. Request Validation

All endpoints validate input using Zod schemas before processing. Common validation rules:

#### Data Types

- **UUID:** Valid UUID v4 format
- **Date:** ISO 8601 format (YYYY-MM-DD)
- **Currency:** 3-letter ISO 4217 code (uppercase, e.g., EUR, USD)
- **Amount:** Non-negative integer (cents)
- **Email:** Valid email format
- **Text Fields:** Non-empty after trimming, max lengths enforced

#### Specific Field Validations

**Companies:**

- `name`: Required, 1-255 characters after trim
- `base_currency`: Required, exactly 3 uppercase letters
- `timezone`: Required, valid IANA timezone string

**Accounts:**

- `name`: Required, 1-255 characters, unique per company
- `currency`: Required, 3-letter ISO code

**Transactions:**

- `amount_tx_cents`: Required, >= 0
- `date_due`: Required, valid date
- `direction`: Required, enum (INFLOW, OUTFLOW)
- `time_slot`: Required, regex `^(IB|[0-9]{4})$`
- `flow_id`: Required, unique per (company_id, dataset_code) for active records
- `fx_rate`: If provided, must be > 0

**Scenarios:**

- `name`: Required, 1-255 characters, unique per (company_id, import_id)
- `start_date`: Required, valid date
- `end_date`: Required, valid date, must be >= start_date
- `dataset_code`: Required, must match existing import
- `status`: Enum (Draft, Locked)

**Scenario Overrides:**

- At least one of `new_date_due` or `new_amount_book_cents` must be provided
- `new_amount_book_cents`: If provided, must be >= 0
- `flow_id`: Must exist in transactions for scenario's dataset_code

### 4.2. Business Logic Rules

#### Import Processing

1. **CSV Validation:**
   - Required columns: company, date, amount, currency, direction, payment_source
   - Optional columns: project, document, counterparty, description
   - Row-level validation captures errors without failing entire import

2. **Transaction Creation:**
   - `flow_id` auto-generated or extracted from document field
   - `time_slot` calculated: "IB" for initial balance, otherwise YYWW format
   - FX conversion: If `currency_tx` ≠ `base_currency`, `fx_rate` required; `amount_book_cents` calculated
   - All transactions linked to import_id

3. **Status Transitions:**
   - `pending` → `processing` (when Edge Function starts)
   - `processing` → `completed` (all valid rows inserted)
   - `processing` → `failed` (critical error)

#### Scenario Management

1. **Creation:**
   - Automatically linked to latest completed import for dataset_code
   - If `base_scenario_id` provided, inherits overrides
   - Initial status: Draft

2. **Locking:**
   - One-way transition: Draft → Locked
   - Sets `locked_at` timestamp and `locked_by` user
   - Prevents all modifications to scenario and overrides
   - Required before export

3. **Soft Delete:**
   - Sets `deleted_at` timestamp
   - Scenarios with `deleted_at IS NOT NULL` excluded from queries
   - Cascade: All overrides remain but are inaccessible

#### Override Logic

1. **First Override:**
   - Captures `original_date_due` and `original_amount_book_cents` from transaction
   - These values are frozen (never updated)

2. **Subsequent Edits:**
   - Only `new_date_due` and/or `new_amount_book_cents` are updated
   - `updated_at` timestamp refreshed

3. **Nullability:**
   - `new_date_due = NULL` means "use original date"
   - `new_amount_book_cents = NULL` means "use original amount"
   - Both NULL = delete override

4. **Validation:**
   - `flow_id` must exist in active transactions for scenario's dataset_code
   - Cannot override IB (Initial Balance) transactions (optional restriction)

#### Weekly Aggregates Calculation

1. **Week Assignment:**
   - `time_slot = "IB"` → week_index = 0
   - Other: Calculate week number from `date_due_effective` and `start_date`

2. **Top-5 Logic:**
   - Rank transactions per (scenario_id, week_index, direction) by `amount_book_cents_effective DESC`
   - Take top 5 per direction
   - Sum remaining as "Other"

3. **Currency Conversion:**
   - All amounts aggregated in `base_currency`
   - Use `amount_book_cents_effective` (already converted)

#### Running Balance Calculation

1. **Initial Balance:**
   - Start from transactions with `time_slot = "IB"`
   - Sum: INFLOW - OUTFLOW

2. **Daily Delta:**
   - Group by `date_due_effective`
   - Sum: INFLOW (positive) + OUTFLOW (negative)

3. **Cumulative Balance:**
   - Window function: `SUM(delta) OVER (ORDER BY date)`

### 4.3. Error Handling

All endpoints return consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "amount_tx_cents",
        "message": "Must be a non-negative integer"
      }
    ]
  }
}
```

#### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource does not exist
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User lacks permission
- `CONFLICT`: Unique constraint violation or business rule conflict
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

#### HTTP Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST (resource created)
- `202 Accepted`: Async operation initiated (e.g., import, export)
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Constraint violation
- `413 Payload Too Large`: File or request too large
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unhandled server error

### 4.4. Pagination

All list endpoints support pagination:

**Query Parameters:**

- `page`: Page number (1-indexed, default: 1)
- `limit`: Items per page (default varies by endpoint, max enforced)

**Response Format:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 980,
    "total_pages": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

### 4.5. Sorting and Filtering

**Sorting:**

- `sort`: Field name (e.g., `date_due`, `amount_book_cents`)
- `order`: Direction (`asc`, `desc`)

**Filtering:**

- Varies by resource (see endpoint documentation)
- Multiple filters combined with AND logic
- Date ranges: `date_from` and `date_to` (inclusive)
- Full-text search: `search` parameter (uses PostgreSQL GIN index)

---

## 5. Performance Considerations

### 5.1. Database Optimization

- **Indexes:** All foreign keys indexed, composite indexes for common queries
- **Views:** Materialized or optimized views for complex aggregations
- **Connection Pooling:** Supabase handles connection pooling automatically

### 5.2. Caching Strategy

- **Static Data:** Company configuration, user profiles cached for 5 minutes
- **Aggregates:** Weekly aggregates and running balance cached per scenario version
- **Cache Invalidation:** On scenario lock, override changes, or new import

### 5.3. Async Processing

- **CSV Import:** Processed asynchronously via Supabase Edge Function
- **Excel Export:** Generated asynchronously, polling via export status endpoint
- **Long-running Queries:** Time limits enforced, return 202 Accepted with job ID

### 5.4. Payload Size Limits

- **CSV Upload:** Max 10MB per file, ~50k rows recommended
- **Batch Override:** Max 100 overrides per request
- **Response Size:** Pagination enforced to prevent large responses

---

## 6. API Versioning

**Strategy:** URL path versioning

**Current Version:** v1

**Format:** `/api/v1/{resource}`

**Note:** For MVP, version prefix may be omitted (defaults to v1). Once in production, all endpoints should use explicit versioning for future compatibility.

---

## 7. Webhooks (Future Consideration)

Not implemented in MVP, but designed for future expansion:

- Import completion notifications
- Scenario lock events
- Export ready notifications

---

## 8. OpenAPI Specification

A full OpenAPI 3.0 specification should be generated from this plan to provide:

- Interactive API documentation (Swagger UI)
- Client SDK generation
- Contract testing

---

## Summary

This REST API plan provides comprehensive coverage of the CashFlow Scenarios MVP requirements:

✅ **Authentication & Multi-tenancy** via Supabase Auth and RLS  
✅ **CSV Import** with async processing and error reporting  
✅ **Scenario Management** with Draft/Locked states and duplication  
✅ **Transaction Overrides** with batch support for drag & drop UX  
✅ **Analytics Views** for weekly aggregates, Top-5, and running balance  
✅ **Export to Excel** with async generation  
✅ **Validation & Security** at every layer  
✅ **Performance Optimization** through indexes, views, and caching

The API is designed to be consumed by the Astro frontend with React islands, leveraging Supabase's RLS for secure multi-tenant data access while maintaining clean separation between user operations and system operations.
