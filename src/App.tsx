import React, { useState, useCallback } from 'react';
import { ShopProvider } from './context/ShopContext';
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
import { RoleSwitchModal } from './components/RoleSwitchModal';

// Tab order defines slide direction
const TAB_ORDER = ['pos', 'calendar', 'stock', 'debtors', 'expenses', 'purchases', 'power', 'analytics', 'admin'];

const slideDirection = (from: string, to: string): 'left' | 'right' => {
  const fromIdx = TAB_ORDER.indexOf(from);
  const toIdx   = TAB_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return 'left';
  return toIdx > fromIdx ? 'left' : 'right';
};

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [prevTab, setPrevTab] = useState<string>('pos');
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const switchTab = useCallback((id: string) => {
    if (id === activeTab) {
      setSidebarOpen(false);
      return;
    }
    setSlideDir(slideDirection(activeTab, id));
    setPrevTab(activeTab);
    setActiveTab(id);
    setSidebarOpen(false);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* ── Top App Header ── */}
      <Header
        activeTab={activeTab}
        setActiveTab={switchTab}
        onMenuClick={() => setSidebarOpen(true)}
        onRoleClick={() => setRoleModalOpen(true)}
      />

      {/* ── Slide-Out Sidebar (Single Navigation Truth) ── */}
      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        onClose={() => setSidebarOpen(false)}
        onNavigate={switchTab}
        onOpenRoleModal={() => setRoleModalOpen(true)}
      />

      {/* ── Main Content Router ── */}
      <main className="flex-1 overflow-x-hidden">
        <div
          key={activeTab}
          onAnimationEnd={() => setSlideDir('none')}
          className={
            activeTab === prevTab || slideDir === 'none'
              ? ''
              : slideDir === 'left'
              ? 'screen-slide-left'
              : 'screen-slide-right'
          }
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

      {/* ── Role Switch Confirmation Modal ── */}
      <RoleSwitchModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
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
