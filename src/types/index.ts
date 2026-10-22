export type UserRole = 'admin' | 'manager' | 'power_admin';

export type BaseUnit = 'kg' | 'litre' | 'piece';

export interface UnitOption {
  label: string;            // e.g. 'sack', 'drum', 'carton', '0.5 kg', 'cup'
  factor: number;           // how many base units (e.g. sack = 50 kg, cup = 0.25 L)
  use_for_buying: boolean;
  use_for_selling: boolean;
  price_override?: number;  // optional fixed price
}

export interface Product {
  id: string;
  name: string;
  category: string;
  base_unit: BaseUnit;
  sell_price: number;       // per base unit (in TSh)
  avg_cost: number;         // per base unit (weighted average cost)
  stock_qty: number;        // in base units (supports 3 decimals e.g. 14.250)
  reorder_level: number;
  barcode?: string;
  unit_options: UnitOption[];
  active: boolean;
  image?: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;          // in base units
  unit_label: string;        // 'kg', 'sack', '0.5 kg', 'cup', 'piece', etc.
  unit_price: number;        // price charged per unit_label
  unit_cost_snapshot: number;// avg_cost per base unit at the exact second of sale
  line_total: number;
  line_cost: number;
  line_profit: number;
  rounding_adjustment?: number;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'tigopesa' | 'airtel' | 'credit';

export interface Sale {
  id: string;
  receipt_no: string;
  sold_at: string;           // ISO string with timezone
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  total: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: PaymentMethod;
  created_by: string;        // 'Admin' or 'Manager (Family Member)'
  sold_by_name: string;
  voided_at?: string;
  void_reason?: string;
  voided_by?: string;
}

export interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity_bought: number;   // e.g. 2 sacks
  unit_label: string;        // 'sack'
  factor: number;            // 50 (base units)
  total_base_qty: number;    // 100 kg
  unit_cost: number;         // cost per buy unit (e.g. 130,000 TSh per sack)
  base_cost_each: number;    // 2,600 TSh per kg
  total_cost: number;
}

export interface Purchase {
  id: string;
  invoice_no: string;
  supplier_id: string;
  supplier_name: string;
  purchase_date: string;
  items: PurchaseItem[];
  total: number;
  paid_amount: number;
  receipt_url?: string;
  created_by: string;
  status: 'paid' | 'partial' | 'unpaid';
  note?: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'transport'
  | 'wages'
  | 'electricity_shop'
  | 'packaging'
  | 'maintenance'
  | 'taxes_licenses'
  | 'other';

export interface Expense {
  id: string;
  date: string;
  spent_on: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  created_by: string;
}

export interface OwnerDrawing {
  id: string;
  date: string;
  type: 'product' | 'cash';
  product_id?: string;
  product_name?: string;
  quantity?: number;
  base_unit?: string;
  cost_value: number;       // valued at cost (does not hurt shop profit calculation)
  cash_amount?: number;
  note: string;
  taken_by: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  is_regular: boolean;
  credit_limit: number;
  notes?: string;
  current_balance: number;  // positive = owes shop; negative = advance credit
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  current_balance: number;  // positive = shop owes supplier
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  party_type: 'customer' | 'supplier';
  party_id: string;
  party_name: string;
  direction: 'debit' | 'credit'; // for customer: debit = took goods on credit, credit = made payment
  amount: number;
  ref_sale_id?: string;
  ref_purchase_id?: string;
  items_summary?: string;
  note?: string;
  created_at: string;
  created_by: string;
}

export interface PowerMember {
  id: string;
  name: string;
  phone: string;
  meter_no: string;
  room_or_house: string;
  initial_reading: number;
}

export interface PowerPeriod {
  id: string;
  month: string;             // YYYY-MM e.g. "2026-10"
  month_label: string;       // e.g. "October 2026"
  rate_per_unit: number;     // e.g. 413.45 TSh/unit
  rate_mode: 'fixed' | 'derived';
  main_meter_units?: number;
  total_luku_tokens_bought?: number;
  status: 'open' | 'closed';
  closed_at?: string;
}

export interface MeterReading {
  id: string;
  period_id: string;
  member_id: string;
  previous_reading: number;
  current_reading: number;
  units_used: number;
  rate_charged: number;
  current_charge: number;    // units_used * rate_charged
  carried_forward_debt: number; // unpaid from previous month (or negative credit)
  total_due: number;         // current_charge + carried_forward_debt
  paid_amount: number;
  closing_balance: number;   // total_due - paid_amount
  status: 'paid' | 'partial' | 'unpaid' | 'credit';
  last_payment_date?: string;
}

export interface PowerPayment {
  id: string;
  period_id: string;
  member_id: string;
  member_name: string;
  amount: number;
  paid_at: string;
  recorded_by: string;
  reference?: string;
  payment_method: 'cash' | 'mpesa' | 'tigopesa' | 'airtel';
}

export type AuditSeverity = 'alert' | 'digest' | 'log';

export interface AuditLogEntry {
  id: string;
  at: string;
  user_name: string;
  user_role: UserRole;
  table_name: string;
  record_id: string;
  action: 'PRICE_CHANGE' | 'STOCK_ADJUST' | 'SALE_VOID' | 'PURCHASE_ENTRY' | 'RATE_CHANGE' | 'STOCKTAKE' | 'DEBT_PAYMENT';
  old_value?: any;
  new_value?: any;
  reason: string;
  severity: AuditSeverity;
}

export interface CashRegisterSession {
  id: string;
  date: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  cash_sales: number;
  cash_debt_payments: number;
  cash_expenses: number;
  cash_owner_drawings: number;
  expected_closing: number;
  actual_closing?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}
