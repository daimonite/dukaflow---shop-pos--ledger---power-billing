-- ====================================================================
-- DUKAFLOW PHASE 0 MIGRATION: RETAIL POS, LOOSE UNITS, CARRY-FORWARD POWER & AUDIT LOG
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).
-- ====================================================================

-- 1. Profiles & Roles (admin, manager, power_admin)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'manager', 'power_admin')),
  created_at timestamptz default now()
);

-- 2. Products with decimal quantities & weighted-average cost
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id text,
  base_unit text not null check (base_unit in ('piece', 'kg', 'litre')),
  sell_price numeric(14,2) not null check (sell_price >= 0),
  avg_cost numeric(14,4) not null default 0 check (avg_cost >= 0),
  stock_qty numeric(14,3) not null default 0,
  reorder_level numeric(14,3) not null default 10,
  barcode text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. Product Pack Unit Options (buy/sell conversion)
create table if not exists product_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,                 -- 'gunia', 'dumu', '0.5 kg', 'cup'
  factor numeric(14,4) not null,       -- how many base units (e.g. 50 kg)
  use_for_buying boolean default false,
  use_for_selling boolean default false,
  price_override numeric(14,2)
);

-- 4. Sales and Snapshot Line Items
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique not null,
  sold_at timestamptz default now(),
  customer_id uuid,
  payment_method text not null check (payment_method in ('cash', 'mpesa', 'tigopesa', 'airtel', 'credit')),
  total numeric(14,2) not null,
  paid_amount numeric(14,2) not null,
  debt_amount numeric(14,2) not null default 0,
  created_by uuid references auth.users(id),
  voided_at timestamptz,
  void_reason text,
  voided_by uuid references auth.users(id)
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,3) not null,
  unit_label text not null,
  unit_price numeric(14,2) not null,
  unit_cost_snapshot numeric(14,4) not null, -- cost snapshot at exact millisecond of sale
  line_total numeric(14,2) not null,
  line_profit numeric(14,2) not null
);

-- 5. Expenses and Owner Drawings (Personal Use at Cost)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on text not null,
  category text not null,
  amount numeric(14,2) not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists owner_drawings (
  id uuid primary key default gen_random_uuid(),
  taken_at timestamptz default now(),
  type text not null check (type in ('product', 'cash')),
  product_id uuid references products(id),
  quantity numeric(14,3),
  cost_value numeric(14,2) not null, -- tracked at cost without distorting shop profit
  note text,
  taken_by uuid references auth.users(id)
);

-- 6. Customers, Suppliers & Double-Entry Ledger
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  is_regular boolean default true,
  credit_limit numeric(14,2) default 50000
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  party_type text not null check (party_type in ('customer', 'supplier')),
  party_id uuid not null,
  direction text not null check (direction in ('debit', 'credit')),
  amount numeric(14,2) not null,
  ref_sale_id uuid references sales(id),
  items_summary text,
  note text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- 7. Shared Electricity Module with Carry-Forward
create table if not exists power_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  meter_no text not null,
  room_or_house text,
  initial_reading numeric(10,1) default 0
);

create table if not exists power_periods (
  id uuid primary key default gen_random_uuid(),
  month text not null,                 -- '2026-10'
  rate_per_unit numeric(10,2) not null default 413.45,
  rate_mode text default 'fixed',
  main_meter_units numeric(10,2),
  total_bill numeric(14,2),
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz
);

create table if not exists meter_readings (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references power_periods(id),
  member_id uuid references power_members(id),
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

-- 8. Immutable Audit Log (Triggers only, Admin read-only)
create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz default now(),
  user_id uuid,
  user_name text,
  table_name text not null,
  record_id text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text not null,
  severity text not null check (severity in ('alert', 'digest', 'log'))
);

-- Row Level Security policies
alter table audit_log enable row level security;
create policy "admin reads log" on audit_log for select
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
