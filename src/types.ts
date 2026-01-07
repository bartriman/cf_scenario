import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

// Transaction direction
export const TransactionDirection = {
  INFLOW: "INFLOW",
  OUTFLOW: "OUTFLOW",
} as const;
export type TransactionDirectionType = (typeof TransactionDirection)[keyof typeof TransactionDirection];

// Scenario status
export const ScenarioStatus = {
  DRAFT: "Draft",
  LOCKED: "Locked",
} as const;
export type ScenarioStatusType = (typeof ScenarioStatus)[keyof typeof ScenarioStatus];

// Import status
export const ImportStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export type ImportStatusType = (typeof ImportStatus)[keyof typeof ImportStatus];

// Export status
export const ExportStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export type ExportStatusType = (typeof ExportStatus)[keyof typeof ExportStatus];

// Error codes for API responses
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// Sort order
export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;
export type SortOrderType = (typeof SortOrder)[keyof typeof SortOrder];

// Transaction sort fields
export const TransactionSortField = {
  DATE_DUE: "date_due",
  AMOUNT_BOOK_CENTS: "amount_book_cents",
  CREATED_AT: "created_at",
} as const;
export type TransactionSortFieldType = (typeof TransactionSortField)[keyof typeof TransactionSortField];

// Export group by options
export const ExportGroupBy = {
  WEEK: "week",
  DAY: "day",
  MONTH: "month",
} as const;
export type ExportGroupByType = (typeof ExportGroupBy)[keyof typeof ExportGroupBy];

// =============================================================================
// ENTITY TYPES (Direct mappings from database)
// =============================================================================

export type Company = Tables<"companies">;
export type Account = Tables<"accounts">;
export type Import = Tables<"imports">;
export type ImportRow = Tables<"import_rows">;
export type Transaction = Tables<"transactions">;
export type Scenario = Tables<"scenarios">;
export type ScenarioOverride = Tables<"scenario_overrides">;
export type UserProfile = Tables<"user_profiles">;
export type CompanyMember = Tables<"company_members">;

// Insert types (for creating new records)
export type CompanyInsert = TablesInsert<"companies">;
export type AccountInsert = TablesInsert<"accounts">;
export type ImportInsert = TablesInsert<"imports">;
export type ImportRowInsert = TablesInsert<"import_rows">;
export type TransactionInsert = TablesInsert<"transactions">;
export type ScenarioInsert = TablesInsert<"scenarios">;
export type ScenarioOverrideInsert = TablesInsert<"scenario_overrides">;
export type UserProfileInsert = TablesInsert<"user_profiles">;
export type CompanyMemberInsert = TablesInsert<"company_members">;

// Update types (for updating existing records)
export type CompanyUpdate = TablesUpdate<"companies">;
export type AccountUpdate = TablesUpdate<"accounts">;
export type ImportUpdate = TablesUpdate<"imports">;
export type ImportRowUpdate = TablesUpdate<"import_rows">;
export type TransactionUpdate = TablesUpdate<"transactions">;
export type ScenarioUpdate = TablesUpdate<"scenarios">;
export type ScenarioOverrideUpdate = TablesUpdate<"scenario_overrides">;
export type UserProfileUpdate = TablesUpdate<"user_profiles">;
export type CompanyMemberUpdate = TablesUpdate<"company_members">;

// Views
export type RunningBalanceRow = Tables<"running_balance_v">;
export type ScenarioTransactionRow = Tables<"scenario_transactions_v">;
export type ScenarioExportRow = Tables<"scenario_export_v">;
export type ScenarioSummaryRow = Tables<"scenario_summary_v">;
export type WeeklyAggregateRow = Tables<"weekly_aggregates_v">;

// =============================================================================
// AUTHENTICATION DTOs
// =============================================================================

// 1. Sign Up Request DTO
export interface SignUpRequestDTO {
  email: string;
  password: string;
}

