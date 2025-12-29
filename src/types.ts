import type { Tables, TablesInsert, TablesUpdate } from './db/database.types';

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

// Transaction direction
export const TransactionDirection = {
  INFLOW: 'INFLOW',
  OUTFLOW: 'OUTFLOW',
} as const;
export type TransactionDirectionType = typeof TransactionDirection[keyof typeof TransactionDirection];

// Scenario status
export const ScenarioStatus = {
  DRAFT: 'Draft',
  LOCKED: 'Locked',
} as const;
export type ScenarioStatusType = typeof ScenarioStatus[keyof typeof ScenarioStatus];

// Import status
export const ImportStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type ImportStatusType = typeof ImportStatus[keyof typeof ImportStatus];

// Export status
export const ExportStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type ExportStatusType = typeof ExportStatus[keyof typeof ExportStatus];

// Error codes for API responses
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// Sort order
export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortOrderType = typeof SortOrder[keyof typeof SortOrder];

// Transaction sort fields
export const TransactionSortField = {
  DATE_DUE: 'date_due',
  AMOUNT_BOOK_CENTS: 'amount_book_cents',
  CREATED_AT: 'created_at',
} as const;
export type TransactionSortFieldType = typeof TransactionSortField[keyof typeof TransactionSortField];

// Export group by options
export const ExportGroupBy = {
  WEEK: 'week',
  DAY: 'day',
  MONTH: 'month',
} as const;
export type ExportGroupByType = typeof ExportGroupBy[keyof typeof ExportGroupBy];

// =============================================================================
// ENTITY TYPES (Direct mappings from database)
// =============================================================================

export type Company = Tables<'companies'>;
export type Account = Tables<'accounts'>;
export type Import = Tables<'imports'>;
export type ImportRow = Tables<'import_rows'>;
export type Transaction = Tables<'transactions'>;
export type Scenario = Tables<'scenarios'>;
export type ScenarioOverride = Tables<'scenario_overrides'>;
export type UserProfile = Tables<'user_profiles'>;
export type CompanyMember = Tables<'company_members'>;

// Insert types (for creating new records)
export type CompanyInsert = TablesInsert<'companies'>;
export type AccountInsert = TablesInsert<'accounts'>;
export type ImportInsert = TablesInsert<'imports'>;
export type ImportRowInsert = TablesInsert<'import_rows'>;
export type TransactionInsert = TablesInsert<'transactions'>;
export type ScenarioInsert = TablesInsert<'scenarios'>;
export type ScenarioOverrideInsert = TablesInsert<'scenario_overrides'>;
export type UserProfileInsert = TablesInsert<'user_profiles'>;
export type CompanyMemberInsert = TablesInsert<'company_members'>;

// Update types (for updating existing records)
export type CompanyUpdate = TablesUpdate<'companies'>;
export type AccountUpdate = TablesUpdate<'accounts'>;
export type ImportUpdate = TablesUpdate<'imports'>;
export type ImportRowUpdate = TablesUpdate<'import_rows'>;
export type TransactionUpdate = TablesUpdate<'transactions'>;
export type ScenarioUpdate = TablesUpdate<'scenarios'>;
export type ScenarioOverrideUpdate = TablesUpdate<'scenario_overrides'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;
export type CompanyMemberUpdate = TablesUpdate<'company_members'>;

// Views
export type RunningBalanceRow = Tables<'running_balance_v'>;
export type ScenarioTransactionRow = Tables<'scenario_transactions_v'>;
export type ScenarioExportRow = Tables<'scenario_export_v'>;
export type ScenarioSummaryRow = Tables<'scenario_summary_v'>;
export type WeeklyAggregateRow = Tables<'weekly_aggregates_v'>;

// =============================================================================
// AUTHENTICATION DTOs
// =============================================================================

// 1. Sign Up Request DTO
export type SignUpRequestDTO = {
  email: string;
  password: string;
};

// 2. Sign Up Response DTO
export type SignUpResponseDTO = {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
};

// 3. Sign In Request DTO
export type SignInRequestDTO = {
  email: string;
  password: string;
};

// 4. Sign In Response DTO
export type SignInResponseDTO = {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
};

// =============================================================================
// USER PROFILE DTOs
// =============================================================================

