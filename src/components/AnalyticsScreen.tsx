import React, { useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  DollarSign,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { formatTsh } from '../utils/translations';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const AnalyticsScreen: React.FC = () => {
  const {
    t,
    sales,
    expenses,
    ownerDrawings,
    products,
    customers,
    exportSalesCSV,
    exportDatabaseJSON,
    currentRole
  } = useShop();

  // 1. Daily Sales Trend (past 14 days)
  const dailySalesData = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; revenue: number; profit: number }>();
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('sw-TZ', { month: 'short', day: 'numeric' });
      map.set(isoKey, { date: isoKey, displayDate, revenue: 0, profit: 0 });
    }

    sales.forEach(sale => {
      if (sale.voided_at) return;
      const key = sale.sold_at.split('T')[0];
      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.revenue += sale.total;
        const lineProfit = sale.items.reduce((s, item) => s + item.line_profit, 0);
        entry.profit += lineProfit;
      }
    });

    return Array.from(map.values());
  }, [sales]);

  // 2. Financial Breakdown: Revenue, COGS, Gross Profit, Operating Expenses, Net Operating Profit
  const financialSummary = useMemo(() => {
    const validSales = sales.filter(s => !s.voided_at);
    const totalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);
    const totalCostOfGoods = validSales.reduce(
      (sum, s) => sum + s.items.reduce((acc, item) => acc + item.line_cost, 0),
      0
    );
    const grossProfit = totalRevenue - totalCostOfGoods;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingProfit = grossProfit - totalExpenses;
    const totalPersonalDrawings = ownerDrawings.reduce((sum, d) => sum + d.cost_value, 0);

    return {
      totalRevenue,
      totalCostOfGoods,
      grossProfit,
      totalExpenses,
      netOperatingProfit,
      totalPersonalDrawings,
    };
  }, [sales, expenses, ownerDrawings]);

  // 3. Top 10 Selling Products by Volume & Revenue
  const topProductsData = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();

    sales.forEach(sale => {
      if (sale.voided_at) return;
      sale.items.forEach(item => {
        const existing = map.get(item.product_name) || {
          name: item.product_name.replace(/\(.*\)/, '').trim(),
          qty: 0,
          revenue: 0,
          profit: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += item.line_total;
        existing.profit += item.line_profit;
        map.set(item.product_name, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [sales]);

  // 4. Sales by Category
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    sales.forEach(sale => {
      if (sale.voided_at) return;
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        const cat = prod?.category || 'General';
        map.set(cat, (map.get(cat) || 0) + item.line_total);
      });
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  // 5. Payment Methods Distribution
  const paymentMethodData = useMemo(() => {
    const map = new Map<string, number>();

    sales.forEach(sale => {
      if (sale.voided_at) return;
      const method = sale.payment_method.toUpperCase();
      map.set(method, (map.get(method) || 0) + sale.total);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const COLORS = ['#ea580c', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      
      {/* Top Banner with Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span>Takwimu & Uchambuzi wa Faida (Analytics)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tathmini halisi ya mapato, faida ghafi (gross profit), matumizi na faida halisi (net profit).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSalesCSV}
            className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Pakua Mauzo (CSV / Excel)</span>
          </button>

          <button
            onClick={exportDatabaseJSON}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>Backup Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Gross Revenue */}
        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Jumla ya Mapato (Revenue)
          </span>
          <div className="text-2xl font-black text-gray-950 mt-1 font-mono">
            {formatTsh(financialSummary.totalRevenue)}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            Mauzo yote yaliyofanyika
          </span>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Gharama ya Bidhaa (COGS)
          </span>
          <div className="text-2xl font-black text-gray-600 mt-1 font-mono">
            {formatTsh(financialSummary.totalCostOfGoods)}
          </div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">
            Bei za kununua wakati wa mauzo
          </span>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Matumizi ya Duka (Expenses)
          </span>
          <div className="text-2xl font-black text-red-600 mt-1 font-mono">
            -{formatTsh(financialSummary.totalExpenses)}
          </div>
          <span className="text-[11px] text-red-500 mt-0.5 block">
            Kodi, nauli, mifuko, posho
          </span>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-3xl shadow-sm">
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
            Faida Halisi ya Duka (Net Profit)
          </span>
          <div className="text-2xl font-black mt-1 font-mono">
            {formatTsh(financialSummary.netOperatingProfit)}
          </div>
          <span className="text-[11px] text-emerald-100 mt-0.5 block">
            Faida ghafi kutoa matumizi ya duka
          </span>
        </div>
      </div>

      {/* Prominent Profit Equation Formula Banner */}
      <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-3xl text-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-bold text-orange-950">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🧮</span>
            <span>Ufafanuzi wa Hesabu ya Faida:</span>
          </span>
          <span className="font-mono text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-orange-200 shadow-2xs">
            Faida Halisi = Mauzo - Gharama za Kununua (COGS) - Matumizi
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-1">
          <span className="bg-white px-2 py-1 rounded-lg border border-gray-200 font-bold text-gray-800">
            {formatTsh(financialSummary.totalRevenue)} (Mauzo)
          </span>
          <span className="text-gray-400 font-bold">-</span>
          <span className="bg-white px-2 py-1 rounded-lg border border-gray-200 font-bold text-gray-600">
            {formatTsh(financialSummary.totalCostOfGoods)} (COGS)
          </span>
          <span className="text-gray-400 font-bold">-</span>
          <span className="bg-white px-2 py-1 rounded-lg border border-gray-200 font-bold text-red-600">
            {formatTsh(financialSummary.totalExpenses)} (Matumizi)
          </span>
          <span className="text-gray-400 font-bold">=</span>
          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-black shadow-2xs">
            {formatTsh(financialSummary.netOperatingProfit)} (Faida Halisi)
          </span>
        </div>

        <p className="text-[11px] text-gray-500 pt-1">
          ✓ <strong>Ulinzi wa Historia:</strong> Kila mauzo yanapofanyika, bei ya kununua (cost price) inanakiliwa papo hapo. Kubadilisha bei ya bidhaa leo au kesho hakubadili kamwe faida ya mauzo yaliyopita.
        </p>
      </div>

      {/* Chart 1: Daily Sales & Profit Trend (Line / Bar) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span>Mwenendo wa Mauzo ya Kila Siku (Siku 14 Zilizopita)</span>
            </h3>
            <p className="text-xs text-gray-400">Mapato dhidi ya faida ya kila siku</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={val => `${Math.round(val / 1000)}k`} />
              <Tooltip
                formatter={(value: any) => [formatTsh(Number(value)), '']}
                contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', backgroundColor: '#fff', fontSize: '12px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Mapato (Revenue)"
                stroke="#ea580c"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ea580c' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Faida Ghafi"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row: Top Products & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Top Products Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-gray-900">
            Bidhaa Zinazoongoza kwa Mauzo (Top Sellers)
          </h3>
          <p className="text-xs text-gray-400">Bidhaa 8 zinazozalisha mapato makubwa zaidi</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 15, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={val => `${Math.round(val / 1000)}k`} />
                <YAxis dataKey="name" type="category" stroke="#374151" fontSize={11} width={120} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatTsh(Number(val)), 'Mapato']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" name="Mapato" fill="#ea580c" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-gray-900">
            Mgawanyo wa Mauzo kwa Makundi (Categories)
          </h3>
          <p className="text-xs text-gray-400">Asilimia ya kila kundi kwenye duka</p>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <span className="text-xs text-gray-400">Hakuna data ya kutosha</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatTsh(Number(val)), 'Jumla']}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
