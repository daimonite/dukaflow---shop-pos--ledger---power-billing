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
  MessageSquare,
  Smartphone,
  Check
} from 'lucide-react';
import { formatTsh } from '../utils/translations';
import { Customer, Supplier, PaymentMethod, LedgerEntry } from '../types';
import { Modal } from './Modal';

export const DebtorsCreditorsScreen: React.FC = () => {
  const {
    t,
    customers,
    suppliers,
    ledgerEntries,
    recordCustomerPayment,
    recordSupplierPayment,
    addCustomer,
    addSupplier,
    settings
  } = useShop();

  const [activeTab, setActiveTab] = useState<'debtors' | 'creditors'>('debtors');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Payment modals
  const [showCustPaymentModal, setShowCustPaymentModal] = useState(false);
  const [custPaymentAmount, setCustPaymentAmount] = useState('');
  const [custPaymentMethod, setCustPaymentMethod] = useState<PaymentMethod>('cash');
  const [custPaymentReference, setCustPaymentReference] = useState('');
  const [custPaymentNote, setCustPaymentNote] = useState('');
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<{
    customerName: string;
    amount: number;
    remaining: number;
    method: string;
    ref?: string;
  } | null>(null);

  const [showSuppPaymentModal, setShowSuppPaymentModal] = useState(false);
  const [suppPaymentAmount, setSuppPaymentAmount] = useState('');
  const [suppPaymentMethod, setSuppPaymentMethod] = useState<PaymentMethod>('cash');
  const [suppPaymentReference, setSuppPaymentReference] = useState('');
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

  // Helper: WhatsApp Debt Repayment Receipt
  const getWhatsAppDebtPaymentReceipt = (receipt: { customerName: string; amount: number; remaining: number; method: string; ref?: string }) => {
    const refLine = receipt.ref ? `%0A*Namba ya Muamala / Ref:* ${receipt.ref}` : '';
    return `*${settings.storeName.toUpperCase()} - UTHIBITISHO WA MALIPO YA DENI*%0A---------------------------%0A*Mteja:* ${receipt.customerName}%0A*Kiasi Kilicholipwa:* ${formatTsh(receipt.amount)}%0A*Njia ya Malipo:* ${receipt.method.toUpperCase()}${refLine}%0A*Baki ya Deni Lako:* ${formatTsh(receipt.remaining)}%0A---------------------------%0ATarehe: ${new Date().toLocaleString()}%0AAsante sana kwa uaminifu wako! Karibu tena.`;
  };

  // Customer Payment Submit
  const handleCustomerPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(custPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Weka kiasi sahihi cha malipo.');
      return;
    }

    const remaining = Math.max(0, Math.round(selectedCustomer.current_balance - amt));

    recordCustomerPayment(
      selectedCustomer.id,
      amt,
      custPaymentMethod,
      custPaymentNote.trim() || undefined,
      custPaymentReference.trim() || undefined
    );

    setLastPaymentReceipt({
      customerName: selectedCustomer.name,
      amount: amt,
      remaining,
      method: custPaymentMethod,
      ref: custPaymentReference.trim() || undefined,
    });

    setShowCustPaymentModal(false);
    setCustPaymentAmount('');
    setCustPaymentReference('');
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

    const note = suppPaymentNote.trim() || (suppPaymentReference.trim() ? `Malipo (${suppPaymentMethod.toUpperCase()} Ref: ${suppPaymentReference.trim()})` : undefined);

    recordSupplierPayment(
      selectedSupplier.id,
      amt,
      suppPaymentMethod,
      note
    );

    setShowSuppPaymentModal(false);
    setSuppPaymentAmount('');
    setSuppPaymentReference('');
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
      <Modal
        isOpen={showCustPaymentModal && Boolean(selectedCustomer)}
        onClose={() => setShowCustPaymentModal(false)}
        maxWidth="max-w-md"
      >
        {selectedCustomer && (
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Rekodi Malipo ya Mteja
                </h3>
                <p className="text-xs text-gray-500">
                  Mteja: <span className="font-bold text-gray-800">{selectedCustomer.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Debt Banner */}
            <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-800 block font-semibold">Deni Lililopo Sasa:</span>
                <span className="text-lg font-mono font-black text-amber-950">
                  {formatTsh(selectedCustomer.current_balance)}
                </span>
              </div>
              <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Anadaiwa
              </span>
            </div>

            <form onSubmit={handleCustomerPaymentSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                  <label>Kiasi Anacholipa (TSh):</label>
                  {custPaymentAmount && (
                    <button
                      type="button"
                      onClick={() => setCustPaymentAmount('')}
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      Futa
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  value={custPaymentAmount}
                  onChange={e => setCustPaymentAmount(e.target.value)}
                  placeholder={selectedCustomer.current_balance.toString()}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/20 text-base font-mono font-extrabold text-gray-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden shadow-2xs"
                />

                {/* Quick Payment suggestion chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setCustPaymentAmount(selectedCustomer.current_balance.toString())}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Lipa Yote ({formatTsh(selectedCustomer.current_balance)})
                  </button>
                  {selectedCustomer.current_balance > 2000 && (
                    <button
                      type="button"
                      onClick={() => setCustPaymentAmount(Math.round(selectedCustomer.current_balance / 2).toString())}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Nusu ({formatTsh(Math.round(selectedCustomer.current_balance / 2))})
                    </button>
                  )}
                  {[2000, 5000, 10000, 20000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const curr = parseFloat(custPaymentAmount) || 0;
                        setCustPaymentAmount((curr + amt).toString());
                      }}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Njia ya Malipo:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['cash', 'mpesa', 'tigopesa', 'airtel'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setCustPaymentMethod(pm)}
                      className={`py-2 px-1 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        custPaymentMethod === pm
                          ? pm === 'mpesa'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : pm === 'tigopesa'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : pm === 'airtel'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {pm === 'cash' ? '💵 Cash' :
                       pm === 'mpesa' ? '🟢 M-Pesa' :
                       pm === 'tigopesa' ? '🔵 Tigo' : '🔴 Airtel'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Code if Mobile Money */}
              {custPaymentMethod !== 'cash' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Namba ya Kumbukumbu / Reference (Hiari):</label>
                  <input
                    type="text"
                    value={custPaymentReference}
                    onChange={e => setCustPaymentReference(e.target.value)}
                    placeholder="Mf. QK8819 au M-Pesa Code"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-medium focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo ya Ziada (Hiari):</label>
                <input
                  type="text"
                  value={custPaymentNote}
                  onChange={e => setCustPaymentNote(e.target.value)}
                  placeholder="Mf. Malipo ya nusu deni la unga"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCustPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Thibitisha Malipo
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: WhatsApp Debt Repayment Receipt Acknowledgement */}
      <Modal
        isOpen={Boolean(lastPaymentReceipt)}
        onClose={() => setLastPaymentReceipt(null)}
        maxWidth="max-w-sm"
      >
        {lastPaymentReceipt && (
          <div className="p-5 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Malipo Yamerekodiwa!</h3>
            <p className="text-xs text-gray-500">
              <span className="font-bold text-gray-800">{lastPaymentReceipt.customerName}</span> amelipa{' '}
              <span className="font-bold text-emerald-700">{formatTsh(lastPaymentReceipt.amount)}</span>.
            </p>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Njia:</span>
                <span className="font-bold uppercase">{lastPaymentReceipt.method}</span>
              </div>
              {lastPaymentReceipt.ref && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ref Code:</span>
                  <span className="font-mono font-bold">{lastPaymentReceipt.ref}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-1 font-bold">
                <span className="text-gray-700">Baki ya Deni:</span>
                <span className="text-amber-700 font-mono">{formatTsh(lastPaymentReceipt.remaining)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLastPaymentReceipt(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Funga
              </button>
              <a
                href={`https://wa.me/?text=${getWhatsAppDebtPaymentReceipt(lastPaymentReceipt)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Tuma WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Supplier Payment */}
      <Modal
        isOpen={showSuppPaymentModal && Boolean(selectedSupplier)}
        onClose={() => setShowSuppPaymentModal(false)}
        maxWidth="max-w-md"
      >
        {selectedSupplier && (
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Rekodi Malipo kwa Msambazaji
                </h3>
                <p className="text-xs text-gray-500">
                  Msambazaji: <span className="font-bold text-gray-800">{selectedSupplier.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSuppPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50/80 p-3 rounded-2xl border border-red-200 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-red-800 block font-semibold">Tunachodaiwa Sasa:</span>
                <span className="text-lg font-mono font-black text-red-950">
                  {formatTsh(selectedSupplier.current_balance)}
                </span>
              </div>
              <span className="text-xs font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded-full">
                Tunadaiwa
              </span>
            </div>

            <form onSubmit={handleSupplierPaymentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi cha Kulipa (TSh):</label>
                <input
                  type="number"
                  required
                  value={suppPaymentAmount}
                  onChange={e => setSuppPaymentAmount(e.target.value)}
                  placeholder={selectedSupplier.current_balance.toString()}
                  className="w-full px-3 py-2.5 rounded-xl border border-red-200 text-base font-mono font-extrabold focus:border-red-500 focus:outline-hidden shadow-2xs"
                />

                {/* Quick chip to pay in full */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSuppPaymentAmount(selectedSupplier.current_balance.toString())}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Lipa Deni Lote ({formatTsh(selectedSupplier.current_balance)})
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Njia ya Malipo:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['cash', 'mpesa', 'tigopesa', 'airtel'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setSuppPaymentMethod(pm)}
                      className={`py-2 px-1 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        suppPaymentMethod === pm
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {pm === 'cash' ? '💵 Cash' :
                       pm === 'mpesa' ? '🟢 M-Pesa' :
                       pm === 'tigopesa' ? '🔵 Tigo' : '🔴 Airtel'}
                    </button>
                  ))}
                </div>
              </div>

              {suppPaymentMethod !== 'cash' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">Namba ya Kumbukumbu / Reference (Hiari):</label>
                  <input
                    type="text"
                    value={suppPaymentReference}
                    onChange={e => setSuppPaymentReference(e.target.value)}
                    placeholder="Mf. QK8819 au Bank Slip Code"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-medium focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo (Hiari):</label>
                <input
                  type="text"
                  value={suppPaymentNote}
                  onChange={e => setSuppPaymentNote(e.target.value)}
                  placeholder="Mf. Malipo ya unga wa ngano"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSuppPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Lipa Msambazaji
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Add Customer */}
      <Modal
        isOpen={showAddCustModal}
        onClose={() => setShowAddCustModal(false)}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-gray-900">Ongeza Mteja Mpya</h3>
            <button
              type="button"
              onClick={() => setShowAddCustModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddCustomerSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Jina Kamili:</label>
              <input
                type="text"
                required
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                placeholder="Mf. Mama Junior au Mzee Ally"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Simu:</label>
              <input
                type="text"
                value={newCustPhone}
                onChange={e => setNewCustPhone(e.target.value)}
                placeholder="0754 112 233"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Kikomo cha Kukopa (TSh):</label>
              <input
                type="number"
                value={newCustLimit}
                onChange={e => setNewCustLimit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="reg_cust"
                checked={newCustIsRegular}
                onChange={e => setNewCustIsRegular(e.target.checked)}
                className="accent-orange-500 rounded-sm"
              />
              <label htmlFor="reg_cust" className="text-xs text-gray-700 font-semibold cursor-pointer">
                Mteja wa Kawaida (Ataonekana kwenye POS kwa kugonga mara moja)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddCustModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Ghairi
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Hifadhi Mteja
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Add Supplier */}
      <Modal
        isOpen={showAddSuppModal}
        onClose={() => setShowAddSuppModal(false)}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-gray-900">Ongeza Msambazaji Mpya</h3>
            <button
              type="button"
              onClick={() => setShowAddSuppModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddSupplierSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Jina la Duka/Msambazaji:</label>
              <input
                type="text"
                required
                value={newSuppName}
                onChange={e => setNewSuppName(e.target.value)}
                placeholder="Mf. Azam Wholesale au Kibo Traders"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Simu:</label>
              <input
                type="text"
                value={newSuppPhone}
                onChange={e => setNewSuppPhone(e.target.value)}
                placeholder="0715 000 111"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddSuppModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Ghairi
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Hifadhi Msambazaji
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
