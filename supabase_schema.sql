-- ====================================================================
-- DUKAFLOW SUPABASE SYNC SCHEMA (PHASE 0 - OFFLINE-FIRST POS SYNC)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).
-- It creates/updates all tables, columns, and sets RLS permissions for the POS anon key.
-- ====================================================================

-- 1. Sales (Header & Items)
create table if not exists sales (
  id text primary key,
  receipt_no text unique not null,
  sold_at timestamptz default now(),
  customer_id text,
  customer_name text,
  customer_phone text,
  items jsonb,
  total numeric(14,2) not null,
  paid_amount numeric(14,2) not null,
  debt_amount numeric(14,2) default 0,
  payment_method text not null,
  created_by text,
  sold_by_name text,
  voided_at timestamptz,
  void_reason text,
  voided_by text
);

-- 2. Operating Expenses
create table if not exists expenses (
  id text primary key,
  date timestamptz default now(),
  spent_on text not null,
  category text not null,
  amount numeric(14,2) not null,
  note text,
  created_by text,
  created_at timestamptz default now()
);

-- 3. Stock Purchases (Suppliers)
create table if not exists purchases (
  id text primary key,
  supplier_id text,
  supplier_name text,
  invoice_no text,
  date timestamptz default now(),
  items jsonb,
  total numeric(14,2) not null,
  paid_amount numeric(14,2) not null,
  debt_amount numeric(14,2) default 0,
  note text,
  receipt_url text,
  created_by text
);

-- 4. Inventory Movements (Stock Adjustments & Shrinkage)
create table if not exists inventory_movements (
  id bigserial primary key,
  product_id text,
  product_name text,
  old_qty numeric(14,3),
  new_qty numeric(14,3),
  diff numeric(14,3),
  reason text,
  adjusted_at timestamptz default now()
);

-- 5. Owner Drawings (Personal Use at Cost)
create table if not exists owner_drawings (
  id text primary key,
  date timestamptz default now(),
  type text not null,
  product_id text,
  product_name text,
  quantity numeric(14,3),
  base_unit text,
  cost_value numeric(14,2) not null,
  cash_amount numeric(14,2),
  note text,
  taken_by text
);

-- 6. Shared Electricity Module (Carry-Forward & Sub-Meters)
create table if not exists power_members (
  id text primary key,
  name text not null,
  phone text,
  meter_no text not null,
  room_or_house text,
  initial_reading numeric(10,1) default 0
);

create table if not exists power_periods (
  id text primary key,
  month text not null,
  rate_per_unit numeric(10,2) not null default 413.45,
  rate_mode text default 'fixed',
  main_meter_units numeric(10,2),
  total_bill numeric(14,2),
  status text not null default 'open',
  closed_at timestamptz
);

create table if not exists meter_readings (
  id text primary key,
  period_id text,
  member_id text,
  previous_reading numeric(10,1) not null,
  current_reading numeric(10,1) not null,
  units_used numeric(10,1) not null,
  rate_charged numeric(10,2) not null,
  current_charge numeric(14,2) not null,
  carried_forward_debt numeric(14,2) not null default 0,
  total_due numeric(14,2) not null,
  paid_amount numeric(14,2) not null default 0,
  closing_balance numeric(14,2) not null
);

create table if not exists power_payments (
  id text primary key,
  member_id text,
  member_name text,
  period_id text,
  amount numeric(14,2) not null,
  paid_at timestamptz default now(),
  recorded_by text,
  reference text,
  payment_method text
);

-- 7. Customers & Debtors Ledger
create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  is_regular boolean default true,
  credit_limit numeric(14,2) default 50000,
  current_balance numeric(14,2) default 0
);

create table if not exists suppliers (
  id text primary key,
  name text not null,
  phone text,
  contact_person text
);

create table if not exists ledger_entries (
  id text primary key,
  party_type text not null,
  party_id text not null,
  direction text not null,
  amount numeric(14,2) not null,
  ref_sale_id text,
  items_summary text,
  note text,
  created_at timestamptz default now(),
  created_by text
);

-- 8. Immutable Audit Log
create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz default now(),
  user_id text,
  user_name text,
  table_name text not null,
  record_id text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text not null,
  severity text not null
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) PERMISSIONS FOR OFFLINE POS SYNC
-- Disable RLS or allow anon inserts so terminal outbox sync works seamlessly
-- ====================================================================

alter table if exists sales disable row level security;
alter table if exists expenses disable row level security;
alter table if exists purchases disable row level security;
alter table if exists inventory_movements disable row level security;
alter table if exists owner_drawings disable row level security;
alter table if exists power_members disable row level security;
alter table if exists power_periods disable row level security;
alter table if exists meter_readings disable row level security;
alter table if exists power_payments disable row level security;
alter table if exists customers disable row level security;
alter table if exists suppliers disable row level security;
alter table if exists ledger_entries disable row level security;
alter table if exists audit_log disable row level security;
