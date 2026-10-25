import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Wallet,
  Home,
  Plus,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingDown,
  Info,
  Clock,
  User,
  ShoppingBag,
  X
} from 'lucide-react';
import { formatTsh, formatQty } from '../utils/translations';
import { Expense, ExpenseCategory, OwnerDrawing } from '../types';
import { Modal } from './Modal';

export const ExpensesPersonalScreen: React.FC = () => {
  const {
    t,
    expenses,
    ownerDrawings,
    products,
    addExpense,
    addOwnerDrawing,
    currentRole
  } = useShop();

  const [activeTab, setActiveTab] = useState<'expenses' | 'personal'>('expenses');

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [spentOn, setSpentOn] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('packaging');
  const [amountInput, setAmountInput] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  // Add Personal Use Modal
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [personalType, setPersonalType] = useState<'product' | 'cash'>('product');
  const [personalProductId, setPersonalProductId] = useState(products[0]?.id || '');
  const [personalQty, setPersonalQty] = useState('1');
  const [personalCashAmount, setPersonalCashAmount] = useState('');
  const [personalNote, setPersonalNote] = useState('');

  // Totals
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalOwnerDrawings = useMemo(() => {
    return ownerDrawings.reduce((sum, d) => sum + d.cost_value, 0);
  }, [ownerDrawings]);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0 || !spentOn.trim()) {
      alert('Weka maelezo na kiasi sahihi.');
      return;
    }

    addExpense(spentOn.trim(), category, amt, expenseNote.trim() || undefined);
    setShowExpenseModal(false);
    setSpentOn('');
    setAmountInput('');
    setExpenseNote('');
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (personalType === 'product') {
      const qtyNum = parseFloat(personalQty);
      if (isNaN(qtyNum) || qtyNum <= 0 || !personalProductId) {
        alert('Chagua bidhaa na uweke kiasi sahihi.');
        return;
      }
      addOwnerDrawing({
        type: 'product',
        productId: personalProductId,
        qty: qtyNum,
        note: personalNote.trim() || 'Vitu vilivyochukuliwa kwa matumizi ya nyumbani',
      });
    } else {
      const cashAmt = parseFloat(personalCashAmount);
      if (isNaN(cashAmt) || cashAmt <= 0) {
        alert('Weka kiasi sahihi cha pesa taslimu.');
        return;
      }
      addOwnerDrawing({
        type: 'cash',
        cashAmount: cashAmt,
        note: personalNote.trim() || 'Pesa iliyochukuliwa kwenye droo na mwenye duka',
      });
    }

    setShowPersonalModal(false);
    setPersonalQty('1');
    setPersonalCashAmount('');
    setPersonalNote('');
  };

  const categoryLabels: Record<ExpenseCategory, string> = {
    packaging: 'Mifuko / Vifungashio',
    transport: 'Nauli / Usafiri',
    rent: 'Kodi ya Fremu',
    wages: 'Posho / Mshahara',
    electricity_shop: 'Umeme wa Duka',
    maintenance: 'Matengenezo / Ukarabati',
    taxes_licenses: 'Ushuru / Leseni',
    other: 'Matumizi Mengineyo',
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-600" />
            <span>Matumizi ya Duka & Vitu vya Nyumbani</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tofautisha matumizi ya duka yanayopunguza faida, na vitu vinavyochukuliwa nyumbani (Owner Drawings) kwa bei ya kununua.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center gap-1.5 bg-orange-50 p-1 rounded-2xl border border-orange-100">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Matumizi ya Duka (Expenses)</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'personal'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Vitu vya Nyumbani (Personal Use)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Jumla ya Matumizi ya Uendeshaji (Expenses)
            </span>
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              Inapunguza Faida
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2 font-mono">
            {formatTsh(totalExpenses)}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Kodi, nauli ya kufuata bidhaa, mifuko, posho, n.k.
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Vitu/Pesa Zilizochukuliwa Nyumbani (Owner Drawings)
            </span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Thamani ya Cost
            </span>
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2 font-mono">
            {formatTsh(totalOwnerDrawings)}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Havihesabiwi kama hasara bali mtaji uliopunguzwa na mwenye duka
          </span>
        </div>
      </div>

      {/* Explanatory banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Kanuni ya Uhasibu wa Duka la Rejareja: </span>
          Ukichukua sukari au sabuni kwa matumizi ya nyumbani, isirekodiwe kama "Matumizi ya duka" kwa sababu itaonyesha duka lina hasara. Inarekodiwa kama <i>Owner Drawing</i> kwa bei halisi iliyonunuliwa (at cost).
        </div>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="font-extrabold text-sm text-gray-800">Orodha ya Matumizi Yote</span>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Rekodi Matumizi Mapya</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {expenses.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">Hakuna matumizi yaliyorekodiwa.</p>
            ) : (
              expenses.map(exp => (
                <div
                  key={exp.id}
                  className="p-3.5 bg-orange-50/30 rounded-2xl border border-orange-100 hover:border-orange-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">{exp.spent_on}</span>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {categoryLabels[exp.category]}
                      </span>
                    </div>
                    {exp.note && (
                      <p className="text-[11px] text-gray-500 mt-0.5 italic">"{exp.note}"</p>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(exp.date).toLocaleDateString()} saa {new Date(exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • na {exp.created_by}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm text-red-600">
                      -{formatTsh(exp.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PERSONAL USE TAB */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="font-extrabold text-sm text-gray-800">Orodha ya Vitu Vilivyochukuliwa Nyumbani</span>
            <button
              onClick={() => {
                if (products.length > 0) setPersonalProductId(products[0].id);
                setShowPersonalModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Rekodi Vitu vya Nyumbani</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {ownerDrawings.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">Hakuna vitu vilivyochukuliwa nyumbani bado.</p>
            ) : (
              ownerDrawings.map(draw => (
                <div
                  key={draw.id}
                  className="p-3.5 bg-blue-50/30 rounded-2xl border border-blue-100 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-blue-950">
                        {draw.type === 'product' ? `${draw.product_name} (${draw.quantity} ${draw.base_unit})` : 'Pesa Taslimu ya Nyumbani'}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                        {draw.type === 'product' ? 'Bidhaa' : 'Cash'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">"{draw.note}"</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(draw.date).toLocaleDateString()} saa {new Date(draw.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • na {draw.taken_by}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">Thamani ya Kununua:</span>
                    <span className="font-mono font-extrabold text-sm text-blue-700">
                      {formatTsh(draw.cost_value)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title={t.addExpense}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Matumizi ni ya nini?:</label>
            <input
              type="text"
              required
              value={spentOn}
              onChange={e => setSpentOn(e.target.value)}
              placeholder="Mf. Mifuko ya nailoni, Nauli, Umeme"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Kundi la Matumizi:</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
            >
              <option value="packaging">Mifuko / Vifungashio</option>
              <option value="transport">Nauli / Usafiri</option>
              <option value="rent">Kodi ya Fremu</option>
              <option value="wages">Posho / Mshahara</option>
              <option value="electricity_shop">Umeme wa Duka</option>
              <option value="maintenance">Matengenezo</option>
              <option value="taxes_licenses">Ushuru / Leseni</option>
              <option value="other">Matumizi Mengineyo</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi cha Pesa (TSh):</label>
            <input
              type="number"
              required
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              placeholder="5000"
              className="w-full px-3 py-2 rounded-xl border border-red-200 text-sm font-mono font-bold focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo ya Ziada (Hiari):</label>
            <input
              type="text"
              value={expenseNote}
              onChange={e => setExpenseNote(e.target.value)}
              placeholder="Mf. Bando 2 za mifuko Kariakoo"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs"
            >
              Hifadhi Matumizi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Personal Use */}
      <Modal
        isOpen={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        title={t.addPersonalUse}
        maxWidth="max-w-sm"
      >
        <p className="text-[11px] text-gray-500 mb-3">
          Inapunguza stoo kwa bei ya gharama bila kuharibu faida halisi ya duka.
        </p>

        <form onSubmit={handlePersonalSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Aina ya Kuchukua:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPersonalType('product')}
                className={`py-1.5 rounded-xl text-xs font-bold border ${
                  personalType === 'product' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                Bidhaa Dukani
              </button>
              <button
                type="button"
                onClick={() => setPersonalType('cash')}
                className={`py-1.5 rounded-xl text-xs font-bold border ${
                  personalType === 'cash' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                Pesa Taslimu
              </button>
            </div>
          </div>

          {personalType === 'product' ? (
            <>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Chagua Bidhaa:</label>
                <select
                  value={personalProductId}
                  onChange={e => setPersonalProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stoo: {p.stock_qty} {p.base_unit} @ {formatTsh(p.avg_cost)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi Kilichochukuliwa:</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={personalQty}
                  onChange={e => setPersonalQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-mono font-bold focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi cha Pesa (TSh):</label>
              <input
                type="number"
                required
                value={personalCashAmount}
                onChange={e => setPersonalCashAmount(e.target.value)}
                placeholder="20000"
                className="w-full px-3 py-2 rounded-xl border border-blue-200 text-sm font-mono font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo:</label>
            <input
              type="text"
              value={personalNote}
              onChange={e => setPersonalNote(e.target.value)}
              placeholder="Mf. Sukari 2kg kwa ajili ya chai nyumbani"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPersonalModal(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Hifadhi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
