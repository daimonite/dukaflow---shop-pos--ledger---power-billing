import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { useSync } from '../context/SyncContext';
import { useToast } from '../context/ToastContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  User,
  ShoppingBag,
  CreditCard,
  Ban,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CheckCircle2,
  Lock,
  RefreshCw,
  Sparkles,
  Layers,
  Percent,
  Coins
} from 'lucide-react';
import { formatTsh, formatQty } from '../utils/translations';
import { Sale, Product, Expense } from '../types';

export const CalendarScreen: React.FC = () => {
  const {
    t,
    sales,
    voidSale,
    currentRole,
    products,
    expenses,
    ownerDrawings,
    cashRegister,
    addExpense,
    addOwnerDrawing,
    closeDayRegister
  } = useShop();

  const { openOutbox, isOnline, pendingCount } = useSync();
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [voidModalSale, setVoidModalSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Quick Action Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseSpentOn, setExpenseSpentOn] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('electricity_shop');
  const [expenseNote, setExpenseNote] = useState('');

  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingType, setDrawingType] = useState<'product' | 'cash'>('product');
  const [drawingProductId, setDrawingProductId] = useState('');
  const [drawingQty, setDrawingQty] = useState('');
  const [drawingCashAmount, setDrawingCashAmount] = useState('');
  const [drawingNote, setDrawingNote] = useState('');

  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  }, [year, month]);

  // Aggregate sales by day (YYYY-MM-DD)
  const salesByDay = useMemo(() => {
    const map = new Map<string, { total: number; profit: number; count: number; sales: Sale[] }>();
    
    sales.forEach(sale => {
      if (sale.voided_at) return; // skip voided
      const dayKey = sale.sold_at.split('T')[0];
      const profit = sale.items.reduce((sum, item) => sum + item.line_profit, 0);

      const existing = map.get(dayKey) || { total: 0, profit: 0, count: 0, sales: [] };
      existing.total += sale.total;
      existing.profit += profit;
      existing.count += 1;
      existing.sales.push(sale);
      map.set(dayKey, existing);
    });

    return map;
  }, [sales]);

  // Monthly summary metrics
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthSales = useMemo(() => {
    return sales.filter(s => !s.voided_at && s.sold_at.startsWith(monthPrefix));
  }, [sales, monthPrefix]);

  const monthlyTotalRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthlyTotalProfit = monthSales.reduce(
    (sum, s) => sum + s.items.reduce((acc, i) => acc + i.line_profit, 0),
    0
  );

  // Today specific calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => {
    return sales.filter(s => !s.voided_at && s.sold_at.startsWith(todayStr));
  }, [sales, todayStr]);

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayGrossProfit = todaySales.reduce(
    (sum, s) => sum + s.items.reduce((acc, i) => acc + i.line_profit, 0),
    0
  );
  const todayGrossMargin = todayRevenue > 0 ? (todayGrossProfit / todayRevenue) * 100 : 0;

  const todayExpensesList = expenses.filter(e => e.date.startsWith(todayStr));
  const todayExpensesTotal = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);

  const todayDrawingsList = ownerDrawings.filter(d => d.date.startsWith(todayStr));
  const todayDrawingsTotal = todayDrawingsList.reduce((sum, d) => sum + d.cost_value, 0);

  const todayNetProfit = todayGrossProfit - todayExpensesTotal - todayDrawingsTotal;
  const actualCashInHand = cashRegister.expected_closing;

  // Low stock products for Urgent Reorder Banner
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.active && p.stock_qty <= p.reorder_level);
  }, [products]);

  // Active day sales
  const activeDayData = salesByDay.get(selectedDayStr);
  const activeDaySales = sales
    .filter(s => s.sold_at.startsWith(selectedDayStr))
    .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleConfirmVoid = () => {
    if (!voidModalSale) return;
    if (!voidReason.trim()) {
      showToast('Tafadhali andika sababu ya kufuta mauzo haya.', 'warning');
      return;
    }
    voidSale(voidModalSale.id, voidReason.trim());
    showToast(`Mauzo #${voidModalSale.receipt_no} yamefutwa na stoo kurejeshwa`, 'info');
    setVoidModalSale(null);
    setVoidReason('');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseSpentOn.trim() || isNaN(amt) || amt <= 0) {
      showToast('Weka maelezo na kiasi sahihi cha matumizi', 'error');
      return;
    }
    addExpense(expenseSpentOn.trim(), expenseCategory, amt, expenseNote.trim());
    showToast(`Matumizi ya TSh ${amt.toLocaleString()} yamehifadhiwa`, 'success');
    setShowExpenseModal(false);
    setExpenseSpentOn('');
    setExpenseAmount('');
    setExpenseNote('');
  };

  const handleSaveOwnerDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    if (drawingType === 'product') {
      const qtyNum = parseFloat(drawingQty);
      if (!drawingProductId || isNaN(qtyNum) || qtyNum <= 0) {
        showToast('Chagua bidhaa na idadi iliyochukuliwa', 'error');
        return;
      }
      addOwnerDrawing({
        type: 'product',
        productId: drawingProductId,
        qty: qtyNum,
        note: drawingNote.trim() || 'Matumizi ya nyumbani',
      });
      showToast('Bidhaa ya matumizi ya nyumbani imerekodiwa kwa bei ya jumla (at cost)', 'success');
    } else {
      const cashAmt = parseFloat(drawingCashAmount);
      if (isNaN(cashAmt) || cashAmt <= 0) {
        showToast('Weka kiasi sahihi cha pesa taslimu zilizochukuliwa', 'error');
        return;
      }
      addOwnerDrawing({
        type: 'cash',
        cashAmount: cashAmt,
        note: drawingNote.trim() || 'Pesa ya matumizi binafsi',
      });
      showToast(`Pesa TSh ${cashAmt.toLocaleString()} za matumizi binafsi zimerekodiwa`, 'success');
    }
    setShowDrawingModal(false);
    setDrawingProductId('');
    setDrawingQty('');
    setDrawingCashAmount('');
    setDrawingNote('');
  };

  const handleConfirmReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseFloat(actualCashCounted);
    if (isNaN(count) || count < 0) {
      showToast('Weka kiasi cha pesa zilizopo kwenye droo', 'error');
      return;
    }
    closeDayRegister(count, reconcileNotes.trim());
    const diff = count - cashRegister.expected_closing;
    if (diff === 0) {
      showToast('Droo imefungwa: Pesa ziko sahihi kabisa (Hakuna upungufu)', 'success');
    } else if (diff < 0) {
      showToast(`Droo imefungwa: Upungufu wa TSh ${Math.abs(diff).toLocaleString()}`, 'warning');
    } else {
      showToast(`Droo imefungwa: Ziada ya TSh ${diff.toLocaleString()}`, 'info');
    }
    setShowReconcileModal(false);
    setActualCashCounted('');
    setReconcileNotes('');
  };

  const monthNames = [
    'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
    'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5 animate-fade-in">
      
      {/* ── URGENT REORDER BANNER ── */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white p-4 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse-ring">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  Tahadhari ya Kuishiwa Mzigo Dukani!
                </span>
                <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {lowStockProducts.length} Bidhaa
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                {lowStockProducts.slice(0, 3).map(p => `${p.name} (Baki: ${p.stock_qty} ${p.base_unit})`).join(' • ')}
                {lowStockProducts.length > 3 && ` na nyingine ${lowStockProducts.length - 3}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => showToast('Nenda sehemu ya Stoo au Ununuzi wa Mzigo kurekodi mzigo mpya', 'info')}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-700 hover:bg-orange-50 font-extrabold text-xs rounded-2xl shadow-sm transition-all btn-press whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            <span>Agiza Mzigo Sasa</span>
          </button>
        </div>
      )}

      {/* ── REAL-TIME FINANCIAL SNAPSHOT (TODAY) ── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100/60 px-2.5 py-0.5 rounded-full">
              Hali ya Fedha ya Leo · Live Snapshot
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mt-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span>Mapato, Pesa Mkononi & Faida Halisi ya Leo</span>
            </h2>
          </div>
          <div className="text-xs font-semibold text-gray-400">
            {new Date().toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Today's Sales Revenue */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 p-3.5 rounded-2xl card-lift">
            <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wide block">
              Mauzo ya Leo (Revenue)
            </span>
            <div className="text-xl sm:text-2xl font-black text-orange-950 font-mono mt-1">
              {formatTsh(todayRevenue)}
            </div>
            <div className="text-[11px] text-orange-700/80 mt-1 flex items-center gap-1 font-medium">
              <ShoppingBag className="w-3 h-3" />
              <span>{todaySales.length} Risiti zilizouzwa leo</span>
            </div>
          </div>

          {/* Card 2: Actual Cash in Hand */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 p-3.5 rounded-2xl card-lift">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide block">
              Pesa Taslimu Drooni (Cash in Hand)
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-950 font-mono mt-1">
              {formatTsh(actualCashInHand)}
            </div>
            <div className="text-[11px] text-blue-700/80 mt-1 flex items-center gap-1 font-medium">
              <Coins className="w-3 h-3" />
              <span>Droo ya fedha iliyo wazi</span>
            </div>
          </div>

          {/* Card 3: Gross Profit & Margin */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 p-3.5 rounded-2xl card-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block">
                Faida ya Mauzo (Gross)
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                {todayGrossMargin.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-1">
              {formatTsh(todayGrossProfit)}
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-1 flex items-center gap-1 font-medium">
              <Percent className="w-3 h-3" />
              <span>Iliyohesabiwa kutoka bei ya ununuzi</span>
            </div>
          </div>

          {/* Card 4: Net Profit after Expenses & Drawings */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50/60 border border-purple-200/80 p-3.5 rounded-2xl card-lift">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
              Faida Halisi (Net Profit)
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${todayNetProfit >= 0 ? 'text-purple-950' : 'text-red-600'}`}>
              {formatTsh(todayNetProfit)}
            </div>
            <div className="text-[10px] text-purple-700/80 mt-1 flex items-center justify-between">
              <span>Matumizi: -{formatTsh(todayExpensesTotal)}</span>
              <span>Binafsi: -{formatTsh(todayDrawingsTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── OWNER DRAWINGS (MATUMIZI BINAFSI) STRIP ── */}
        <div className="mt-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                <span>Matumizi Binafsi ya Nyumbani (Owner Drawings)</span>
                <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full">
                  Valued at Cost (TSh {formatTsh(todayDrawingsTotal)})
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Vitu au pesa zilizotolewa dukani kwa matumizi ya nyumbani vinahesabiwa kwa bei ya jumla ya ununuzi ili faida ya biashara isipotee.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDrawingModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all btn-press whitespace-nowrap"
          >
            <span>+ Weka Matumizi Binafsi</span>
          </button>
        </div>
      </div>

      {/* ── QUICK ACTION BAR ── */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-orange-100 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
          Vitendo vya Haraka (Quick Action Bar)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Action 1: Add Expense */}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 p-2.5 rounded-2xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all btn-press text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">+ Matumizi ya Duka</div>
              <div className="text-[10px] text-gray-400">Umeme, chakula, usafiri</div>
            </div>
          </button>

          {/* Action 2: Add Owner Drawing */}
          <button
            onClick={() => setShowDrawingModal(true)}
            className="flex items-center gap-2 p-2.5 rounded-2xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all btn-press text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">+ Matumizi Binafsi</div>
              <div className="text-[10px] text-gray-400">Bidhaa / Pesa ya nyumbani</div>
            </div>
          </button>

          {/* Action 3: Reconcile Cash Closing */}
          <button
            onClick={() => setShowReconcileModal(true)}
            className="flex items-center gap-2 p-2.5 rounded-2xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all btn-press text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Funga Droo ya Siku</div>
              <div className="text-[10px] text-gray-400">Reconcile cash closing</div>
            </div>
          </button>

          {/* Action 4: Offline Sync Verification */}
          <button
            onClick={openOutbox}
            className="flex items-center gap-2 p-2.5 rounded-2xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all btn-press text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <RefreshCw className={`w-4 h-4 ${pendingCount > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span>Hali ya Sync</span>
                {pendingCount > 0 && (
                  <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full font-mono font-bold">
                    {pendingCount}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400">
                {isOnline ? 'Online · Tayari kusawazisha' : 'Offline · Dexie hifadhi'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── HEADER AND MONTH NAVIGATION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
            <span>{t.salesCalendar}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bofya tarehe yoyote kutazama miamala yote na faida iliyopatikana siku hiyo.
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-50 p-1 rounded-2xl border border-orange-100">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-gray-700 transition-colors btn-press"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm text-orange-950 px-3 min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-gray-700 transition-colors btn-press"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MONTH TOTALS KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-4 rounded-3xl shadow-sm card-lift">
          <span className="text-xs font-semibold text-orange-100 uppercase tracking-wider block">
            Jumla ya Mauzo ya Mwezi ({monthNames[month]})
          </span>
          <div className="text-2xl font-black mt-1 font-mono">{formatTsh(monthlyTotalRevenue)}</div>
          <span className="text-[11px] text-orange-100 mt-1 block">
            Kutokana na risiti {monthSales.length} zilizouzwa mwezi huu
          </span>
        </div>

        {currentRole === 'admin' && (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-4 rounded-3xl shadow-sm card-lift">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
              Faida ya Mauzo (Monthly Gross Profit)
            </span>
            <div className="text-2xl font-black mt-1 font-mono">{formatTsh(monthlyTotalProfit)}</div>
            <span className="text-[11px] text-emerald-100 mt-1 block">
              Margin: {monthlyTotalRevenue > 0 ? ((monthlyTotalProfit / monthlyTotalRevenue) * 100).toFixed(1) : 0}% kabla ya kutoa matumizi
            </span>
          </div>
        )}

        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs card-lift">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Wastani wa Mauzo kwa Siku
          </span>
          <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
            {formatTsh(daysInMonth > 0 ? Math.round(monthlyTotalRevenue / daysInMonth) : 0)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Wastani unaotakiwa: &gt; TSh 250,000 / siku
          </span>
        </div>
      </div>

      {/* ── MAIN GRID: COLOR-CODED CALENDAR (LEFT) & SELECTED DAY SALES (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
          
          {/* Legend Strip */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 text-[10px] text-gray-500">
            <span className="font-bold uppercase tracking-wider">Muongozo wa Rangi:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-bold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                &gt;300k (Juu)
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                100k-300k (Kawaida)
              </span>
              <span className="flex items-center gap-1 font-bold text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                &lt;100k
              </span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
            <span>Jpili</span>
            <span>Jtatu</span>
            <span>Jnne</span>
            <span>Jtano</span>
            <span>Alh</span>
            <span>Ijumaa</span>
            <span>Jmosi</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[80px] rounded-2xl bg-gray-50/50" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayData = salesByDay.get(dateStr);
              const isSelected = selectedDayStr === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const totalAmt = dayData ? dayData.total : 0;

              // Color coding logic
              const isHighPerforming = totalAmt >= 300000;
              const isRegularDay = totalAmt >= 100000 && totalAmt < 300000;
              const isLowerDay = totalAmt > 0 && totalAmt < 100000;

              let cellStyle = 'border-gray-100 bg-white hover:bg-orange-50/20';
              if (isSelected) {
                cellStyle = 'border-orange-500 bg-orange-50 ring-2 ring-orange-400 shadow-sm';
              } else if (isHighPerforming) {
                cellStyle = 'border-emerald-300 bg-emerald-50/70 hover:border-emerald-500 hover:bg-emerald-100/50';
              } else if (isRegularDay) {
                cellStyle = 'border-amber-200 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-100/50';
              } else if (isLowerDay) {
                cellStyle = 'border-blue-100 bg-blue-50/30 hover:border-blue-300';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`min-h-[64px] sm:min-h-[80px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer btn-press ${cellStyle}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-orange-600 text-white'
                          : isSelected
                          ? 'text-orange-900 font-extrabold'
                          : 'text-gray-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayData && (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {dayData.count}r
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    {dayData && dayData.total > 0 ? (
                      <div>
                        <div className={`text-[11px] font-extrabold font-mono truncate ${
                          isHighPerforming ? 'text-emerald-900' : isRegularDay ? 'text-amber-900' : 'text-gray-900'
                        }`}>
                          {formatTsh(dayData.total)}
                        </div>
                        {currentRole === 'admin' && (
                          <div className={`text-[9px] font-bold truncate ${
                            isHighPerforming ? 'text-emerald-700' : 'text-gray-500'
                          }`}>
                            +{formatTsh(dayData.profit)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300">-</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Breakdown Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs flex flex-col">
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Orodha ya Mauzo ya Tarehe
              </span>
              <h3 className="font-extrabold text-base text-gray-900">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('sw-TZ', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
            </div>
            {activeDayData && (
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Jumla ya Siku:</span>
                <span className="font-mono font-extrabold text-sm text-orange-600">
                  {formatTsh(activeDayData.total)}
                </span>
              </div>
            )}
          </div>

          {/* Sales list for selected date */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[500px]">
            {activeDaySales.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Hakuna mauzo yaliyofanyika tarehe hii.
              </div>
            ) : (
              activeDaySales.map(sale => {
                const isVoided = Boolean(sale.voided_at);
                const saleProfit = sale.items.reduce((s, i) => s + i.line_profit, 0);

                return (
                  <div
                    key={sale.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isVoided
                        ? 'bg-red-50/50 border-red-200 opacity-70'
                        : 'bg-orange-50/30 border-orange-100 hover:border-orange-300'
                    }`}
                  >
                    {/* Top line: Receipt no & Time */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                        <FileText className="w-3.5 h-3.5 text-orange-600" />
                        <span>{sale.receipt_no}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(sale.sold_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Customer & salesperson */}
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="font-semibold text-gray-800">
                          {sale.customer_name || 'Taslimu'}
                        </span>
                      </div>
                      <span className="text-gray-400">Muuzaji: {sale.sold_by_name}</span>
                    </div>

                    {/* Items taken */}
                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-xs space-y-1 mb-2">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-700">
                            {item.product_name}{' '}
                            <span className="text-gray-400">({formatQty(item.quantity, item.unit_label)})</span>
                          </span>
                          <span className="font-mono text-gray-900 font-semibold">
                            {formatTsh(item.line_total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Payment method */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-sm">
                          {sale.payment_method}
                        </span>
                        {currentRole === 'admin' && !isVoided && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            Faida: {formatTsh(saleProfit)}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-extrabold text-sm text-gray-900">
                          {formatTsh(sale.total)}
                        </span>
                      </div>
                    </div>

                    {/* Void badge or Void Action button */}
                    {isVoided ? (
                      <div className="mt-2 bg-red-100 text-red-800 text-[10px] font-bold p-1.5 rounded-lg flex items-center justify-between">
                        <span>ILIFUTWA: {sale.void_reason}</span>
                        <span>na {sale.voided_by}</span>
                      </div>
                    ) : (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => setVoidModalSale(sale)}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline btn-press"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Futa Mauzo (Void)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: VOID SALE ── */}
      {voidModalSale && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-gray-900">Thibitisha Kufuta Mauzo</h3>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Kufuta risiti <span className="font-bold font-mono">{voidModalSale.receipt_no}</span> kutarudisha bidhaa kwenye stoo na kufuta deni (kama lilikuwepo). Tukio hili litalogiwa kwenye Audit Log ya Admin.
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Sababu ya Kufuta (Inahitajika):
              </label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="Mfano: Mteja amebadilisha mawazo / namba ya risiti ilirudiwa"
                rows={3}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-red-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setVoidModalSale(null);
                  setVoidReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmVoid}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs btn-press"
              >
                Ndio, Futa Mauzo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD EXPENSE ── */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Rekodi Matumizi ya Duka</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yalitumika kwa ajili ya nini?</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: LUKU ya dukani, Chakula cha mchana"
                  value={expenseSpentOn}
                  onChange={e => setExpenseSpentOn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi (TSh)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="Kiasi cha fedha"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Aina ya Matumizi</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="electricity_shop">LUKU / Umeme</option>
                    <option value="transport">Usafiri / Boda</option>
                    <option value="rent">Kodi ya Pango</option>
                    <option value="wages">Mshahara / Posho</option>
                    <option value="packaging">Vifungashio / Mifuko</option>
                    <option value="maintenance">Ukarabati / Matengenezo</option>
                    <option value="taxes_licenses">Leseni / Kodi za Serikali</option>
                    <option value="other">Mengineyo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo ya Ziada (Hiari)</label>
                <input
                  type="text"
                  placeholder="Mfano: Risiti namba 0928"
                  value={expenseNote}
                  onChange={e => setExpenseNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs btn-press"
                >
                  Hifadhi Matumizi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD OWNER DRAWING (MATUMIZI BINAFSI) ── */}
      {showDrawingModal && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Rekodi Matumizi Binafsi ya Nyumbani</h3>
                  <div className="text-[10px] text-gray-400">Valued at Cost to preserve operating margins</div>
                </div>
              </div>
              <button onClick={() => setShowDrawingModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOwnerDrawing} className="space-y-3">
              {/* Type Switcher: Product or Cash */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDrawingType('product')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    drawingType === 'product' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Bidhaa ya Duka (Product)
                </button>
                <button
                  type="button"
                  onClick={() => setDrawingType('cash')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    drawingType === 'cash' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Pesa Taslimu (Cash)
                </button>
              </div>

              {drawingType === 'product' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Chagua Bidhaa</label>
                    <select
                      required
                      value={drawingProductId}
                      onChange={e => setDrawingProductId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                    >
                      <option value="">-- Chagua bidhaa iliyochukuliwa --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Bei ya mzigo: TSh {p.avg_cost.toLocaleString()} / {p.base_unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Idadi / Kiasi Kilichochukuliwa</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.05"
                      placeholder="Mfano: 1 au 2.5"
                      value={drawingQty}
                      onChange={e => setDrawingQty(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi cha Pesa Taslimu (TSh)</label>
                  <input
                    type="number"
                    required
                    min="500"
                    placeholder="Mfano: 20000"
                    value={drawingCashAmount}
                    onChange={e => setDrawingCashAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo</label>
                <input
                  type="text"
                  placeholder="Mfano: Unga na Mafuta ya kupikia nyumbani"
                  value={drawingNote}
                  onChange={e => setDrawingNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDrawingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs btn-press"
                >
                  Hifadhi Matumizi Binafsi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECONCILE CASH REGISTER ── */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Hesabu & Funga Droo ya Siku</h3>
              </div>
              <button onClick={() => setShowReconcileModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReconcile} className="space-y-3">
              <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
                <div className="text-[11px] text-blue-800 font-semibold">Pesa Zinazotarajiwa Drooni (Expected):</div>
                <div className="text-xl font-black font-mono text-blue-950 mt-0.5">
                  {formatTsh(cashRegister.expected_closing)}
                </div>
                <div className="text-[10px] text-blue-600 mt-1">
                  Kuanzia asubuhi ({formatTsh(cashRegister.opening_cash)}) + Mauzo ({formatTsh(cashRegister.cash_sales)}) - Matumizi ({formatTsh(cashRegister.cash_expenses + cashRegister.cash_owner_drawings)})
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Pesa Halisi Ulizozihesabu Drooni (Actual Cash Counted)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Kiasi halisi ulichokihesabu"
                  value={actualCashCounted}
                  onChange={e => setActualCashCounted(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {actualCashCounted !== '' && !isNaN(parseFloat(actualCashCounted)) && (
                <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                  parseFloat(actualCashCounted) === cashRegister.expected_closing
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : parseFloat(actualCashCounted) < cashRegister.expected_closing
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  <span>Tofauti (Variance):</span>
                  <span className="font-mono">
                    {parseFloat(actualCashCounted) - cashRegister.expected_closing === 0
                      ? 'TSh 0 (Sahihi Kabisa ✓)'
                      : formatTsh(parseFloat(actualCashCounted) - cashRegister.expected_closing)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo ya Kufunga Droo</label>
                <input
                  type="text"
                  placeholder="Mfano: Mteja alirudisha chenji baadaye"
                  value={reconcileNotes}
                  onChange={e => setReconcileNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs btn-press"
                >
                  Thibitisha Kufunga Droo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
