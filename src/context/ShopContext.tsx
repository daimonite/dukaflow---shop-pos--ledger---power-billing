import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Expense,
  OwnerDrawing,
  PowerMember,
  PowerPeriod,
  MeterReading,
  PowerPayment,
  AuditLogEntry,
  CashRegisterSession,
  LedgerEntry,
  UserRole,
  SaleItem,
  PaymentMethod,
  ShopSettings
} from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialSales,
  initialPurchases,
  initialExpenses,
  initialOwnerDrawings,
  initialLedgerEntries,
  initialPowerMembers,
  initialPowerPeriods,
  initialMeterReadings,
  initialPowerPayments,
  initialAuditLogs,
  initialCashRegister
} from '../data/seedData';
import { Language, translations, formatTsh } from '../utils/translations';
import { syncService } from '../services/syncService';

interface ShopContextType {
  // Localization & Role
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['sw'];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: { name: string; role: UserRole };
  
  // Store Settings & Config
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  
  // Data
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  ownerDrawings: OwnerDrawing[];
  ledgerEntries: LedgerEntry[];
  powerMembers: PowerMember[];
  powerPeriods: PowerPeriod[];
  meterReadings: MeterReading[];
  powerPayments: PowerPayment[];
  auditLogs: AuditLogEntry[];
  cashRegister: CashRegisterSession;
  
  // Actions
  createSale: (params: {
    items: {
      productId: string;
      qty: number;
      unitLabel: string;
      unitPrice: number;
      roundingAdjustment?: number;
    }[];
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    paymentReference?: string;
  }) => Sale;
  
  voidSale: (saleId: string, reason: string) => void;
  
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProductPrice: (productId: string, newSellPrice: number, reason: string) => void;
  adjustStock: (productId: string, newQty: number, reason: string) => void;
  
  addPurchase: (params: {
    supplierId: string;
    invoiceNo?: string;
    items: {
      productId: string;
      qtyBought: number;
      unitLabel: string;
      factor: number;
      unitCost: number;
    }[];
    paidAmount: number;
    note?: string;
    receiptUrl?: string;
  }) => void;
  
  addExpense: (spentOn: string, category: Expense['category'], amount: number, note?: string) => void;
  addOwnerDrawing: (params: {
    type: 'product' | 'cash';
    productId?: string;
    qty?: number;
    cashAmount?: number;
    note: string;
  }) => void;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'current_balance'>) => void;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, note?: string, reference?: string) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'current_balance'>) => void;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMethod: PaymentMethod, note?: string) => void;
  
  // Power Actions
  addPowerMember: (member: Omit<PowerMember, 'id'>) => void;
  recordPowerReading: (periodId: string, memberId: string, currentReading: number) => void;
  recordPowerPayment: (periodId: string, memberId: string, amount: number, paymentMethod: PowerPayment['payment_method'], reference?: string) => void;
  updatePowerRate: (periodId: string, rate: number, mode: 'fixed' | 'derived', mainMeterUnits?: number, totalBill?: number) => void;
  closePowerPeriodAndRollOver: (periodId: string) => void;
  
  // Register Actions
  closeDayRegister: (actualCash: number, notes?: string) => void;
  openNewDayRegister: (openingCash: number, notes?: string) => void;
  
  // Utility & Backup
  clearDemoTransactions: () => void;
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
  exportSalesCSV: () => void;
  exportPowerCSV: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const STORAGE_KEY = 'dukeflow_app_state_v1';

