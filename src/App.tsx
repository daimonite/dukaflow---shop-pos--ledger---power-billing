import React, { useState, useCallback } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { SyncProvider } from './context/SyncContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PosScreen } from './components/PosScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { StockScreen } from './components/StockScreen';
import { DebtorsCreditorsScreen } from './components/DebtorsCreditorsScreen';
import { ExpensesPersonalScreen } from './components/ExpensesPersonalScreen';
import { PurchasesScreen } from './components/PurchasesScreen';
import { PowerBillingScreen } from './components/PowerBillingScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { AdminAuditScreen } from './components/AdminAuditScreen';
import { OutboxModal } from './components/OutboxModal';
import {
  ShoppingCart,
  Calendar,
  Package,
  Users,
  Zap,
  BarChart3,
  Wallet,
  FileText,
  Shield,
} from 'lucide-react';

// Tab order defines slide direction
const TAB_ORDER = ['pos', 'calendar', 'stock', 'debtors', 'expenses', 'purchases', 'power', 'analytics', 'admin'];

const slideDirection = (from: string, to: string): 'left' | 'right' => {
  const fromIdx = TAB_ORDER.indexOf(from);
  const toIdx   = TAB_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return 'left';
  return toIdx > fromIdx ? 'left' : 'right';
};

// Screen label map for breadcrumb
const SCREEN_LABELS: Record<string, { sw: string; en: string; emoji: string }> = {
  pos:       { sw: 'Mauzo ya Haraka',      en: 'Quick POS Sale',         emoji: '🛒' },
  calendar:  { sw: 'Dashibodi / Kalenda',   en: 'Dashboard & Calendar',   emoji: '📅' },
  stock:     { sw: 'Stoo & Bidhaa',         en: 'Stock & Inventory',      emoji: '📦' },
  debtors:   { sw: 'Madeni & Wasambazaji',  en: 'Debtors & Creditors',    emoji: '👥' },
  expenses:  { sw: 'Matumizi & Mwenyewe',   en: 'Expenses & Drawings',    emoji: '💳' },
  purchases: { sw: 'Ununuzi wa Mzigo',      en: 'Stock Purchases',        emoji: '📋' },
  power:     { sw: 'Bili ya Umeme (LUKU)',   en: 'Community Power Billing',emoji: '⚡' },
  analytics: { sw: 'Takwimu & Faida',       en: 'Analytics & Profit',     emoji: '📊' },
  admin:     { sw: 'Ukaguzi & Usimamizi',   en: 'Audit Log & Admin',      emoji: '🔐' },
};

