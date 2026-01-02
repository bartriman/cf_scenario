# Import CSV View Implementation Plan

## Analiza endpointów dla Widoku 3: Import CSV (US-002 i US-003)

---

## **Endpoint Description**

### Przegląd

Widok 3: Import CSV wymaga następujących kluczowych endpointów do obsługi historyjek użytkownika **US-002** (Import transakcji z CSV) oraz **US-003** (Obsługa błędów importu):

### 1. **POST /api/companies/{companyId}/imports**
**Cel:** Upload pliku CSV i zainicjowanie procesu importu transakcji

**Użycie w UI:**
- Krok 1 kreatora importu: Upload pliku
- Wywoływany po przeciągnięciu pliku CSV przez użytkownika i podaniu dataset_code
- Zwraca ID importu, który jest używany do śledzenia statusu

**Kluczowe funkcje:**
- Walidacja formatu pliku (.csv)
- Walidacja rozmiaru (max 10MB)
- Utworzenie rekordu importu ze statusem 'pending'
- Uruchomienie Edge Function do przetwarzania w tle

**Odpowiedź sukcesu (202 Accepted):**
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

---

### 2. **GET /api/companies/{companyId}/imports/{importId}**
**Cel:** Pobranie szczegółowych informacji o imporcie wraz ze statusem przetwarzania

**Użycie w UI:**
- Krok 2-3 kreatora importu: Monitoring statusu walidacji i przetwarzania
- Polling co 2-3 sekundy do momentu zmiany statusu z 'processing' na 'completed' lub 'failed'
- Wyświetlanie statystyk: total_rows, valid_rows, invalid_rows

**Kluczowe funkcje:**
- Zwraca aktualny status importu
- Dostarcza statystyki walidacji
- Zawiera raport błędów (JSON i opcjonalnie URL do pliku CSV)
- Informacja o utworzonym scenariuszu bazowym (jeśli status='completed')

