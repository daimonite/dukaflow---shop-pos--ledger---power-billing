import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Users,
  Truck,
  DollarSign,
  Clock,
  Phone,
  Plus,
  Share2,
  CheckCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  X,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { formatTsh } from '../utils/translations';
import { Customer, Supplier, PaymentMethod, LedgerEntry } from '../types';

export const DebtorsCreditorsScreen: React.FC = () => {
  const {
    t,
    customers,
    suppliers,
    ledgerEntries,
    recordCustomerPayment,
    recordSupplierPayment,
    addCustomer,
    addSupplier
  } = useShop();

  const [activeTab, setActiveTab] = useState<'debtors' | 'creditors'>('debtors');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Payment modals
  const [showCustPaymentModal, setShowCustPaymentModal] = useState(false);
  const [custPaymentAmount, setCustPaymentAmount] = useState('');
  const [custPaymentMethod, setCustPaymentMethod] = useState<PaymentMethod>('cash');
  const [custPaymentNote, setCustPaymentNote] = useState('');

  const [showSuppPaymentModal, setShowSuppPaymentModal] = useState(false);
  const [suppPaymentAmount, setSuppPaymentAmount] = useState('');
  const [suppPaymentMethod, setSuppPaymentMethod] = useState<PaymentMethod>('cash');
  const [suppPaymentNote, setSuppPaymentNote] = useState('');

  // Add modals
  const [showAddCustModal, setShowAddCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('50000');
  const [newCustIsRegular, setNewCustIsRegular] = useState(true);

  const [showAddSuppModal, setShowAddSuppModal] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');

  // Metrics
  const totalCustomerDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.current_balance), 0);
  }, [customers]);

  const totalSupplierDebt = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + Math.max(0, s.current_balance), 0);
  }, [suppliers]);

  // Selected customer & their ledger history
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerLedger = useMemo(() => {
    if (!selectedCustomerId) return [];
    return ledgerEntries
      .filter(l => l.party_type === 'customer' && l.party_id === selectedCustomerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ledgerEntries, selectedCustomerId]);

  // Selected supplier & their ledger history
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const supplierLedger = useMemo(() => {
    if (!selectedSupplierId) return [];
    return ledgerEntries
      .filter(l => l.party_type === 'supplier' && l.party_id === selectedSupplierId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ledgerEntries, selectedSupplierId]);

  // Customer Payment Submit
  const handleCustomerPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(custPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Weka kiasi sahihi cha malipo.');
      return;
    }

    recordCustomerPayment(
      selectedCustomer.id,
      amt,
      custPaymentMethod,
      custPaymentNote.trim() || undefined
    );

    setShowCustPaymentModal(false);
    setCustPaymentAmount('');
    setCustPaymentNote('');
  };

  // Supplier Payment Submit
  const handleSupplierPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amt = parseFloat(suppPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Weka kiasi sahihi cha malipo.');
      return;
    }

    recordSupplierPayment(
      selectedSupplier.id,
      amt,
      suppPaymentMethod,
      suppPaymentNote.trim() || undefined
    );

    setShowSuppPaymentModal(false);
    setSuppPaymentAmount('');
    setSuppPaymentNote('');
  };

  // Add Customer Submit
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      is_regular: newCustIsRegular,
      credit_limit: parseFloat(newCustLimit) || 50000,
    });

    setShowAddCustModal(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  // Add Supplier Submit
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim()) return;

    addSupplier({
      name: newSuppName.trim(),
      phone: newSuppPhone.trim(),
    });

    setShowAddSuppModal(false);
    setNewSuppName('');
    setNewSuppPhone('');
  };

  // WhatsApp Statement link generator
  const getWhatsAppStatementUrl = (cust: Customer, entries: LedgerEntry[]) => {
    const lines = entries.slice(0, 5).map(e => {
      const date = new Date(e.created_at).toLocaleDateString();
      const time = new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sign = e.direction === 'debit' ? '+' : '-';
      return `• ${date} ${time}: ${e.direction === 'debit' ? 'Ulichukua: ' + (e.items_summary || 'Vitu vya dukani') : 'Umelipa'} (${sign}${formatTsh(e.amount)})`;
    });

    const text = `Habari ndugu *${cust.name}*,%0A%0ATunaomba kukukumbusha taarifa ya akaunti yako ya dukani (DukaFlow):%0A%0A*Jumla ya Deni Lililopo:* ${formatTsh(cust.current_balance)}%0A%0A*Mwenendo wa Hivi Karibuni:*%0A${lines.join('%0A')}%0A%0AUnaweza kulipa kupitia M-Pesa, Tigo Pesa au Taslimu dukani. Asante sana kwa ushirikiano wako!`;
    return `https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${text}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Daftari la Madeni (Debtors & Creditors)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Fuatilia nani anadaiwa, nini alichukua, tarehe na muda kamili, pamoja na wadaiji wa bidhaa.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center gap-1.5 bg-orange-50 p-1 rounded-2xl border border-orange-100">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'debtors'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Wateja (Wadaiwa)</span>
          </button>

          <button
            onClick={() => setActiveTab('creditors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'creditors'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Wauzaji (Wadaiji)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">
            Jumla Wanayotudaiwa Wateja (Debtors Balance)
          </span>
          <div className="text-3xl font-black mt-1 font-mono">
            {formatTsh(totalCustomerDebt)}
          </div>
          <span className="text-[11px] text-amber-100 mt-1 block">
            Pesa ya duka iliyopo mikononi mwa wateja
          </span>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider block">
            Jumla Tunayodaiwa na Wasambazaji (Creditors Balance)
          </span>
          <div className="text-3xl font-black mt-1 font-mono">
            {formatTsh(totalSupplierDebt)}
          </div>
          <span className="text-[11px] text-rose-100 mt-1 block">
            Baki ya mizigo iliyonunuliwa kwa mkopo
          </span>
        </div>
      </div>

      {/* MAIN CONTENT: DEBTORS TAB */}
      {activeTab === 'debtors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Customer list (5 cols) */}
          <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700">Orodha ya Wateja</span>
              <button
                onClick={() => setShowAddCustModal(true)}
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Mteja</span>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[500px]">
              {customers.map(cust => {
                const isSelected = selectedCustomerId === cust.id;
                const hasDebt = cust.current_balance > 0;

                return (
                  <button
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-300 shadow-xs'
                        : hasDebt
                        ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-gray-900">{cust.name}</span>
                        {cust.is_regular && (
                          <span className="text-[9px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded-full">
                            Regular
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{cust.phone}</div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono text-xs font-extrabold ${hasDebt ? 'text-amber-900' : 'text-gray-400'}`}>
                        {formatTsh(cust.current_balance)}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        Kikomo: {formatTsh(cust.credit_limit)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Ledger Detail (7 cols) */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
            {selectedCustomer ? (
              <div className="space-y-4">
                
                {/* Header of selected customer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-gray-900">{selectedCustomer.name}</h3>
                      {selectedCustomer.is_regular && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                          Mteja wa Kawaida
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{selectedCustomer.phone}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Record Payment Button */}
                    <button
                      onClick={() => {
                        setCustPaymentAmount(selectedCustomer.current_balance.toString());
                        setShowCustPaymentModal(true);
                      }}
                      disabled={selectedCustomer.current_balance <= 0}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{t.recordPayment}</span>
                    </button>

                    {/* WhatsApp Statement Share Button */}
                    {selectedCustomer.phone && selectedCustomer.current_balance > 0 && (
                      <a
                        href={getWhatsAppStatementUrl(selectedCustomer, customerLedger)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center transition-colors"
                        title="Tuma Taarifa kwa WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Balance & limit overview */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-orange-50/40 rounded-2xl border border-orange-100">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Deni Lililopo Sasa:</span>
                    <span className="text-lg font-black font-mono text-orange-700">
                      {formatTsh(selectedCustomer.current_balance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Kikomo cha Kukopa:</span>
                    <span className="text-lg font-black font-mono text-gray-700">
                      {formatTsh(selectedCustomer.credit_limit)}
                    </span>
                  </div>
                </div>

                {/* Ledger History: What they took, date, time */}
                <div>
                  <h4 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                    <span>Historia ya Vitu Alivyochukua na Malipo:</span>
                  </h4>

                  <div className="space-y-2 overflow-y-auto max-h-[350px]">
                    {customerLedger.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">Hakuna kumbukumbu ya madeni kwa mteja huyu.</p>
                    ) : (
                      customerLedger.map(entry => {
                        const isDebit = entry.direction === 'debit';
                        return (
                          <div
                            key={entry.id}
                            className={`p-3 rounded-2xl border text-xs ${
                              isDebit ? 'bg-amber-50/30 border-amber-200' : 'bg-emerald-50/30 border-emerald-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className={isDebit ? 'text-amber-950' : 'text-emerald-950'}>
                                {isDebit ? 'Amechukua Bidhaa kwa Mkopo' : 'Amefanya Malipo ya Deni'}
                              </span>
                              <span className={`font-mono text-xs font-black ${isDebit ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {isDebit ? '+' : '-'}{formatTsh(entry.amount)}
                              </span>
                            </div>

                            {entry.items_summary && (
                              <div className="text-[11px] text-gray-700 bg-white/80 p-1.5 rounded-lg border border-gray-100 mb-1">
                                <span className="font-semibold text-gray-900">Vitu: </span>
                                {entry.items_summary}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(entry.created_at).toLocaleDateString()} saa{' '}
                                  {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span>Imerekodiwa na {entry.created_by}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                <Users className="w-12 h-12 stroke-1 text-gray-300 mb-2" />
                <p className="text-xs font-medium">Chagua mteja upande wa kushoto kuona historia ya madeni na risiti.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT: CREDITORS TAB (Suppliers) */}
      {activeTab === 'creditors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Supplier List (5 cols) */}
          <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700">Orodha ya Wasambazaji (Wadaiji)</span>
              <button
                onClick={() => setShowAddSuppModal(true)}
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Msambazaji</span>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[500px]">
              {suppliers.map(supp => {
                const isSelected = selectedSupplierId === supp.id;
                const weOwe = supp.current_balance > 0;

                return (
                  <button
                    key={supp.id}
                    onClick={() => setSelectedSupplierId(supp.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-300 shadow-xs'
                        : weOwe
                        ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-gray-900">{supp.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{supp.phone}</div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono text-xs font-extrabold ${weOwe ? 'text-red-700' : 'text-gray-400'}`}>
                        {formatTsh(supp.current_balance)}
                      </div>
                      <span className="text-[10px] text-gray-400">Tunachodaiwa</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supplier Ledger Detail (7 cols) */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
            {selectedSupplier ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{selectedSupplier.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{selectedSupplier.phone}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSuppPaymentAmount(selectedSupplier.current_balance.toString());
                      setShowSuppPaymentModal(true);
                    }}
                    disabled={selectedSupplier.current_balance <= 0}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Lipa Msambazaji</span>
                  </button>
                </div>

                <div className="p-3 bg-red-50/50 rounded-2xl border border-red-200">
                  <span className="text-[10px] text-red-700 block uppercase font-bold">Jumla Tunayodaiwa na Msambazaji Huyu:</span>
                  <span className="text-xl font-black font-mono text-red-800">
                    {formatTsh(selectedSupplier.current_balance)}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                    <span>Historia ya Malipo na Mizigo ya Mkopo:</span>
                  </h4>

                  <div className="space-y-2 overflow-y-auto max-h-[350px]">
                    {supplierLedger.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">Hakuna kumbukumbu ya madeni kwa msambazaji huyu.</p>
                    ) : (
                      supplierLedger.map(entry => (
                        <div key={entry.id} className="p-3 rounded-2xl border border-gray-200 bg-gray-50/40 text-xs">
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="text-gray-900">{entry.note || 'Muamala wa Msambazaji'}</span>
                            <span className="font-mono text-xs font-black text-gray-800">
                              {formatTsh(entry.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                            <span>{new Date(entry.created_at).toLocaleString()}</span>
                            <span>na {entry.created_by}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                <Truck className="w-12 h-12 stroke-1 text-gray-300 mb-2" />
                <p className="text-xs font-medium">Chagua msambazaji kuona orodha ya malipo unayodaiwa.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Customer Payment */}
      {showCustPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Rekodi Malipo ya Mteja
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Mteja: <span className="font-bold text-gray-800">{selectedCustomer.name}</span> (Deni: {formatTsh(selectedCustomer.current_balance)})
            </p>

            <form onSubmit={handleCustomerPaymentSubmit} className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi Kilicholipwa (TSh):</label>
                <input
                  type="number"
                  required
                  value={custPaymentAmount}
                  onChange={e => setCustPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-sm font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Njia ya Malipo:</label>
                <select
                  value={custPaymentMethod}
                  onChange={e => setCustPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="cash">Taslimu (Cash)</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigopesa">Tigo Pesa</option>
                  <option value="airtel">Airtel Money</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo ya Ziada (Hiari):</label>
                <input
                  type="text"
                  value={custPaymentNote}
                  onChange={e => setCustPaymentNote(e.target.value)}
                  placeholder="Mf. Malipo ya nusu deni"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Thibitisha Malipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Supplier Payment */}
      {showSuppPaymentModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Rekodi Malipo kwa Msambazaji
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Msambazaji: <span className="font-bold text-gray-800">{selectedSupplier.name}</span> (Tunadaiwa: {formatTsh(selectedSupplier.current_balance)})
            </p>

            <form onSubmit={handleSupplierPaymentSubmit} className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi cha Kulipa (TSh):</label>
                <input
                  type="number"
                  required
                  value={suppPaymentAmount}
                  onChange={e => setSuppPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-red-200 text-sm font-mono font-bold focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Njia ya Malipo:</label>
                <select
                  value={suppPaymentMethod}
                  onChange={e => setSuppPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-red-500 focus:outline-hidden"
                >
                  <option value="cash">Taslimu (Cash)</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigopesa">Tigo Pesa</option>
                  <option value="airtel">Airtel Money</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo:</label>
                <input
                  type="text"
                  value={suppPaymentNote}
                  onChange={e => setSuppPaymentNote(e.target.value)}
                  placeholder="Mf. Malipo ya unga wa ngano"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuppPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                >
                  Lipa Msambazaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      {showAddCustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-3">Ongeza Mteja Mpya</h3>
            <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Jina Kamili:</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="Mf. Mama Junior au Mzee Ally"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Simu:</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="0754 112 233"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kikomo cha Kukopa (TSh):</label>
                <input
                  type="number"
                  value={newCustLimit}
                  onChange={e => setNewCustLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reg_cust"
                  checked={newCustIsRegular}
                  onChange={e => setNewCustIsRegular(e.target.checked)}
                  className="accent-orange-500"
                />
                <label htmlFor="reg_cust" className="text-xs text-gray-700 font-semibold cursor-pointer">
                  Mteja wa Kawaida (Ataonekana kwenye POS kwa kugonga mara moja)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs"
                >
                  Hifadhi Mteja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {showAddSuppModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-3">Ongeza Msambazaji Mpya</h3>
            <form onSubmit={handleAddSupplierSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Jina la Duka/Msambazaji:</label>
                <input
                  type="text"
                  required
                  value={newSuppName}
                  onChange={e => setNewSuppName(e.target.value)}
                  placeholder="Mf. Azam Wholesale au Kibo Traders"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Simu:</label>
                <input
                  type="text"
                  value={newSuppPhone}
                  onChange={e => setNewSuppPhone(e.target.value)}
                  placeholder="0715 000 111"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSuppModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs"
                >
                  Hifadhi Msambazaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
