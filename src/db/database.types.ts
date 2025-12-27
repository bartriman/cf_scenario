export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          company_id: string
          created_at: string
          currency: string
          id: number
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          currency: string
          id?: never
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          currency?: string
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          company_id: string
          created_at: string
          error_message: string | null
          id: number
          import_id: number
          is_valid: boolean
          raw_data: Json
          row_number: number
        }
        Insert: {
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: never
          import_id: number
          is_valid?: boolean
          raw_data: Json
          row_number: number
        }
        Update: {
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: never
          import_id?: number
          is_valid?: boolean
          raw_data?: Json
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          company_id: string
          created_at: string
          dataset_code: string
          error_report_json: Json | null
          error_report_url: string | null
          file_name: string | null
          id: number
          inserted_transactions_count: number
          invalid_rows: number
          status: string
          total_rows: number
          uploaded_by: string | null
          valid_rows: number
        }
        Insert: {
          company_id: string
          created_at?: string
          dataset_code: string
          error_report_json?: Json | null
          error_report_url?: string | null
          file_name?: string | null
          id?: never
          inserted_transactions_count?: number
          invalid_rows?: number
          status: string
          total_rows?: number
          uploaded_by?: string | null
          valid_rows?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          dataset_code?: string
          error_report_json?: Json | null
          error_report_url?: string | null
          file_name?: string | null
          id?: never
          inserted_transactions_count?: number
          invalid_rows?: number
          status?: string
          total_rows?: number
          uploaded_by?: string | null
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_overrides: {
        Row: {
          company_id: string
          created_at: string
          flow_id: string
          id: number
          new_amount_book_cents: number | null
          new_date_due: string | null
          original_amount_book_cents: number
          original_date_due: string
          scenario_id: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          flow_id: string
          id?: never
          new_amount_book_cents?: number | null
          new_date_due?: string | null
          original_amount_book_cents: number
          original_date_due: string
          scenario_id: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          flow_id?: string
          id?: never
          new_amount_book_cents?: number | null
          new_date_due?: string | null
          original_amount_book_cents?: number
          original_date_due?: string
          scenario_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_overrides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_overrides_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "running_balance_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenario_overrides_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_export_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenario_overrides_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_summary_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenario_overrides_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_transactions_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenario_overrides_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_overrides_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "weekly_aggregates_v"
            referencedColumns: ["scenario_id"]
          },
        ]
      }
      scenarios: {
        Row: {
          base_scenario_id: number | null
          company_id: string
          created_at: string
          dataset_code: string
          deleted_at: string | null
          end_date: string
          id: number
          import_id: number
          locked_at: string | null
          locked_by: string | null
          name: string
          start_date: string
          status: string
        }
        Insert: {
          base_scenario_id?: number | null
          company_id: string
          created_at?: string
          dataset_code: string
          deleted_at?: string | null
          end_date: string
          id?: never
          import_id: number
          locked_at?: string | null
          locked_by?: string | null
          name: string
          start_date: string
          status: string
        }
        Update: {
          base_scenario_id?: number | null
          company_id?: string
          created_at?: string
          dataset_code?: string
          deleted_at?: string | null
          end_date?: string
          id?: never
          import_id?: number
          locked_at?: string | null
          locked_by?: string | null
          name?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_base_scenario_id_fkey"
            columns: ["base_scenario_id"]
            isOneToOne: false
            referencedRelation: "running_balance_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenarios_base_scenario_id_fkey"
            columns: ["base_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_export_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenarios_base_scenario_id_fkey"
            columns: ["base_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_summary_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenarios_base_scenario_id_fkey"
            columns: ["base_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenario_transactions_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenarios_base_scenario_id_fkey"
            columns: ["base_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_base_scenario_id_fkey"
            columns: ["base_scenario_id"]
            isOneToOne: false
            referencedRelation: "weekly_aggregates_v"
            referencedColumns: ["scenario_id"]
          },
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: number | null
          amount_book_cents: number
          amount_tx_cents: number
          company_id: string
          counterparty: string | null
          created_at: string
          currency_tx: string
          dataset_code: string
          date_due: string
          description: string | null
          direction: string
          document: string | null
          flow_id: string
          fx_rate: number | null
          id: number
          import_id: number
          is_active: boolean
          payment_source: string
          project: string | null
          time_slot: string
        }
        Insert: {
          account_id?: number | null
          amount_book_cents: number
          amount_tx_cents: number
          company_id: string
          counterparty?: string | null
          created_at?: string
          currency_tx: string
          dataset_code: string
          date_due: string
          description?: string | null
          direction: string
          document?: string | null
          flow_id: string
          fx_rate?: number | null
          id?: never
          import_id: number
          is_active?: boolean
          payment_source: string
          project?: string | null
          time_slot: string
        }
        Update: {
          account_id?: number | null
          amount_book_cents?: number
          amount_tx_cents?: number
          company_id?: string
          counterparty?: string | null
          created_at?: string
          currency_tx?: string
          dataset_code?: string
          date_due?: string
          description?: string | null
          direction?: string
          document?: string | null
          flow_id?: string
          fx_rate?: number | null
          id?: never
          import_id?: number
          is_active?: boolean
          payment_source?: string
          project?: string | null
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          default_company_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          default_company_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          default_company_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_default_company_id_fkey"
            columns: ["user_id", "default_company_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["user_id", "company_id"]
          },
        ]
      }
    }
    Views: {
      running_balance_v: {
        Row: {
          as_of_date: string | null
          company_id: string | null
          delta_book_cents: number | null
          running_balance_book_cents: number | null
          scenario_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_export_v: {
        Row: {
          amount_book_cents_effective: number | null
          amount_book_cents_original: number | null
          amount_tx_cents: number | null
          company_id: string | null
          counterparty: string | null
          currency_tx: string | null
          date_due_effective: string | null
          date_due_original: string | null
          delta_book_cents: number | null
          description: string | null
          direction: string | null
          document: string | null
          flow_id: string | null
          fx_rate: number | null
          is_overridden: boolean | null
          payment_source: string | null
          project: string | null
          running_balance_book_cents: number | null
          scenario_id: number | null
          time_slot: string | null
          transaction_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_summary_v: {
        Row: {
          company_id: string | null
          created_at: string | null
          dataset_code: string | null
          earliest_transaction_date: string | null
          end_date: string | null
          latest_transaction_date: string | null
          locked_at: string | null
          locked_by: string | null
          net_balance_book_cents: number | null
          overridden_transactions: number | null
          scenario_id: number | null
          scenario_name: string | null
          scenario_status: string | null
          start_date: string | null
          total_inflow_book_cents: number | null
          total_outflow_book_cents: number | null
          total_transactions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_transactions_v: {
        Row: {
          account_id: number | null
          amount_book_cents_effective: number | null
          amount_book_cents_original: number | null
          amount_tx_cents: number | null
          company_id: string | null
          counterparty: string | null
          currency_tx: string | null
          dataset_code: string | null
          date_due_effective: string | null
          date_due_original: string | null
          description: string | null
          direction: string | null
          document: string | null
          flow_id: string | null
          fx_rate: number | null
          is_overridden: boolean | null
          override_id: number | null
          payment_source: string | null
          project: string | null
          scenario_id: number | null
          time_slot: string | null
          transaction_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_aggregates_v: {
        Row: {
          company_id: string | null
          inflow_other_book_cents: number | null
          inflow_top5: Json | null
          inflow_total_book_cents: number | null
          outflow_other_book_cents: number | null
          outflow_top5: Json | null
          outflow_total_book_cents: number | null
          scenario_id: number | null
          week_index: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_latest_import_id: {
        Args: { p_company_id: string; p_dataset_code: string }
        Returns: number
      }
      set_scenario_locked: {
        Args: { p_locked_by: string; p_scenario_id: number }
        Returns: undefined
      }
      set_scenario_unlocked: {
        Args: { p_scenario_id: number }
        Returns: undefined
      }
      soft_delete_scenario: {
        Args: { p_scenario_id: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

