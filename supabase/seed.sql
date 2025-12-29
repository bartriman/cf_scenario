-- Test seed data for weekly aggregates endpoint

-- Create test user (this will be done via Supabase Auth, but we can insert directly for testing)
-- User ID: 550e8400-e29b-41d4-a716-446655440001

-- Insert test company
INSERT INTO companies (id, name, base_currency, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Test Company Ltd', 'EUR', 'Europe/Warsaw');

-- Insert company member (must be before user_profiles due to FK constraint)
INSERT INTO company_members (company_id, user_id, joined_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', now());

-- Insert user profile
INSERT INTO user_profiles (user_id, default_company_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');

-- Insert test account
INSERT INTO accounts (company_id, name, currency) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Main Account', 'EUR');

-- Insert test import
INSERT INTO imports (
  company_id, 
  dataset_code, 
  status, 
  total_rows, 
  valid_rows, 
  invalid_rows, 
  inserted_transactions_count,
  file_name,
  uploaded_by
) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Q1', 'completed', 10, 10, 0, 10, 'test-data.csv', '550e8400-e29b-41d4-a716-446655440001');

-- Insert test scenario
INSERT INTO scenarios (
  company_id,
  import_id,
  dataset_code,
  name,
  status,
  start_date,
  end_date
) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'Test Scenario Q1 2025', 'Draft', '2025-01-06', '2025-03-31');

-- Insert test transactions (across multiple weeks)
INSERT INTO transactions (
  company_id,
  import_id,
  dataset_code,
  flow_id,
  account_id,
  is_active,
  amount_tx_cents,
  currency_tx,
  fx_rate,
  amount_book_cents,
  date_due,
  direction,
  time_slot,
  counterparty,
  description,
  payment_source
) VALUES
-- Week 1 Inflows
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'INV-2025-001', 1, true, 108500, 'EUR', 1.0, 108500, '2025-01-08', 'INFLOW', '2501', 'Client ABC', 'Payment for services', 'Bank Transfer'),
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'INV-2025-002', 1, true, 75000, 'EUR', 1.0, 75000, '2025-01-09', 'INFLOW', '2501', 'Client XYZ', 'Monthly retainer', 'Bank Transfer'),
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'INV-2025-003', 1, true, 50000, 'EUR', 1.0, 50000, '2025-01-10', 'INFLOW', '2501', 'Client DEF', 'Consulting fees', 'Bank Transfer'),

-- Week 1 Outflows
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'BILL-2025-001', 1, true, 50000, 'EUR', 1.0, 50000, '2025-01-07', 'OUTFLOW', '2501', 'Supplier XYZ', 'Office supplies', 'Bank Transfer'),
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'BILL-2025-002', 1, true, 30000, 'EUR', 1.0, 30000, '2025-01-08', 'OUTFLOW', '2501', 'Utility Company', 'Electricity bill', 'Bank Transfer'),

-- Week 2 Inflows
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'INV-2025-004', 1, true, 120000, 'EUR', 1.0, 120000, '2025-01-15', 'INFLOW', '2502', 'Client GHI', 'Project milestone', 'Bank Transfer'),
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'INV-2025-005', 1, true, 95000, 'EUR', 1.0, 95000, '2025-01-16', 'INFLOW', '2502', 'Client JKL', 'License fee', 'Bank Transfer'),

-- Week 2 Outflows
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'BILL-2025-003', 1, true, 80000, 'EUR', 1.0, 80000, '2025-01-14', 'OUTFLOW', '2502', 'Software Vendor', 'Annual subscription', 'Bank Transfer'),
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'BILL-2025-004', 1, true, 45000, 'EUR', 1.0, 45000, '2025-01-15', 'OUTFLOW', '2502', 'Marketing Agency', 'Campaign costs', 'Bank Transfer'),

-- Initial Balance transaction
('550e8400-e29b-41d4-a716-446655440000', 1, 'Q1', 'IB-2025-001', 1, true, 100000, 'EUR', 1.0, 100000, '2025-01-06', 'INFLOW', 'IB', 'Bank Account', 'Initial balance', 'Opening Balance');