function AppContent() {
  const { products, customers, auditLogs, language } = useShop();
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [prevTab,   setPrevTab]   = useState<string>('pos');
  const [slideDir,  setSlideDir]  = useState<'left' | 'right'>('left');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const switchTab = useCallback((id: string) => {
    if (id === activeTab) { setSidebarOpen(false); return; }
    setSlideDir(slideDirection(activeTab, id));
    setPrevTab(activeTab);
    setActiveTab(id);
  }, [activeTab]);

  const lowStockCount = products.filter(p => p.stock_qty <= p.reorder_level).length;
  const debtorsCount  = customers.filter(c => c.current_balance > 0).length;

  // Mobile bottom nav items (6 primary tabs)
  const bottomNavItems = [
    { id: 'pos',      labelSw: 'Mauzo',  icon: ShoppingCart },
    { id: 'calendar', labelSw: 'Kalenda', icon: Calendar },
    { id: 'stock',    labelSw: 'Stoo',    icon: Package,    badge: lowStockCount },
    { id: 'debtors',  labelSw: 'Madeni',  icon: Users,      badge: debtorsCount },
    { id: 'power',    labelSw: 'Umeme',   icon: Zap },
    { id: 'analytics',labelSw: 'Faida',   icon: BarChart3 },
  ];

  const screenInfo = SCREEN_LABELS[activeTab] ?? SCREEN_LABELS.pos;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white pb-20 sm:pb-0">

      {/* ── Top App Header ── */}
      <Header
        activeTab={activeTab}
        setActiveTab={switchTab}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {/* ── Slide-Out Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        onClose={() => setSidebarOpen(false)}
        onNavigate={switchTab}
      />

      {/* ── Desktop Tab Bar (hidden on mobile — sidebar replaces it) ── */}
      <nav className="hidden sm:block bg-white border-b border-orange-100/70 shadow-xs sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
            {[
              { id: 'pos',       label: 'Mauzo',    icon: ShoppingCart },
              { id: 'calendar',  label: 'Kalenda',  icon: Calendar },
              { id: 'stock',     label: 'Stoo',     icon: Package,    badge: lowStockCount, bc: 'bg-red-500' },
              { id: 'debtors',   label: 'Madeni',   icon: Users,      badge: debtorsCount,  bc: 'bg-amber-500' },
              { id: 'expenses',  label: 'Matumizi', icon: Wallet },
              { id: 'purchases', label: 'Ununuzi',  icon: FileText },
              { id: 'power',     label: 'Umeme',    icon: Zap },
              { id: 'analytics', label: 'Takwimu',  icon: BarChart3 },
              { id: 'admin',     label: 'Ukaguzi',  icon: Shield, badge: auditLogs.filter(l => l.severity === 'alert').length, bc: 'bg-purple-600' },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all btn-press relative ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                      : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                  {(item.badge ?? 0) > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                      isActive ? 'bg-black/25' : (item.bc ?? 'bg-gray-400')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Screen breadcrumb (mobile only) ── */}
      <div className="sm:hidden sticky top-[57px] z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-1.5 flex items-center gap-2">
        <span className="text-sm">{screenInfo.emoji}</span>
        <span className="text-xs font-bold text-gray-700 truncate">
          {language === 'sw' ? screenInfo.sw : screenInfo.en}
        </span>
      </div>

      {/* ── Main Content Router ── */}
      <main className="flex-1 overflow-hidden">
        <div
          key={activeTab}
          className={activeTab === prevTab ? '' : slideDir === 'left' ? 'screen-slide-left' : 'screen-slide-right'}
        >
          {activeTab === 'pos'       && <PosScreen />}
          {activeTab === 'calendar'  && <CalendarScreen />}
          {activeTab === 'stock'     && <StockScreen />}
          {activeTab === 'debtors'   && <DebtorsCreditorsScreen />}
          {activeTab === 'expenses'  && <ExpensesPersonalScreen />}
          {activeTab === 'purchases' && <PurchasesScreen />}
          {activeTab === 'power'     && <PowerBillingScreen />}
          {activeTab === 'analytics' && <AnalyticsScreen />}
          {activeTab === 'admin'     && <AdminAuditScreen />}
        </div>
      </main>

      {/* ── Dexie Outbox Sync Drawer ── */}
      <OutboxModal />

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/97 backdrop-blur-lg border-t border-gray-100 z-40 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => switchTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative py-2 transition-all btn-press ${
                  isActive ? 'text-orange-600' : 'text-gray-400'
                }`}
              >
                {/* Active background pill */}
                {isActive && (
                  <span className="absolute inset-x-2 top-1 bottom-1 bg-orange-50 rounded-2xl -z-0" />
                )}
                <div className="relative z-10">
                  <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold leading-none">{Math.min(item.badge!, 9)}</span>
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold leading-none z-10 ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                  {item.labelSw}
                </span>
                {/* Active indicator dot */}
                {isActive && <span className="nav-active-pill" />}
              </button>
            );
          })}
        </div>
        {/* Home indicator spacing (iPhone) */}
        <div className="h-safe-bottom bg-white/97" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SyncProvider>
      <ShopProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ShopProvider>
    </SyncProvider>
  );
}
