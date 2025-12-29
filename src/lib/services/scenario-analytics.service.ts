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
  date_due: z.string(),
  project: z.string().nullable().optional()
});

/**
 * Calculate week label from week_index and start_date
 * Week 0 = "Initial Balance"
 * Week 1+ = "W{week} {year}"
 * 
 * @param weekIndex - Week index (0 for IB, 1+ for actual weeks)
 * @param startDate - Scenario start date
 * @returns Week label string
 */
function calculateWeekLabel(weekIndex: number, startDate: string): string {
  if (weekIndex === 0) {
    return 'Initial Balance';
  }
  
  const start = new Date(startDate);
  const weekStartDate = new Date(start);
  weekStartDate.setDate(start.getDate() + (weekIndex - 1) * 7);
  
  const year = weekStartDate.getFullYear();
  return `W${weekIndex} ${year}`;
}

/**
 * Calculate week start date from week_index and scenario start_date
 * Week 0 = null (Initial Balance)
 * Week 1+ = start_date + (week_index - 1) * 7 days
 * 
 * @param weekIndex - Week index (0 for IB, 1+ for actual weeks)
 * @param startDate - Scenario start date
 * @returns ISO date string or null for week 0
 */
function calculateWeekStartDate(weekIndex: number, startDate: string): string | null {
  if (weekIndex === 0) {
    return null;
  }
  
  const start = new Date(startDate);
  const weekStartDate = new Date(start);
  weekStartDate.setDate(start.getDate() + (weekIndex - 1) * 7);
  
  return weekStartDate.toISOString().split('T')[0];
}

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
  const { data, error: authError } = await supabase.auth.getUser();
  
  if (!data.user) {
    throw new ForbiddenError('User not authenticated');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('company_id', companyId)
    .eq('user_id', data.user.id)
    .single();

  if (membershipError || !membership) {
    throw new ForbiddenError('User not a member of company');
  }

  // Step 2: Verify scenario exists and belongs to company
  const { data: scenario, error: scenarioError } = await supabase
    .from('scenarios')
    .select('id, company_id, dataset_code, start_date')
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
    week_index: week.week_index ?? 0,
    week_label: calculateWeekLabel(week.week_index ?? 0, scenario.start_date),
    week_start_date: calculateWeekStartDate(week.week_index ?? 0, scenario.start_date),
    inflow_total_book_cents: week.inflow_total_book_cents ?? 0,
    outflow_total_book_cents: week.outflow_total_book_cents ?? 0,
    inflow_top5: parseTop5Transactions(week.inflow_top5),
    outflow_top5: parseTop5Transactions(week.outflow_top5),
    inflow_other_book_cents: week.inflow_other_book_cents ?? 0,
    outflow_other_book_cents: week.outflow_other_book_cents ?? 0
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
        if (!parsed.success) {
          console.warn('Failed to parse top5 item:', parsed.error);
          return null;
        }
        
        // Transform to DTO format
        return {
          flow_id: parsed.data.flow_id,
          amount_book_cents: parsed.data.amount_book_cents,
          counterparty: parsed.data.counterparty,
          description: parsed.data.description,
          date_due: parsed.data.date_due
        } as TopTransactionItemDTO;
      })
      .filter((item): item is TopTransactionItemDTO => item !== null);
  } catch (error) {
    console.error('Error parsing top5 transactions:', error);
    return [];
  }
}