// 5. User Company DTO - Company data from user's perspective
export type UserCompanyDTO = {
  company_id: string;
  name: string;
  base_currency: string;
  joined_at: string;
};

// 6. User Profile Response DTO
export type UserProfileResponseDTO = {
  user_id: string;
  default_company_id: string | null;
  created_at: string;
  companies: UserCompanyDTO[];
};

// 7. Update User Profile Request DTO
export type UpdateUserProfileRequestDTO = {
  default_company_id: string;
};

// 8. Update User Profile Response DTO
export type UpdateUserProfileResponseDTO = {
  user_id: string;
  default_company_id: string | null;
  updated_at: string;
};

// =============================================================================
// COMPANY DTOs
// =============================================================================

// 9. Company List Item DTO
export type CompanyListItemDTO = Pick<Company, 'id' | 'name' | 'base_currency' | 'timezone'> & {
  joined_at: string; // from company_members
};

// 10. Company List Response DTO
export type CompanyListResponseDTO = {
  companies: CompanyListItemDTO[];
};

// 11. Company Details Response DTO
export type CompanyDetailsResponseDTO = Pick<Company, 'id' | 'name' | 'base_currency' | 'timezone' | 'created_at'> & {
  members_count: number;
};

// =============================================================================
// ACCOUNT DTOs
// =============================================================================

// 12. Account DTO - Base account representation
export type AccountDTO = Pick<Account, 'id' | 'company_id' | 'name' | 'currency' | 'created_at'>;

// 13. Account List Response DTO
export type AccountListResponseDTO = {
  accounts: AccountDTO[];
};

// 14. Create Account Request DTO
export type CreateAccountRequestDTO = {
  name: string;
  currency: string;
};

// 15. Create Account Response DTO
export type CreateAccountResponseDTO = AccountDTO;

// 16. Update Account Request DTO
export type UpdateAccountRequestDTO = {
  name: string;
  currency: string;
};

// 17. Update Account Response DTO
export type UpdateAccountResponseDTO = AccountDTO & {
  updated_at: string;
};

// =============================================================================
// IMPORT DTOs
// =============================================================================

// 18. Import List Item DTO
export type ImportListItemDTO = Pick<Import, 
  'id' | 'company_id' | 'dataset_code' | 'status' | 'total_rows' | 
  'valid_rows' | 'invalid_rows' | 'inserted_transactions_count' | 
  'file_name' | 'uploaded_by' | 'created_at'
>;

// 19. Import List Response DTO with pagination
export type ImportListResponseDTO = {
  imports: ImportListItemDTO[];
  pagination: PaginationDTO;
};

// 20. Import Details Response DTO
export type ImportDetailsResponseDTO = Pick<Import,
  'id' | 'company_id' | 'dataset_code' | 'status' | 'total_rows' |
  'valid_rows' | 'invalid_rows' | 'inserted_transactions_count' |
  'error_report_json' | 'error_report_url' | 'file_name' | 
  'uploaded_by' | 'created_at'
>;

// 21. Create Import Request DTO (multipart form data structure)
export type CreateImportRequestDTO = {
  file: File;
  dataset_code: string;
};

// 22. Create Import Response DTO
export type CreateImportResponseDTO = Pick<Import,
  'id' | 'company_id' | 'dataset_code' | 'status' | 'file_name' | 'created_at'
>;

// 23. Import Error Row DTO
export type ImportErrorRowDTO = Pick<ImportRow,
  'row_number' | 'raw_data' | 'error_message' | 'created_at'
>;

// 24. Import Error Rows Response DTO
export type ImportErrorRowsResponseDTO = {
  import_id: number;
  errors: ImportErrorRowDTO[];
  pagination: PaginationDTO;
};

// =============================================================================
// TRANSACTION DTOs
// =============================================================================

// 25. Transaction DTO - Full transaction details
export type TransactionDTO = Pick<Transaction,
  'id' | 'company_id' | 'import_id' | 'dataset_code' | 'flow_id' |
  'account_id' | 'is_active' | 'amount_tx_cents' | 'currency_tx' |
  'fx_rate' | 'amount_book_cents' | 'date_due' | 'direction' |
  'time_slot' | 'project' | 'counterparty' | 'document' |
  'description' | 'payment_source' | 'created_at'
