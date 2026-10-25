import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Scale,
  CreditCard,
  User,
  Phone,
  CheckCircle2,
  Printer,
  Share2,
  X,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Coins,
  Check,
  Banknote,
  Smartphone
} from 'lucide-react';
import { formatTsh, formatQty } from '../utils/translations';
import { Product, PaymentMethod, Sale, Customer } from '../types';
import { Modal } from './Modal';
import confetti from 'canvas-confetti';

interface CartItem {
  product: Product;
  quantity: number;        // in base unit
  unitLabel: string;
  unitPrice: number;       // price charged per unitLabel
  lineTotal: number;
}

export const PosScreen: React.FC = () => {
  const {
    t,
    products,
    customers,
    createSale,
    currentRole,
    settings
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [roundTo50, setRoundTo50] = useState<boolean>(true);

  // Success Receipt Modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Quick Amount Modal for "Sell by Amount"
  const [amountModalProduct, setAmountModalProduct] = useState<Product | null>(null);
  const [moneyAmountInput, setMoneyAmountInput] = useState<string>('1000');

  // Low Stock Warning Modal state
  const [lowStockAlert, setLowStockAlert] = useState<{
    product: Product;
    factor: number;
    unitLabel?: string;
    overridePrice?: number;
  } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Regular customers list for quick 1-tap chips
  const regularCustomers = useMemo(() => {
    return customers.filter(c => c.is_regular);
  }, [customers]);

  // Add standard unit to cart (with low-stock threshold warning modal)
  const addToCart = (product: Product, factor = 1, unitLabel?: string, overridePrice?: number, bypassWarning = false) => {
    // If product is at or below reorder level, trigger warning modal first
    if (!bypassWarning && product.stock_qty <= product.reorder_level) {
      setLowStockAlert({ product, factor, unitLabel, overridePrice });
      return;
    }

    const label = unitLabel || (factor === 1 ? `1 ${product.base_unit}` : `${factor} ${product.base_unit}`);
    const price = overridePrice !== undefined ? overridePrice : product.sell_price * factor;

    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.unitLabel === label
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + factor;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.round(newQty * 1000) / 1000,
          lineTotal: Math.round((newQty / factor) * price),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: factor,
            unitLabel: label,
            unitPrice: price,
            lineTotal: price,
          },
        ];
      }
    });
  };

  // Add by money amount (e.g. Sukari ya 2,000 TSh)
  const handleAddByMoneyAmount = () => {
    if (!amountModalProduct) return;
    const amountNum = parseFloat(moneyAmountInput);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // Calculate base quantity: amount / price_per_base_unit
    const baseQty = Math.round((amountNum / amountModalProduct.sell_price) * 1000) / 1000;
    const label = `${baseQty} ${amountModalProduct.base_unit} (TSh ${amountNum.toLocaleString()})`;

    setCart(prev => [
      ...prev,
      {
        product: amountModalProduct,
        quantity: baseQty,
        unitLabel: label,
        unitPrice: amountNum,
        lineTotal: amountNum,
      },
    ]);

    setAmountModalProduct(null);
    setMoneyAmountInput('1000');
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCart(prev => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      const factorRatio = newQty / item.quantity;
      updated[index] = {
        ...item,
        quantity: Math.round(newQty * 1000) / 1000,
        lineTotal: Math.round(item.lineTotal * factorRatio),
      };
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Raw cart total
  const rawSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  // Rounding adjustment to nearest 50 TSh if toggled
  const roundedSubtotal = useMemo(() => {
    if (!roundTo50 || rawSubtotal === 0) return rawSubtotal;
    return Math.round(rawSubtotal / 50) * 50;
  }, [rawSubtotal, roundTo50]);

  const roundingAdjustment = roundedSubtotal - rawSubtotal;

  // Tendered calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - roundedSubtotal);

  // Check if credit limit exceeded for selected customer
  const customerDebtWarning = useMemo(() => {
    if (paymentMethod !== 'credit' || !selectedCustomer) return null;
    const newTotalDebt = selectedCustomer.current_balance + roundedSubtotal;
    if (newTotalDebt > selectedCustomer.credit_limit) {
      return `Onyo: Mteja atafikisha deni la TSh ${newTotalDebt.toLocaleString()} (Kikomo ni TSh ${selectedCustomer.credit_limit.toLocaleString()})!`;
    }
    return null;
  }, [paymentMethod, selectedCustomer, roundedSubtotal]);

  // Complete Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'credit' && !selectedCustomer && !customCustomerName) {
      alert('Tafadhali chagua mteja au andika jina la mteja anayekopa.');
      return;
    }

    const paidAmount = paymentMethod === 'credit' ? 0 : roundedSubtotal;

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      qty: item.quantity,
      unitLabel: item.unitLabel,
      unitPrice: item.unitPrice,
      roundingAdjustment: 0,
    }));

    const sale = createSale({
      items: saleItems,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : customCustomerName || undefined,
      customerPhone: selectedCustomer ? selectedCustomer.phone : undefined,
      paymentMethod,
      paidAmount,
      paymentReference: paymentReference?.trim() || undefined,
    });

    // Reset checkout & cart
    setCart([]);
    setSelectedCustomer(null);
    setCustomCustomerName('');
    setCashTendered('');
    setPaymentReference('');
    setCompletedSale(sale);
    setShowReceiptModal(true);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // ignore
    }
  };

  const getWhatsAppReceiptText = (sale: Sale) => {
    const itemsText = sale.items
      .map(i => `• ${i.product_name} (${formatQty(i.quantity, i.unit_label)}): ${formatTsh(i.line_total)}`)
      .join('%0A');

    const refText = sale.payment_reference ? `%0A*Ref/Muamala:* ${sale.payment_reference}` : '';

    return `*RISITI YA MAUZO - ${settings.storeName.toUpperCase()}*%0A---------------------------%0A*Namba:* ${sale.receipt_no}%0A*Tarehe:* ${new Date(sale.sold_at).toLocaleString()}%0A*Mteja:* ${sale.customer_name || 'Taslimu'}%0A*Muuzaji:* ${sale.sold_by_name}%0A---------------------------%0A*Bidhaa:*%0A${itemsText}%0A---------------------------%0A*JUMLA:* ${formatTsh(sale.total)}%0A*Njia ya Malipo:* ${sale.payment_method.toUpperCase()} (${formatTsh(sale.paid_amount)})${refText}%0A${sale.debt_amount > 0 ? `*Baki ya Deni:* ${formatTsh(sale.debt_amount)}%0A` : ''}${settings.receiptFooter || 'Asante kwa kununua nasi! Karibu tena.'}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Catalog & Products (7-8 cols on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Search bar & Category filters */}
          <div className="bg-white p-3.5 rounded-3xl border border-orange-100 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchProduct}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-orange-50/50 border border-orange-100/80 focus:bg-white focus:border-orange-500 focus:outline-hidden text-sm font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full hover:bg-gray-300"
                >
                  Futa
                </button>
              )}
            </div>

            {/* Category horizontal scroll pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {cat === 'all' ? t.allCategories : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProducts.map(prod => {
              const isLowStock = prod.stock_qty <= prod.reorder_level;
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl p-3.5 border border-orange-100/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    {/* Top row: Category tag & Stock count */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        {prod.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isLowStock
                            ? 'bg-red-100 text-red-700 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {formatQty(prod.stock_qty, prod.base_unit)}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                      {prod.name}
                    </h3>

                    {/* Selling price per base unit */}
                    <div className="text-orange-600 font-extrabold text-base mb-3">
                      {formatTsh(prod.sell_price)}{' '}
                      <span className="text-xs font-normal text-gray-400">/{prod.base_unit}</span>
                    </div>
                  </div>

                  {/* Actions: Quick add units & Sell by amount */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    
                    {/* Standard base unit Add to Cart */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-orange-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>1 {prod.base_unit} ({formatTsh(prod.sell_price)})</span>
                      </button>

                      {/* Sell by Amount button for loose items (e.g. Sugar / Oil / Flour) */}
                      {(prod.base_unit === 'kg' || prod.base_unit === 'litre') && (
                        <button
                          onClick={() => setAmountModalProduct(prod)}
                          title="Uza kwa kiasi cha pesa (mf. Sukari ya 2,000)"
                          className="px-2.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pesa</span>
                        </button>
                      )}
                    </div>

                    {/* Optional pack chips (e.g. 0.5 kg, 0.25 kg, cup) */}
                    {prod.unit_options && prod.unit_options.filter(u => u.use_for_selling).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prod.unit_options
                          .filter(u => u.use_for_selling)
                          .map(unit => {
                            const unitPrice =
                              unit.price_override !== undefined
                                ? unit.price_override
                                : prod.sell_price * unit.factor;
                            return (
                              <button
                                key={unit.label}
                                onClick={() => addToCart(prod, unit.factor, unit.label, unit.price_override)}
                                className="text-[11px] font-semibold bg-gray-50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-gray-700 px-2 py-1 rounded-lg border border-gray-200 transition-colors"
                              >
                                {unit.label}: {formatTsh(unitPrice)}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: POS Cart & Checkout (4-5 cols on large screens) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-md p-4 sm:p-5 sticky top-20 flex flex-col max-h-[calc(100vh-100px)]">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-base">{t.cart}</h2>
                  <span className="text-[11px] text-gray-400">
                    {cart.length} {cart.length === 1 ? 'aina ya bidhaa' : 'aina za bidhaa'}
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Futa</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[160px] max-h-[300px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                  <Package className="w-10 h-10 stroke-1 text-gray-300 mb-2" />
                  <p className="text-xs">{t.emptyCart}</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.unitLabel}-${idx}`}
                    className="p-2.5 bg-orange-50/40 rounded-2xl border border-orange-100 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {formatQty(item.quantity, item.unitLabel)} @ {formatTsh(item.unitPrice)}
                      </div>
                      <div className="font-extrabold text-orange-600 text-xs mt-0.5">
                        {formatTsh(item.lineTotal)}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                      <button
                        onClick={() => updateCartItemQty(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1.5 min-w-[20px] text-center text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQty(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeCartItem(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Customer Select (Crucial: 1-tap regular customer chips) */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700">{t.regularCustomers}:</span>
                {selectedCustomer && (
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[10px] text-orange-600 font-semibold hover:underline"
                  >
                    Ghairi ({selectedCustomer.name})
                  </button>
                )}
              </div>

              {/* Regular Customer Chips */}
              <div className="flex flex-wrap gap-1.5">
                {regularCustomers.map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      if (selectedCustomer?.id === cust.id) {
                        setSelectedCustomer(null);
                      } else {
                        setSelectedCustomer(cust);
                        setCustomCustomerName(cust.name);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                      selectedCustomer?.id === cust.id
                        ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                        : cust.current_balance > 0
                        ? 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-300'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cust.name}
                    {cust.current_balance > 0 && (
                      <span className="ml-1 text-[10px] font-bold opacity-80">
                        ({formatTsh(cust.current_balance)})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Optional Custom Customer input if not regular */}
              {!selectedCustomer && (
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customCustomerName}
                    onChange={e => setCustomCustomerName(e.target.value)}
                    placeholder={t.customerName}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 space-y-2">
              <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                <span>{t.paymentMethod}:</span>
                <span className="text-[10px] font-semibold text-gray-400 capitalize">
                  {paymentMethod === 'credit' ? 'Mkopo' : paymentMethod.toUpperCase()}
                </span>
              </label>

              {/* Payment Method Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                {(['cash', 'mpesa', 'tigopesa', 'airtel', 'credit'] as PaymentMethod[]).map(pm => {
                  const isSelected = paymentMethod === pm;
                  return (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-1 rounded-2xl font-bold text-center border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? pm === 'credit'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : pm === 'mpesa'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : pm === 'tigopesa'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : pm === 'airtel'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-gray-50/80 text-gray-700 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <span>
                        {pm === 'cash' ? '💵 Cash' :
                         pm === 'mpesa' ? '🟢 M-Pesa' :
                         pm === 'tigopesa' ? '🔵 Tigo' :
                         pm === 'airtel' ? '🔴 Airtel' : '📝 Mkopo'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Cash tender & change calculator with quick chips */}
              {paymentMethod === 'cash' && cart.length > 0 && (
                <div className="bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100/80 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <span>Pesa Iliyopokelewa (TSh):</span>
                    {tenderedNum > 0 && (
                      <button
                        type="button"
                        onClick={() => setCashTendered('')}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        Futa
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={e => setCashTendered(e.target.value)}
                      placeholder={roundedSubtotal ? `${roundedSubtotal}` : '0'}
                      className="w-full pl-3 pr-20 py-2 bg-white border border-orange-200 rounded-xl text-sm font-mono font-extrabold text-gray-900 focus:border-orange-500 focus:outline-hidden shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setCashTendered(roundedSubtotal.toString())}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold bg-orange-100 hover:bg-orange-200 text-orange-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Weka pesa kamilifu"
                    >
                      Kamilifu
                    </button>
                  </div>

                  {/* Quick Addition Chips */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {[1000, 2000, 5000, 10000, 20000, 50000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(cashTendered) || 0;
                          setCashTendered((curr + amt).toString());
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 font-mono font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {/* Real-time Change Display */}
                  {tenderedNum >= roundedSubtotal && tenderedNum > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 animate-in zoom-in-95">
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-700" />
                        Chenji kwa Mteja:
                      </span>
                      <span className="font-mono text-sm font-black text-emerald-800">
                        {formatTsh(changeDue)}
                      </span>
                    </div>
                  )}

                  {tenderedNum > 0 && tenderedNum < roundedSubtotal && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-amber-100/70 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
                      <span>Baki Inayodaiwa:</span>
                      <span className="font-mono text-xs font-bold text-amber-800">
                        {formatTsh(roundedSubtotal - tenderedNum)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Money Reference code (M-Pesa, Tigo, Airtel) */}
              {(paymentMethod === 'mpesa' || paymentMethod === 'tigopesa' || paymentMethod === 'airtel') && (
                <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200 space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    Namba ya Kumbukumbu / Muamala (Hiari):
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      placeholder="Mf. QK8819 au Jina la Aliyetuma"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-medium focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Namba hii itahifadhiwa kwenye risiti na rekodi za mauzo ya dukani.
                  </p>
                </div>
              )}

              {/* Debt limit warning */}
              {customerDebtWarning && (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px]">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{customerDebtWarning}</span>
                </div>
              )}
            </div>

            {/* Cart Totals & Checkout Button */}
            <div className="pt-3 mt-2 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Jumla Ndogo (Subtotal):</span>
                <span className="font-mono font-medium">{formatTsh(rawSubtotal)}</span>
              </div>

              {/* Rounding to 50 TSh toggle */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundTo50}
                    onChange={e => setRoundTo50(e.target.checked)}
                    className="accent-orange-500 rounded-sm"
                  />
                  <span>Rejesha hadi 50 TSh ya karibu:</span>
                </label>
                {roundingAdjustment !== 0 && (
                  <span className="font-mono text-[11px] text-orange-600">
                    {roundingAdjustment > 0 ? `+${roundingAdjustment}` : roundingAdjustment} TSh
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-base font-extrabold text-gray-900 pt-1 border-t border-dashed border-gray-200">
                <span>JUMLA KUU:</span>
                <span className="text-xl font-extrabold text-orange-600 font-mono">
                  {formatTsh(roundedSubtotal)}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm rounded-2xl shadow-md shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{paymentMethod === 'credit' ? 'Thibitisha Mauzo ya Mkopo' : t.completeSale}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Sell by Amount (Sukari ya 2000) */}
      <Modal
        isOpen={Boolean(amountModalProduct)}
        onClose={() => setAmountModalProduct(null)}
        maxWidth="max-w-sm"
      >
        {amountModalProduct && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">{t.sellByAmount}</h3>
              <button
                type="button"
                onClick={() => setAmountModalProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Mteja ameomba <span className="font-bold text-gray-800">{amountModalProduct.name}</span> ya kiasi gani? (Bei: {formatTsh(amountModalProduct.sell_price)}/{amountModalProduct.base_unit})
            </p>

            {/* Quick amount suggestion chips */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {['500', '1000', '1500', '2000', '3000', '4000', '5000', '10000'].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setMoneyAmountInput(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    moneyAmountInput === amt
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {parseInt(amt).toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Kiasi cha Pesa (TSh):
              </label>
              <input
                type="number"
                value={moneyAmountInput}
                onChange={e => setMoneyAmountInput(e.target.value)}
                placeholder="2000"
                className="w-full text-center text-xl font-mono font-bold px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/30 focus:bg-white focus:border-orange-500 focus:outline-hidden"
              />
              {parseFloat(moneyAmountInput) > 0 && (
                <div className="text-center text-xs text-orange-700 font-semibold mt-1.5">
                  Italingana na:{' '}
                  <span className="font-bold font-mono">
                    {((parseFloat(moneyAmountInput) || 0) / amountModalProduct.sell_price).toFixed(3)}{' '}
                    {amountModalProduct.base_unit}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAmountModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleAddByMoneyAmount}
                className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs"
              >
                Weka Kikapuni
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Low Stock Alert Warning Modal */}
      <Modal
        isOpen={Boolean(lowStockAlert)}
        onClose={() => setLowStockAlert(null)}
        maxWidth="max-w-sm"
      >
        {lowStockAlert && (
          <div className="p-5">
            <div className="flex items-center gap-2.5 text-red-600 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm text-gray-900">Onyo la Bidhaa Inayoisha!</h3>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Bidhaa <span className="font-bold text-gray-900">{lowStockAlert.product.name}</span> ipo chini au imefikia kiwango cha kuagiza (Reorder Level).
            </p>

            <div className="bg-red-50/60 p-3 rounded-2xl border border-red-100 text-xs space-y-1 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Stoo Iliyopo Sasa:</span>
                <span className="font-mono font-bold text-red-700">
                  {formatQty(lowStockAlert.product.stock_qty, lowStockAlert.product.base_unit)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Kiwango cha Tahadhari (Reorder):</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatQty(lowStockAlert.product.reorder_level, lowStockAlert.product.base_unit)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Kiasi Unachouza:</span>
                <span className="font-mono font-bold text-orange-700">
                  {lowStockAlert.unitLabel || `${lowStockAlert.factor} ${lowStockAlert.product.base_unit}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLowStockAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Ghairi Mauzo
              </button>
              <button
                type="button"
                onClick={() => {
                  const alertData = lowStockAlert;
                  setLowStockAlert(null);
                  addToCart(
                    alertData.product,
                    alertData.factor,
                    alertData.unitLabel,
                    alertData.overridePrice,
                    true
                  );
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              >
                Endelea na Mauzo
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Printable Receipt & WhatsApp Share */}
      <Modal
        isOpen={showReceiptModal && Boolean(completedSale)}
        onClose={() => {
          setShowReceiptModal(false);
          setCompletedSale(null);
        }}
        maxWidth="max-w-md"
      >
        {completedSale && (
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 no-print">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm">{t.saleSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  setCompletedSale(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Printable Receipt Card */}
            <div className="mt-4 p-5 bg-orange-50/30 rounded-2xl border border-orange-100 font-mono text-xs text-gray-800 space-y-3">
              <div className="text-center space-y-1">
                <h4 className="font-extrabold text-base tracking-wider text-gray-900">
                  {settings.storeName.toUpperCase()}
                </h4>
                <p className="text-[11px] text-gray-500">{settings.storeLocation}</p>
                {settings.storePhone && (
                  <p className="text-[10px] text-gray-400">Simu: {settings.storePhone}</p>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Risiti:</span>
                  <span className="font-bold">{completedSale.receipt_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarehe:</span>
                  <span>{new Date(completedSale.sold_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mteja:</span>
                  <span className="font-bold">{completedSale.customer_name || 'Taslimu'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Muuzaji:</span>
                  <span>{completedSale.sold_by_name}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1.5 text-[11px]">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-gray-900">{item.product_name}</div>
                      <div className="text-[10px] text-gray-500">
                        {formatQty(item.quantity, item.unit_label)} x {item.unit_price}
                      </div>
                    </div>
                    <div className="font-bold text-right">{formatTsh(item.line_total)}</div>
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between font-extrabold text-sm text-gray-900">
                  <span>JUMLA:</span>
                  <span>{formatTsh(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Njia ya Malipo:</span>
                  <span className="capitalize font-bold">{completedSale.payment_method}</span>
                </div>
                {completedSale.payment_reference && (
                  <div className="flex justify-between text-gray-700 bg-gray-50 px-1 py-0.5 rounded-sm">
                    <span>Namba ya Muamala:</span>
                    <span className="font-bold font-mono">{completedSale.payment_reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Kiasi Kilicholipwa:</span>
                  <span className="font-bold text-emerald-700">{formatTsh(completedSale.paid_amount)}</span>
                </div>
                {completedSale.debt_amount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1 rounded-sm">
                    <span>Baki ya Deni (Mkopo):</span>
                    <span>{formatTsh(completedSale.debt_amount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-gray-400 pt-3 border-t border-dashed border-gray-300">
                *** {settings.receiptFooter || 'Asante sana kwa kununua nasi! Karibu tena'} ***
              </div>
            </div>

            {/* Actions: Print and WhatsApp Share */}
            <div className="mt-4 flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t.printReceipt}</span>
              </button>

              <a
                href={`https://wa.me/?text=${getWhatsAppReceiptText(completedSale)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
