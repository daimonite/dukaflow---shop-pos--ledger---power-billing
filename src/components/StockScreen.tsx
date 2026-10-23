import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { useSync } from '../context/SyncContext';
import {
  Package,
  Plus,
  Search,
  Scale,
  ClipboardCheck,
  ShoppingBag,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit3,
  TrendingUp,
  Scan,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  DollarSign,
  CloudCheck,
  Building2,
  Store,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { formatTsh, formatQty } from '../utils/translations';
import { Product, BaseUnit } from '../types';
import { Modal } from './Modal';

export const StockScreen: React.FC = () => {
  const {
    t,
    products,
    suppliers,
    addProduct,
    updateProductPrice,
    adjustStock,
    addPurchase,
    addOwnerDrawing,
    currentRole
  } = useShop();

  const { openOutbox, pendingCount, isOnline } = useSync();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [isStocktakeMode, setIsStocktakeMode] = useState(false);
  const [showStocktakeBanner, setShowStocktakeBanner] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Stocktake Drawer state
  const [activeStocktakeProduct, setActiveStocktakeProduct] = useState<Product | null>(null);
  const [physicalCountInput, setPhysicalCountInput] = useState<string>('');
  const [shrinkageReason, setShrinkageReason] = useState<string>('Kuharibika / Kumwagika (Spillage/Spoilage)');
  const [stocktakeNote, setStocktakeNote] = useState<string>('');

  // Price Adjustment Modal state
  const [editPriceProduct, setEditPriceProduct] = useState<Product | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [priceChangeReason, setPriceChangeReason] = useState<string>('');

  // Receive Stock Modal state
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [receiveProductId, setReceiveProductId] = useState<string>('');
  const [receiveSupplierId, setReceiveSupplierId] = useState<string>('');
  const [receiveInvoiceNo, setReceiveInvoiceNo] = useState<string>('');
  const [receiveUnitLabel, setReceiveUnitLabel] = useState<string>('');
  const [receiveFactor, setReceiveFactor] = useState<number>(1);
  const [receiveQuantity, setReceiveQuantity] = useState<string>('1');
  const [receiveUnitCost, setReceiveUnitCost] = useState<string>('');
  const [receivePaidAmount, setReceivePaidAmount] = useState<string>('');

  // Personal Drawings Modal state
  const [showDrawingsModal, setShowDrawingsModal] = useState<boolean>(false);
  const [drawingProductId, setDrawingProductId] = useState<string>('');
  const [drawingQty, setDrawingQty] = useState<string>('1');
  const [drawingNote, setDrawingNote] = useState<string>('Matumizi ya nyumbani (Home consumption)');

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Vyakula (Groceries)');
  const [newBaseUnit, setNewBaseUnit] = useState<BaseUnit>('kg');
  const [newSellPrice, setNewSellPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newStockQty, setNewStockQty] = useState('');
  const [newReorderLevel, setNewReorderLevel] = useState('10');
  const [newBarcode, setNewBarcode] = useState('');

  // Financial calculations
  const totalPurchaseCost = useMemo(() => {
    return products.reduce((sum, p) => sum + Math.max(0, p.stock_qty) * p.avg_cost, 0);
  }, [products]);

  const totalExpectedSales = useMemo(() => {
    return products.reduce((sum, p) => sum + Math.max(0, p.stock_qty) * p.sell_price, 0);
  }, [products]);

  const projectedMarginPct = useMemo(() => {
    if (totalExpectedSales <= 0) return 0;
    const profit = totalExpectedSales - totalPurchaseCost;
    return (profit / totalExpectedSales) * 100;
  }, [totalExpectedSales, totalPurchaseCost]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock_qty <= p.reorder_level);
  }, [products]);

  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: { [cat: string]: number } = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return [
      { id: 'all', label: 'Zote', count: products.length },
      ...Object.keys(counts).map(cat => ({
        id: cat,
        label: cat,
        count: counts[cat]
      }))
    ];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filterLowStockOnly && p.stock_qty > p.reorder_level) return false;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery, filterLowStockOnly]);

  // Open stocktake drawer for product
  const handleOpenStocktake = (prod: Product) => {
    setActiveStocktakeProduct(prod);
    setPhysicalCountInput(prod.stock_qty.toString());
    setShrinkageReason('Kuharibika / Kumwagika (Spillage/Spoilage)');
    setStocktakeNote('');
  };

  // Close stocktake drawer
  const handleCloseStocktake = () => {
    setActiveStocktakeProduct(null);
  };

  // Quick delta adjustments in stocktake
  const handleDeltaCount = (delta: number) => {
    const current = parseFloat(physicalCountInput) || 0;
    const updated = Math.max(0, current + delta);
    setPhysicalCountInput(updated % 1 === 0 ? updated.toString() : updated.toFixed(3));
  };

  // Submit stocktake audit
  const handleConfirmStocktake = () => {
    if (!activeStocktakeProduct) return;
    const counted = parseFloat(physicalCountInput);
    if (isNaN(counted) || counted < 0) {
      showToast('Weka kiasi halisi kilichohesabiwa', 'warn');
      return;
    }

    const diff = counted - activeStocktakeProduct.stock_qty;
    const reasonText = diff === 0
      ? 'Hesabu ya stoo - Iko sahihi (Reconciled)'
      : `Hesabu ya stoo: ${shrinkageReason}${stocktakeNote ? ` (${stocktakeNote})` : ''}`;

    adjustStock(activeStocktakeProduct.id, counted, reasonText);
    showToast(`Hesabu ya ${activeStocktakeProduct.name} imehifadhiwa kikamilifu!`, 'success');
    handleCloseStocktake();
  };

  // Submit price update
  const handleConfirmPriceUpdate = () => {
    if (!editPriceProduct) return;
    const priceNum = parseFloat(newPriceInput);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Weka bei sahihi ya kuuza', 'warn');
      return;
    }
    if (!priceChangeReason.trim()) {
      showToast('Tafadhali taja sababu ya kubadilisha bei kwa kumbukumbu', 'warn');
      return;
    }

    updateProductPrice(editPriceProduct.id, priceNum, priceChangeReason.trim());
    showToast(`Bei ya ${editPriceProduct.name} imesasishwa kuwa TSh ${formatQty(priceNum)}`, 'success');
    setEditPriceProduct(null);
    setNewPriceInput('');
    setPriceChangeReason('');
  };

  // Open Receive modal with optional pre-selected product
  const handleOpenReceive = (prod?: Product) => {
    if (prod) {
      setReceiveProductId(prod.id);
      const buyOpt = prod.unit_options.find(u => u.use_for_buying);
      if (buyOpt) {
        setReceiveUnitLabel(buyOpt.label);
        setReceiveFactor(buyOpt.factor);
        setReceiveUnitCost((prod.avg_cost * buyOpt.factor).toString());
      } else {
        setReceiveUnitLabel(prod.base_unit);
        setReceiveFactor(1);
        setReceiveUnitCost(prod.avg_cost.toString());
      }
    } else if (products.length > 0) {
      const p = products[0];
      setReceiveProductId(p.id);
      const buyOpt = p.unit_options.find(u => u.use_for_buying);
      if (buyOpt) {
        setReceiveUnitLabel(buyOpt.label);
        setReceiveFactor(buyOpt.factor);
        setReceiveUnitCost((p.avg_cost * buyOpt.factor).toString());
      } else {
        setReceiveUnitLabel(p.base_unit);
        setReceiveFactor(1);
        setReceiveUnitCost(p.avg_cost.toString());
      }
    }
    if (suppliers.length > 0) {
      setReceiveSupplierId(suppliers[0].id);
    }
    setReceiveQuantity('1');
    setReceiveInvoiceNo(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setShowReceiveModal(true);
  };

  // Submit Receive Stock
  const handleConfirmReceive = () => {
    if (!receiveProductId) {
      showToast('Chagua bidhaa', 'warn');
      return;
    }
    const qty = parseFloat(receiveQuantity);
    const cost = parseFloat(receiveUnitCost);
    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) {
      showToast('Weka kiasi na bei sahihi ya kupokea', 'warn');
      return;
    }

    const totalVal = qty * cost;
    const paid = parseFloat(receivePaidAmount) || totalVal;

    addPurchase({
      supplierId: receiveSupplierId || (suppliers[0]?.id || 'sup-default'),
      invoiceNo: receiveInvoiceNo || `PO-${Date.now().toString().slice(-4)}`,
      items: [
        {
          productId: receiveProductId,
          qtyBought: qty,
          unitLabel: receiveUnitLabel || 'kipande',
          factor: receiveFactor || 1,
          unitCost: cost
        }
      ],
      paidAmount: paid,
      note: 'Ingizo la mzigo stoo kupitia DukaSmart'
    });

    const targetProd = products.find(p => p.id === receiveProductId);
    showToast(`Mzigo wa ${targetProd?.name || 'bidhaa'} umepokewa na stoo kuongezeka!`, 'success');
    setShowReceiveModal(false);
  };

  // Submit Personal Drawing
  const handleConfirmDrawing = () => {
    if (!drawingProductId) {
      showToast('Chagua bidhaa ya matumizi binafsi', 'warn');
      return;
    }
    const qty = parseFloat(drawingQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Weka kiasi sahihi', 'warn');
      return;
    }

    addOwnerDrawing({
      type: 'product',
      productId: drawingProductId,
      qty: qty,
      note: drawingNote.trim() || 'Matumizi binafsi ya nyumbani'
    });

    const prod = products.find(p => p.id === drawingProductId);
    showToast(`Umechukua ${qty} ${prod?.base_unit || ''} ya ${prod?.name || 'bidhaa'} kwa matumizi binafsi.`, 'info');
    setShowDrawingsModal(false);
  };

  // Submit Add Product
  const handleConfirmAddProduct = () => {
    if (!newName.trim()) {
      showToast('Weka jina la bidhaa', 'warn');
      return;
    }
    const sellPrice = parseFloat(newSellPrice);
    const costPrice = parseFloat(newCostPrice) || (sellPrice * 0.8);
    const stockQty = parseFloat(newStockQty) || 0;
    const reorder = parseFloat(newReorderLevel) || 10;

    if (isNaN(sellPrice) || sellPrice <= 0) {
      showToast('Weka bei sahihi ya kuuza', 'warn');
      return;
    }

    addProduct({
      name: newName.trim(),
      category: newCategory,
      base_unit: newBaseUnit,
      sell_price: sellPrice,
      avg_cost: costPrice,
      stock_qty: stockQty,
      reorder_level: reorder,
      barcode: newBarcode.trim() || undefined,
      active: true,
      unit_options: [
        { label: `1 ${newBaseUnit}`, factor: 1, use_for_buying: false, use_for_selling: true }
      ]
    });

    showToast(`Bidhaa mpya "${newName}" imeongezwa kwenye stoo!`, 'success');
    setShowAddModal(false);
    setNewName('');
    setNewSellPrice('');
    setNewCostPrice('');
    setNewStockQty('');
    setNewBarcode('');
  };

  // Barcode mock scan
  const handleMockBarcodeScan = () => {
    if (products.length > 0) {
      const sample = products[Math.floor(Math.random() * products.length)];
      setSearchQuery(sample.name);
      showToast(`Barcode imesomwa: ${sample.name}`, 'info');
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#faf8f5] text-gray-900 flex flex-col font-sans pb-24">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="bg-gray-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-orange-400 flex-shrink-0" />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sub-Header Bar (DukaSmart Identity) */}
      <div className="bg-white/90 backdrop-blur-md border-b border-orange-100/80 sticky top-[108px] z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1WqfVNZWOzPRUIq-IOOGmS4dWIh3bgUArKpuvKcxbiupsXxZq7kl2bcdiTcGM59kBT14Wj0UYum6q4zSjWOAUbLQVifeeSGnMAZEK87ipqiT4nbsMKk9NcfRKUXF696hmS0X_-PjrDE_INa3qnPjC6477PIIH--Ggp2gXo-MlTm9q5CNkAItcbV7BZ9Uzx6PGnAD7tX04njAd_PVzKMD7HobdIJYg03Mf3CGhEkmvt9EQJ2ipUSyICEAHA"
              alt="DukaSmart Logo"
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <h1 className="font-display font-bold text-base text-gray-900 tracking-tight">
                  Stoo & Hesabu (DukaSmart Inventory)
                </h1>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="truncate font-medium">Neema Super Duka · Arusha</span>
                <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-full text-[10px]">
                  Mtandaoni
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openOutbox}
              className={`h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-xl border transition-all cursor-pointer ${
                !isOnline
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : pendingCount > 0
                  ? 'bg-orange-50 border-orange-300 text-orange-900'
                  : 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100'
              }`}
              title="Sawazisha na Supabase / Fungua Dexie Outbox"
            >
              <CloudCheck className={`w-4 h-4 ${!isOnline ? 'text-amber-600' : 'text-emerald-600'}`} />
              {pendingCount > 0 && (
                <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <div className="w-9 h-9 rounded-full ring-2 ring-orange-500/30 overflow-hidden flex-shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzjIFLNSs87xWPqBHiCkT3dJ5IeOFANjwuGprLYvD3mwjMdAX1JQPMZqflwdlWyxEtf54xjHkCWAbT4SM_tgHWrLKIgUyMGLs3IMZ3vRraJTexcrgQCCjkuWKoc7BQ65gnqrxQmTGjk2ueTU4DzwBCkaOzX3ZUQziemxxCRyTTUlgqBFD2v7lRBO1fKry4BbY7mpBAAR83yxVBtgiDPqH2jm5l4LeQ8A9bIiIJbdGX5KU6_LCXTVeD"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full pt-4 space-y-4">
        {/* Top Financial Snapshot Banner (Bento-style metrics) */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700">
                Thamani ya Stoo (Stock Valuation)
              </span>
            </div>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-full">
              WAC Model (Weighted Cost)
            </span>
          </div>

          {/* Main Valuation Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            <div className="bg-[#fffbf7] border border-orange-100/80 p-3.5 rounded-xl shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">Gharama ya Ununuzi (Cost)</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {formatTsh(totalPurchaseCost)}
              </p>
              <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 font-medium">
                <Store className="w-3.5 h-3.5 text-orange-600" /> Bei ya Jumla (Jumla ya Mtaji Uliopo)
              </span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100/80 p-3.5 rounded-xl shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">Mauzo Yanayotarajiwa (Retail)</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-emerald-800 mt-1">
                {formatTsh(totalExpectedSales)}
              </p>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> Thamani ya Rejareja (Mapato Yote Yakitoka)
              </span>
            </div>
          </div>

          {/* Margin & Alerts Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-orange-500/10 border border-orange-200/60 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-orange-900 font-medium">Kiwango cha Faida (Projected Margin)</span>
                <p className="text-[11px] text-orange-700 mt-0.5">
                  Faida ya Jumla: <span className="font-bold">{formatTsh(Math.max(0, totalExpectedSales - totalPurchaseCost))}</span>
                </p>
              </div>
              <span className="font-display text-xl font-bold text-orange-600">
                {projectedMarginPct.toFixed(1)}%
              </span>
            </div>

            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`p-3 rounded-xl flex items-center justify-between transition-all text-left ${
                filterLowStockOnly
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-red-50 hover:bg-red-100/70 border border-red-200/60 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-5 h-5 ${filterLowStockOnly ? 'text-white' : 'text-red-500'}`} />
                <div>
                  <span className="text-xs font-bold block">
                    {lowStockProducts.length > 0 ? `${lowStockProducts.length} Bidhaa Ziko Chini` : 'Hakuna Bidhaa Iliyo Chini'}
                  </span>
                  <span className={`text-[11px] ${filterLowStockOnly ? 'text-red-100' : 'text-red-600'}`}>
                    {filterLowStockOnly ? 'Bofya kuona bidhaa zote' : 'Bofya kuchuja bidhaa zilizopungua'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-75" />
            </button>
          </div>
        </section>

        {/* Quick Action Drawer Bar (Tactile Buttons) */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Receive Stock */}
            <button
              onClick={() => handleOpenReceive()}
              className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl shadow-sm hover:shadow-md active:scale-98 transition-all text-center min-h-[64px]"
            >
              <Truck className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold leading-tight">Ingiza Mzigo</span>
              <span className="text-[10px] text-orange-100 leading-tight">Pokea bidhaa toka wauzaji</span>
            </button>

            {/* Stocktake Toggle */}
            <button
              onClick={() => {
                const nextState = !showStocktakeBanner;
                setShowStocktakeBanner(nextState);
                setIsStocktakeMode(nextState);
                if (nextState) {
                  showToast('Modi ya Hesabu ya Stoo imewashwa', 'info');
                }
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border active:scale-98 transition-all text-center min-h-[64px] ${
                showStocktakeBanner
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-orange-100 hover:bg-orange-50/50 text-gray-800'
              }`}
            >
              <div className="relative">
                <ClipboardCheck className="w-5 h-5 text-amber-600 mb-1" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              </div>
              <span className="text-xs font-bold leading-tight">Hesabu Stoo</span>
              <span className="text-[10px] text-gray-500 leading-tight">Linganisha na mizani</span>
            </button>

            {/* Personal Use / Drawings */}
            <button
              onClick={() => {
                if (products.length > 0) {
                  setDrawingProductId(products[0].id);
                }
                setShowDrawingsModal(true);
              }}
              className="flex flex-col items-center justify-center p-3 bg-white border border-orange-100 hover:bg-orange-50/50 text-gray-800 rounded-2xl active:scale-98 transition-all text-center min-h-[64px]"
            >
              <ShoppingBag className="w-5 h-5 text-orange-600 mb-1" />
              <span className="text-xs font-bold leading-tight">Matumizi Binafsi</span>
              <span className="text-[10px] text-gray-500 leading-tight">Vitu vya nyumbani (Cost)</span>
            </button>

            {/* Add New Product */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-white border border-orange-100 hover:bg-orange-50/50 text-gray-800 rounded-2xl active:scale-98 transition-all text-center min-h-[64px]"
            >
              <Plus className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xs font-bold leading-tight">Ongeza Bidhaa</span>
              <span className="text-[10px] text-gray-500 leading-tight">Sajili bidhaa mpya</span>
            </button>
          </div>
        </section>

        {/* Live Stocktake Mode Active Banner */}
        {showStocktakeBanner && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-amber-500 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-spin">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold">Modi ya Hesabu Imewashwa (Audit Mode Active)</p>
                  <p className="text-[11px] text-amber-100">
                    Bofya kitufe cha <b>&quot;Pima&quot;</b> au <b>&quot;Hesabu&quot;</b> kwenye bidhaa yoyote kurekodi hesabu halisi na pungufu.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStocktakeBanner(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* Filter & Search Section with Scanner */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tafuta bidhaa kwa jina au barcode..."
                className="w-full h-11 pl-10 pr-11 bg-white border border-orange-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-2xs"
              />
              <button
                onClick={handleMockBarcodeScan}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-orange-600 transition-colors"
                title="Soma Barcode"
              >
                <Scan className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`h-11 px-3.5 rounded-2xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-2xs ${
                filterLowStockOnly
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white border-orange-100 hover:bg-orange-50 text-gray-700'
              }`}
              title="Chuja Zilizopungua"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Chuja</span>
            </button>
          </div>

          {/* Category Quick Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categoriesWithCounts.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setFilterLowStockOnly(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
                  selectedCategory === cat.id && !filterLowStockOnly
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white border border-orange-100 text-gray-600 hover:bg-orange-50/60'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </section>

        {/* Stock Item Cards (Loose & Pack Units) */}
        <section className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-orange-200">
              <Package className="w-12 h-12 text-orange-300 mx-auto mb-2" />
              <h3 className="font-bold text-gray-700">Hakuna bidhaa inayolingana</h3>
              <p className="text-xs text-gray-500 mt-1">Jaribu kubadili jina au kategoria kwenye kichujio.</p>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const isLowStock = prod.stock_qty <= prod.reorder_level;
              const isOutOfStock = prod.stock_qty <= 0;
              const stockValue = Math.max(0, prod.stock_qty) * prod.avg_cost;
              const profitMargin = prod.sell_price - prod.avg_cost;
              const profitPct = prod.sell_price > 0 ? (profitMargin / prod.sell_price) * 100 : 0;

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100/90 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* Card Header: Thumbnail, Name, Badges, Edit Price */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="relative w-14 h-14 rounded-2xl bg-orange-50 overflow-hidden flex-shrink-0 border border-orange-100 flex items-center justify-center">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-7 h-7 text-orange-400" />
                        )}
                        <span className="absolute bottom-0 right-0 bg-orange-600 text-white text-[9px] px-1.5 py-0.2 font-display font-bold uppercase rounded-tl-lg">
                          {prod.base_unit}
                        </span>
                      </div>

                      {/* Product Name & Category */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-display font-bold text-sm sm:text-base text-gray-900 truncate">
                            {prod.name}
                          </h2>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-700">
                              Imeisha!
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                              Imebaki Kidogo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                              Stoo ya Kutosha
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {prod.category} · {prod.unit_options.map(u => u.label).join(' & ')}
                        </p>
                      </div>
                    </div>

                    {/* Price edit button */}
                    <button
                      onClick={() => {
                        setEditPriceProduct(prod);
                        setNewPriceInput(prod.sell_price.toString());
                        setPriceChangeReason('');
                      }}
                      className="w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0 transition-colors"
                      title="Badili Bei"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity & Stock Valuation Strip */}
                  <div className="mt-3 bg-[#fffbf7] border border-orange-100/70 rounded-xl p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500 font-medium">Kiasi Kilichopo Stoo:</span>
                      <div className="text-right">
                        <span className="font-display text-lg sm:text-xl font-extrabold text-gray-900">
                          {formatQty(prod.stock_qty)}
                        </span>
                        <span className="text-xs text-gray-500 font-bold ml-1">{prod.base_unit}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Thamani ya stoo: <b className="text-gray-800">{formatTsh(stockValue)}</b></span>
                      <span>Kiwango cha kuagiza: <b className="text-amber-700">{formatQty(prod.reorder_level)} {prod.base_unit}</b></span>
                    </div>
                  </div>

                  {/* Dual Pricing Boxes: Cost vs Retail */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-gray-500 block text-[11px]">WAC Bei ya Kununua:</span>
                      <span className="font-display font-bold text-gray-900 text-sm">
                        {formatTsh(prod.avg_cost)} <span className="text-[10px] text-gray-500 font-normal">/{prod.base_unit}</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100/80">
                      <span className="text-orange-800 block text-[11px] font-medium">Bei ya Rejareja:</span>
                      <span className="font-display font-bold text-orange-600 text-sm">
                        {formatTsh(prod.sell_price)} <span className="text-[10px] text-gray-500 font-normal">/{prod.base_unit}</span>
                      </span>
                      <span className="block text-[10px] text-orange-700 font-bold">
                        Faida: {formatTsh(profitMargin)} ({profitPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Quick Unit Breakdown & CTA Action Button */}
                  <div className="mt-3 pt-2.5 border-t border-orange-100/60 flex items-center justify-between flex-wrap gap-2">
                    {/* Unit chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-orange-50/80 text-orange-800 border border-orange-100 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                        1 {prod.base_unit} = {formatTsh(prod.sell_price)}
                      </span>
                      {prod.unit_options
                        .filter(u => u.use_for_selling && u.factor !== 1)
                        .slice(0, 2)
                        .map((u, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg text-[11px] font-medium"
                          >
                            {u.label} = {formatTsh(u.price_override || prod.sell_price * u.factor)}
                          </span>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {isLowStock && (
                        <button
                          onClick={() => handleOpenReceive(prod)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Agiza Sasa
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenStocktake(prod)}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Hesabu / Pima
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE STOCKTAKE & SHRINKAGE BOTTOM SHEET DRAWER / MODAL         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!activeStocktakeProduct}
        onClose={handleCloseStocktake}
        maxWidth="max-w-lg"
      >
        {activeStocktakeProduct && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">
                    Hesabu ya Stoo & Mizani
                  </h3>
                  <p className="text-xs text-gray-500">Linganisha kiasi kilichopo kwenye rafu/stoo</p>
                </div>
              </div>
              <button
                onClick={handleCloseStocktake}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Product Summary */}
            <div className="bg-[#fffbf7] border border-orange-100 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm">{activeStocktakeProduct.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  {activeStocktakeProduct.base_unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                <span>Kiasi Kinachotarajiwa kwenye Mfumo:</span>
                <span className="font-display font-extrabold text-gray-900 text-sm">
                  {formatQty(activeStocktakeProduct.stock_qty)} {activeStocktakeProduct.base_unit}
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                Bei ya ununuzi: {formatTsh(activeStocktakeProduct.avg_cost)} /{activeStocktakeProduct.base_unit}
              </div>
            </div>

            {/* Physical Count Input with tactile steppers */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kiasi Halisi Kilichohesabiwa (Physical Count):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={physicalCountInput}
                  onChange={e => setPhysicalCountInput(e.target.value)}
                  className="w-full h-13 px-4 text-center font-display text-2xl font-extrabold bg-gray-50 border-2 border-orange-200 focus:border-orange-500 rounded-2xl focus:outline-none"
                  placeholder="0.000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  {activeStocktakeProduct.base_unit}
                </span>
              </div>

              {/* Quick Stepper Delta Chips */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDeltaCount(-1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  -1.0
                </button>
                <button
                  type="button"
                  onClick={() => handleDeltaCount(-0.5)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  -0.5
                </button>
                <button
                  type="button"
                  onClick={() => handleDeltaCount(-0.1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  -0.1
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalCountInput(activeStocktakeProduct.stock_qty.toString())}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800"
                >
                  Sawa (Reset)
                </button>
                <button
                  type="button"
                  onClick={() => handleDeltaCount(0.1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  +0.1
                </button>
                <button
                  type="button"
                  onClick={() => handleDeltaCount(0.5)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  +0.5
                </button>
                <button
                  type="button"
                  onClick={() => handleDeltaCount(1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  +1.0
                </button>
              </div>
            </div>

            {/* Real-time Variance Calculation Box */}
            {(() => {
              const count = parseFloat(physicalCountInput) || 0;
              const diff = count - activeStocktakeProduct.stock_qty;
              const varianceValue = Math.abs(diff) * activeStocktakeProduct.avg_cost;

              if (diff < 0) {
                return (
                  <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-red-900 block">Tofauti ya Stoo (Pungufu):</span>
                      <span className="font-display font-extrabold text-red-600 text-base">
                        {diff.toFixed(3)} {activeStocktakeProduct.base_unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-red-700 block font-medium">Hasara ya Kifedha:</span>
                      <span className="font-display font-extrabold text-red-600 text-base">
                        -{formatTsh(varianceValue)}
                      </span>
                    </div>
                  </div>
                );
              } else if (diff > 0) {
                return (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Tofauti ya Stoo (Ziada):</span>
                      <span className="font-display font-extrabold text-emerald-600 text-base">
                        +{diff.toFixed(3)} {activeStocktakeProduct.base_unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-700 block font-medium">Thamani ya Ziada:</span>
                      <span className="font-display font-extrabold text-emerald-600 text-base">
                        +{formatTsh(varianceValue)}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Tofauti: 0.000 (Hesabu inalingana)</span>
                    <span className="text-xs font-extrabold text-emerald-700">Hakuna hasara wala ziada</span>
                  </div>
                );
              }
            })()}

            {/* Shrinkage Reason Selector (Shown if variance exists) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Sababu ya Marekebisho / Shrinkage:
              </label>
              <select
                value={shrinkageReason}
                onChange={e => setShrinkageReason(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Kuharibika / Kumwagika (Spillage/Spoilage)">Kuharibika / Kumwagika (Spillage / Spoilage)</option>
                <option value="Wizi / Kupotea (Theft / Lost)">Wizi / Kupotea (Theft / Lost)</option>
                <option value="Kipimo cha Kupimia / Loose Sales Margin (Scale Variance)">Kipimo cha Kupimia / Loose Sales Margin</option>
                <option value="Hitilafu ya Kuhesabu Awali (Counting Error)">Hitilafu ya Kuhesabu Awali (Counting Error)</option>
                <option value="Zawadi kwa Wateja (Promo / Customer Gift)">Zawadi kwa Wateja (Promo / Customer Gift)</option>
                <option value="Nyinginezo (Other)">Nyinginezo (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Maelezo ya Ziada (Hiari):</label>
              <input
                type="text"
                value={stocktakeNote}
                onChange={e => setStocktakeNote(e.target.value)}
                placeholder="Mfano: Mfuko ulipasuka wakati wa kushusha mzigo..."
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs"
              />
            </div>

            {/* Confirm & Save Button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseStocktake}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleConfirmStocktake}
                className="flex-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Thibitisha & Hifadhi Hesabu
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 2. PRICE ADJUSTMENT MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!editPriceProduct}
        onClose={() => setEditPriceProduct(null)}
        maxWidth="max-w-md"
      >
        {editPriceProduct && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">Badili Bei ya Kuuza</h3>
                  <p className="text-xs text-gray-500">Marekebisho yataathiri mauzo yajayo pekee</p>
                </div>
              </div>
              <button
                onClick={() => setEditPriceProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#fffbf7] border border-orange-100 p-3.5 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-gray-900 text-sm">{editPriceProduct.name}</div>
              <div className="text-gray-500">
                Gharama ya Ununuzi (WAC Cost): <b>{formatTsh(editPriceProduct.avg_cost)} /{editPriceProduct.base_unit}</b>
              </div>
              <div className="text-gray-500">
                Bei ya Sasa: <b className="text-gray-800">{formatTsh(editPriceProduct.sell_price)} /{editPriceProduct.base_unit}</b>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bei Mpya ya Rejareja (TSh):</label>
              <input
                type="number"
                value={newPriceInput}
                onChange={e => setNewPriceInput(e.target.value)}
                className="w-full h-11 px-3 bg-gray-50 border-2 border-orange-200 focus:border-orange-500 rounded-xl font-display font-bold text-lg text-gray-900 focus:outline-none"
                placeholder="Weka bei mpya..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Sababu ya Kubadilisha Bei (Inahitajika kwa Ukaguzi wa Mfumo):
              </label>
              <input
                type="text"
                value={priceChangeReason}
                onChange={e => setPriceChangeReason(e.target.value)}
                placeholder="Mfano: Bei ya jumla Kariakoo imepanda..."
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditPriceProduct(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleConfirmPriceUpdate}
                className="flex-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Hifadhi Bei Mpya
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 3. RECEIVE STOCK (INGIZA MZIGO) MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">Ingiza Mzigo Stoo (Receive Stock)</h3>
                  <p className="text-xs text-gray-500">Mfumo utahuisha Wastani wa Gharama (WAC) kiotomatiki</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select Product */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Chagua Bidhaa:</label>
              <select
                value={receiveProductId}
                onChange={e => {
                  const pid = e.target.value;
                  setReceiveProductId(pid);
                  const p = products.find(prod => prod.id === pid);
                  if (p) {
                    const buyOpt = p.unit_options.find(u => u.use_for_buying);
                    if (buyOpt) {
                      setReceiveUnitLabel(buyOpt.label);
                      setReceiveFactor(buyOpt.factor);
                      setReceiveUnitCost((p.avg_cost * buyOpt.factor).toString());
                    } else {
                      setReceiveUnitLabel(p.base_unit);
                      setReceiveFactor(1);
                      setReceiveUnitCost(p.avg_cost.toString());
                    }
                  }
                }}
                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier & Invoice */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Msambazaji (Supplier):</label>
                <select
                  value={receiveSupplierId}
                  onChange={e => setReceiveSupplierId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Namba ya Risiti / Ankara:</label>
                <input
                  type="text"
                  value={receiveInvoiceNo}
                  onChange={e => setReceiveInvoiceNo(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  placeholder="INV-1024"
                />
              </div>
            </div>

            {/* Unit type & factor */}
            {(() => {
              const selectedProd = products.find(p => p.id === receiveProductId);
              if (!selectedProd) return null;
              return (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">Aina ya Kifurushi Kilichopokelewa:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiveUnitLabel(selectedProd.base_unit);
                        setReceiveFactor(1);
                        setReceiveUnitCost(selectedProd.avg_cost.toString());
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        receiveFactor === 1
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-orange-50/50'
                      }`}
                    >
                      1 {selectedProd.base_unit} (Base)
                    </button>
                    {selectedProd.unit_options
                      .filter(u => u.use_for_buying)
                      .map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setReceiveUnitLabel(u.label);
                            setReceiveFactor(u.factor);
                            setReceiveUnitCost((selectedProd.avg_cost * u.factor).toString());
                          }}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                            receiveFactor === u.factor
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-orange-50/50'
                          }`}
                        >
                          {u.label} ({u.factor} {selectedProd.base_unit})
                        </button>
                      ))}
                  </div>
                </div>
              );
            })()}

            {/* Qty & Cost */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Idadi ya Vifurushi:</label>
                <input
                  type="number"
                  step="any"
                  value={receiveQuantity}
                  onChange={e => setReceiveQuantity(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl font-display font-bold text-base"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bei ya Kununulia Kila Kifurushi (TSh):</label>
                <input
                  type="number"
                  value={receiveUnitCost}
                  onChange={e => setReceiveUnitCost(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl font-display font-bold text-base text-gray-900"
                  placeholder="50,000"
                />
              </div>
            </div>

            {/* Total purchase amount summary */}
            {(() => {
              const q = parseFloat(receiveQuantity) || 0;
              const c = parseFloat(receiveUnitCost) || 0;
              const tot = q * c;
              const totalBaseUnits = q * receiveFactor;
              const selectedProd = products.find(p => p.id === receiveProductId);

              return (
                <div className="bg-[#fffbf7] border border-orange-100 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block">Jumla ya Malipo ya Mzigo:</span>
                    <span className="font-display font-bold text-orange-600 text-base">
                      {formatTsh(tot)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block">Stoo Itaongezeka:</span>
                    <span className="font-display font-bold text-emerald-700 text-base">
                      +{totalBaseUnits.toFixed(2)} {selectedProd?.base_unit || ''}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleConfirmReceive}
                className="flex-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ingiza Mzigo Stoo
              </button>
            </div>
          </div>
        </Modal>

      {/* ========================================================================= */}
      {/* 4. PERSONAL DRAWINGS MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showDrawingsModal}
        onClose={() => setShowDrawingsModal(false)}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">Matumizi Binafsi (Personal Use)</h3>
                  <p className="text-xs text-gray-500">Inapunguzwa kwa gharama ya ununuzi bila kuhesabiwa kama hasara</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrawingsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Chagua Bidhaa:</label>
              <select
                value={drawingProductId}
                onChange={e => setDrawingProductId(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Iliyopo: {formatQty(p.stock_qty)} {p.base_unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kiasi Kilichochukuliwa:</label>
              <input
                type="number"
                step="any"
                value={drawingQty}
                onChange={e => setDrawingQty(e.target.value)}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl font-display font-bold text-base"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Maelezo (Sababu):</label>
              <input
                type="text"
                value={drawingNote}
                onChange={e => setDrawingNote(e.target.value)}
                placeholder="Mfano: Matumizi ya chakula cha mchana nyumbani..."
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDrawingsModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleConfirmDrawing}
                className="flex-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Rekodi Matumizi Binafsi
              </button>
            </div>
          </div>
        </Modal>

      {/* ========================================================================= */}
      {/* 5. ADD NEW PRODUCT MODAL                                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">Sajili Bidhaa Mpya</h3>
                  <p className="text-xs text-gray-500">Weka taarifa za bidhaa mpya kwenye stoo</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jina la Bidhaa:</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Mfano: Unga wa Dona (Azam 5kg)"
                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategoria:</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Vyakula, Usafi, Nafaka..."
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kipimo cha Msingi (Base Unit):</label>
                <select
                  value={newBaseUnit}
                  onChange={e => setNewBaseUnit(e.target.value as BaseUnit)}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                >
                  <option value="kg">Kilogramu (kg)</option>
                  <option value="litre">Lita (litre)</option>
                  <option value="piece">Kipande / Pakiti (piece)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bei ya Kuuza Rejareja (TSh):</label>
                <input
                  type="number"
                  value={newSellPrice}
                  onChange={e => setNewSellPrice(e.target.value)}
                  placeholder="2,500"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bei ya Kununulia (Cost TSh):</label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={e => setNewCostPrice(e.target.value)}
                  placeholder="2,000"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kiasi cha Kuanzia Stoo:</label>
                <input
                  type="number"
                  step="any"
                  value={newStockQty}
                  onChange={e => setNewStockQty(e.target.value)}
                  placeholder="50"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kiwango cha Kuagiza Upya:</label>
                <input
                  type="number"
                  value={newReorderLevel}
                  onChange={e => setNewReorderLevel(e.target.value)}
                  placeholder="10"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Barcode (Hiari):</label>
              <input
                type="text"
                value={newBarcode}
                onChange={e => setNewBarcode(e.target.value)}
                placeholder="616123456789"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleConfirmAddProduct}
                className="flex-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Hifadhi Bidhaa Mpya
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
};