>;

// 26. Transaction List Response DTO
export type TransactionListResponseDTO = {
  transactions: TransactionDTO[];
  pagination: PaginationDTO;
};

// 27. Transaction Details Response DTO (same as TransactionDTO)
export type TransactionDetailsResponseDTO = TransactionDTO;

// =============================================================================
// SCENARIO DTOs
// =============================================================================

// 28. Scenario List Item DTO
export type ScenarioListItemDTO = Pick<Scenario,
  'id' | 'company_id' | 'import_id' | 'dataset_code' | 'name' |
  'status' | 'base_scenario_id' | 'start_date' | 'end_date' |
  'locked_at' | 'locked_by' | 'created_at'
>;

// 29. Scenario List Response DTO
export type ScenarioListResponseDTO = {
  scenarios: ScenarioListItemDTO[];
  pagination: PaginationDTO;
};

// 30. Scenario Details Response DTO
export type ScenarioDetailsResponseDTO = ScenarioListItemDTO & {
  overrides_count: number;
};

// 31. Create Scenario Request DTO
export type CreateScenarioRequestDTO = {
  dataset_code: string;
  name: string;
  base_scenario_id?: number;
  start_date: string;
  end_date: string;
};

// 32. Create Scenario Response DTO
export type CreateScenarioResponseDTO = Pick<Scenario,
  'id' | 'company_id' | 'import_id' | 'dataset_code' | 'name' |
  'status' | 'base_scenario_id' | 'start_date' | 'end_date' | 'created_at'
>;

// 33. Update Scenario Request DTO
export type UpdateScenarioRequestDTO = {
  name?: string;
  start_date?: string;
  end_date?: string;
};

// 34. Update Scenario Response DTO
export type UpdateScenarioResponseDTO = Pick<Scenario,
  'id' | 'company_id' | 'import_id' | 'dataset_code' | 'name' |
  'status' | 'base_scenario_id' | 'start_date' | 'end_date'
> & {
  updated_at: string;
};

// 35. Lock Scenario Response DTO
export type LockScenarioResponseDTO = {
  id: number;
  status: string;
  locked_at: string;
  locked_by: string;
};

// 36. Duplicate Scenario Request DTO
export type DuplicateScenarioRequestDTO = {
  name: string;
};

// 37. Duplicate Scenario Response DTO
export type DuplicateScenarioResponseDTO = CreateScenarioResponseDTO & {
  overrides_count: number;
};

// =============================================================================
// SCENARIO OVERRIDE DTOs
// =============================================================================

// 38. Scenario Override DTO
export type ScenarioOverrideDTO = Pick<ScenarioOverride,
  'id' | 'company_id' | 'scenario_id' | 'flow_id' |
  'original_date_due' | 'original_amount_book_cents' |
  'new_date_due' | 'new_amount_book_cents' |
  'created_at' | 'updated_at'
>;

// 39. Scenario Override List Response DTO
export type ScenarioOverrideListResponseDTO = {
  scenario_id: number;
  overrides: ScenarioOverrideDTO[];
  pagination: PaginationDTO;
};

// 40. Create/Update Override Request DTO (upsert)
export type UpsertOverrideRequestDTO = {
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
};

// 41. Create/Update Override Response DTO
export type UpsertOverrideResponseDTO = ScenarioOverrideDTO;

// 42. Batch Override Item DTO - Single item in batch update
export type BatchOverrideItemDTO = {
  flow_id: string;
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
};

// 43. Batch Update Overrides Request DTO
export type BatchUpdateOverridesRequestDTO = {
  overrides: BatchOverrideItemDTO[];
};

// 44. Batch Override Result DTO - Result of a single override in batch
export type BatchOverrideResultDTO = {
  id: number;
  flow_id: string;
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
};

// 45. Batch Update Overrides Response DTO
export type BatchUpdateOverridesResponseDTO = {
  updated_count: number;
  overrides: BatchOverrideResultDTO[];
};

// =============================================================================
// ANALYTICS & AGGREGATION DTOs
// =============================================================================

