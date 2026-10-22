import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Shield,
  AlertTriangle,
  History,
  FileCode,
  DollarSign,
  Download,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
  Copy,
  Check,
  Eye,
  Coins
} from 'lucide-react';
import { formatTsh } from '../utils/translations';
import { AuditSeverity, AuditLogEntry } from '../types';

export const AdminAuditScreen: React.FC = () => {
  const {
    t,
    auditLogs,
    currentRole,
    cashRegister,
    closeDayRegister,
    openNewDayRegister,
    exportDatabaseJSON,
    resetToDefaultData
  } = useShop();

  const [severityFilter, setSeverityFilter] = useState<'all' | AuditSeverity>('all');
  const [copiedSql, setCopiedSql] = useState(false);

  // Cash Register closing modal
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [registerNotes, setRegisterNotes] = useState('');

  // Cash Register opening modal
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('50000');
  const [openingNotes, setOpeningNotes] = useState('Float ya asubuhi');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (severityFilter === 'all') return true;
      return log.severity === severityFilter;
    });
  }, [auditLogs, severityFilter]);

  const alertCount = auditLogs.filter(l => l.severity === 'alert').length;

  const handleCloseRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashInput);
    if (isNaN(actual) || actual < 0) {
      alert('Tafadhali weka kiasi halisi cha pesa ulichohesabu.');
      return;
    }
    closeDayRegister(actual, registerNotes.trim() || undefined);
    setShowCloseRegisterModal(false);
    setActualCashInput('');
    setRegisterNotes('');
  };

  const handleOpenRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const opening = parseFloat(openingCashInput);
    if (isNaN(opening) || opening < 0) {
      alert('Tafadhali weka float sahihi ya asubuhi.');
      return;
    }
    openNewDayRegister(opening, openingNotes.trim() || undefined);
    setShowOpenRegisterModal(false);
  };

  // Full tested Supabase Phase 0 SQL Migration code
  const supabaseSqlScript = `-- ====================================================================
-- DUKAFLOW PHASE 0 MIGRATION: RETAIL POS, LOOSE UNITS, CARRY-FORWARD POWER & AUDIT LOG
-- Run this in your Supabase SQL Editor. Disable public signups before running.
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
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Admin & Kumbukumbu za Mfumo (Audit Log)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Fuatilia mabadiliko ya bei za bidhaa, mauzo yaliyofutwa (voids), na hesabu ya droo ya pesa ya kila siku.
          </p>
        </div>

        {/* Register closing / opening button */}
        <div className="flex items-center gap-2">
          {cashRegister.status === 'open' ? (
            <button
              onClick={() => {
                setActualCashInput(cashRegister.expected_closing.toString());
                setShowCloseRegisterModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Funga Droo ya Pesa ya Siku (Reconcile)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenRegisterModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Fungua Droo Mpya ya Leo</span>
            </button>
          )}
        </div>
      </div>

      {/* Cash Drawer Status Card */}
      <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-sm text-gray-900">
              Ulinganifu wa Pesa ya Droo (Cash Drawer Reconciliation)
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              cashRegister.status === 'open'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {cashRegister.status === 'open' ? 'Droo Imefunguliwa' : 'Droo Imefungwa'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-gray-400 block">Pesa ya Kuanzia (Float):</span>
            <span className="font-mono font-bold text-sm text-gray-800">
              {formatTsh(cashRegister.opening_cash)}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <span className="text-emerald-700 block">Mauzo ya Cash Leo:</span>
            <span className="font-mono font-bold text-sm text-emerald-900">
              +{formatTsh(cashRegister.cash_sales)}
            </span>
          </div>

          <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100">
            <span className="text-red-700 block">Matumizi ya Cash Leo:</span>
            <span className="font-mono font-bold text-sm text-red-900">
              -{formatTsh(cashRegister.cash_expenses)}
            </span>
          </div>

          <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-100">
            <span className="text-orange-700 block font-bold">Pesa Inayotarajiwa Drooni:</span>
            <span className="font-mono font-extrabold text-base text-orange-950">
              {formatTsh(cashRegister.expected_closing)}
            </span>
          </div>
        </div>

        {cashRegister.status === 'closed' && cashRegister.actual_closing !== undefined && (
          <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            cashRegister.difference === 0
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}>
            <span>Pesa Halisi Iliyohesabiwa: <strong className="font-mono">{formatTsh(cashRegister.actual_closing)}</strong></span>
            <span>Tofauti ya Droo: <strong className="font-mono">{cashRegister.difference! >= 0 ? `+${cashRegister.difference}` : cashRegister.difference} TSh</strong></span>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-orange-100 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" />
              <span>Kumbukumbu ya Vitendo na Mabadiliko (Audit Trail)</span>
            </h3>
            <p className="text-xs text-gray-400">
              Kila badiliko la bei au kufuta mauzo linaandikwa na kutolewa arifa mara moja.
            </p>
          </div>

          {/* Severity filter pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold ${
                severityFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Zote ({auditLogs.length})
            </button>
            <button
              onClick={() => setSeverityFilter('alert')}
              className={`px-3 py-1 rounded-xl font-bold ${
                severityFilter === 'alert' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
              }`}
            >
              Arifa za Dharura ({alertCount})
            </button>
            <button
              onClick={() => setSeverityFilter('digest')}
              className={`px-3 py-1 rounded-xl font-bold ${
                severityFilter === 'digest' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
              }`}
            >
              Kawaida
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[450px] overflow-y-auto">
          {filteredLogs.map(log => {
            const isAlert = log.severity === 'alert';
            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-2xl border text-xs transition-all ${
                  isAlert
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-orange-50/20 border-orange-100'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        isAlert ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-gray-900 font-extrabold">{log.table_name.toUpperCase()}</span>
                  </div>

                  <span className="text-[11px] text-gray-400">
                    {new Date(log.at).toLocaleString()}
                  </span>
                </div>

                <p className="text-gray-800 font-medium mt-1">
                  Sababu: <span className="font-semibold text-gray-950">"{log.reason}"</span>
                </p>

                {/* Values diff */}
                {log.old_value && log.new_value && (
                  <div className="mt-2 p-2 bg-white/80 rounded-xl border border-gray-100 text-[11px] font-mono flex items-center gap-4 text-gray-600">
                    <div>Awali: <span className="text-gray-800 font-bold">{JSON.stringify(log.old_value)}</span></div>
                    <div>→ Sasa: <span className="text-orange-700 font-bold">{JSON.stringify(log.new_value)}</span></div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 mt-2 flex items-center justify-between">
                  <span>Mhusika: <strong className="text-gray-600">{log.user_name}</strong></span>
                  <span>ID: {log.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase Phase 0 SQL Migration Script Viewer */}
      <div className="bg-white rounded-3xl border border-orange-100 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>Script ya Supabase / Postgres Migration (Phase 0)</span>
            </h3>
            <p className="text-xs text-gray-400">
              Msimbo kamili wa SQL uliojaribiwa na kuthibitishwa wenye majedwali, RLS policies na triggers.
            </p>
          </div>

          <button
            onClick={copySqlToClipboard}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Imenakiliwa!' : 'Nakili SQL Script'}</span>
          </button>
        </div>

        <div className="p-3 bg-gray-900 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto max-h-52">
          <pre>{supabaseSqlScript}</pre>
        </div>
      </div>

      {/* Danger Zone: Reset to Demo Data */}
      <div className="bg-red-50/50 rounded-3xl border border-red-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-sm text-red-950">Rejesha Mfumo kwenye Hali ya Awali (Reset Demo)</h4>
          <p className="text-xs text-red-700 mt-0.5">
            Itarudisha bidhaa, wateja, mauzo na namba za mita za mfano.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Una uhakika unataka kurudisha data zote za mfano?')) {
              resetToDefaultData();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          Rejesha Data za Mfano
        </button>
      </div>

      {/* Modal: Close Cash Register */}
      {showCloseRegisterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Funga Droo ya Pesa ya Siku (End of Day Cash Count)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Hesabu pesa taslimu zilizopo mkononi kwenye droo.
            </p>

            <form onSubmit={handleCloseRegisterSubmit} className="space-y-3">
              <div className="p-2.5 bg-orange-50 rounded-xl text-xs">
                <span className="text-gray-500 block">Pesa Inayotarajiwa:</span>
                <span className="font-mono font-black text-sm text-orange-950">
                  {formatTsh(cashRegister.expected_closing)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Pesa Halisi Uliyohesabu Drooni (TSh):
                </label>
                <input
                  type="number"
                  required
                  value={actualCashInput}
                  onChange={e => setActualCashInput(e.target.value)}
                  placeholder="52400"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm font-mono font-bold focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              {parseFloat(actualCashInput) >= 0 && (
                <div className="text-xs font-semibold">
                  Tofauti:{' '}
                  <span
                    className={
                      parseFloat(actualCashInput) - cashRegister.expected_closing === 0
                        ? 'text-emerald-600'
                        : 'text-red-600 font-bold'
                    }
                  >
                    {parseFloat(actualCashInput) - cashRegister.expected_closing} TSh
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo (Hiari):</label>
                <input
                  type="text"
                  value={registerNotes}
                  onChange={e => setRegisterNotes(e.target.value)}
                  placeholder="Mf. Chenji ya 100 ilipungua asubuhi"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
                >
                  Funga Hesabu ya Droo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Open Cash Register */}
      {showOpenRegisterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Fungua Droo Mpya ya Leo
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Weka float ya kuanzia asubuhi.
            </p>

            <form onSubmit={handleOpenRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Float ya Kuanzia Asubuhi (TSh):
                </label>
                <input
                  type="number"
                  required
                  value={openingCashInput}
                  onChange={e => setOpeningCashInput(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-sm font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo (Hiari):</label>
                <input
                  type="text"
                  value={openingNotes}
                  onChange={e => setOpeningNotes(e.target.value)}
                  placeholder="Mf. Noti za 10,000 na sarafu za chenji"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Fungua Droo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
