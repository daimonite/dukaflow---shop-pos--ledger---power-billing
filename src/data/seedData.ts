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
  LedgerEntry
} from '../types';

export const initialProducts: Product[] = [
  {
    id: 'prod-sugar',
    name: 'Sukari Nyeupe (Sugar)',
    category: 'Vyakula (Groceries)',
    base_unit: 'kg',
    sell_price: 3000,
    avg_cost: 2600,
    stock_qty: 64.5,
    reorder_level: 25,
    unit_options: [
      { label: 'gunia (sack 50kg)', factor: 50, use_for_buying: true, use_for_selling: false },
      { label: '1 kg', factor: 1, use_for_buying: false, use_for_selling: true },
      { label: '0.5 kg (nusu)', factor: 0.5, use_for_buying: false, use_for_selling: true, price_override: 1500 },
      { label: '0.25 kg (robo)', factor: 0.25, use_for_buying: false, use_for_selling: true, price_override: 750 }
    ],
    active: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrzxngbICG52AXSGKJmTowk5CjHFuPoB1xsl7WkwZISlot0z341BETcVmkAnuRTfOt4KErbJoLQmfdnx5aK9PCxQOJv_0a6zOloy2_s_be0vwvFMiaGjHB1FbueSIK3PqWFTlViV5Rp7i7OxSVUDi3l2mAKo0oRnwXAhpV7d7bVHOVCavrfCJhSdqmi3CGpu5fIHOdx9un_tu7nV_cdBZuDO6qmtEwydBMP24KEWyaB4E_0EUadrqq',
  },
  {
    id: 'prod-oil',
    name: 'Mafuta ya Kupikia (Cooking Oil)',
    category: 'Vyakula (Groceries)',
    base_unit: 'litre',
    sell_price: 4500,
    avg_cost: 3750,
    stock_qty: 38.25,
    reorder_level: 15,
    unit_options: [
      { label: 'dumu (drum 20L)', factor: 20, use_for_buying: true, use_for_selling: false },
      { label: '1 Litre', factor: 1, use_for_buying: false, use_for_selling: true },
      { label: 'Kikombe / 0.25L', factor: 0.25, use_for_buying: false, use_for_selling: true, price_override: 1200 },
      { label: 'Nusu Lita / 0.5L', factor: 0.5, use_for_buying: false, use_for_selling: true, price_override: 2300 }
    ],
    active: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeN0sGX19BOpY3QPWAAZtg-RbG7ay44-iaUR4VQz_IFpSsZYGAnVmUkaTCJR2i4_pdUiIZyzJB3P0dXL5MnGnc-O2FtVv28Hem2FhII9yQTJqVf2hxNEmXiN-3ECGk98kY4c2jdX6x8UC82dU9XLFVSWnRfkAiLfPNuVp0bt8xsczO9dBQ7J1vyuSzjntUE-7lwX4uTx6GCcFzxvxpumMs5Ib0SouyfWIlAqkkwAgNWXDFq2iRdXaW',
  },
  {
    id: 'prod-rice',
    name: 'Mchele Safi wa Kyela (Rice)',
    category: 'Nafaka (Grains)',
    base_unit: 'kg',
    sell_price: 3200,
    avg_cost: 2700,
    stock_qty: 85.0,
    reorder_level: 30,
    unit_options: [
      { label: 'gunia (sack 100kg)', factor: 100, use_for_buying: true, use_for_selling: false },
      { label: 'gunia (sack 50kg)', factor: 50, use_for_buying: true, use_for_selling: false },
      { label: '1 kg', factor: 1, use_for_buying: false, use_for_selling: true },
      { label: '0.5 kg', factor: 0.5, use_for_buying: false, use_for_selling: true, price_override: 1600 }
    ],
    active: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp2Frf2MKuNMAK_rEC_AIjrAuXNEH96EN9Y-BeZPIxIpqteZgiiaTHTANaI-QOm0vHQg2K_6fwCy0Qw1F-BHMxLUJ81Wdaxec_xiC_YMuJPwpEQbHniLWufWXrLTlcrphSjc72XpyyY6IaV1UWp_0_N-II7wGSuIGC6H1FmmV35j22cYvD1Slf7HhVD-3jr_-ihHDmBgMMvSPp-mbmIhxkOvn6-8z-A_1oQWLodhsL4HpElMII34fp',
  },
  {
    id: 'prod-sembe',
    name: 'Unga wa Sembe (Maize Flour Azam)',
    category: 'Nafaka (Grains)',
    base_unit: 'kg',
    sell_price: 1800,
    avg_cost: 1450,
    stock_qty: 42.0,
    reorder_level: 20,
    unit_options: [
      { label: 'mfuko (bag 25kg)', factor: 25, use_for_buying: true, use_for_selling: false },
      { label: '1 kg', factor: 1, use_for_buying: false, use_for_selling: true },
      { label: '2 kg', factor: 2, use_for_buying: false, use_for_selling: true, price_override: 3500 }
    ],
    active: true,
  },
  {
    id: 'prod-ngano',
    name: 'Unga wa Ngano (Wheat Flour)',
    category: 'Nafaka (Grains)',
    base_unit: 'kg',
    sell_price: 2200,
    avg_cost: 1800,
    stock_qty: 18.0,
    reorder_level: 15,
    unit_options: [
      { label: 'mfuko (bag 25kg)', factor: 25, use_for_buying: true, use_for_selling: false },
      { label: '1 kg', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
  },
  {
    id: 'prod-soap',
    name: 'Sabuni ya Kipande (Mbuni Bar Soap)',
    category: 'Usafi (Cleaning)',
    base_unit: 'piece',
    sell_price: 1500,
    avg_cost: 1150,
    stock_qty: 54,
    reorder_level: 12,
    unit_options: [
      { label: 'katoni (box 24 pcs)', factor: 24, use_for_buying: true, use_for_selling: false },
      { label: '1 kipande', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJKYvbhkzRxNICIunilL1kRpTUQl7jnA1A7M_ouqit7MUfDflWiAtqE8SpAOqhEETrybTf32Gj4Lg4kVjg7_WEEOtRj0q7sHgJ0pYqL9psyRhcl62dPhvv2Vz2bIJfzUby1SbCnuDTwGfXwjGPTrcH9tOTWLm3vnWzcMf_aJAiccYLRXu1BdOtFBz9txkh_aNniS9TRW7deo1wbWpLSHFyvXoztKBQ-gcoXkQX0fL_vFxDb5FY-kB7',
  },
  {
    id: 'prod-salt',
    name: 'Chumvi ya Kifurushi (Salt 500g)',
    category: 'Vyakula (Groceries)',
    base_unit: 'piece',
    sell_price: 500,
    avg_cost: 350,
    stock_qty: 6, // Low stock on purpose to demonstrate alerts!
    reorder_level: 10,
    unit_options: [
      { label: 'bando (bundle 20 pcs)', factor: 20, use_for_buying: true, use_for_selling: false },
      { label: '1 pakiti', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
  },
  {
    id: 'prod-tea',
    name: 'Majani ya Chai (Chai Bora 50g)',
    category: 'Vyakula (Groceries)',
    base_unit: 'piece',
    sell_price: 1000,
    avg_cost: 750,
    stock_qty: 28,
    reorder_level: 10,
    unit_options: [
      { label: 'katoni (box 48 pcs)', factor: 48, use_for_buying: true, use_for_selling: false },
      { label: '1 box', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
  },
  {
    id: 'prod-matches',
    name: 'Kiberiti (Moonlite Matches)',
    category: 'Matumizi Madogo (Sundries)',
    base_unit: 'piece',
    sell_price: 100,
    avg_cost: 65,
    stock_qty: 90,
    reorder_level: 20,
    unit_options: [
      { label: 'pakiti kubwa (10 boxes)', factor: 10, use_for_buying: true, use_for_selling: false },
      { label: '1 box', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
  },
  {
    id: 'prod-milk',
    name: 'Maziwa ya Freshi (Asas Fresh Milk 500ml)',
    category: 'Vinywaji (Beverages)',
    base_unit: 'piece',
    sell_price: 1500,
    avg_cost: 1150,
    stock_qty: 4, // Low stock!
    reorder_level: 10,
    unit_options: [
      { label: 'katoni (crate 12)', factor: 12, use_for_buying: true, use_for_selling: false },
      { label: '1 pakiti', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
  },
  {
    id: 'prod-bread',
    name: 'Mkate wa Bakhresa (Sliced Bread)',
    category: 'Vyakula (Groceries)',
    base_unit: 'piece',
    sell_price: 2200,
    avg_cost: 1800,
    stock_qty: 14,
    reorder_level: 5,
    unit_options: [
      { label: '1 mkate', factor: 1, use_for_buying: true, use_for_selling: true }
    ],
    active: true,
  },
  {
    id: 'prod-eggs',
    name: 'Mayai ya Kienyeji/Kisasa (Eggs)',
    category: 'Vyakula (Groceries)',
    base_unit: 'piece',
    sell_price: 500,
    avg_cost: 380,
    stock_qty: 45,
    reorder_level: 15,
    unit_options: [
      { label: 'trei (tray 30 pcs)', factor: 30, use_for_buying: true, use_for_selling: false },
      { label: '1 yai', factor: 1, use_for_buying: false, use_for_selling: true }
    ],
    active: true,
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mama Neema',
    phone: '0754 112 233',
    is_regular: true,
    credit_limit: 50000,
    notes: 'Jirani wa mtaa, anachukua vitu vya nyumbani na kulipa wikiendi',
    current_balance: 14500,
  },
  {
    id: 'cust-2',
    name: 'Baba Junior',
    phone: '0786 445 566',
    is_regular: true,
    credit_limit: 40000,
    notes: 'Mwenye duka la spea karibu na sisi',
    current_balance: 8500,
  },
  {
    id: 'cust-3',
    name: 'Mwalimu Juma',
    phone: '0713 778 899',
    is_regular: true,
    credit_limit: 60000,
    notes: 'Mwalimu wa shule ya msingi, hulipa mshahara ukitoka',
    current_balance: 22000,
  },
  {
    id: 'cust-4',
    name: 'Fundi Kassim',
    phone: '0765 990 011',
    is_regular: true,
    credit_limit: 30000,
    notes: 'Fundi ujenzi',
    current_balance: 0,
  },
  {
    id: 'cust-5',
    name: 'Bi Fatuma',
    phone: '0742 334 455',
    is_regular: true,
    credit_limit: 35000,
    notes: 'Mama lishe jirani',
    current_balance: 12000,
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'supp-1',
    name: 'Azam Wholesale Kariakoo',
    phone: '0715 000 111',
    current_balance: 85000, // we owe them 85,000 for recent flour & juice restock
    notes: 'Msambazaji mkuu wa unga, juisi na biskuti'
  },
  {
    id: 'supp-2',
    name: 'Mbeya Super Rice Depot',
    phone: '0784 555 666',
    current_balance: 0,
    notes: 'Mchele wa daraja la kwanza kutoka Kyela'
  },
  {
    id: 'supp-3',
    name: 'Kibo Oil & Soap Distributors',
    phone: '0754 222 333',
    current_balance: 40000,
    notes: 'Mafuta ya kula na sabuni'
  }
];

// Helper to get formatted date string for today and past days
const now = new Date();
const formatDate = (daysAgo: number, hour = 10, minute = 30) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const initialSales: Sale[] = [
  // Today's sales
  {
    id: 'sale-101',
    receipt_no: 'RCP-20261019-01',
    sold_at: formatDate(0, 8, 15),
    customer_name: 'Cash Customer',
    items: [
      {
        product_id: 'prod-bread',
        product_name: 'Mkate wa Bakhresa (Sliced Bread)',
        quantity: 2,
        unit_label: '1 mkate',
        unit_price: 2200,
        unit_cost_snapshot: 1800,
        line_total: 4400,
        line_cost: 3600,
        line_profit: 800,
      },
      {
        product_id: 'prod-milk',
        product_name: 'Maziwa ya Freshi (Asas Fresh Milk 500ml)',
        quantity: 2,
        unit_label: '1 pakiti',
        unit_price: 1500,
        unit_cost_snapshot: 1150,
        line_total: 3000,
        line_cost: 2300,
        line_profit: 700,
      }
    ],
    total: 7400,
    paid_amount: 7400,
    debt_amount: 0,
    payment_method: 'cash',
    created_by: 'manager',
    sold_by_name: 'Baraka (Manager)',
  },
  {
    id: 'sale-102',
    receipt_no: 'RCP-20261019-02',
    sold_at: formatDate(0, 9, 45),
    customer_id: 'cust-1',
    customer_name: 'Mama Neema',
    customer_phone: '0754 112 233',
    items: [
      {
        product_id: 'prod-sugar',
        product_name: 'Sukari Nyeupe (Sugar)',
        quantity: 2,
        unit_label: '1 kg',
        unit_price: 3000,
        unit_cost_snapshot: 2600,
        line_total: 6000,
        line_cost: 5200,
        line_profit: 800,
      },
      {
        product_id: 'prod-tea',
        product_name: 'Majani ya Chai (Chai Bora 50g)',
        quantity: 1,
        unit_label: '1 box',
        unit_price: 1000,
        unit_cost_snapshot: 750,
        line_total: 1000,
        line_cost: 750,
        line_profit: 250,
      }
    ],
    total: 7000,
    paid_amount: 0, // taken on credit!
    debt_amount: 7000,
    payment_method: 'credit',
    created_by: 'manager',
    sold_by_name: 'Baraka (Manager)',
  },
  {
    id: 'sale-103',
    receipt_no: 'RCP-20261019-03',
    sold_at: formatDate(0, 11, 20),
    customer_name: 'Walk-in',
    items: [
      {
        product_id: 'prod-oil',
        product_name: 'Mafuta ya Kupikia (Cooking Oil)',
        quantity: 1.5,
        unit_label: '1.5 Litres',
        unit_price: 4500,
        unit_cost_snapshot: 3750,
        line_total: 6750,
        line_cost: 5625,
        line_profit: 1125,
      },
      {
        product_id: 'prod-sembe',
        product_name: 'Unga wa Sembe (Maize Flour Azam)',
        quantity: 3,
        unit_label: '1 kg',
        unit_price: 1800,
        unit_cost_snapshot: 1450,
        line_total: 5400,
        line_cost: 4350,
        line_profit: 1050,
      }
    ],
    total: 12150,
    paid_amount: 12150,
    debt_amount: 0,
    payment_method: 'mpesa',
    created_by: 'admin',
    sold_by_name: 'Kelvin (Admin)',
  },
  // Yesterday's sales
  {
    id: 'sale-98',
    receipt_no: 'RCP-20261018-01',
    sold_at: formatDate(1, 10, 0),
    customer_name: 'Jirani',
    items: [
      {
        product_id: 'prod-rice',
        product_name: 'Mchele Safi wa Kyela (Rice)',
        quantity: 5,
        unit_label: '1 kg',
        unit_price: 3200,
        unit_cost_snapshot: 2700,
        line_total: 16000,
        line_cost: 13500,
        line_profit: 2500,
      },
      {
        product_id: 'prod-soap',
        product_name: 'Sabuni ya Kipande (Mbuni Bar Soap)',
        quantity: 2,
        unit_label: '1 kipande',
        unit_price: 1500,
        unit_cost_snapshot: 1150,
        line_total: 3000,
        line_cost: 2300,
        line_profit: 700,
      }
    ],
    total: 19000,
    paid_amount: 19000,
    debt_amount: 0,
    payment_method: 'cash',
    created_by: 'manager',
    sold_by_name: 'Baraka (Manager)',
  },
  {
    id: 'sale-99',
    receipt_no: 'RCP-20261018-02',
    sold_at: formatDate(1, 15, 30),
    customer_id: 'cust-3',
    customer_name: 'Mwalimu Juma',
    customer_phone: '0713 778 899',
    items: [
      {
        product_id: 'prod-sembe',
        product_name: 'Unga wa Sembe (Maize Flour Azam)',
        quantity: 5,
        unit_label: '1 kg',
        unit_price: 1800,
        unit_cost_snapshot: 1450,
        line_total: 9000,
        line_cost: 7250,
        line_profit: 1750,
      },
      {
        product_id: 'prod-sugar',
        product_name: 'Sukari Nyeupe (Sugar)',
        quantity: 2,
        unit_label: '1 kg',
        unit_price: 3000,
        unit_cost_snapshot: 2600,
        line_total: 6000,
        line_cost: 5200,
        line_profit: 800,
      }
    ],
    total: 15000,
    paid_amount: 0, // credit
    debt_amount: 15000,
    payment_method: 'credit',
    created_by: 'manager',
    sold_by_name: 'Baraka (Manager)',
  },
  // Day before yesterday
  {
    id: 'sale-95',
    receipt_no: 'RCP-20261017-01',
    sold_at: formatDate(2, 14, 10),
    customer_name: 'Walk-in',
    items: [
      {
        product_id: 'prod-oil',
        product_name: 'Mafuta ya Kupikia (Cooking Oil)',
        quantity: 3,
        unit_label: '1 Litre',
        unit_price: 4500,
        unit_cost_snapshot: 3750,
        line_total: 13500,
        line_cost: 11250,
        line_profit: 2250,
      },
      {
        product_id: 'prod-eggs',
        product_name: 'Mayai ya Kienyeji/Kisasa (Eggs)',
        quantity: 15,
        unit_label: '1 yai',
        unit_price: 500,
        unit_cost_snapshot: 380,
        line_total: 7500,
        line_cost: 5700,
        line_profit: 1800,
      }
    ],
    total: 21000,
    paid_amount: 21000,
    debt_amount: 0,
    payment_method: 'tigopesa',
    created_by: 'manager',
    sold_by_name: 'Baraka (Manager)',
  },
  // 3 days ago
  {
    id: 'sale-92',
    receipt_no: 'RCP-20261016-01',
    sold_at: formatDate(3, 11, 40),
    customer_name: 'Customer Cash',
    items: [
      {
        product_id: 'prod-sugar',
        product_name: 'Sukari Nyeupe (Sugar)',
        quantity: 5,
        unit_label: '1 kg',
        unit_price: 3000,
        unit_cost_snapshot: 2600,
        line_total: 15000,
        line_cost: 13000,
        line_profit: 2000,
      },
      {
        product_id: 'prod-ngano',
        product_name: 'Unga wa Ngano (Wheat Flour)',
        quantity: 4,
        unit_label: '1 kg',
        unit_price: 2200,
        unit_cost_snapshot: 1800,
        line_total: 8800,
        line_cost: 7200,
        line_profit: 1600,
      }
    ],
    total: 23800,
    paid_amount: 23800,
    debt_amount: 0,
    payment_method: 'cash',
    created_by: 'manager',
    sold_by_name: 'Baraka (Manager)',
  },
  // 4 days ago
  {
    id: 'sale-89',
    receipt_no: 'RCP-20261015-01',
    sold_at: formatDate(4, 16, 20),
    customer_name: 'Cash customer',
    items: [
      {
        product_id: 'prod-rice',
        product_name: 'Mchele Safi wa Kyela (Rice)',
        quantity: 10,
        unit_label: '1 kg',
        unit_price: 3200,
        unit_cost_snapshot: 2700,
        line_total: 32000,
        line_cost: 27000,
        line_profit: 5000,
      }
    ],
    total: 32000,
    paid_amount: 32000,
    debt_amount: 0,
    payment_method: 'airtel',
    created_by: 'admin',
    sold_by_name: 'Kelvin (Admin)',
  }
];

export const initialPurchases: Purchase[] = [
  {
    id: 'pur-1',
    invoice_no: 'INV-AZAM-8841',
    supplier_id: 'supp-1',
    supplier_name: 'Azam Wholesale Kariakoo',
    purchase_date: formatDate(3, 11, 0),
    items: [
      {
        product_id: 'prod-sugar',
        product_name: 'Sukari Nyeupe (Sugar)',
        quantity_bought: 2,
        unit_label: 'gunia (sack 50kg)',
        factor: 50,
        total_base_qty: 100,
        unit_cost: 130000,
        base_cost_each: 2600,
        total_cost: 260000,
      },
      {
        product_id: 'prod-sembe',
        product_name: 'Unga wa Sembe (Maize Flour Azam)',
        quantity_bought: 4,
        unit_label: 'mfuko (bag 25kg)',
        factor: 25,
        total_base_qty: 100,
        unit_cost: 36250,
        base_cost_each: 1450,
        total_cost: 145000,
      }
    ],
    total: 405000,
    paid_amount: 320000,
    created_by: 'Kelvin (Admin)',
    status: 'partial',
    note: 'Tulilipa 320,000 taslimu, iliyobaki 85,000 tutalipa Ijumaa.'
  },
  {
    id: 'pur-2',
    invoice_no: 'INV-KIBO-1029',
    supplier_id: 'supp-3',
    supplier_name: 'Kibo Oil & Soap Distributors',
    purchase_date: formatDate(6, 14, 0),
    items: [
      {
        product_id: 'prod-oil',
        product_name: 'Mafuta ya Kupikia (Cooking Oil)',
        quantity_bought: 2,
        unit_label: 'dumu (drum 20L)',
        factor: 20,
        total_base_qty: 40,
        unit_cost: 75000,
        base_cost_each: 3750,
        total_cost: 150000,
      },
      {
        product_id: 'prod-soap',
        product_name: 'Sabuni ya Kipande (Mbuni Bar Soap)',
        quantity_bought: 3,
        unit_label: 'katoni (box 24 pcs)',
        factor: 24,
        total_base_qty: 72,
        unit_cost: 27600,
        base_cost_each: 1150,
        total_cost: 82800,
      }
    ],
    total: 232800,
    paid_amount: 192800,
    created_by: 'Kelvin (Admin)',
    status: 'partial',
    note: 'Baki 40,000 imeingizwa kwenye daftari la wadaiji.'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    date: formatDate(0, 12, 0),
    spent_on: 'Mifuko ya nailoni (Plastics/Packaging)',
    category: 'packaging',
    amount: 5000,
    note: 'Bando 2 za mifuko ya kufungia sukari na unga',
    created_by: 'Baraka (Manager)',
  },
  {
    id: 'exp-2',
    date: formatDate(2, 9, 30),
    spent_on: 'Nauli ya Bajaj kwenda sokoni (Transport)',
    category: 'transport',
    amount: 6000,
    note: 'Kufuata bidhaa Kariakoo',
    created_by: 'Baraka (Manager)',
  },
  {
    id: 'exp-3',
    date: formatDate(4, 18, 0),
    spent_on: 'Kodi ya Fremu ya Duka (Weekly portion)',
    category: 'rent',
    amount: 25000,
    note: 'Mchango wa kodi ya juma',
    created_by: 'Kelvin (Admin)',
  }
];

export const initialOwnerDrawings: OwnerDrawing[] = [
  {
    id: 'draw-1',
    date: formatDate(1, 19, 0),
    type: 'product',
    product_id: 'prod-sugar',
    product_name: 'Sukari Nyeupe (Sugar)',
    quantity: 2,
    base_unit: 'kg',
    cost_value: 5200, // 2kg * 2,600 avg_cost
    note: 'Sukari 2kg ilichukuliwa nyumbani kwa chai',
    taken_by: 'Kelvin (Owner)',
  },
  {
    id: 'draw-2',
    date: formatDate(3, 13, 0),
    type: 'product',
    product_id: 'prod-soap',
    product_name: 'Sabuni ya Kipande (Mbuni Bar Soap)',
    quantity: 2,
    base_unit: 'piece',
    cost_value: 2300, // 2 * 1,150
    note: 'Sabuni za kufulia nyumbani',
    taken_by: 'Baraka (Family)',
  }
];

export const initialLedgerEntries: LedgerEntry[] = [
  {
    id: 'led-1',
    party_type: 'customer',
    party_id: 'cust-1',
    party_name: 'Mama Neema',
    direction: 'debit',
    amount: 7500,
    items_summary: 'Unga wa ngano 2kg, Mafuta nusu',
    note: 'Amechukua deni jioni',
    created_at: formatDate(5, 17, 30),
    created_by: 'Baraka (Manager)'
  },
  {
    id: 'led-2',
    party_type: 'customer',
    party_id: 'cust-1',
    party_name: 'Mama Neema',
    direction: 'debit',
    amount: 7000,
    ref_sale_id: 'sale-102',
    items_summary: 'Sukari 2kg, Majani ya Chai 1',
    note: 'Amechukua asubuhi',
    created_at: formatDate(0, 9, 45),
    created_by: 'Baraka (Manager)'
  },
  {
    id: 'led-3',
    party_type: 'customer',
    party_id: 'cust-2',
    party_name: 'Baba Junior',
    direction: 'debit',
    amount: 8500,
    items_summary: 'Mchele 2kg, Sabuni 1',
    note: 'Deni la juzi',
    created_at: formatDate(2, 19, 10),
    created_by: 'Baraka (Manager)'
  },
  {
    id: 'led-4',
    party_type: 'customer',
    party_id: 'cust-3',
    party_name: 'Mwalimu Juma',
    direction: 'debit',
    amount: 15000,
    ref_sale_id: 'sale-99',
    items_summary: 'Sembe 5kg, Sukari 2kg',
    note: 'Amechukua deni',
    created_at: formatDate(1, 15, 30),
    created_by: 'Baraka (Manager)'
  },
  {
    id: 'led-5',
    party_type: 'customer',
    party_id: 'cust-3',
    party_name: 'Mwalimu Juma',
    direction: 'debit',
    amount: 7000,
    items_summary: 'Mayai 14',
    note: 'Deni la awali',
    created_at: formatDate(7, 18, 0),
    created_by: 'Kelvin (Admin)'
  },
  {
    id: 'led-6',
    party_type: 'customer',
    party_id: 'cust-5',
    party_name: 'Bi Fatuma',
    direction: 'debit',
    amount: 12000,
    items_summary: 'Mchele 3kg, Mafuta 1L',
    note: 'Vitu vya mama lishe',
    created_at: formatDate(1, 11, 0),
    created_by: 'Baraka (Manager)'
  },
  // Suppliers ledger
  {
    id: 'led-sup-1',
    party_type: 'supplier',
    party_id: 'supp-1',
    party_name: 'Azam Wholesale Kariakoo',
    direction: 'debit',
    amount: 85000,
    ref_purchase_id: 'pur-1',
    note: 'Baki ya ununuzi wa gunia za sukari na unga',
    created_at: formatDate(3, 11, 0),
    created_by: 'Kelvin (Admin)'
  },
  {
    id: 'led-sup-2',
    party_type: 'supplier',
    party_id: 'supp-3',
    party_name: 'Kibo Oil & Soap Distributors',
    direction: 'debit',
    amount: 40000,
    ref_purchase_id: 'pur-2',
    note: 'Baki ya dumu la mafuta',
    created_at: formatDate(6, 14, 0),
    created_by: 'Kelvin (Admin)'
  }
];

// Shared Power billing initial data
export const initialPowerMembers: PowerMember[] = [
  {
    id: 'pm-1',
    name: 'Juma Mwangi',
    phone: '0754 991 122',
    meter_no: 'SUB-MTR-01',
    room_or_house: 'Chumba A1 (Mbele)',
    initial_reading: 1420.0
  },
  {
    id: 'pm-2',
    name: 'Mama Neema',
    phone: '0713 882 233',
    meter_no: 'SUB-MTR-02',
    room_or_house: 'Chumba A2 (Kati)',
    initial_reading: 980.5
  },
  {
    id: 'pm-3',
    name: 'Frank Mlay',
    phone: '0786 773 344',
    meter_no: 'SUB-MTR-03',
    room_or_house: 'Fremu B1 (Kinyozi)',
    initial_reading: 2150.0
  },
  {
    id: 'pm-4',
    name: 'Asha Salum',
    phone: '0765 664 455',
    meter_no: 'SUB-MTR-04',
    room_or_house: 'Chumba B2 (Nyuma)',
    initial_reading: 810.0
  },
  {
    id: 'pm-5',
    name: 'Baraka John',
    phone: '0742 555 566',
    meter_no: 'SUB-MTR-05',
    room_or_house: 'Chumba C1 (Ghorofani)',
    initial_reading: 1330.0
  }
];

export const initialPowerPeriods: PowerPeriod[] = [
  {
    id: 'period-2026-10',
    month: '2026-10',
    month_label: 'Oktoba 2026',
    rate_per_unit: 413.45,
    rate_mode: 'fixed',
    main_meter_units: 320,
    total_luku_tokens_bought: 150000,
    status: 'open',
  },
  {
    id: 'period-2026-09',
    month: '2026-09',
    month_label: 'Septemba 2026',
    rate_per_unit: 413.45,
    rate_mode: 'fixed',
    main_meter_units: 305,
    total_luku_tokens_bought: 140000,
    status: 'closed',
    closed_at: '2026-09-30T23:59:59Z'
  }
];

export const initialMeterReadings: MeterReading[] = [
  {
    id: 'mr-1',
    period_id: 'period-2026-10',
    member_id: 'pm-1',
    previous_reading: 1420.0,
    current_reading: 1475.0,
    units_used: 55.0,
    rate_charged: 413.45,
    current_charge: 22739.75,
    carried_forward_debt: 0,
    total_due: 22740,
    paid_amount: 22740,
    closing_balance: 0,
    status: 'paid',
    last_payment_date: formatDate(1, 14, 0)
  },
  {
    id: 'mr-2',
    period_id: 'period-2026-10',
    member_id: 'pm-2',
    previous_reading: 980.5,
    current_reading: 1032.5,
    units_used: 52.0,
    rate_charged: 413.45,
    current_charge: 21499.4,
    carried_forward_debt: 5000, // carried over from Sept!
    total_due: 26500,
    paid_amount: 15000,
    closing_balance: 11500,
    status: 'partial',
    last_payment_date: formatDate(0, 11, 0)
  },
  {
    id: 'mr-3',
    period_id: 'period-2026-10',
    member_id: 'pm-3',
    previous_reading: 2150.0,
    current_reading: 2240.0,
    units_used: 90.0, // kinyozi uses more power!
    rate_charged: 413.45,
    current_charge: 37210.5,
    carried_forward_debt: 0,
    total_due: 37211,
    paid_amount: 0,
    closing_balance: 37211,
    status: 'unpaid',
  },
  {
    id: 'mr-4',
    period_id: 'period-2026-10',
    member_id: 'pm-4',
    previous_reading: 810.0,
    current_reading: 848.0,
    units_used: 38.0,
    rate_charged: 413.45,
    current_charge: 15711.1,
    carried_forward_debt: -4000, // had overpaid in Sept!
    total_due: 11711,
    paid_amount: 12000,
    closing_balance: -289, // slight credit
    status: 'paid',
    last_payment_date: formatDate(2, 16, 20)
  },
  {
    id: 'mr-5',
    period_id: 'period-2026-10',
    member_id: 'pm-5',
    previous_reading: 1330.0,
    current_reading: 1372.0,
    units_used: 42.0,
    rate_charged: 413.45,
    current_charge: 17364.9,
    carried_forward_debt: 8500,
    total_due: 25865,
    paid_amount: 0,
    closing_balance: 25865,
    status: 'unpaid',
  }
];

export const initialPowerPayments: PowerPayment[] = [
  {
    id: 'pay-1',
    period_id: 'period-2026-10',
    member_id: 'pm-1',
    member_name: 'Juma Mwangi',
    amount: 22740,
    paid_at: formatDate(1, 14, 0),
    recorded_by: 'Kelvin (Admin)',
    reference: 'M-Pesa QK8910B',
    payment_method: 'mpesa'
  },
  {
    id: 'pay-2',
    period_id: 'period-2026-10',
    member_id: 'pm-2',
    member_name: 'Mama Neema',
    amount: 15000,
    paid_at: formatDate(0, 11, 0),
    recorded_by: 'Kelvin (Admin)',
    reference: 'Cash',
    payment_method: 'cash'
  },
  {
    id: 'pay-3',
    period_id: 'period-2026-10',
    member_id: 'pm-4',
    member_name: 'Asha Salum',
    amount: 12000,
    paid_at: formatDate(2, 16, 20),
    recorded_by: 'Kelvin (Admin)',
    reference: 'Tigo Pesa TG441',
    payment_method: 'tigopesa'
  }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    at: formatDate(0, 10, 15),
    user_name: 'Baraka (Manager)',
    user_role: 'manager',
    table_name: 'products',
    record_id: 'prod-oil',
    action: 'PRICE_CHANGE',
    old_value: { sell_price: 4200 },
    new_value: { sell_price: 4500 },
    reason: 'Bei ya jumla ya dumu la mafuta imepanda Kariakoo kutoka 70,000 hadi 75,000',
    severity: 'alert'
  },
  {
    id: 'log-2',
    at: formatDate(1, 17, 45),
    user_name: 'Baraka (Manager)',
    user_role: 'manager',
    table_name: 'stock_movements',
    record_id: 'prod-salt',
    action: 'STOCK_ADJUST',
    old_value: { stock_qty: 10 },
    new_value: { stock_qty: 6 },
    reason: 'Vifurushi 4 vya chumvi vililowa maji wakati wa mvua jioni',
    severity: 'alert'
  },
  {
    id: 'log-3',
    at: formatDate(2, 9, 0),
    user_name: 'Kelvin (Admin)',
    user_role: 'admin',
    table_name: 'power_periods',
    record_id: 'period-2026-10',
    action: 'RATE_CHANGE',
    old_value: { rate_per_unit: 395.0 },
    new_value: { rate_per_unit: 413.45 },
    reason: 'TANESCO / LUKU token tariff adjustment to official domestic rate 413.45 TSh',
    severity: 'alert'
  }
];

export const initialCashRegister: CashRegisterSession = {
  id: 'reg-today',
  date: new Date().toISOString().split('T')[0],
  opened_at: formatDate(0, 7, 30),
  opening_cash: 50000, // starting float in drawer
  cash_sales: 7400,
  cash_debt_payments: 0,
  cash_expenses: 5000,
  cash_owner_drawings: 0,
  expected_closing: 52400,
  status: 'open',
  notes: 'Float ya asubuhi 50,000 TSh'
};