// 46. Scenario Transaction DTO - Transaction with applied overrides (from scenario_transactions_v)
export type ScenarioTransactionDTO = Pick<ScenarioTransactionRow,
  'transaction_id' | 'flow_id' | 'dataset_code' | 'direction' | 'time_slot' |
  'currency_tx' | 'amount_tx_cents' | 'fx_rate' | 'amount_book_cents_original' |
  'date_due_original' | 'amount_book_cents_effective' | 'date_due_effective' |
  'is_overridden' | 'project' | 'counterparty' | 'document' | 'description' |
  'payment_source'
>;

// 47. Scenario Transaction List Response DTO
export type ScenarioTransactionListResponseDTO = {
  scenario_id: number;
  transactions: ScenarioTransactionDTO[];
  pagination: PaginationDTO;
};

// 48. Top Transaction Item DTO - Transaction in Top-5 list
export type TopTransactionItemDTO = {
  flow_id: string;
  amount_book_cents: number;
  counterparty: string;
  description: string;
  date_due: string;
};

// 49. Week Aggregate DTO - Single week's aggregated data
export type WeekAggregateDTO = {
  week_index: number;
  week_label: string;
  week_start_date: string | null;
  inflow_total_book_cents: number;
  outflow_total_book_cents: number;
  inflow_top5: TopTransactionItemDTO[];
  outflow_top5: TopTransactionItemDTO[];
  inflow_other_book_cents: number;
  outflow_other_book_cents: number;
};

// 50. Weekly Aggregates Response DTO
export type WeeklyAggregatesResponseDTO = {
  scenario_id: number;
  base_currency: string;
  weeks: WeekAggregateDTO[];
};

// 51. Running Balance Item DTO - Single day's balance (from running_balance_v)
export type RunningBalanceItemDTO = Pick<RunningBalanceRow,
  'as_of_date' | 'delta_book_cents' | 'running_balance_book_cents'
> & {
  // Ensure non-null values for response
  as_of_date: string;
  delta_book_cents: number;
  running_balance_book_cents: number;
};

// 52. Running Balance Response DTO
export type RunningBalanceResponseDTO = {
  scenario_id: number;
  base_currency: string;
  balances: RunningBalanceItemDTO[];
};

// 53. Scenario Comparison Balance DTO - Balance data for one scenario in comparison
export type ScenarioComparisonBalanceDTO = {
  as_of_date: string;
  running_balance_book_cents: number;
};

// 54. Scenario Comparison Item DTO - One scenario's data in comparison
export type ScenarioComparisonItemDTO = {
  scenario_id: number;
  scenario_name: string;
  balances: ScenarioComparisonBalanceDTO[];
};

// 55. Compare Scenarios Request DTO
export type CompareScenariosRequestDTO = {
  scenario_ids: number[];
};

// 56. Compare Scenarios Response DTO
export type CompareScenariosResponseDTO = {
  base_currency: string;
  scenarios: ScenarioComparisonItemDTO[];
};

// =============================================================================
// EXPORT DTOs
// =============================================================================

// 57. Export Scenario Request DTO
export type ExportScenarioRequestDTO = {
  include_chart?: boolean;
  include_transactions?: boolean;
  group_by?: ExportGroupByType;
};

// 58. Export Scenario Response DTO (initial response)
export type ExportScenarioResponseDTO = {
  export_id: string;
  status: string;
  created_at: string;
};

// 59. Export Status Response DTO
export type ExportStatusResponseDTO = {
  export_id: string;
  scenario_id: number;
  status: string;
  download_url?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
};

// =============================================================================
// COMMON DTOs
// =============================================================================

// 60. Pagination DTO - Used across all paginated responses
export type PaginationDTO = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
};

// 61. Error Detail DTO - Single validation error
export type ErrorDetailDTO = {
  field: string;
  message: string;
};

// 62. Error Response DTO - Standard error response
export type ErrorResponseDTO = {
  error: {
    code: ErrorCodeType;
    message: string;
    details?: ErrorDetailDTO[];
  };
};

// =============================================================================
// COMMAND MODELS (For internal processing/business logic)
// =============================================================================

// Command for creating a new company (admin/service operation)
export type CreateCompanyCommand = TablesInsert<'companies'>;

// Command for creating a new user profile
export type CreateUserProfileCommand = TablesInsert<'user_profiles'>;

// Command for adding user to company
export type AddCompanyMemberCommand = TablesInsert<'company_members'>;

