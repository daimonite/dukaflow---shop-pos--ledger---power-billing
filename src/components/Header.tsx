import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useSync } from '../context/SyncContext';
import { RoleSwitchModal } from './RoleSwitchModal';
import {
  Store,
  Shield,
  UserCheck,
  Zap,
  Globe,
  Bell,
  Lock,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Cloud,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Menu,
} from 'lucide-react';
import { formatTsh } from '../utils/translations';

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

export const Header: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMenuClick: () => void;
  onRoleClick?: () => void;
}> = ({ activeTab, setActiveTab, onMenuClick, onRoleClick }) => {
  const {
    language,
    setLanguage,
    t,
    currentRole,
    currentUser,
    sales,
    auditLogs,
    cashRegister,
    customers,
    suppliers,
    products
  } = useShop();

  const { isOnline, isSyncing, pendingCount, openOutbox, isSimulatedOffline } = useSync();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentScreen = SCREEN_LABELS[activeTab] || SCREEN_LABELS.pos;

  // Compute today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = sales.filter(s => !s.voided_at && s.sold_at.startsWith(todayStr));
  const todayRevenue = todaySalesList.reduce((sum, s) => sum + s.total, 0);
  const todayProfit = todaySalesList.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.line_profit, 0), 0);

  // Debt totals
  const totalCustomerDebt = customers.reduce((sum, c) => sum + Math.max(0, c.current_balance), 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + Math.max(0, s.current_balance), 0);
  const lowStockCount = products.filter(p => p.stock_qty <= p.reorder_level).length;

  // Unread or high severity alerts
  const alertLogs = auditLogs.filter(l => l.severity === 'alert').slice(0, 5);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
      {/* Top Banner with branding and quick stats */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Hamburger + Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger menu button (opens sidebar) */}
            <button
              onClick={onMenuClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-all btn-press shadow-2xs font-bold text-xs cursor-pointer"
              aria-label="Open navigation menu"
              title="Fungua Menyu ya Pembeni (Sidebar Navigation)"
            >
              <Menu className="w-4 h-4 text-orange-600" />
              <span className="font-extrabold text-[11px] uppercase tracking-wider hidden sm:inline text-orange-900">Menyu</span>
            </button>
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1WqfVNZWOzPRUIq-IOOGmS4dWIh3bgUArKpuvKcxbiupsXxZq7kl2bcdiTcGM59kBT14Wj0UYum6q4zSjWOAUbLQVifeeSGnMAZEK87ipqiT4nbsMKk9NcfRKUXF696hmS0X_-PjrDE_INa3qnPjC6477PIIH--Ggp2gXo-MlTm9q5CNkAItcbV7BZ9Uzx6PGnAD7tX04njAd_PVzKMD7HobdIJYg03Mf3CGhEkmvt9EQJ2ipUSyICEAHA"
              alt="DukaSmart Logo"
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-gray-900">
                  Duka<span className="text-orange-600">Smart</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full">
                  Neema Duka
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mtandaoni
                </span>
              </div>
              <p className="text-[11px] text-gray-500 truncate max-w-[200px] sm:max-w-xs font-medium">
                <span className="sm:hidden font-bold text-orange-700 mr-1">
                  {currentScreen.emoji} {language === 'sw' ? currentScreen.sw : currentScreen.en} ·
                </span>
                <span className="hidden sm:inline">Neema Super Duka · Arusha · </span>
                {t.appSubtitle}
              </p>
            </div>

            {/* Current Active Screen Tag (Desktop) */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-orange-50/70 border border-orange-200/80 rounded-xl text-xs font-bold text-orange-950 ml-1">
              <span>{currentScreen.emoji}</span>
              <span className="truncate">{language === 'sw' ? currentScreen.sw : currentScreen.en}</span>
            </div>
          </div>

          {/* Quick Metrics Ticker (Hidden on very small screens, visible on tablet+) */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="bg-orange-50/80 border border-orange-100/80 px-3 py-1.5 rounded-xl">
              <div className="text-gray-500 font-medium">{t.todaySales}</div>
              <div className="text-orange-700 font-bold text-sm">{formatTsh(todayRevenue)}</div>
            </div>

            {currentRole === 'admin' && (
              <div className="bg-emerald-50/80 border border-emerald-100/80 px-3 py-1.5 rounded-xl">
                <div className="text-gray-500 font-medium">{t.todayProfit}</div>
                <div className="text-emerald-700 font-bold text-sm">{formatTsh(todayProfit)}</div>
              </div>
            )}

            <div className="bg-amber-50/80 border border-amber-100/80 px-3 py-1.5 rounded-xl">
              <div className="text-gray-500 font-medium">{t.debtOwedToUs}</div>
              <div className="text-amber-800 font-bold text-sm">{formatTsh(totalCustomerDebt)}</div>
            </div>

            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('stock')}
                className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-red-500" />
                <span className="font-bold">{lowStockCount} {t.lowStockNotice}</span>
              </button>
            )}
          </div>

          {/* Action buttons: Role, Language, Notifications, Sync/Outbox */}
          <div className="flex items-center gap-2">
            
            {/* Sync & Outbox Status Indicator */}
            <button
              onClick={openOutbox}
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                !isOnline
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs'
                  : isSyncing
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                  : pendingCount > 0
                  ? 'bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100 shadow-2xs'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Hali ya Mtandao & Sanduku la Miamala (Dexie Outbox)"
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="hidden sm:inline text-blue-800">Inapakia...</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  <Database className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline">Outbox</span>
                  <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold">
                    {pendingCount}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Mtandaoni</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-colors text-gray-700"
              title="Badili Lugha / Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{language}</span>
            </button>

            {/* Audit Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 transition-colors"
                title="Arifa za Mabadiliko / Audit Alerts"
              >
                <Bell className="w-4 h-4" />
                {alertLogs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {alertLogs.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-bold text-xs text-gray-800">Arifa Muhimu za Mfumo (Audit)</span>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('admin');
                      }}
                      className="text-[11px] text-orange-600 hover:underline font-semibold"
                    >
                      Tazama Zote
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {alertLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Hakuna arifa za dharura kwa sasa.</p>
                    ) : (
                      alertLogs.map(log => (
                        <div key={log.id} className="p-2 bg-orange-50/60 rounded-xl border border-orange-100 text-xs">
                          <div className="flex items-center justify-between font-semibold text-orange-950">
                            <span>{log.action}</span>
                            <span className="text-[10px] text-gray-500">{new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-700 mt-0.5 text-[11px]">{log.reason}</p>
                          <div className="text-[10px] text-gray-400 mt-1">na {log.user_name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <button
              onClick={() => onRoleClick ? onRoleClick() : setShowRoleModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                currentRole === 'admin'
                  ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  : currentRole === 'manager'
                  ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              {currentRole === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-purple-600" />
              ) : currentRole === 'manager' ? (
                <UserCheck className="w-3.5 h-3.5 text-orange-600" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span className="capitalize">{currentRole === 'admin' ? 'Admin' : currentRole === 'manager' ? 'Meneja' : 'Umeme'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Role Switch Modal */}
      <RoleSwitchModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />
    </header>
  );
};