// 2. Sign Up Response DTO
export interface SignUpResponseDTO {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// 3. Sign In Request DTO
export interface SignInRequestDTO {
  email: string;
  password: string;
}

// 4. Sign In Response DTO
export interface SignInResponseDTO {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// =============================================================================
// USER PROFILE DTOs
// =============================================================================

// 5. User Company DTO - Company data from user's perspective
export interface UserCompanyDTO {
  company_id: string;
  name: string;
  base_currency: string;
  joined_at: string;
}

// 6. User Profile Response DTO
export interface UserProfileResponseDTO {
  user_id: string;
  default_company_id: string | null;
  created_at: string;
  companies: UserCompanyDTO[];
}

// 7. Update User Profile Request DTO
export interface UpdateUserProfileRequestDTO {
  default_company_id: string;
}

// 8. Update User Profile Response DTO
export interface UpdateUserProfileResponseDTO {
  user_id: string;
  default_company_id: string | null;
  updated_at: string;
}

// =============================================================================
// COMPANY DTOs
// =============================================================================

// 9. Company List Item DTO
export type CompanyListItemDTO = Pick<Company, "id" | "name" | "base_currency" | "timezone"> & {
  joined_at: string; // from company_members
};

// 10. Company List Response DTO
export interface CompanyListResponseDTO {
  companies: CompanyListItemDTO[];
}

// 11. Company Details Response DTO
export type CompanyDetailsResponseDTO = Pick<Company, "id" | "name" | "base_currency" | "timezone" | "created_at"> & {
  members_count: number;
};

// =============================================================================
// ACCOUNT DTOs
// =============================================================================

// 12. Account DTO - Base account representation
export type AccountDTO = Pick<Account, "id" | "company_id" | "name" | "currency" | "created_at">;

// 13. Account List Response DTO
export interface AccountListResponseDTO {
  accounts: AccountDTO[];
}

// 14. Create Account Request DTO
export interface CreateAccountRequestDTO {
  name: string;
  currency: string;
}

// 15. Create Account Response DTO
export type CreateAccountResponseDTO = AccountDTO;

// 16. Update Account Request DTO
export interface UpdateAccountRequestDTO {
  name: string;
  currency: string;
}

// 17. Update Account Response DTO
export type UpdateAccountResponseDTO = AccountDTO & {
  updated_at: string;
};

// =============================================================================
// IMPORT DTOs
// =============================================================================

// 18. Import List Item DTO
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

// 19. Import List Response DTO with pagination
export interface ImportListResponseDTO {
  imports: ImportListItemDTO[];
  pagination: PaginationDTO;
}

// 20. Import Details Response DTO
export type ImportDetailsResponseDTO = Pick<
  Import,
  | "id"
  | "company_id"
  | "dataset_code"
  | "status"
  | "total_rows"
  | "valid_rows"
  | "invalid_rows"
  | "inserted_transactions_count"
  | "error_report_json"
  | "error_report_url"
  | "file_name"
  | "uploaded_by"
  | "created_at"
>;

// 21. Create Import Request DTO (multipart form data structure)
export interface CreateImportRequestDTO {
  file: File;
  dataset_code: string;
}

// 22. Create Import Response DTO
export type CreateImportResponseDTO = Pick<
  Import,
  "id" | "company_id" | "dataset_code" | "status" | "file_name" | "created_at"
>;

// 23. Import Error Row DTO
export type ImportErrorRowDTO = Pick<ImportRow, "row_number" | "raw_data" | "error_message" | "created_at">;

// 24. Import Error Rows Response DTO
export interface ImportErrorRowsResponseDTO {
  import_id: number;
  errors: ImportErrorRowDTO[];
  pagination: PaginationDTO;
}

// =============================================================================
// TRANSACTION DTOs
// =============================================================================

// 25. Transaction DTO - Full transaction details
export type TransactionDTO = Pick<
  Transaction,
  | "id"
  | "company_id"
  | "import_id"
  | "dataset_code"
  | "flow_id"
  | "account_id"
  | "is_active"
  | "amount_tx_cents"
  | "currency_tx"
  | "fx_rate"
  | "amount_book_cents"
  | "date_due"
  | "direction"
  | "time_slot"
  | "project"
  | "counterparty"
  | "document"
  | "description"
  | "payment_source"
  | "created_at"
>;

// 26. Transaction List Response DTO
export interface TransactionListResponseDTO {
  transactions: TransactionDTO[];
  pagination: PaginationDTO;
}

// 27. Transaction Details Response DTO (same as TransactionDTO)
export type TransactionDetailsResponseDTO = TransactionDTO;

// =============================================================================
// SCENARIO DTOs
// =============================================================================

// 28. Scenario List Item DTO
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

// 29. Scenario List Response DTO
export interface ScenarioListResponseDTO {
  scenarios: ScenarioListItemDTO[];
  pagination: PaginationDTO;
}

// 30. Scenario Details Response DTO
export type ScenarioDetailsResponseDTO = ScenarioListItemDTO & {
  overrides_count: number;
};

// 31. Create Scenario Request DTO
export interface CreateScenarioRequestDTO {
  dataset_code: string;
  name: string;
  base_scenario_id?: number;
  start_date: string;
  end_date: string;
}

// 32. Create Scenario Response DTO
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

// 33. Update Scenario Request DTO
export interface UpdateScenarioRequestDTO {
  name?: string;
  start_date?: string;
  end_date?: string;
}

// 34. Update Scenario Response DTO
export type UpdateScenarioResponseDTO = Pick<
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
> & {
  updated_at: string;
};

// 35. Lock Scenario Response DTO
export interface LockScenarioResponseDTO {
  id: number;
  status: string;
  locked_at: string;
  locked_by: string;
}

// 36. Duplicate Scenario Request DTO
export interface DuplicateScenarioRequestDTO {
  name: string;
}

// 37. Duplicate Scenario Response DTO
export type DuplicateScenarioResponseDTO = CreateScenarioResponseDTO & {
  overrides_count: number;
};

// =============================================================================
// SCENARIO OVERRIDE DTOs
// =============================================================================

// 38. Scenario Override DTO
export type ScenarioOverrideDTO = Pick<
  ScenarioOverride,
  | "id"
  | "company_id"
  | "scenario_id"
  | "flow_id"
  | "original_date_due"
  | "original_amount_book_cents"
  | "new_date_due"
  | "new_amount_book_cents"
  | "created_at"
  | "updated_at"
>;

// 39. Scenario Override List Response DTO
export interface ScenarioOverrideListResponseDTO {
  scenario_id: number;
  overrides: ScenarioOverrideDTO[];
  pagination: PaginationDTO;
}

// 40. Create/Update Override Request DTO (upsert)
export interface UpsertOverrideRequestDTO {
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
}

// 41. Create/Update Override Response DTO
export type UpsertOverrideResponseDTO = ScenarioOverrideDTO;

// 42. Batch Override Item DTO - Single item in batch update
export interface BatchOverrideItemDTO {
  flow_id: string;
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
}

// 43. Batch Update Overrides Request DTO
export interface BatchUpdateOverridesRequestDTO {
  overrides: BatchOverrideItemDTO[];
}

// 44. Batch Override Result DTO - Result of a single override in batch
export interface BatchOverrideResultDTO {
  id: number;
  flow_id: string;
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
}

// 45. Batch Update Overrides Response DTO
export interface BatchUpdateOverridesResponseDTO {
  updated_count: number;
  overrides: BatchOverrideResultDTO[];
}

// =============================================================================
// ANALYTICS & AGGREGATION DTOs
// =============================================================================

// 46. Scenario Transaction DTO - Transaction with applied overrides (from scenario_transactions_v)
export type ScenarioTransactionDTO = Pick<
  ScenarioTransactionRow,
  | "transaction_id"
  | "flow_id"
  | "dataset_code"
  | "direction"
  | "time_slot"
  | "currency_tx"
  | "amount_tx_cents"
  | "fx_rate"
  | "amount_book_cents_original"
  | "date_due_original"
  | "amount_book_cents_effective"
  | "date_due_effective"
  | "is_overridden"
  | "project"
  | "counterparty"
  | "document"
  | "description"
  | "payment_source"
>;

// 47. Scenario Transaction List Response DTO
export interface ScenarioTransactionListResponseDTO {
  scenario_id: number;
  transactions: ScenarioTransactionDTO[];
  pagination: PaginationDTO;
}

// 48. Top Transaction Item DTO - Transaction in Top-5 list
export interface TopTransactionItemDTO {
  flow_id: string;
  amount_book_cents: number;
  counterparty: string;
  description: string;
  date_due: string;
}

// 49. Week Aggregate DTO - Single week's aggregated data
export interface WeekAggregateDTO {
  week_index: number;
  week_label: string;
  week_start_date: string | null;
  inflow_total_book_cents: number;
  outflow_total_book_cents: number;
  inflow_top5: TopTransactionItemDTO[];
  outflow_top5: TopTransactionItemDTO[];
  inflow_other_book_cents: number;
  outflow_other_book_cents: number;
}

// 50. Weekly Aggregates Response DTO
export interface WeeklyAggregatesResponseDTO {
  scenario_id: number;
  base_currency: string;
  weeks: WeekAggregateDTO[];
}

// 51. Running Balance Item DTO - Single day's balance (from running_balance_v)
export type RunningBalanceItemDTO = Pick<
  RunningBalanceRow,
  "as_of_date" | "delta_book_cents" | "running_balance_book_cents"
> & {
  // Ensure non-null values for response
  as_of_date: string;
  delta_book_cents: number;
  running_balance_book_cents: number;
};

// 52. Running Balance Response DTO
export interface RunningBalanceResponseDTO {
  scenario_id: number;
  base_currency: string;
  balances: RunningBalanceItemDTO[];
}

// 53. Scenario Comparison Balance DTO - Balance data for one scenario in comparison
export interface ScenarioComparisonBalanceDTO {
  as_of_date: string;
  running_balance_book_cents: number;
}

// 54. Scenario Comparison Item DTO - One scenario's data in comparison
export interface ScenarioComparisonItemDTO {
  scenario_id: number;
  scenario_name: string;
  balances: ScenarioComparisonBalanceDTO[];
}

// 55. Compare Scenarios Request DTO
export interface CompareScenariosRequestDTO {
  scenario_ids: number[];
}

// 56. Compare Scenarios Response DTO
export interface CompareScenariosResponseDTO {
  base_currency: string;
  scenarios: ScenarioComparisonItemDTO[];
}

// =============================================================================
// EXPORT DTOs
// =============================================================================

// 57. Export Scenario Request DTO
export interface ExportScenarioRequestDTO {
  include_chart?: boolean;
  include_transactions?: boolean;
  group_by?: ExportGroupByType;
}

// 58. Export Scenario Response DTO (initial response)
export interface ExportScenarioResponseDTO {
  export_id: string;
  status: string;
  created_at: string;
}

// 59. Export Status Response DTO
export interface ExportStatusResponseDTO {
  export_id: string;
  scenario_id: number;
  status: string;
  download_url?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
}

// =============================================================================
// COMMON DTOs
// =============================================================================

// 60. Pagination DTO - Used across all paginated responses
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

// 61. Error Detail DTO - Single validation error
export interface ErrorDetailDTO {
  field: string;
  message: string;
}

// 62. Error Response DTO - Standard error response
export interface ErrorResponseDTO {
  error: {
    code: ErrorCodeType;
    message: string;
    details?: ErrorDetailDTO[];
  };
}

// =============================================================================
// COMMAND MODELS (For internal processing/business logic)
// =============================================================================

// Command for creating a new company (admin/service operation)
export type CreateCompanyCommand = TablesInsert<"companies">;

// Command for creating a new user profile
export type CreateUserProfileCommand = TablesInsert<"user_profiles">;

// Command for adding user to company
export type AddCompanyMemberCommand = TablesInsert<"company_members">;

// Command for creating an account
export type CreateAccountCommand = Omit<TablesInsert<"accounts">, "id" | "created_at">;

// Command for updating an account
export interface UpdateAccountCommand {
  id: number;
  company_id: string;
  data: Pick<TablesUpdate<"accounts">, "name" | "currency">;
}

// Command for deleting an account
export interface DeleteAccountCommand {
  id: number;
  company_id: string;
}

// Command for creating an import (service operation)
export type CreateImportCommand = Omit<TablesInsert<"imports">, "id" | "created_at">;

// Command for creating import rows (service operation)
export type CreateImportRowCommand = Omit<TablesInsert<"import_rows">, "id" | "created_at">;

// Command for creating a transaction (service operation)
export type CreateTransactionCommand = Omit<TablesInsert<"transactions">, "id" | "created_at">;

// Command for creating a scenario
export type CreateScenarioCommand = Omit<TablesInsert<"scenarios">, "id" | "created_at" | "deleted_at">;

// Command for updating a scenario
export interface UpdateScenarioCommand {
  id: number;
  company_id: string;
  data: Pick<TablesUpdate<"scenarios">, "name" | "start_date" | "end_date">;
}

// Command for locking a scenario
export interface LockScenarioCommand {
  scenario_id: number;
  locked_by: string;
}

// Command for soft deleting a scenario
export interface SoftDeleteScenarioCommand {
  scenario_id: number;
}

// Command for duplicating a scenario
export interface DuplicateScenarioCommand {
  source_scenario_id: number;
  new_name: string;
  company_id: string;
}

// Command for creating/updating an override
export interface UpsertOverrideCommand {
  company_id: string;
  scenario_id: number;
  flow_id: string;
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
  original_date_due: string;
  original_amount_book_cents: number;
}

// Command for deleting an override
export interface DeleteOverrideCommand {
  company_id: string;
  scenario_id: number;
  flow_id: string;
}

// Command for batch upserting overrides
export interface BatchUpsertOverridesCommand {
  company_id: string;
  scenario_id: number;
  overrides: {
    flow_id: string;
    new_date_due?: string | null;
    new_amount_book_cents?: number | null;
    original_date_due: string;
    original_amount_book_cents: number;
  }[];
}

// Command for updating user profile default company
export interface UpdateUserProfileDefaultCompanyCommand {
  user_id: string;
  default_company_id: string;
}

// =============================================================================
// QUERY PARAMETER TYPES (For filtering, sorting, and pagination)
// =============================================================================

// Base pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Account list query params
export interface AccountListQueryParams {
  currency?: string;
}

// Import list query params
export type ImportListQueryParams = PaginationParams & {
  status?: ImportStatusType;
  dataset_code?: string;
};

// Transaction list query params
export type TransactionListQueryParams = PaginationParams & {
  dataset_code?: string;
  import_id?: number;
  direction?: TransactionDirectionType;
  date_from?: string;
  date_to?: string;
  project?: string;
  counterparty?: string;
  search?: string;
  sort?: TransactionSortFieldType;
  order?: SortOrderType;
};

// Scenario list query params
export type ScenarioListQueryParams = PaginationParams & {
  dataset_code?: string;
  status?: ScenarioStatusType;
};

// Scenario transaction list query params
export type ScenarioTransactionListQueryParams = PaginationParams & {
  direction?: TransactionDirectionType;
  date_from?: string;
  date_to?: string;
  time_slot?: string;
};

// Import error rows query params
export type ImportErrorRowsQueryParams = PaginationParams;

// Scenario override list query params
export type ScenarioOverrideListQueryParams = PaginationParams;

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Helper type for API success responses with data
export interface ApiSuccessResponse<T> {
  data: T;
  status: number;
}

// Helper type for API error responses
export interface ApiErrorResponse {
  error: ErrorResponseDTO["error"];
  status: number;
}

// Helper type for API responses (union of success and error)
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guard for checking if response is an error
export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return "error" in response;
}

// Helper type for CSV row data during import
export interface CSVRowData {
  company?: string;
  date?: string;
  amount?: string;
  currency?: string;
  direction?: string;
  payment_source?: string;
  project?: string;
  document?: string;
  counterparty?: string;
  description?: string;
  account?: string;
  fx_rate?: string;
  [key: string]: string | undefined; // Allow additional columns
}

// Helper type for Top-5 JSON structure in weekly_aggregates_v
export interface Top5Transaction {
  flow_id: string;
  amount_book_cents: number;
  counterparty: string;
  description: string;
  date_due: string;
}

// Helper type for authentication context
export interface AuthContext {
  user_id: string;
  email: string;
  default_company_id?: string | null;
}

// Helper type for company membership validation
export interface CompanyMembershipContext {
  user_id: string;
  company_id: string;
  is_member: boolean;
}

// Helper type for scenario lock status
export interface ScenarioLockStatus {
  is_locked: boolean;
  locked_at?: string | null;
  locked_by?: string | null;
}

// Helper type for import validation result
export interface ImportValidationResult {
  is_valid: boolean;
  errors: string[];
  row_number: number;
  raw_data: CSVRowData;
}

// Helper type for scenario summary (from scenario_summary_v view)
export interface ScenarioSummary {
  scenario_id: number;
  scenario_name: string;
  scenario_status: string;
  dataset_code: string;
  company_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  locked_at: string | null;
  locked_by: string | null;
  total_transactions: number;
  overridden_transactions: number;
  total_inflow_book_cents: number;
  total_outflow_book_cents: number;
  net_balance_book_cents: number;
  earliest_transaction_date: string | null;
  latest_transaction_date: string | null;
}

// Helper type for multipart form data file upload
export interface FileUpload {
  file: File | Blob;
  filename: string;
  content_type: string;
}

// =============================================================================
// VIEW MODELS (for UI components)
// =============================================================================

// Reprezentuje pojedynczą transakcję na karcie (Top5 lub "Other")
export interface TransactionVM {
  id: string; // flow_id lub syntetyczny ID dla "Other"
  type: "transaction" | "other";
  direction: "INFLOW" | "OUTFLOW";
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

// =============================================================================
// CSV IMPORT VIEW MODELS AND TYPES
// =============================================================================

// Enum dla kroków kreatora
export enum WizardStep {
  FileUpload = 1,
  ColumnMapping = 2,
  Validation = 3,
  Processing = 4,
}

// Stan kreatora
export interface ImportWizardState {
  currentStep: WizardStep;
  companyId: string;
  file: File | null;
  datasetCode: string;
  csvHeaders: string[];
  previewRows: string[][];
  columnMapping: ColumnMapping;
  validationResult: ValidationResult | null;
  importId: number | null;
  scenarioId: number | null;
  error: string | null;
}

// Mapowanie kolumn CSV na pola systemowe
export interface ColumnMapping {
  date_due: string | null;       // WYMAGANE
  amount: string | null;          // WYMAGANE
  direction: string | null;       // WYMAGANE
  currency: string | null;        // WYMAGANE
  flow_id?: string | null;        // opcjonalne
  counterparty?: string | null;   // opcjonalne
  description?: string | null;    // opcjonalne
  project?: string | null;        // opcjonalne
  document?: string | null;       // opcjonalne
  payment_source?: string | null; // opcjonalne
}

// Definicja pola systemowego
export interface SystemField {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
  description?: string;
}

// Wynik walidacji całego pliku
export interface ValidationResult {
  import_id: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: ValidationError[];
  status: 'success' | 'warning' | 'error';
}

// Pojedynczy błąd walidacji
export interface ValidationError {
  row_number: number;
  field_name: string;
  invalid_value: string;
  error_message: string;
  error_code?: string;
}

// Kody błędów walidacji
export enum ValidationErrorCode {
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_AMOUNT_FORMAT = 'INVALID_AMOUNT_FORMAT',
  INVALID_DIRECTION = 'INVALID_DIRECTION',
  INVALID_CURRENCY_CODE = 'INVALID_CURRENCY_CODE',
  NEGATIVE_AMOUNT = 'NEGATIVE_AMOUNT',
  DUPLICATE_FLOW_ID = 'DUPLICATE_FLOW_ID',
}

// Stan uploadu pliku
export interface FileUploadState {
  file: File | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
}

// Stan mapowania
export interface MappingState {
  csvHeaders: string[];
  previewRows: string[][];
  mapping: ColumnMapping;
  isComplete: boolean;
}

// Stan walidacji
export interface ValidationState {
  isValidating: boolean;
  result: ValidationResult | null;
  selectedAction: 'continue' | 'back' | null;
}

// Stan przetwarzania
export interface ProcessingState {
  importId: number;
  status: ImportStatusType;
  progress: number; // 0-100
  message: string;
  scenarioId: number | null;
}

// =============================================================================
// SCENARIO LIST VIEW MODELS
// =============================================================================

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
