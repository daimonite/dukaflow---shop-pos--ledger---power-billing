export type Language = 'sw' | 'en';

export const translations = {
  sw: {
    appName: 'DukaFlow',
    appSubtitle: 'Mfumo wa Duka la Rejareja, Daftari & Umeme wa Kushiriki',
    // Navigation
    pos: 'Mauzo Mapya (POS)',
    todayAndCalendar: 'Leo & Kalenda',
    stock: 'Stoo & Bidhaa',
    debtorsCreditors: 'Wadaiwa & Wadaiji',
    expensesPersonal: 'Matumizi & Ya Nyumbani',
    purchases: 'Manunuzi & Risiti',
    powerBilling: 'Umeme wa Pamoja',
    analytics: 'Takwimu & Faida',
    adminAudit: 'Admin & Kumbukumbu',
    
    // Quick Metrics
    todaySales: 'Mauzo ya Leo',
    todayProfit: 'Faida ya Leo',
    cashInHand: 'Pesa Taslimu',
    debtOwedToUs: 'Deni la Wateja',
    weOweSuppliers: 'Tunachodaiwa',
    lowStockNotice: 'Bidhaa Zinazoisha',
    
    // Roles
    admin: 'Msimamizi Mkuu (Admin)',
    manager: 'Meneja wa Duka (Family)',
    powerAdmin: 'Msimamizi wa Umeme',
    switchRole: 'Badilisha Nafasi',
    enterPin: 'Weka PIN ya Admin (1234)',
    
    // POS
    searchProduct: 'Tafuta bidhaa au piga namba...',
    allCategories: 'Zote',
    sellByAmount: 'Uza kwa Kiasi cha Pesa (Mf. Sukari ya 2,000)',
    sellByQty: 'Uza kwa Wingi/Uzito',
    amountPlaceholder: 'Kiasi cha TSh...',
    addToCart: 'Weka Kikapuni',
    cart: 'Kikapu cha Mauzo',
    emptyCart: 'Kikapu kiko tupu. Bonyeza bidhaa kuongeza.',
    regularCustomers: 'Wateja wa Kawaida (Bonyeza jina)',
    customerName: 'Jina la Mteja (Hiari)',
    customerPhone: 'Namba ya Simu',
    paymentMethod: 'Njia ya Malipo',
    cash: 'Taslimu (Cash)',
    mpesa: 'M-Pesa',
    tigopesa: 'Tigo Pesa',
    airtel: 'Airtel Money',
    credit: 'Mkopo (Amechukua Deni)',
    completeSale: 'Kamilisha Mauzo',
    saleSuccess: 'Mauzo Yamerekodiwa Kikamilifu!',
    printReceipt: 'Chapisha / Tuma Risiti',
    whatsappShare: 'Tuma kwa WhatsApp',
    
    // Stock
    addProduct: 'Ongeza Bidhaa Mpya',
    productName: 'Jina la Bidhaa',
    category: 'Kundi',
    baseUnit: 'Kizio Kikuu (Base Unit)',
    sellPrice: 'Bei ya Kuuza',
    costPrice: 'Bei ya Kununua (Avg Cost)',
    stockQty: 'Kiasi Kilichopo',
    reorderLevel: 'Kiwango cha Kuagiza Upya',
    changePrice: 'Badilisha Bei',
    priceChangeReason: 'Sababu ya kubadili bei (Inahitajika)',
    stocktakeMode: 'Hesabu ya Stoo (Stocktake)',
    countedQty: 'Kiasi Ulichohesabu',
    expectedQty: 'Kiasi Kilichotarajiwa',
    shrinkage: 'Punguzo / Hasara ya Upotevu (Shrinkage)',
    
    // Calendar
    salesCalendar: 'Kalenda ya Mauzo ya Kila Siku',
    monthlyTotal: 'Jumla ya Mwezi',
    monthlyProfit: 'Faida Halisi ya Mwezi',
    clickDayToView: 'Bonyeza tarehe kuona orodha kamili ya risiti za siku hiyo',
    
    // Debtors & Creditors
    debtorsTitle: 'Wateja Wanaotudaiwa (Wadaiwa)',
    creditorsTitle: 'Wauzaji Tunawadaiwa (Wadaiji)',
    recordPayment: 'Rekodi Malipo',
    totalDebt: 'Jumla ya Madeni',
    itemsTaken: 'Vitu Alivyochukua',
    time: 'Muda',
    
    // Expenses & Owner Drawings
    expensesTitle: 'Matumizi ya Duka (Yanapunguza Faida)',
    personalUseTitle: 'Vitu Vilivyochukuliwa Nyumbani (Owner Drawings)',
    personalUseNote: 'Vitu vya nyumbani huhesabiwa kwa bei ya kununua. Havipunguzi faida ya duka kimakosa bali vinapunguza hisa ya mtaji.',
    addExpense: 'Ongeza Matumizi',
    addPersonalUse: 'Rekodi Vitu vya Nyumbani',
    
    // Power
    powerTitle: 'Mfumo wa Ankara ya Umeme wa Kushiriki',
    currentRate: 'Kiwango cha Bei kwa Uniti',
    enterReadings: 'Weka Namba za Mita (Sub-Meters)',
    lastReading: 'Kipimo cha Mwezi Uliopita',
    currentReading: 'Kipimo cha Mwezi Huu',
    unitsUsed: 'Uniti Zilizotumika',
    billAmount: 'Kiasi cha Ankara',
    carriedDebt: 'Deni Lililobaki Nyuma',
    totalToPay: 'Jumla ya Kulipa',
    paid: 'Imelipwa',
    unpaid: 'Haijalipwa',
    partial: 'Imelipwa Sehemu',
    creditAdvance: 'Ziada / Salio Mbele',
    whoOwesNow: 'Wanaodaiwa Umeme Hivi Sasa',
    
    // Common
    save: 'Hifadhi',
    cancel: 'Ghairi',
    confirm: 'Thibitisha',
    currency: 'TSh',
    reason: 'Sababu',
    date: 'Tarehe',
    status: 'Hali',
    filter: 'Chuja',
    exportExcel: 'Pakua Data (CSV / Excel)',
    undo: 'Rejesha (Undo)',
  },
  en: {
    appName: 'DukaFlow',
    appSubtitle: 'Retail Shop POS, Ledger & Shared Power Billing',
    // Navigation
    pos: 'New Sale (POS)',
    todayAndCalendar: 'Today & Calendar',
    stock: 'Stock & Inventory',
    debtorsCreditors: 'Debtors & Creditors',
    expensesPersonal: 'Expenses & Personal Use',
    purchases: 'Purchases & Receipts',
    powerBilling: 'Shared Power',
    analytics: 'Analytics & Profit',
    adminAudit: 'Admin & Audit Log',
    
    // Quick Metrics
    todaySales: "Today's Sales",
    todayProfit: "Today's Profit",
    cashInHand: 'Cash in Hand',
    debtOwedToUs: 'Customer Debt',
    weOweSuppliers: 'We Owe Suppliers',
    lowStockNotice: 'Low Stock Alerts',
    
    // Roles
    admin: 'Administrator',
    manager: 'Shop Manager (Family)',
    powerAdmin: 'Power Billing Admin',
    switchRole: 'Switch Role',
    enterPin: 'Enter Admin PIN (1234)',
    
    // POS
    searchProduct: 'Search products or scan...',
    allCategories: 'All',
    sellByAmount: 'Sell by Money Amount (e.g. Sugar of 2,000)',
    sellByQty: 'Sell by Quantity / Weight',
    amountPlaceholder: 'Amount in TSh...',
    addToCart: 'Add to Cart',
    cart: 'Sale Cart',
    emptyCart: 'Cart is empty. Tap products to add.',
    regularCustomers: 'Regular Customers (Quick Tap)',
    customerName: 'Customer Name (Optional)',
    customerPhone: 'Phone Number',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    mpesa: 'M-Pesa',
    tigopesa: 'Tigo Pesa',
    airtel: 'Airtel Money',
    credit: 'Credit (Pay Later)',
    completeSale: 'Complete Sale',
    saleSuccess: 'Sale recorded successfully!',
    printReceipt: 'Print / Send Receipt',
    whatsappShare: 'Share via WhatsApp',
    
    // Stock
    addProduct: 'Add New Product',
    productName: 'Product Name',
    category: 'Category',
    baseUnit: 'Base Unit',
    sellPrice: 'Selling Price',
    costPrice: 'Buying Cost (Avg Cost)',
    stockQty: 'Stock Available',
    reorderLevel: 'Reorder Level',
    changePrice: 'Update Price',
    priceChangeReason: 'Reason for price change (Required)',
    stocktakeMode: 'Stocktake & Audit',
    countedQty: 'Counted Quantity',
    expectedQty: 'Expected Quantity',
    shrinkage: 'Shrinkage / Discrepancy',
    
    // Calendar
    salesCalendar: 'Daily Sales Calendar',
    monthlyTotal: 'Monthly Total Sales',
    monthlyProfit: 'Monthly Net Profit',
    clickDayToView: 'Click any date to view itemized receipts and sales logs',
    
    // Debtors & Creditors
    debtorsTitle: 'Customer Debtors (Owed to Us)',
    creditorsTitle: 'Supplier Creditors (We Owe)',
    recordPayment: 'Record Payment',
    totalDebt: 'Total Outstanding Debt',
    itemsTaken: 'Items Taken',
    time: 'Time',
    
    // Expenses & Owner Drawings
    expensesTitle: 'Shop Operating Expenses (Reduces Profit)',
    personalUseTitle: 'Personal Use / Owner Drawings (Valued at Cost)',
    personalUseNote: 'Items taken for personal use are tracked at buying cost. They do NOT distort shop operating profit, but properly reduce inventory and owner equity.',
    addExpense: 'Add Expense',
    addPersonalUse: 'Record Personal Item / Cash',
    
    // Power
    powerTitle: 'Shared Electricity Billing System',
    currentRate: 'Rate per Unit',
    enterReadings: 'Enter Sub-Meter Readings',
    lastReading: 'Previous Month Reading',
    currentReading: 'Current Month Reading',
    unitsUsed: 'Units Used',
    billAmount: 'Current Bill',
    carriedDebt: 'Carried Forward Debt',
    totalToPay: 'Total Due',
    paid: 'Paid in Full',
    unpaid: 'Unpaid',
    partial: 'Partially Paid',
    creditAdvance: 'Credit Advance',
    whoOwesNow: 'Who Owes Power Right Now',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    currency: 'TSh',
    reason: 'Reason',
    date: 'Date',
    status: 'Status',
    filter: 'Filter',
    exportExcel: 'Export Data (CSV / Excel)',
    undo: 'Undo',
  }
};

export function formatTsh(amount: number): string {
  if (isNaN(amount)) return '0 TSh';
  return `${Math.round(amount).toLocaleString('en-US')} TSh`;
}

export function formatQty(qty: number, unit: string = ''): string {
  if (unit === 'piece') {
    return `${Math.round(qty)} pcs`;
  }
  // format 3 decimals if fractional, else whole
  const formatted = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}