// Command for creating an account
export type CreateAccountCommand = Omit<TablesInsert<'accounts'>, 'id' | 'created_at'>;

// Command for updating an account
export type UpdateAccountCommand = {
  id: number;
  company_id: string;
  data: Pick<TablesUpdate<'accounts'>, 'name' | 'currency'>;
};

// Command for deleting an account
export type DeleteAccountCommand = {
  id: number;
  company_id: string;
};

// Command for creating an import (service operation)
export type CreateImportCommand = Omit<TablesInsert<'imports'>, 'id' | 'created_at'>;

// Command for creating import rows (service operation)
export type CreateImportRowCommand = Omit<TablesInsert<'import_rows'>, 'id' | 'created_at'>;

// Command for creating a transaction (service operation)
export type CreateTransactionCommand = Omit<TablesInsert<'transactions'>, 'id' | 'created_at'>;

// Command for creating a scenario
export type CreateScenarioCommand = Omit<TablesInsert<'scenarios'>, 'id' | 'created_at' | 'deleted_at'>;

// Command for updating a scenario
export type UpdateScenarioCommand = {
  id: number;
  company_id: string;
  data: Pick<TablesUpdate<'scenarios'>, 'name' | 'start_date' | 'end_date'>;
};

// Command for locking a scenario
export type LockScenarioCommand = {
  scenario_id: number;
  locked_by: string;
};

// Command for soft deleting a scenario
export type SoftDeleteScenarioCommand = {
  scenario_id: number;
};

// Command for duplicating a scenario
export type DuplicateScenarioCommand = {
  source_scenario_id: number;
  new_name: string;
  company_id: string;
};

// Command for creating/updating an override
export type UpsertOverrideCommand = {
  company_id: string;
  scenario_id: number;
  flow_id: string;
  new_date_due?: string | null;
  new_amount_book_cents?: number | null;
  original_date_due: string;
  original_amount_book_cents: number;
};

// Command for deleting an override
export type DeleteOverrideCommand = {
  company_id: string;
  scenario_id: number;
  flow_id: string;
};

// Command for batch upserting overrides
export type BatchUpsertOverridesCommand = {
  company_id: string;
  scenario_id: number;
  overrides: Array<{
    flow_id: string;
    new_date_due?: string | null;
    new_amount_book_cents?: number | null;
    original_date_due: string;
    original_amount_book_cents: number;
  }>;
};

// Command for updating user profile default company
export type UpdateUserProfileDefaultCompanyCommand = {
  user_id: string;
  default_company_id: string;
};

// =============================================================================
// QUERY PARAMETER TYPES (For filtering, sorting, and pagination)
// =============================================================================

// Base pagination params
export type PaginationParams = {
  page?: number;
  limit?: number;
};

// Account list query params
export type AccountListQueryParams = {
  currency?: string;
};

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
export type ApiSuccessResponse<T> = {
  data: T;
  status: number;
};

// Helper type for API error responses
export type ApiErrorResponse = {
  error: ErrorResponseDTO['error'];
  status: number;
};

// Helper type for API responses (union of success and error)
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guard for checking if response is an error
export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return 'error' in response;
}

// Helper type for CSV row data during import
export type CSVRowData = {
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
};

// Helper type for Top-5 JSON structure in weekly_aggregates_v
export type Top5Transaction = {
  flow_id: string;
  amount_book_cents: number;
  counterparty: string;
  description: string;
  date_due: string;
};

// Helper type for authentication context
export type AuthContext = {
  user_id: string;
  email: string;
  default_company_id?: string | null;
};

// Helper type for company membership validation
export type CompanyMembershipContext = {
  user_id: string;
  company_id: string;
  is_member: boolean;
};

// Helper type for scenario lock status
export type ScenarioLockStatus = {
  is_locked: boolean;
  locked_at?: string | null;
  locked_by?: string | null;
};

// Helper type for import validation result
export type ImportValidationResult = {
  is_valid: boolean;
  errors: string[];
  row_number: number;
  raw_data: CSVRowData;
};

// Helper type for scenario summary (from scenario_summary_v view)
export type ScenarioSummary = {
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
};

// Helper type for multipart form data file upload
export type FileUpload = {
  file: File | Blob;
  filename: string;
  content_type: string;
};