export const defaultSettings: ShopSettings = {
  storeName: 'DukaSmart Super Duka',
  storeLocation: 'Arusha, Tanzania',
  storePhone: '+255 754 000 000',
  adminName: 'Kelvin',
  adminPin: '1234',
  managerName: 'Baraka',
  receiptFooter: 'Asante kwa kununua nasi! Karibu tena.'
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('dukeflow_lang') as Language) || 'sw';
  });
  
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Configurable Shop Settings
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Core state collections initialized from localStorage or seed data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sales`);
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_purchases`);
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [ownerDrawings, setOwnerDrawings] = useState<OwnerDrawing[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_owner_drawings`);
    return saved ? JSON.parse(saved) : initialOwnerDrawings;
  });

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ledger`);
    return saved ? JSON.parse(saved) : initialLedgerEntries;
  });

  const [powerMembers, setPowerMembers] = useState<PowerMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_power_members`);
    return saved ? JSON.parse(saved) : initialPowerMembers;
  });

  const [powerPeriods, setPowerPeriods] = useState<PowerPeriod[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_power_periods`);
    return saved ? JSON.parse(saved) : initialPowerPeriods;
  });

  const [meterReadings, setMeterReadings] = useState<MeterReading[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_meter_readings`);
    return saved ? JSON.parse(saved) : initialMeterReadings;
  });

  const [powerPayments, setPowerPayments] = useState<PowerPayment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_power_payments`);
    return saved ? JSON.parse(saved) : initialPowerPayments;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit_logs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [cashRegister, setCashRegister] = useState<CashRegisterSession>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cash_register`);
    return saved ? JSON.parse(saved) : initialCashRegister;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('dukeflow_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_owner_drawings`, JSON.stringify(ownerDrawings));
  }, [ownerDrawings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ledger`, JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_power_members`, JSON.stringify(powerMembers));
  }, [powerMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_power_periods`, JSON.stringify(powerPeriods));
  }, [powerPeriods]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_meter_readings`, JSON.stringify(meterReadings));
  }, [meterReadings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_power_payments`, JSON.stringify(powerPayments));
  }, [powerPayments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cash_register`, JSON.stringify(cashRegister));
  }, [cashRegister]);

  const currentUser = {
    name: currentRole === 'admin'
      ? `${settings.adminName || 'Admin'} (Admin)`
      : currentRole === 'manager'
      ? `${settings.managerName || 'Manager'} (Manager)`
      : 'Power Committee',
    role: currentRole
  };

  const t = translations[language];

  // Audit Log helper
  const addAuditEntry = (entry: Omit<AuditLogEntry, 'id' | 'at' | 'user_name' | 'user_role'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      at: new Date().toISOString(),
      user_name: currentUser.name,
      user_role: currentRole,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // 1. Create Sale (Atomic snapshot of cost, stock decrease, ledger debt update)
  const createSale: ShopContextType['createSale'] = ({
    items: inputItems,
    customerId,
    customerName,
    customerPhone,
    paymentMethod,
    paidAmount,
    paymentReference
  }) => {
    const nowIso = new Date().toISOString();
    const dateCode = nowIso.slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const receiptNo = `RCP-${dateCode}-${randomSuffix}`;

    // Map sale items with instant cost snapshots
    const processedItems: SaleItem[] = inputItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const costSnapshot = prod ? prod.avg_cost : 0;
      const lineTotal = Math.round(item.qty * item.unitPrice);
      const lineCost = Math.round(item.qty * costSnapshot);
      const lineProfit = lineTotal - lineCost;

      return {
        product_id: item.productId,
        product_name: prod ? prod.name : 'Unknown Product',
        quantity: item.qty,
        unit_label: item.unitLabel,
        unit_price: item.unitPrice,
        unit_cost_snapshot: costSnapshot,
        line_total: lineTotal,
        line_cost: lineCost,
        line_profit: lineProfit,
        rounding_adjustment: item.roundingAdjustment || 0,
      };
    });

    const total = processedItems.reduce((sum, item) => sum + item.line_total, 0);
    const debtAmount = Math.max(0, total - paidAmount);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receipt_no: receiptNo,
      sold_at: nowIso,
      customer_id: customerId,
      customer_name: customerName || (customerId ? customers.find(c => c.id === customerId)?.name : 'Mteja Taslimu'),
      customer_phone: customerPhone || (customerId ? customers.find(c => c.id === customerId)?.phone : undefined),
      items: processedItems,
      total,
      paid_amount: paidAmount,
      debt_amount: debtAmount,
      payment_method: paymentMethod,
      payment_reference: paymentReference?.trim() || undefined,
      created_by: currentRole,
      sold_by_name: currentUser.name,
    };

    // Update product stock quantities
    setProducts(prev =>
      prev.map(prod => {
        const soldItem = processedItems.find(i => i.product_id === prod.id);
        if (soldItem) {
          const newQty = Math.max(0, prod.stock_qty - soldItem.quantity);
          return { ...prod, stock_qty: Math.round(newQty * 1000) / 1000 };
        }
        return prod;
      })
    );

    // If there is debt or customer was provided
    if (customerId && debtAmount > 0) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === customerId
            ? { ...c, current_balance: c.current_balance + debtAmount }
            : c
        )
      );

      const itemsSummary = processedItems
        .map(i => `${i.product_name} (${i.quantity} ${i.unit_label})`)
        .join(', ');

      const newLedger: LedgerEntry = {
        id: `led-${Date.now()}`,
        party_type: 'customer',
        party_id: customerId,
        party_name: customerName || 'Customer',
        direction: 'debit',
        amount: debtAmount,
        ref_sale_id: newSale.id,
        items_summary: itemsSummary,
        note: `Mauzo kwa mkopo #${receiptNo}`,
        created_at: nowIso,
        created_by: currentUser.name,
      };

      setLedgerEntries(prev => [newLedger, ...prev]);
    }

    // Update cash drawer if cash was paid
    if (paymentMethod === 'cash' && paidAmount > 0) {
      setCashRegister(prev => ({
        ...prev,
        cash_sales: prev.cash_sales + paidAmount,
        expected_closing: prev.expected_closing + paidAmount,
      }));
    }

    setSales(prev => [newSale, ...prev]);

    // Queue in Dexie Outbox for Supabase upload
    syncService.queueTransaction({
      type: 'sale',
      title: `Mauzo: ${newSale.receipt_no} (${newSale.customer_name})`,
      amount: newSale.total,
      target_table: 'sales',
      payload: newSale
    }).catch(console.error);

    return newSale;
  };

  // 2. Void Sale
  const voidSale: ShopContextType['voidSale'] = (saleId, reason) => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale || targetSale.voided_at) return;

    const nowIso = new Date().toISOString();

    // Restore stock
    setProducts(prev =>
      prev.map(prod => {
        const item = targetSale.items.find(i => i.product_id === prod.id);
        if (item) {
          return {
            ...prod,
            stock_qty: Math.round((prod.stock_qty + item.quantity) * 1000) / 1000,
          };
        }
        return prod;
      })
    );

    // Reverse debt if it had debt
    if (targetSale.customer_id && targetSale.debt_amount > 0) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === targetSale.customer_id
            ? { ...c, current_balance: Math.max(0, c.current_balance - targetSale.debt_amount) }
            : c
        )
      );

      const reversalLedger: LedgerEntry = {
        id: `led-void-${Date.now()}`,
        party_type: 'customer',
        party_id: targetSale.customer_id,
        party_name: targetSale.customer_name || 'Customer',
        direction: 'credit',
        amount: targetSale.debt_amount,
        ref_sale_id: targetSale.id,
        note: `Kufuta mauzo #${targetSale.receipt_no}: ${reason}`,
        created_at: nowIso,
        created_by: currentUser.name,
      };
      setLedgerEntries(prev => [reversalLedger, ...prev]);
    }

    // Deduct cash if it was cash
    if (targetSale.payment_method === 'cash' && targetSale.paid_amount > 0) {
      setCashRegister(prev => ({
        ...prev,
        cash_sales: Math.max(0, prev.cash_sales - targetSale.paid_amount),
        expected_closing: Math.max(0, prev.expected_closing - targetSale.paid_amount),
      }));
    }

    // Mark sale voided
    setSales(prev =>
      prev.map(s =>
        s.id === saleId
          ? {
              ...s,
              voided_at: nowIso,
              void_reason: reason,
              voided_by: currentUser.name,
            }
          : s
      )
    );

    // Instant Alert in Audit Log
    addAuditEntry({
      table_name: 'sales',
      record_id: saleId,
      action: 'SALE_VOID',
      old_value: { total: targetSale.total, receipt_no: targetSale.receipt_no },
      new_value: { voided: true },
      reason,
      severity: 'alert',
    });
  };

  // 3. Products: Add & Price Update
  const addProduct: ShopContextType['addProduct'] = (productData) => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);

    addAuditEntry({
      table_name: 'products',
      record_id: newProd.id,
      action: 'PRICE_CHANGE',
      new_value: { name: newProd.name, sell_price: newProd.sell_price, avg_cost: newProd.avg_cost },
      reason: 'Bidhaa mpya imeongezwa dukani',
      severity: 'digest',
    });
  };

  const updateProductPrice: ShopContextType['updateProductPrice'] = (productId, newSellPrice, reason) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const oldPrice = prod.sell_price;
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, sell_price: newSellPrice } : p))
    );

    // Instant Alert for Price Change as requested!
    addAuditEntry({
      table_name: 'products',
      record_id: productId,
      action: 'PRICE_CHANGE',
      old_value: { product_name: prod.name, sell_price: oldPrice },
      new_value: { product_name: prod.name, sell_price: newSellPrice },
      reason: reason || 'Marekebisho ya bei ya kuuza',
      severity: 'alert',
    });

    // Queue in Dexie Outbox for Supabase
    syncService.queueTransaction({
      type: 'price_update',
      title: `Bei ya ${prod.name}: TSh ${newSellPrice}`,
      amount: newSellPrice,
      target_table: 'products',
      payload: {
        product_id: productId,
        product_name: prod.name,
        old_price: oldPrice,
        new_price: newSellPrice,
        reason: reason || 'Marekebisho ya bei ya kuuza',
        updated_at: new Date().toISOString()
      }
    }).catch(console.error);
  };

  // 4. Adjust Stock / Stocktake Shrinkage
  const adjustStock: ShopContextType['adjustStock'] = (productId, newQty, reason) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const oldQty = prod.stock_qty;
    const diff = newQty - oldQty;

    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock_qty: newQty } : p))
    );

    addAuditEntry({
      table_name: 'stock_movements',
      record_id: productId,
      action: 'STOCK_ADJUST',
      old_value: { product: prod.name, stock_qty: oldQty },
      new_value: { product: prod.name, stock_qty: newQty, diff },
      reason: reason || (diff < 0 ? 'Punguzo la stoo/Shrinkage' : 'Nyongeza ya stoo'),
      severity: diff < 0 ? 'alert' : 'digest',
    });

    // Queue in Dexie Outbox for Supabase
    syncService.queueTransaction({
      type: 'stock_adjustment',
      title: `Hesabu ya Stoo: ${prod.name} (${newQty} ${prod.base_unit})`,
      target_table: 'inventory_movements',
      payload: {
        product_id: productId,
        product_name: prod.name,
        old_qty: oldQty,
        new_qty: newQty,
        diff,
        reason: reason || 'Marekebisho ya stoo',
        adjusted_at: new Date().toISOString()
      }
    }).catch(console.error);
  };

  // 5. Purchases with Weighted-Average Cost Update
  const addPurchase: ShopContextType['addPurchase'] = ({
    supplierId,
    invoiceNo,
    items,
    paidAmount,
    note,
    receiptUrl,
  }) => {
    const nowIso = new Date().toISOString();
    const supplier = suppliers.find(s => s.id === supplierId);
    const supplierName = supplier?.name || 'Supplier';

    let totalCost = 0;
    const processedPurchaseItems = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const totalBaseQty = item.qtyBought * item.factor;
      const baseCostEach = item.unitCost / item.factor;
      const lineCost = item.qtyBought * item.unitCost;
      totalCost += lineCost;

      // Calculate weighted average cost:
      // (old_qty * old_cost + new_qty * new_cost) / (old_qty + new_qty)
      if (prod) {
        const oldQty = prod.stock_qty;
        const oldCost = prod.avg_cost;
        const newTotalQty = oldQty + totalBaseQty;
        const weightedCost =
          newTotalQty > 0
            ? (oldQty * oldCost + totalBaseQty * baseCostEach) / newTotalQty
            : baseCostEach;

        setProducts(curr =>
          curr.map(p =>
            p.id === prod.id
              ? {
                  ...p,
                  stock_qty: Math.round(newTotalQty * 1000) / 1000,
                  avg_cost: Math.round(weightedCost * 100) / 100,
                }
              : p
          )
        );
      }

      return {
        product_id: item.productId,
        product_name: prod?.name || 'Product',
        quantity_bought: item.qtyBought,
        unit_label: item.unitLabel,
        factor: item.factor,
        total_base_qty: totalBaseQty,
        unit_cost: item.unitCost,
        base_cost_each: baseCostEach,
        total_cost: lineCost,
      };
    });

    const status: Purchase['status'] =
      paidAmount >= totalCost ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      invoice_no: invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
      supplier_id: supplierId,
      supplier_name: supplierName,
      purchase_date: nowIso,
      items: processedPurchaseItems,
      total: totalCost,
      paid_amount: paidAmount,
      receipt_url: receiptUrl,
      created_by: currentUser.name,
      status,
      note,
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // If unpaid amount, add to creditor debt
    const unpaidDebt = totalCost - paidAmount;
    if (unpaidDebt > 0) {
      setSuppliers(prev =>
        prev.map(s =>
          s.id === supplierId
            ? { ...s, current_balance: s.current_balance + unpaidDebt }
            : s
        )
      );

      const newLedger: LedgerEntry = {
        id: `led-supp-${Date.now()}`,
        party_type: 'supplier',
        party_id: supplierId,
        party_name: supplierName,
        direction: 'debit',
        amount: unpaidDebt,
        ref_purchase_id: newPurchase.id,
        note: `Baki ya ununuzi #${newPurchase.invoice_no}`,
        created_at: nowIso,
        created_by: currentUser.name,
      };
      setLedgerEntries(prev => [newLedger, ...prev]);
    }

    addAuditEntry({
      table_name: 'purchases',
      record_id: newPurchase.id,
      action: 'PURCHASE_ENTRY',
      new_value: { supplier: supplierName, total: totalCost, paidAmount },
      reason: `Ununuzi mpya wa mzigo kutoka kwa ${supplierName}`,
      severity: 'digest',
    });

    // Queue in Dexie Outbox for Supabase
    syncService.queueTransaction({
      type: 'purchase',
      title: `Ununuzi: ${newPurchase.invoice_no} (${supplierName})`,
      amount: newPurchase.total,
      target_table: 'purchases',
      payload: newPurchase
    }).catch(console.error);
  };

  // 6. Operating Expenses
  const addExpense: ShopContextType['addExpense'] = (spentOn, category, amount, note) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      spent_on: spentOn,
      category,
      amount,
      note,
      created_by: currentUser.name,
    };

    setExpenses(prev => [newExpense, ...prev]);

    setCashRegister(prev => ({
      ...prev,
      cash_expenses: prev.cash_expenses + amount,
      expected_closing: Math.max(0, prev.expected_closing - amount),
    }));

    addAuditEntry({
      table_name: 'expenses',
      record_id: newExpense.id,
      action: 'STOCK_ADJUST',
      new_value: { spentOn, amount, category },
      reason: `Matumizi: ${spentOn} (${amount} TSh)`,
      severity: 'digest',
    });

    // Queue in Dexie Outbox for Supabase
    syncService.queueTransaction({
      type: 'expense',
      title: `Matumizi: ${spentOn}`,
      amount: amount,
      target_table: 'expenses',
      payload: newExpense
    }).catch(console.error);
  };

  // 7. Owner Drawings / Personal Use (Valued at Cost - doesn't distort operating profit)
  const addOwnerDrawing: ShopContextType['addOwnerDrawing'] = ({
    type,
    productId,
    qty,
    cashAmount,
    note,
  }) => {
    let costValue = 0;
    let prodName = '';
    let unit = '';

    if (type === 'product' && productId && qty) {
      const prod = products.find(p => p.id === productId);
      if (prod) {
        costValue = Math.round(qty * prod.avg_cost);
        prodName = prod.name;
        unit = prod.base_unit;

        // Reduce inventory
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? { ...p, stock_qty: Math.max(0, p.stock_qty - qty) }
              : p
          )
        );
      }
    } else if (type === 'cash' && cashAmount) {
      costValue = cashAmount;
      setCashRegister(prev => ({
        ...prev,
        cash_owner_drawings: prev.cash_owner_drawings + cashAmount,
        expected_closing: Math.max(0, prev.expected_closing - cashAmount),
      }));
    }

    const newDrawing: OwnerDrawing = {
      id: `draw-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      product_id: productId,
      product_name: prodName,
      quantity: qty,
      base_unit: unit,
      cost_value: costValue,
      cash_amount: cashAmount,
      note,
      taken_by: currentUser.name,
    };

    setOwnerDrawings(prev => [newDrawing, ...prev]);

    // Queue in Dexie Outbox for Supabase
    syncService.queueTransaction({
      type: 'owner_drawing',
      title: `Matumizi Binafsi: ${note || prodName}`,
      amount: costValue,
      target_table: 'owner_drawings',
      payload: newDrawing
    }).catch(console.error);
  };

  // 8. Customers & Debtors
  const addCustomer: ShopContextType['addCustomer'] = customerData => {
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      current_balance: 0,
    };
    setCustomers(prev => [...prev, newCust]);
  };

  const recordCustomerPayment: ShopContextType['recordCustomerPayment'] = (
    customerId,
    amount,
    paymentMethod,
    note,
    reference
  ) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    const roundedAmount = Math.round(amount);
    const nowIso = new Date().toISOString();
    const newBal = Math.round(cust.current_balance - roundedAmount);

    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, current_balance: newBal } : c))
    );

    const newLedger: LedgerEntry = {
      id: `led-pay-${Date.now()}`,
      party_type: 'customer',
      party_id: customerId,
      party_name: cust.name,
      direction: 'credit', // credit customer account (reduces what they owe)
      amount: roundedAmount,
      payment_method: paymentMethod,
      payment_reference: reference?.trim() || undefined,
      note: note || (reference ? `Malipo ya deni (${paymentMethod.toUpperCase()} Ref: ${reference})` : `Malipo ya deni kupitia ${paymentMethod}`),
      created_at: nowIso,
      created_by: currentUser.name,
    };

    setLedgerEntries(prev => [newLedger, ...prev]);

    if (paymentMethod === 'cash') {
      setCashRegister(prev => ({
        ...prev,
        cash_debt_payments: prev.cash_debt_payments + amount,
        expected_closing: prev.expected_closing + amount,
      }));
    }

    addAuditEntry({
      table_name: 'customers',
      record_id: customerId,
      action: 'DEBT_PAYMENT',
      new_value: { customer: cust.name, amountPaid: amount, remaining: newBal },
      reason: `Malipo ya deni: ${cust.name} amelipa ${amount} TSh`,
      severity: 'log',
    });
  };

  // 9. Suppliers & Creditors
  const addSupplier: ShopContextType['addSupplier'] = supplierData => {
    const newSupp: Supplier = {
      ...supplierData,
      id: `supp-${Date.now()}`,
      current_balance: 0,
    };
    setSuppliers(prev => [...prev, newSupp]);
  };

  const recordSupplierPayment: ShopContextType['recordSupplierPayment'] = (
    supplierId,
    amount,
    paymentMethod,
    note
  ) => {
    const supp = suppliers.find(s => s.id === supplierId);
    if (!supp) return;

    const nowIso = new Date().toISOString();
    const newBal = Math.max(0, supp.current_balance - amount);

    setSuppliers(prev =>
      prev.map(s => (s.id === supplierId ? { ...s, current_balance: newBal } : s))
    );

    const newLedger: LedgerEntry = {
      id: `led-supp-pay-${Date.now()}`,
      party_type: 'supplier',
      party_id: supplierId,
      party_name: supp.name,
      direction: 'credit',
      amount,
      note: note || `Tumelipa deni la msambazaji (${paymentMethod})`,
      created_at: nowIso,
      created_by: currentUser.name,
    };

    setLedgerEntries(prev => [newLedger, ...prev]);

    if (paymentMethod === 'cash') {
      setCashRegister(prev => ({
        ...prev,
        cash_expenses: prev.cash_expenses + amount,
        expected_closing: Math.max(0, prev.expected_closing - amount),
      }));
    }
  };

  // 10. Power Module
  const addPowerMember: ShopContextType['addPowerMember'] = memberData => {
    const newMember: PowerMember = {
      ...memberData,
      id: `pm-${Date.now()}`,
    };
    setPowerMembers(prev => [...prev, newMember]);

    // Also create initial reading entry for current open period
    const openPeriod = powerPeriods.find(p => p.status === 'open') || powerPeriods[0];
    if (openPeriod) {
      const newReading: MeterReading = {
        id: `mr-${Date.now()}`,
        period_id: openPeriod.id,
        member_id: newMember.id,
        previous_reading: newMember.initial_reading,
        current_reading: newMember.initial_reading,
        units_used: 0,
        rate_charged: openPeriod.rate_per_unit,
        current_charge: 0,
        carried_forward_debt: 0,
        total_due: 0,
        paid_amount: 0,
        closing_balance: 0,
        status: 'paid',
      };
      setMeterReadings(prev => [...prev, newReading]);
    }
  };

  const recordPowerReading: ShopContextType['recordPowerReading'] = (
    periodId,
    memberId,
    currentReading
  ) => {
    const period = powerPeriods.find(p => p.id === periodId);
    if (!period || period.status === 'closed') return;

    setMeterReadings(prev =>
      prev.map(reading => {
        if (reading.period_id === periodId && reading.member_id === memberId) {
          const unitsUsed = Math.max(0, currentReading - reading.previous_reading);
          const currentCharge = Math.round(unitsUsed * period.rate_per_unit * 100) / 100;
          const totalDue = Math.round(currentCharge + reading.carried_forward_debt);
          const closingBalance = totalDue - reading.paid_amount;
          const status =
            closingBalance <= 0
              ? 'paid'
              : reading.paid_amount > 0
              ? 'partial'
              : 'unpaid';

          return {
            ...reading,
            current_reading: currentReading,
            units_used: unitsUsed,
            rate_charged: period.rate_per_unit,
            current_charge: currentCharge,
            total_due: totalDue,
            closing_balance: closingBalance,
            status,
          };
        }
        return reading;
      })
    );
  };

  const recordPowerPayment: ShopContextType['recordPowerPayment'] = (
    periodId,
    memberId,
    amount,
    paymentMethod,
    reference
  ) => {
    const member = powerMembers.find(m => m.id === memberId);
    const memberName = member?.name || 'Member';
    const nowIso = new Date().toISOString();

    const newPayment: PowerPayment = {
      id: `ppay-${Date.now()}`,
      period_id: periodId,
      member_id: memberId,
      member_name: memberName,
      amount,
      paid_at: nowIso,
      recorded_by: currentUser.name,
      reference,
      payment_method: paymentMethod,
    };

    setPowerPayments(prev => [newPayment, ...prev]);

    // Queue in Dexie Outbox for Supabase
    syncService.queueTransaction({
      type: 'power_payment',
      title: `Malipo ya Umeme: ${memberName} (${formatTsh(amount)})`,
      amount,
      target_table: 'power_payments',
      payload: newPayment
    }).catch(console.error);

    setMeterReadings(prev =>
      prev.map(reading => {
        if (reading.period_id === periodId && reading.member_id === memberId) {
          const updatedPaid = reading.paid_amount + amount;
          const closingBalance = reading.total_due - updatedPaid;
          const status =
            closingBalance <= 0
              ? 'paid'
              : updatedPaid > 0
              ? 'partial'
              : 'unpaid';

          return {
            ...reading,
            paid_amount: updatedPaid,
            closing_balance: closingBalance,
            status,
            last_payment_date: nowIso,
          };
        }
        return reading;
      })
    );
  };

  const updatePowerRate: ShopContextType['updatePowerRate'] = (
    periodId,
    rate,
    mode,
    mainMeterUnits,
    totalBill
  ) => {
    const period = powerPeriods.find(p => p.id === periodId);
    if (!period || period.status === 'closed') return;

    let computedRate = rate;
    if (mode === 'derived' && mainMeterUnits && totalBill && mainMeterUnits > 0) {
      computedRate = Math.round((totalBill / mainMeterUnits) * 100) / 100;
    }

    const oldRate = period.rate_per_unit;

    setPowerPeriods(prev =>
      prev.map(p =>
        p.id === periodId
          ? {
              ...p,
              rate_per_unit: computedRate,
              rate_mode: mode,
              main_meter_units: mainMeterUnits,
              total_luku_tokens_bought: totalBill,
            }
          : p
      )
    );

    // Recompute charges for this open period
    setMeterReadings(prev =>
      prev.map(reading => {
        if (reading.period_id === periodId) {
          const currentCharge = Math.round(reading.units_used * computedRate * 100) / 100;
          const totalDue = Math.round(currentCharge + reading.carried_forward_debt);
          const closingBalance = totalDue - reading.paid_amount;
          const status =
            closingBalance <= 0
              ? 'paid'
              : reading.paid_amount > 0
              ? 'partial'
              : 'unpaid';

          return {
            ...reading,
            rate_charged: computedRate,
            current_charge: currentCharge,
            total_due: totalDue,
            closing_balance: closingBalance,
            status,
          };
        }
        return reading;
      })
    );

    addAuditEntry({
      table_name: 'power_periods',
      record_id: periodId,
      action: 'RATE_CHANGE',
      old_value: { rate: oldRate },
      new_value: { rate: computedRate, mode },
      reason: `Marekebisho ya kiwango cha umeme: ${oldRate} -> ${computedRate} TSh`,
      severity: 'alert',
    });
  };

  // Close power month and automatically roll forward debts into new month!
  const closePowerPeriodAndRollOver: ShopContextType['closePowerPeriodAndRollOver'] = periodId => {
    const period = powerPeriods.find(p => p.id === periodId);
    if (!period) return;

    const nowIso = new Date().toISOString();

    // Mark current period closed
    setPowerPeriods(prev =>
      prev.map(p => (p.id === periodId ? { ...p, status: 'closed', closed_at: nowIso } : p))
    );

    // Create next month's period
    const [y, m] = period.month.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const nextPeriodId = `period-${nextMonthStr}`;

    const newPeriod: PowerPeriod = {
      id: nextPeriodId,
      month: nextMonthStr,
      month_label: nextDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
      rate_per_unit: period.rate_per_unit,
      rate_mode: period.rate_mode,
      status: 'open',
    };

    setPowerPeriods(prev => [newPeriod, ...prev]);

    // Carry forward closing balances to new readings
    const oldReadings = meterReadings.filter(r => r.period_id === periodId);
    const newReadings: MeterReading[] = oldReadings.map(old => {
      const prevMeterValue = old.current_reading > 0 ? old.current_reading : old.previous_reading;
      const carriedDebt = old.closing_balance; // rolls over!
      return {
        id: `mr-${nextPeriodId}-${old.member_id}`,
        period_id: nextPeriodId,
        member_id: old.member_id,
        previous_reading: prevMeterValue,
        current_reading: prevMeterValue,
        units_used: 0,
        rate_charged: period.rate_per_unit,
        current_charge: 0,
        carried_forward_debt: carriedDebt,
        total_due: carriedDebt,
        paid_amount: 0,
        closing_balance: carriedDebt,
        status: carriedDebt <= 0 ? 'paid' : 'unpaid',
      };
    });

    setMeterReadings(prev => [...prev, ...newReadings]);
  };

  // 11. Register Actions
  const closeDayRegister: ShopContextType['closeDayRegister'] = (actualCash, notes) => {
    const nowIso = new Date().toISOString();
    const diff = actualCash - cashRegister.expected_closing;

    setCashRegister(prev => ({
      ...prev,
      actual_closing: actualCash,
      difference: diff,
      closed_at: nowIso,
      status: 'closed',
      notes,
    }));

    addAuditEntry({
      table_name: 'cash_register',
      record_id: cashRegister.id,
      action: 'STOCKTAKE',
      new_value: { expected: cashRegister.expected_closing, actual: actualCash, diff },
      reason: `Kufunga hesabu ya siku: Tofauti ya ${diff} TSh (${notes || 'Hakuna maelezo'})`,
      severity: Math.abs(diff) > 2000 ? 'alert' : 'digest',
    });
  };

  const openNewDayRegister: ShopContextType['openNewDayRegister'] = (openingCash, notes) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newSession: CashRegisterSession = {
      id: `reg-${Date.now()}`,
      date: todayStr,
      opened_at: new Date().toISOString(),
      opening_cash: openingCash,
      cash_sales: 0,
      cash_debt_payments: 0,
      cash_expenses: 0,
      cash_owner_drawings: 0,
      expected_closing: openingCash,
      status: 'open',
      notes,
    };
    setCashRegister(newSession);
  };

  // 12. Backup & Export
  const clearDemoTransactions = () => {
    setSales([]);
    setPurchases([]);
    setExpenses([]);
    setOwnerDrawings([]);
    setLedgerEntries([]);
    setCustomers(prev => prev.map(c => ({ ...c, current_balance: 0 })));
    setSuppliers(prev => prev.map(s => ({ ...s, current_balance: 0 })));
    setPowerPayments([]);
    setMeterReadings(prev => prev.map(r => ({
      ...r,
      carried_forward_debt: 0,
      paid_amount: 0,
      closing_balance: r.current_charge,
      status: r.current_charge === 0 ? 'paid' : 'unpaid'
    })));
    
    const todayStr = new Date().toISOString().split('T')[0];
    const freshRegister: CashRegisterSession = {
      id: `reg-${Date.now()}`,
      date: todayStr,
      opened_at: new Date().toISOString(),
      opening_cash: cashRegister.opening_cash || 50000,
      cash_sales: 0,
      cash_debt_payments: 0,
      cash_expenses: 0,
      cash_owner_drawings: 0,
      expected_closing: cashRegister.opening_cash || 50000,
      status: 'open',
      notes: 'Kuanza upya baada ya kufuta data za majaribio'
    };
    setCashRegister(freshRegister);

    addAuditEntry({
      table_name: 'system',
      record_id: 'data_wipe',
      action: 'STOCKTAKE',
      reason: 'Kufuta data za majaribio (Kuanza upya rekodi za duka)',
      severity: 'alert'
    });
  };

  const resetToDefaultData = () => {
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setSales(initialSales);
    setPurchases(initialPurchases);
    setExpenses(initialExpenses);
    setOwnerDrawings(initialOwnerDrawings);
    setLedgerEntries(initialLedgerEntries);
    setPowerMembers(initialPowerMembers);
    setPowerPeriods(initialPowerPeriods);
    setMeterReadings(initialMeterReadings);
    setPowerPayments(initialPowerPayments);
    setAuditLogs(initialAuditLogs);
    setCashRegister(initialCashRegister);
    setSettings(defaultSettings);

    // Clean specific storage keys
    const keys = [
      'products', 'customers', 'suppliers', 'sales', 'purchases',
      'expenses', 'owner_drawings', 'ledger_entries', 'power_members',
      'power_periods', 'meter_readings', 'power_payments', 'audit_logs',
      'cash_register', 'settings'
    ];
    keys.forEach(k => localStorage.removeItem(`${STORAGE_KEY}_${k}`));
  };

  const exportDatabaseJSON = () => {
    const fullBackup = {
      exported_at: new Date().toISOString(),
      settings,
      products,
      customers,
      suppliers,
      sales,
      purchases,
      expenses,
      ownerDrawings,
      ledgerEntries,
      powerMembers,
      powerPeriods,
      meterReadings,
      powerPayments,
      auditLogs,
      cashRegister,
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DukaFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSalesCSV = () => {
    const headers = ['Receipt No', 'Date', 'Customer', 'Items', 'Total (TSh)', 'Paid (TSh)', 'Debt (TSh)', 'Method', 'Reference', 'Sold By'];
    const rows = sales.map(s => [
      s.receipt_no,
      new Date(s.sold_at).toLocaleString(),
      `"${s.customer_name || 'Cash'}"`,
      `"${s.items.map(i => `${i.product_name} x${i.quantity}`).join('; ')}"`,
      s.total,
      s.paid_amount,
      s.debt_amount,
      s.payment_method,
      s.payment_reference || '',
      s.sold_by_name,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DukaFlow_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPowerCSV = () => {
    const headers = ['Member Name', 'Meter No', 'House', 'Prev Reading', 'Curr Reading', 'Units Used', 'Rate', 'Charge (TSh)', 'Carried Debt', 'Total Due', 'Paid', 'Closing Balance', 'Status'];
    const rows = meterReadings.map(r => {
      const member = powerMembers.find(m => m.id === r.member_id);
      return [
        `"${member?.name || 'Unknown'}"`,
        member?.meter_no || '',
        `"${member?.room_or_house || ''}"`,
        r.previous_reading,
        r.current_reading,
        r.units_used,
        r.rate_charged,
        r.current_charge,
        r.carried_forward_debt,
        r.total_due,
        r.paid_amount,
        r.closing_balance,
        r.status,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DukaFlow_Power_Readings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ShopContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentRole,
        setCurrentRole,
        currentUser,
        settings,
        updateSettings,
        products,
        customers,
        suppliers,
        sales,
        purchases,
        expenses,
        ownerDrawings,
        ledgerEntries,
        powerMembers,
        powerPeriods,
        meterReadings,
        powerPayments,
        auditLogs,
        cashRegister,
        createSale,
        voidSale,
        addProduct,
        updateProductPrice,
        adjustStock,
        addPurchase,
        addExpense,
        addOwnerDrawing,
        addCustomer,
        recordCustomerPayment,
        addSupplier,
        recordSupplierPayment,
        addPowerMember,
        recordPowerReading,
        recordPowerPayment,
        updatePowerRate,
        closePowerPeriodAndRollOver,
        closeDayRegister,
        openNewDayRegister,
        clearDemoTransactions,
        resetToDefaultData,
        exportDatabaseJSON,
        exportSalesCSV,
        exportPowerCSV,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
