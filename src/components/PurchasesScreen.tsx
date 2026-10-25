import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  FileText,
  Plus,
  Truck,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  X,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Modal } from './Modal';
import { formatTsh } from '../utils/translations';
import { Purchase, Product } from '../types';

interface NewPurchaseItemRow {
  productId: string;
  qtyBought: number;
  unitLabel: string;
  factor: number;
  unitCost: number;
}

export const PurchasesScreen: React.FC = () => {
  const {
    t,
    purchases,
    suppliers,
    products,
    addPurchase
  } = useShop();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [purchaseNote, setPurchaseNote] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [purchaseRows, setPurchaseRows] = useState<NewPurchaseItemRow[]>([
    {
      productId: products[0]?.id || '',
      qtyBought: 1,
      unitLabel: 'gunia (sack 50kg)',
      factor: 50,
      unitCost: 130000,
    }
  ]);

  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  const addPurchaseRow = () => {
    setPurchaseRows(prev => [
      ...prev,
      {
        productId: products[0]?.id || '',
        qtyBought: 1,
        unitLabel: '1 unit',
        factor: 1,
        unitCost: 1000,
      }
    ]);
  };

  const updatePurchaseRow = (index: number, updates: Partial<NewPurchaseItemRow>) => {
    setPurchaseRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removePurchaseRow = (index: number) => {
    setPurchaseRows(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total purchase cost
  const calculatedTotalCost = purchaseRows.reduce((sum, row) => sum + row.qtyBought * row.unitCost, 0);

  // Handle Photo selection/upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setReceiptImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Tafadhali chagua msambazaji.');
      return;
    }
    if (purchaseRows.length === 0) {
      alert('Weka walau bidhaa moja iliyonunuliwa.');
      return;
    }

    const paidAmt = parseFloat(paidAmountInput);
    const finalPaid = isNaN(paidAmt) ? calculatedTotalCost : paidAmt;

    addPurchase({
      supplierId: selectedSupplierId,
      invoiceNo: invoiceNo.trim() || undefined,
      items: purchaseRows,
      paidAmount: finalPaid,
      note: purchaseNote.trim() || undefined,
      receiptUrl: receiptImage || undefined,
    });

    setShowAddModal(false);
    setSelectedSupplierId('');
    setInvoiceNo('');
    setPaidAmountInput('');
    setPurchaseNote('');
    setReceiptImage(null);
    setPurchaseRows([
      {
        productId: products[0]?.id || '',
        qtyBought: 1,
        unitLabel: 'gunia (sack 50kg)',
        factor: 50,
        unitCost: 130000,
      }
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>{t.purchases} (Kuweka Mzigo & Risiti za Ununuzi)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Rekodi ununuzi wa mizigo kwa magunia/katoni na ufuatilie picha za risiti za maduka ya jumla.
          </p>
        </div>

        <button
          onClick={() => {
            if (suppliers.length === 0) {
              alert('Tafadhali ongeza msambazaji kwanza kwenye Daftari la Wadaiji.');
              return;
            }
            setSelectedSupplierId(suppliers[0]?.id || '');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs shadow-orange-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Rekodi Ununuzi Mpya</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-3xl border border-orange-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-extrabold text-sm text-gray-800">Historia ya Risiti za Mizigo</span>
          <span className="text-xs text-gray-500">{purchases.length} Risiti</span>
        </div>

        <div className="divide-y divide-gray-100">
          {purchases.map(pur => (
            <div key={pur.id} className="p-4 hover:bg-orange-50/20 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                
                {/* Left: Supplier & Invoice */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{pur.supplier_name}</span>
                    <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                      {pur.invoice_no}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        pur.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pur.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {pur.status === 'paid' ? 'Imelipwa Yote' : pur.status === 'partial' ? 'Imelipwa Sehemu' : 'Bado Haijalipwa'}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-3">
                    <span>{new Date(pur.purchase_date).toLocaleDateString()} saa {new Date(pur.purchase_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>Imeingizwa na {pur.created_by}</span>
                  </div>

                  {pur.note && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      "{pur.note}"
                    </p>
                  )}
                </div>

                {/* Right: Items, Cost & Receipt thumbnail */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-base text-gray-900">
                      {formatTsh(pur.total)}
                    </div>
                    {pur.total > pur.paid_amount && (
                      <div className="text-xs font-bold text-red-600 font-mono">
                        Deni: {formatTsh(pur.total - pur.paid_amount)}
                      </div>
                    )}
                  </div>

                  {pur.receipt_url && (
                    <button
                      onClick={() => setViewReceiptUrl(pur.receipt_url!)}
                      className="p-1.5 border border-orange-200 rounded-xl hover:bg-orange-50 text-orange-600"
                      title="Tazama Picha ya Risiti"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="mt-3 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100 text-xs flex flex-wrap gap-2">
                {pur.items.map((item, idx) => (
                  <div key={idx} className="bg-white px-2.5 py-1 rounded-xl border border-gray-200">
                    <span className="font-semibold text-gray-800">{item.product_name}: </span>
                    <span className="text-gray-600">
                      {item.quantity_bought} {item.unit_label} = {item.total_base_qty} base units @ {formatTsh(item.base_cost_each)}/unit
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add New Purchase */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Rekodi Ununuzi wa Mzigo Mpya"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Msambazaji (Supplier):</label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Risiti/Invoice:</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                placeholder="Mf. INV-88219"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Dynamic Purchase Item Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700">Bidhaa Zilizomo kwenye Mzigo:</label>
              <button
                type="button"
                onClick={addPurchaseRow}
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Aina Nyingine</span>
              </button>
            </div>

            <div className="space-y-3">
              {purchaseRows.map((row, idx) => {
                const currentProd = products.find(p => p.id === row.productId);
                const baseCost = row.factor > 0 ? row.unitCost / row.factor : row.unitCost;

                return (
                  <div key={idx} className="p-3 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-gray-600 block">Bidhaa:</label>
                        <select
                          value={row.productId}
                          onChange={e => {
                            const newPId = e.target.value;
                            const p = products.find(prod => prod.id === newPId);
                            updatePurchaseRow(idx, {
                              productId: newPId,
                              unitLabel: p?.unit_options?.[0]?.label || `1 ${p?.base_unit}`,
                              factor: p?.unit_options?.[0]?.factor || 1,
                            });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.base_unit})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block">Kipimo cha Kununua:</label>
                        <input
                          type="text"
                          value={row.unitLabel}
                          onChange={e => updatePurchaseRow(idx, { unitLabel: e.target.value })}
                          placeholder="Mf. Gunia 50kg"
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block">
                          Ina Base Units Ngapi? ({currentProd?.base_unit || 'kizio'}):
                        </label>
                        <input
                          type="number"
                          value={row.factor}
                          onChange={e => updatePurchaseRow(idx, { factor: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block">Idadi Iliyonunuliwa:</label>
                        <input
                          type="number"
                          value={row.qtyBought}
                          onChange={e => updatePurchaseRow(idx, { qtyBought: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block">Bei kwa Kila Kipimo (TSh):</label>
                        <input
                          type="number"
                          value={row.unitCost}
                          onChange={e => updatePurchaseRow(idx, { unitCost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white font-mono font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div className="text-[11px] font-semibold text-orange-900">
                          Gharama: {formatTsh(baseCost)}/{currentProd?.base_unit}
                        </div>
                        {purchaseRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePurchaseRow(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            Futa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payments & receipt photo */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Jumla Kuu ya Mzigo:</span>
              <span className="text-base text-orange-600 font-mono font-black">{formatTsh(calculatedTotalCost)}</span>
            </div>

            {/* Quick Tender Options */}
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Chagua jinsi ya kurekodi malipo:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidAmountInput(calculatedTotalCost.toString())}
                  className="py-1.5 px-2 bg-white hover:bg-emerald-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-800 transition-colors"
                >
                  Lipa Yote Taslimu
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmountInput(Math.round(calculatedTotalCost / 2).toString())}
                  className="py-1.5 px-2 bg-white hover:bg-amber-50 border border-gray-200 rounded-xl text-xs font-bold text-amber-800 transition-colors"
                >
                  Nusu Deni (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmountInput('0')}
                  className="py-1.5 px-2 bg-white hover:bg-red-50 border border-gray-200 rounded-xl text-xs font-bold text-red-800 transition-colors"
                >
                  Mkopo Kamili
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-700 font-bold block mb-1">Kiasi Kilicholipwa Sasa (TSh):</label>
                <input
                  type="number"
                  value={paidAmountInput}
                  onChange={e => setPaidAmountInput(e.target.value)}
                  placeholder={calculatedTotalCost.toString()}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-700 font-bold block mb-1">Picha ya Risiti (Hiari):</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {receiptImage && (
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">Picha imepakiwa kikamilifu</span>
                )}
              </div>
            </div>

            {/* Live Debt Summary Banner */}
            {calculatedTotalCost > 0 && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                calculatedTotalCost - (parseFloat(paidAmountInput) || 0) > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}>
                <span>Hali ya Malipo:</span>
                <span>
                  {calculatedTotalCost - (parseFloat(paidAmountInput) || 0) > 0
                    ? `Deni la Msambazaji: ${formatTsh(calculatedTotalCost - (parseFloat(paidAmountInput) || 0))}`
                    : 'Mzigo Umelipwa Kikamilifu (Hakuna Deni)'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Maelezo ya Ziada (Hiari):</label>
            <input
              type="text"
              value={purchaseNote}
              onChange={e => setPurchaseNote(e.target.value)}
              placeholder="Mf. Baki 85,000 tutalipa Ijumaa baada ya mauzo"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs"
            >
              Hifadhi Mzigo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Receipt Photo */}
      <Modal
        isOpen={!!viewReceiptUrl}
        onClose={() => setViewReceiptUrl(null)}
        title="Picha ya Risiti"
        maxWidth="max-w-lg"
      >
        {viewReceiptUrl && (
          <img
            src={viewReceiptUrl}
            alt="Receipt"
            className="w-full max-h-[70vh] object-contain rounded-2xl"
          />
        )}
      </Modal>
    </div>
  );
};