**Odpowiedź sukcesu (200 OK):**
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
  "created_at": "2025-01-15T10:30:00Z",
  "base_scenario_id": 789
}
```

---

### 3. **GET /api/companies/{companyId}/imports/{importId}/errors**
**Cel:** Pobranie szczegółowej listy błędów walidacji dla nieprawidłowych wierszy

**Użycie w UI:**
- ValidationErrorTable w kroku 2 kreatora
- Wyświetlanie użytkownikowi szczegółowych informacji o błędach
- Paginacja dla dużej liczby błędów
- Możliwość pobrania raportu błędów do naprawy

**Kluczowe funkcje:**
- Lista wierszy, które nie przeszły walidacji
- Dla każdego błędu: numer wiersza, surowe dane, opis błędu
- Paginacja (domyślnie 50 błędów na stronę, max 200)
- Umożliwia użytkownikowi zrozumienie i naprawę problemów

**Odpowiedź sukcesu (200 OK):**
```json
{
  "import_id": 123,
  "errors": [
    {
      "row_number": 15,
      "raw_data": {
        "company": "ABC Corp",
        "date": "invalid-date",
        "amount": "1000",
        "currency": "USD",
        "direction": "IN"
      },
      "error_message": "Invalid date format. Expected ISO date (YYYY-MM-DD)",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "row_number": 42,
      "raw_data": {
        "company": "XYZ Ltd",
        "date": "2025-03-15",
        "amount": "not-a-number",
        "currency": "EUR",
        "direction": "OUT"
      },
      "error_message": "Invalid amount format. Expected numeric value",
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

---

### 4. **GET /api/companies/{companyId}/imports**
**Cel:** Lista wszystkich importów dla danej firmy (opcjonalnie pomocnicze)

**Użycie w UI:**
- Opcjonalne: Historia importów dostępna z dashboardu
- Filtrowanie po statusie i dataset_code
- Nie jest krytyczne dla podstawowego flow US-002/US-003

---

## **Endpoint Implementation**

### Architektura implementacji

```
Client (ImportWizard)
    ↓
Astro API Route (/src/pages/api/companies/[companyId]/imports/...)
    ↓
Middleware (Auth + RLS Setup)
    ↓
Validation Layer (Zod schemas)
    ↓
Service Layer (/src/lib/services/import.service.ts)
    ↓
Supabase Client (RLS enabled) + Edge Function (dla przetwarzania CSV)
    ↓
PostgreSQL (tables: imports, import_rows, transactions, scenarios)
```

---

### 1. **POST /api/companies/{companyId}/imports**

#### Lokalizacja pliku
`/src/pages/api/companies/[companyId]/imports/index.ts`

#### DTOs i Validation Schemas

**Request (multipart/form-data):**
```typescript
// src/lib/validation/import.validation.ts
import { z } from 'zod';

export const CreateImportParamsSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format')
});

export const CreateImportBodySchema = z.object({
  dataset_code: z.string()
    .min(1, 'Dataset code is required')
    .max(50, 'Dataset code too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Dataset code can only contain letters, numbers, hyphens and underscores')
});

// File validation handled separately via FormData
export const ImportFileSchema = z.object({
  type: z.literal('text/csv', {
    errorMap: () => ({ message: 'File must be a CSV file' })
  }),
  size: z.number()
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB')
});
```

**Response DTO:**
```typescript
// src/types.ts
export interface ImportCreatedResponseDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  status: 'pending';
  file_name: string;
  created_at: string;
}
```

#### Implementacja Route Handler

```typescript
// src/pages/api/companies/[companyId]/imports/index.ts
import type { APIContext } from 'astro';
import { CreateImportParamsSchema, CreateImportBodySchema } from '@/lib/validation/import.validation';
import { createImport } from '@/lib/services/import.service';

export const prerender = false;

export async function POST({ params, request, locals }: APIContext) {
  try {
    // 1. Validate params
    const paramsResult = CreateImportParamsSchema.safeParse(params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: paramsResult.error.issues
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { companyId } = paramsResult.data;

    // 2. Get authenticated Supabase client
    const supabase = locals.supabase;
    if (!supabase) {
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

    // 3. Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataset_code = formData.get('dataset_code') as string;

    if (!file || !dataset_code) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: file and dataset_code'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate file
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File must be a CSV file'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size cannot exceed 10MB'
          }
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Validate dataset_code
    const bodyResult = CreateImportBodySchema.safeParse({ dataset_code });
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dataset code',
            details: bodyResult.error.issues
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Call service layer
    const importRecord = await createImport(
      supabase,
      companyId,
      dataset_code,
      file
    );

    // 7. Return success response
    return new Response(
      JSON.stringify(importRecord),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Import creation error:', error);
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not a member')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'FORBIDDEN',
              message: 'User not a member of company'
            }
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generic error
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
}
```

#### Service Layer

```typescript
// src/lib/services/import.service.ts
import type { SupabaseClient } from '@/db/supabase.client';
import type { ImportCreatedResponseDTO } from '@/types';

export async function createImport(
  supabase: SupabaseClient,
  companyId: string,
  datasetCode: string,
  file: File
): Promise<ImportCreatedResponseDTO> {
  
  // 1. Verify user is member of company (RLS will enforce this too)
  const { data: membership, error: memberError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('company_id', companyId)
    .single();

  if (memberError || !membership) {
    throw new Error('User not a member of company');
  }

  // 2. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // 3. Create import record with status 'pending'
  const { data: importRecord, error: insertError } = await supabase
    .from('imports')
    .insert({
      company_id: companyId,
      dataset_code: datasetCode,
      status: 'pending',
      file_name: file.name,
      uploaded_by: user.id,
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      inserted_transactions_count: 0
    })
    .select()
    .single();

  if (insertError || !importRecord) {
    throw new Error(`Failed to create import record: ${insertError?.message}`);
  }

  // 4. Upload file to Supabase Storage
  const filePath = `imports/${companyId}/${importRecord.id}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('csv-imports')
    .upload(filePath, file);

  if (uploadError) {
    // Rollback: delete import record
    await supabase.from('imports').delete().eq('id', importRecord.id);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // 5. Invoke Edge Function to process CSV asynchronously
  const { error: functionError } = await supabase.functions.invoke('process-csv-import', {
    body: {
      import_id: importRecord.id,
      company_id: companyId,
      file_path: filePath
    }
  });

  if (functionError) {
    console.error('Failed to invoke Edge Function:', functionError);
    // Don't fail the request - processing will be retried
  }

  // 6. Return DTO
  return {
    id: importRecord.id,
    company_id: importRecord.company_id,
    dataset_code: importRecord.dataset_code,
    status: 'pending',
    file_name: importRecord.file_name,
    created_at: importRecord.created_at
  };
}
```

---

### 2. **GET /api/companies/{companyId}/imports/{importId}**

#### Lokalizacja pliku
`/src/pages/api/companies/[companyId]/imports/[importId]/index.ts`

#### DTOs i Validation Schemas

```typescript
// src/lib/validation/import.validation.ts
export const GetImportParamsSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
  importId: z.coerce.number().int().positive('Import ID must be a positive integer')
});
```

**Response DTO:**
```typescript
// src/types.ts
export interface ImportDetailResponseDTO {
  id: number;
  company_id: string;
  dataset_code: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  inserted_transactions_count: number;
  error_report_json: any | null;
  error_report_url: string | null;
  file_name: string | null;
  uploaded_by: string | null;
  created_at: string;
  base_scenario_id?: number; // Added if status='completed'
}
```

#### Implementacja Route Handler

```typescript
// src/pages/api/companies/[companyId]/imports/[importId]/index.ts
import type { APIContext } from 'astro';
import { GetImportParamsSchema } from '@/lib/validation/import.validation';
import { getImportDetails } from '@/lib/services/import.service';

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  try {
    // 1. Validate params
    const paramsResult = GetImportParamsSchema.safeParse(params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: paramsResult.error.issues
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { companyId, importId } = paramsResult.data;

    // 2. Get authenticated Supabase client
    const supabase = locals.supabase;
    if (!supabase) {
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

    // 3. Call service layer
    const importDetails = await getImportDetails(supabase, companyId, importId);

    if (!importDetails) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Import not found'
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Return success response
    return new Response(
      JSON.stringify(importDetails),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get import details error:', error);
    
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
}
```

#### Service Layer

```typescript
// src/lib/services/import.service.ts (dodanie funkcji)
export async function getImportDetails(
  supabase: SupabaseClient,
  companyId: string,
  importId: number
): Promise<ImportDetailResponseDTO | null> {
  
  // 1. Fetch import record (RLS automatically filters by company membership)
  const { data: importRecord, error } = await supabase
    .from('imports')
    .select('*')
    .eq('id', importId)
    .eq('company_id', companyId)
    .single();

  if (error || !importRecord) {
    return null;
  }

  // 2. If completed, find base scenario created from this import
  let baseScenarioId: number | undefined;
  if (importRecord.status === 'completed') {
    const { data: scenario } = await supabase
      .from('scenarios')
      .select('id')
      .eq('import_id', importId)
      .eq('company_id', companyId)
      .is('base_scenario_id', null)
      .is('deleted_at', null)
      .single();
    
    if (scenario) {
      baseScenarioId = scenario.id;
    }
  }

  // 3. Return DTO
  return {
    ...importRecord,
    base_scenario_id: baseScenarioId
  };
}
```

---

### 3. **GET /api/companies/{companyId}/imports/{importId}/errors**

#### Lokalizacja pliku
`/src/pages/api/companies/[companyId]/imports/[importId]/errors.ts`

#### DTOs i Validation Schemas

```typescript
// src/lib/validation/import.validation.ts
export const GetImportErrorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});
```

**Response DTO:**
```typescript
// src/types.ts
export interface ImportErrorRowDTO {
  row_number: number;
  raw_data: Record<string, any>;
  error_message: string;
  created_at: string;
}

export interface ImportErrorsResponseDTO {
  import_id: number;
  errors: ImportErrorRowDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### Implementacja Route Handler

```typescript
// src/pages/api/companies/[companyId]/imports/[importId]/errors.ts
import type { APIContext } from 'astro';
import { GetImportParamsSchema, GetImportErrorsQuerySchema } from '@/lib/validation/import.validation';
import { getImportErrors } from '@/lib/services/import.service';

export const prerender = false;

export async function GET({ params, url, locals }: APIContext) {
  try {
    // 1. Validate params
    const paramsResult = GetImportParamsSchema.safeParse(params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: paramsResult.error.issues
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate query params
    const queryParams = Object.fromEntries(url.searchParams);
    const queryResult = GetImportErrorsQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.issues
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { companyId, importId } = paramsResult.data;
    const { page, limit } = queryResult.data;

    // 3. Get authenticated Supabase client
    const supabase = locals.supabase;
    if (!supabase) {
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

    // 4. Call service layer
    const errorsResponse = await getImportErrors(
      supabase,
      companyId,
      importId,
      page,
      limit
    );

    if (!errorsResponse) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Import not found'
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Return success response
    return new Response(
      JSON.stringify(errorsResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get import errors error:', error);
    
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
}
```

#### Service Layer

```typescript
// src/lib/services/import.service.ts (dodanie funkcji)
export async function getImportErrors(
  supabase: SupabaseClient,
  companyId: string,
  importId: number,
  page: number,
  limit: number
): Promise<ImportErrorsResponseDTO | null> {
  
  // 1. Verify import exists and belongs to company
  const { data: importRecord, error: importError } = await supabase
    .from('imports')
    .select('id')
    .eq('id', importId)
    .eq('company_id', companyId)
    .single();

  if (importError || !importRecord) {
    return null;
  }

  // 2. Get total count of error rows
  const { count, error: countError } = await supabase
    .from('import_rows')
    .select('*', { count: 'exact', head: true })
    .eq('import_id', importId)
    .eq('company_id', companyId)
    .eq('is_valid', false);

  if (countError) {
    throw new Error(`Failed to count error rows: ${countError.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // 3. Fetch paginated error rows
  const offset = (page - 1) * limit;
  const { data: errorRows, error: rowsError } = await supabase
    .from('import_rows')
    .select('row_number, raw_data, error_message, created_at')
    .eq('import_id', importId)
    .eq('company_id', companyId)
    .eq('is_valid', false)
    .order('row_number', { ascending: true })
    .range(offset, offset + limit - 1);

  if (rowsError) {
    throw new Error(`Failed to fetch error rows: ${rowsError.message}`);
  }

  // 4. Return DTO
  return {
    import_id: importId,
    errors: errorRows || [],
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages
    }
  };
}
```

---

### Dodatkowe komponenty implementacji

#### Edge Function dla przetwarzania CSV

**Lokalizacja:** `supabase/functions/process-csv-import/index.ts`

Odpowiedzialność:
- Parsowanie pliku CSV
- Walidacja każdego wiersza
- Zapisywanie valid/invalid rows do `import_rows`
- Tworzenie rekordów w `transactions`
- Utworzenie bazowego scenariusza
- Aktualizacja statusu importu

#### Storage Bucket

**Konfiguracja:** Utworzenie bucket `csv-imports` w Supabase Storage z RLS:
- Użytkownicy mogą uploadować tylko do własnych folderów firm
- Pliki są dostępne tylko dla członków danej firmy

---

## Podsumowanie

To kompletny opis i implementacja kluczowych endpointów dla Widoku 3: Import CSV obsługujących historyjki US-002 i US-003. Implementacja zapewnia:

1. **Bezpieczeństwo:** RLS, walidacja na każdym etapie, autentykacja JWT
2. **Skalowalność:** Asynchroniczne przetwarzanie przez Edge Functions
3. **User Experience:** Szczegółowe raporty błędów, paginacja, polling statusu
4. **Spójność architektury:** Zgodność z istniejącym stosem technologicznym (Astro, Supabase, TypeScript, Zod)
